import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Premium ambient glow — fully floods the bottom edge, corners, and sides
 * with rich, moving artwork-matched colors (inspired by Apple Dynamic Island).
 *
 * Parent MUST have `position: relative; overflow: hidden;`.
 */
export const AmbientGlow = ({ artUrl, colors = [], isPlaying = false }) => {
  const [c1, c2, c3] = useMemo(() => {
    const fallback = ['#10b981', '#06b6d4', '#6366f1'];
    return [
      colors[0] || fallback[0],
      colors[1] || fallback[1],
      colors[2] || fallback[2],
    ];
  }, [colors]);

  const hasArt = !!artUrl;

  // ─── Layered organic music motion ───
  // Coprime durations (0.7s, 1.1s, 1.3s, 1.9s) for natural beat movement

  // 1. Bottom flood breathing
  const floodAnim = {
    opacity: [0.85, 1, 0.88, 0.95, 0.85],
    scaleY: [1, 1.08, 0.98, 1.05, 1],
  };

  // 2. Wide bass punch (0.75s)
  const bassAnim = {
    scale: [1, 1.25, 1.05, 1.18, 1],
    opacity: [0.75, 1, 0.8, 0.95, 0.75],
    y: ['0%', '-6%', '1%', '-4%', '0%'],
  };

  // 3. Left corner surge (1.3s)
  const leftCornerAnim = {
    scale: [1, 1.2, 0.95, 1.15, 1],
    opacity: [0.7, 0.95, 0.75, 0.9, 0.7],
    x: ['-5%', '5%', '-2%', '4%', '-5%'],
  };

  // 4. Right corner surge (1.1s)
  const rightCornerAnim = {
    scale: [1.05, 0.95, 1.2, 1, 1.05],
    opacity: [0.65, 0.9, 0.7, 0.95, 0.65],
    x: ['5%', '-4%', '6%', '-2%', '5%'],
  };

  // 5. Blurred cover art drift (2s)
  const artDrift = {
    scale: [1.1, 1.18, 1.08, 1.15, 1.1],
    opacity: [0.65, 0.8, 0.68, 0.78, 0.65],
  };

  const makeTiming = (dur) => ({
    duration: dur,
    repeat: Infinity,
    ease: 'easeInOut',
    repeatType: 'loop',
  });

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0, overflow: 'hidden' }}
      aria-hidden="true"
    >
      {/* ─── Layer 1: Blurred Album Art Backdrop (Full coverage) ─── */}
      {hasArt && (
        <motion.div
          animate={isPlaying ? artDrift : { opacity: 0.4, scale: 1.08 }}
          transition={isPlaying ? makeTiming(2.0) : { duration: 0.6 }}
          style={{
            position: 'absolute',
            inset: '-20%',
            backgroundImage: `url(${artUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 80%',
            filter: 'blur(28px) saturate(2.4)',
            opacity: 0.7,
            willChange: 'transform, opacity',
          }}
        />
      )}

      {/* ─── Layer 2: Edge-to-Edge Bottom Linear Flood ───
          Covers 100% of the bottom edge and corners without fading out at edges */}
      <motion.div
        animate={isPlaying ? floodAnim : { opacity: 0.55 }}
        transition={isPlaying ? makeTiming(1.6) : { duration: 0.6 }}
        style={{
          position: 'absolute',
          left: '-10%',
          right: '-10%',
          bottom: '-10%',
          height: '85%',
          transformOrigin: 'bottom center',
          background: `linear-gradient(to top, ${c1} 0%, ${c1}ee 30%, ${c2}88 60%, transparent 95%)`,
          filter: 'blur(16px)',
          opacity: 0.9,
          willChange: 'transform, opacity',
        }}
      />

      {/* ─── Layer 3: Ultra-wide Bottom Elliptical Bass Pulse ───
          150% width centered at bottom: guarantees zero dark edges on sides and corners */}
      <motion.div
        animate={isPlaying ? bassAnim : { opacity: 0.4 }}
        transition={isPlaying ? makeTiming(0.75) : { duration: 0.6 }}
        style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-25%',
          width: '150%',
          height: '115%',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at 50% 90%, ${c1} 0%, ${c2}ee 40%, ${c1}77 75%, transparent 100%)`,
          filter: 'blur(24px)',
          opacity: 0.85,
          willChange: 'transform, opacity',
        }}
      />

      {/* ─── Layer 4: Bottom-Left Corner Flood Orb ─── */}
      <motion.div
        animate={isPlaying ? leftCornerAnim : { opacity: 0.35 }}
        transition={isPlaying ? makeTiming(1.3) : { duration: 0.6 }}
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-20%',
          width: '85%',
          height: '95%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 75%, ${c1} 0%, ${c2}cc 50%, transparent 85%)`,
          filter: 'blur(20px)',
          opacity: 0.8,
          willChange: 'transform, opacity',
        }}
      />

      {/* ─── Layer 5: Bottom-Right Corner Flood Orb ─── */}
      <motion.div
        animate={isPlaying ? rightCornerAnim : { opacity: 0.35 }}
        transition={isPlaying ? makeTiming(1.1) : { duration: 0.6 }}
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-20%',
          width: '85%',
          height: '95%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 60% 75%, ${c2} 0%, ${c1}cc 50%, transparent 85%)`,
          filter: 'blur(20px)',
          opacity: 0.8,
          willChange: 'transform, opacity',
        }}
      />

      {/* ─── Layer 6: Apple-style Top Darkening Mask ───
          Tapers off cleanly so text, controls, and notch header remain legible */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 28%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
