import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './BounceCards.css';

export default function BounceCards({
  className = '',
  images = [],
  containerWidth = 400,
  containerHeight = 400,
  animationDelay = 0.5,
  animationStagger = 0.06,
  easeType = 'elastic.out(1, 0.8)',
  transformStyles = [
    'rotate(10deg) translate(-170px)',
    'rotate(5deg) translate(-85px)',
    'rotate(-3deg)',
    'rotate(-10deg) translate(85px)',
    'rotate(2deg) translate(170px)'
  ],
  enableHover = false
}) {
  const containerRef = useRef(null);
  const [scaleFactor, setScaleFactor] = useState(() => {
    if (typeof window === 'undefined') return 1;
    if (window.innerWidth < 640) return 0.34;
    if (window.innerWidth < 1024) return 0.65;
    return 1;
  });

  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setScaleFactor(0.34);
      } else if (w < 1024) {
        setScaleFactor(0.65);
      } else {
        setScaleFactor(1.0);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getScaledTransform = (transformStr, factor) => {
    if (!transformStr || transformStr === 'none') return 'none';
    return transformStr.replace(/translate\(([-0-9.]+)px(?:,\s*([-0-9.]+)px)?\)/g, (_, x, y) => {
      const sx = Math.round(parseFloat(x) * factor);
      if (y !== undefined) {
        const sy = Math.round(parseFloat(y) * factor);
        return `translate(${sx}px, ${sy}px)`;
      }
      return `translate(${sx}px)`;
    });
  };

  const responsiveTransforms = transformStyles.map(t => getScaledTransform(t, scaleFactor));

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.card',
        { scale: 0 },
        {
          scale: 1,
          stagger: animationStagger,
          ease: easeType,
          delay: animationDelay
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [animationStagger, easeType, animationDelay, scaleFactor]);

  const getNoRotationTransform = transformStr => {
    const hasRotate = /rotate\([\s\S]*?\)/.test(transformStr);
    if (hasRotate) {
      return transformStr.replace(/rotate\([\s\S]*?\)/, 'rotate(0deg)');
    } else if (transformStr === 'none') {
      return 'rotate(0deg)';
    } else {
      return `${transformStr} rotate(0deg)`;
    }
  };

  const getPushedTransform = (baseTransform, offsetX) => {
    const translateRegex = /translate\(([-0-9.]+)px(?:,\s*([-0-9.]+)px)?\)/;
    const match = baseTransform.match(translateRegex);
    if (match) {
      const currentX = parseFloat(match[1]);
      const newX = currentX + offsetX;
      const yPart = match[2] !== undefined ? `, ${match[2]}px` : '';
      return baseTransform.replace(translateRegex, `translate(${newX}px${yPart})`);
    } else {
      return baseTransform === 'none' ? `translate(${offsetX}px)` : `${baseTransform} translate(${offsetX}px)`;
    }
  };

  const pushSiblings = hoveredIdx => {
    if (!enableHover || !containerRef.current) return;
    setActiveCard(hoveredIdx);

    const q = gsap.utils.selector(containerRef);
    const pushDist = Math.max(50, Math.round(160 * scaleFactor));

    images.forEach((_, i) => {
      const target = q(`.card-${i}`);
      gsap.killTweensOf(target);

      const baseTransform = responsiveTransforms[i] || 'none';

      if (i === hoveredIdx) {
        const noRotationTransform = getNoRotationTransform(baseTransform);
        gsap.to(target, {
          transform: noRotationTransform,
          scale: scaleFactor < 0.5 ? 1.04 : 1.08,
          zIndex: 40,
          duration: 0.35,
          ease: 'back.out(1.4)',
          overwrite: 'auto'
        });
      } else {
        const offsetX = i < hoveredIdx ? -pushDist : pushDist;
        const pushedTransform = getPushedTransform(baseTransform, offsetX);

        const distance = Math.abs(hoveredIdx - i);
        const delay = distance * 0.04;

        gsap.to(target, {
          transform: pushedTransform,
          scale: scaleFactor < 0.5 ? 0.96 : 0.94,
          zIndex: 10 - distance,
          duration: 0.35,
          ease: 'back.out(1.4)',
          delay,
          overwrite: 'auto'
        });
      }
    });
  };

  const resetSiblings = () => {
    if (!enableHover || !containerRef.current) return;
    setActiveCard(null);

    const q = gsap.utils.selector(containerRef);

    images.forEach((_, i) => {
      const target = q(`.card-${i}`);
      gsap.killTweensOf(target);
      const baseTransform = responsiveTransforms[i] || 'none';
      gsap.to(target, {
        transform: baseTransform,
        scale: 1,
        zIndex: i + 1,
        duration: 0.35,
        ease: 'back.out(1.4)',
        overwrite: 'auto'
      });
    });
  };

  const responsiveHeight = scaleFactor < 0.5 ? 260 : scaleFactor < 0.8 ? 320 : containerHeight;

  return (
    <div
      className={`bounceCardsContainer ${className}`}
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: typeof containerWidth === 'number' ? `${containerWidth}px` : containerWidth,
        height: `${responsiveHeight}px`
      }}
      onMouseLeave={resetSiblings}
    >
      {images.map((src, idx) => (
        <div
          key={idx}
          className={`card card-${idx}`}
          style={{
            transform: responsiveTransforms[idx] ?? 'none'
          }}
          onMouseEnter={() => pushSiblings(idx)}
          onClick={() => {
            if (activeCard === idx) {
              resetSiblings();
            } else {
              pushSiblings(idx);
            }
          }}
        >
          <img className="image" src={src} alt={`card-${idx}`} loading="lazy" />
        </div>
      ))}
    </div>
  );
}
