import React from 'react';
import { motion } from 'framer-motion';

export default function AudioWaveform({ isPlaying, color, height = 12, width = 24, isSideNotch = false }) {
  const delays = [0.15, 0.4, 0.65, 0.3];

  return (
    <div 
      className={`flex items-center justify-center no-drag ${isSideNotch ? 'flex-col gap-[3px]' : 'gap-[3px]'}`} 
      style={{ width, height }}
      title={isPlaying ? "Media Playing" : "Media Paused"}
    >
      {delays.map((delay, i) => (
        <motion.span
          key={i}
          className="rounded-full bg-gradient-to-t from-cyan-400 via-sky-300 to-white shadow-[0_0_8px_rgba(56,189,248,0.7)] flex-shrink-0"
          style={{
            width: isSideNotch ? (isPlaying ? 12 : 3) : 2.5,
            height: isSideNotch ? 2.5 : (isPlaying ? 12 : 3),
          }}
          animate={
            isPlaying
              ? (isSideNotch
                  ? { width: ['4px', '14px', '4px'], opacity: [0.5, 1, 0.5] }
                  : { height: ['3px', '13px', '3px'], opacity: [0.5, 1, 0.5] })
              : (isSideNotch
                  ? { width: '3px', opacity: 0.35 }
                  : { height: '3px', opacity: 0.35 })
          }
          transition={
            isPlaying
              ? {
                  repeat: Infinity,
                  duration: 0.85,
                  ease: 'easeInOut',
                  delay,
                }
              : {
                  type: 'spring',
                  stiffness: 300,
                  damping: 20
                }
          }
        />
      ))}
    </div>
  );
}
