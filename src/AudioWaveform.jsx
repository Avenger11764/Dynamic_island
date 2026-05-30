import React from 'react';
import { motion } from 'framer-motion';

export default function AudioWaveform({ isPlaying, color = "#22c55e", height = 10, width = 24 }) {
  const barCount = 4;
  
  // Custom height bounds and animation properties for organic physics-like bouncing motion
  const barConfigs = [
    { duration: 0.75, delay: 0.0, minHeight: height * 0.3, maxHeight: height },
    { duration: 0.55, delay: 0.15, minHeight: height * 0.2, maxHeight: height * 0.8 },
    { duration: 0.7, delay: 0.05, minHeight: height * 0.4, maxHeight: height * 0.95 },
    { duration: 0.5, delay: 0.2, minHeight: height * 0.25, maxHeight: height * 0.75 }
  ];

  return (
    <div 
      className="flex items-end justify-center gap-[2px] no-drag h-full" 
      style={{ width, height }}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const config = barConfigs[i];
        return (
          <motion.div
            key={i}
            className="rounded-full flex-shrink-0"
            style={{
              width: 2.2,
              backgroundColor: color,
            }}
            animate={
              isPlaying
                ? {
                    height: [config.minHeight, config.maxHeight, config.minHeight],
                  }
                : {
                    height: 2.2, // Tiny dot when paused
                  }
            }
            transition={
              isPlaying
                ? {
                    duration: config.duration,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: config.delay,
                  }
                : {
                    type: "spring",
                    stiffness: 250,
                    damping: 18,
                  }
            }
          />
        );
      })}
    </div>
  );
}
