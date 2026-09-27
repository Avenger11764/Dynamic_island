import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const MatrixBackground = React.memo(() => {
  const columns = useMemo(() => Array.from({ length: 20 }).map(() => ({
    left: Math.random() * 100,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
    chars: Array.from({ length: 10 }).map(() => (Math.random() > 0.5 ? '1' : '0'))
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50 bg-black/80">
      {columns.map((col, i) => (
        <motion.div key={i} animate={{ y: [-50, 400], opacity: [0, 1, 0] }} transition={{ duration: col.duration, repeat: Infinity, delay: col.delay, ease: 'linear' }} className="absolute text-[8px] font-mono leading-[8px] text-green-500/80" style={{ left: `${col.left}%` }}>
           {col.chars.map((char, j) => <div key={j}>{char}</div>)}
        </motion.div>
      ))}
    </div>
  );
});

export const HyperspaceBackground = React.memo(({ isPlaying }) => {
  const stars = useMemo(() => Array.from({ length: 40 }).map(() => ({
    top: Math.random() * 100,
    duration: 5 + Math.random() * 10,
    fastDuration: 0.2 + Math.random() * 0.5,
    delay: Math.random() * 5
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black/90">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_rgba(0,0,0,1)_100%)]" />
      {stars.map((star, i) => (
        <motion.div key={i} animate={{ x: [-10, 400], scaleX: isPlaying ? [1, 10, 1] : 1, opacity: [0, 1, 0] }} transition={{ duration: isPlaying ? star.fastDuration : star.duration, repeat: Infinity, delay: star.delay, ease: 'linear' }} className="absolute w-[2px] h-[2px] bg-white rounded-full shadow-[0_0_5px_#fff]" style={{ left: '-5%', top: `${star.top}%` }} />
      ))}
    </div>
  );
});

export const RainBackground = React.memo(({ accentColor }) => {
  const drops = useMemo(() => Array.from({ length: 15 }).map(() => ({
    left: Math.random() * 100,
    duration: 1.5 + Math.random() * 2,
    delay: Math.random() * 3
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60 bg-slate-900/40 backdrop-blur-md">
      {drops.map((drop, i) => (
        <motion.div key={i} animate={{ y: [-20, 400], opacity: [0, 0.8, 0], scaleY: [1, 1.5, 1] }} transition={{ duration: drop.duration, repeat: Infinity, delay: drop.delay, ease: 'linear' }} className={`absolute w-[2px] h-[15px] rounded-full ${accentColor === 'cyan' ? 'bg-cyan-200/50' : (accentColor === 'purple' ? 'bg-purple-200/50' : (accentColor === 'green' ? 'bg-green-200/50' : 'bg-white/30'))}`} style={{ left: `${drop.left}%` }} />
      ))}
    </div>
  );
});
