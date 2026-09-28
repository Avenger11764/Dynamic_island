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

export const LiquidGlowBackground = React.memo(({ accentColor }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-70">
      <motion.div
        animate={{
          scale: [1, 1.25, 0.95, 1],
          x: [-20, 30, -10, -20],
          y: [-10, 20, -15, -10]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-10 -left-10 w-52 h-52 rounded-full bg-gradient-to-tr from-cyan-500/40 via-blue-600/30 to-purple-500/40 filter blur-2xl"
      />
      <motion.div
        animate={{
          scale: [1.1, 0.9, 1.2, 1.1],
          x: [20, -30, 15, 20],
          y: [15, -20, 10, 15]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-gradient-to-br from-pink-500/35 via-purple-600/30 to-indigo-500/35 filter blur-2xl"
      />
      <motion.div
        animate={{
          scale: [0.95, 1.15, 0.95],
          x: [0, 20, -20, 0]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/2 left-1/3 -translate-y-1/2 w-44 h-44 rounded-full bg-gradient-to-r from-emerald-400/25 via-teal-500/20 to-sky-500/30 filter blur-xl"
      />
    </div>
  );
});

export const CosmicOrbitsBackground = React.memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black/60">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.2)_0%,_transparent_75%)]" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[100px] rounded-[50%] border border-indigo-400/25 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
      >
        <div className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[130px] rounded-[50%] border border-purple-400/20 shadow-[0_0_18px_rgba(168,85,247,0.2)]"
      >
        <div className="absolute -bottom-1.5 left-1/3 w-2.5 h-2.5 rounded-full bg-pink-400 shadow-[0_0_10px_#ec4899]" />
        <div className="absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-indigo-300 shadow-[0_0_8px_#a5b4fc]" />
      </motion.div>
    </div>
  );
});

export const AuroraWaveBackground = React.memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-75">
      <motion.div
        animate={{
          x: ['-20%', '20%', '-20%'],
          skewX: [-8, 8, -8],
          opacity: [0.45, 0.8, 0.45]
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-10 left-0 right-0 h-36 bg-gradient-to-r from-emerald-500/35 via-teal-400/45 via-cyan-500/40 to-purple-600/35 filter blur-2xl transform"
      />
      <motion.div
        animate={{
          x: ['20%', '-20%', '20%'],
          skewY: [4, -4, 4],
          opacity: [0.4, 0.75, 0.4]
        }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-8 left-0 right-0 h-32 bg-gradient-to-r from-indigo-500/35 via-purple-500/40 via-pink-500/35 to-emerald-500/30 filter blur-2xl transform"
      />
    </div>
  );
});
