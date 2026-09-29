import React, { useRef } from 'react';
import { useAudioReactive } from '../../utils/audioReactive';

/**
 * Artwork-matched ambient light behind the media card.
 *
 * Same layered look as the original (blurred cover + coloured light rising
 * from the bottom edge and corners), but every layer animates only
 * `transform`/`opacity` through CSS keyframes, so it runs on the compositor
 * instead of re-rendering React/Framer every frame. Blur is applied once to
 * static layers and the animations pause when playback pauses.
 *
 * Parent MUST have `position: relative; overflow: hidden;`.
 */
export const AmbientGlow = ({ artUrl, colors = [], isPlaying = false, intensity = 1 }) => {
  const ref = useRef(null);
  useAudioReactive(ref, isPlaying && !!artUrl);
  // No artwork (e.g. nothing playing): no glow, rather than a generic colour blob
  if (!artUrl) return null;
  const c1 = colors[0] || '#10b981';
  const c2 = colors[1] || colors[0] || '#06b6d4';
  const state = isPlaying ? 'running' : 'paused';
  const layer = (extra) => ({
    position: 'absolute',
    pointerEvents: 'none',
    animationPlayState: state,
    willChange: 'transform, opacity',
    ...extra
  });

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0, borderRadius: 'inherit', opacity: intensity }} aria-hidden="true">
      {artUrl && (
        <div
          style={layer({
            inset: '-25%',
            backgroundImage: `url(${artUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 70%',
            filter: 'blur(26px) saturate(2)',
            opacity: 0.55,
            animation: 'ag-drift 9s ease-in-out infinite alternate'
          })}
        />
      )}

      {/* Light layers: with live audio they rise, brighten and swell on the beat */}
      <div className="ag-react absolute inset-0">
      {/* Bottom flood */}
      <div
        style={layer({
          left: '-10%', right: '-10%', bottom: '-12%', height: '80%',
          transformOrigin: 'bottom center',
          background: `linear-gradient(to top, ${c1}f0 0%, ${c1}aa 35%, ${c2}55 65%, transparent 100%)`,
          opacity: isPlaying ? 0.85 : 0.55,
          animation: 'ag-breathe 3.2s ease-in-out infinite'
        })}
      />

      {/* Corner lights */}
      <div
        style={layer({
          left: '-30%', bottom: '-35%', width: '95%', height: '100%', borderRadius: '50%',
          background: `radial-gradient(circle at 50% 60%, ${c1} 0%, ${c2}99 45%, transparent 72%)`,
          opacity: 0.75,
          animation: 'ag-orb-a 4.3s ease-in-out infinite'
        })}
      />
      <div
        style={layer({
          right: '-30%', bottom: '-35%', width: '95%', height: '100%', borderRadius: '50%',
          background: `radial-gradient(circle at 50% 60%, ${c2} 0%, ${c1}99 45%, transparent 72%)`,
          opacity: 0.7,
          animation: 'ag-orb-b 3.7s ease-in-out infinite'
        })}
      />

      </div>

      {/* Keep the title and controls legible */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 32%, transparent 62%)' }} />
    </div>
  );
};

export default AmbientGlow;
