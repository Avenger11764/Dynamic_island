import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Play, Pause } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');

export const StopwatchView = React.memo(({
  isSideNotch = false,
  stopwatch,
  isSwRunning,
  toggleSw,
  resetSw
}) => (
  <motion.div
    key="stopwatch"
    className={`w-full flex my-auto ${isSideNotch ? 'flex-col gap-4 items-center py-1' : 'items-center justify-between px-2'}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className={`flex flex-col ${isSideNotch ? 'items-center' : ''}`}>
      <span className="text-[12px] font-medium text-white/55">Stopwatch</span>
      <span className="font-display text-[34px] font-semibold text-white leading-tight">
        {stopwatch >= 3600 ? `${pad(Math.floor(stopwatch / 3600))}:` : ''}
        {pad(Math.floor((stopwatch % 3600) / 60))}:{pad(stopwatch % 60)}
      </span>
    </div>
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        aria-label="Reset stopwatch"
        className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.12] flex items-center justify-center transition-colors text-white/80"
        onClick={resetSw}
      >
        <RotateCcw size={15} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label={isSwRunning ? 'Pause stopwatch' : 'Start stopwatch'}
        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform"
        onClick={toggleSw}
      >
        {isSwRunning ? <Pause size={15} fill="currentColor" strokeWidth={0} /> : <Play size={15} fill="currentColor" strokeWidth={0} className="translate-x-[1px]" />}
      </button>
    </div>
  </motion.div>
));
