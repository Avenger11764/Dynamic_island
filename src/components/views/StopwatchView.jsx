import React from 'react';
import { motion } from 'framer-motion';
import { Timer as TimerIcon, RotateCcw, Play, Pause } from 'lucide-react';

export const StopwatchView = React.memo(({
  isSideNotch = false,
  stopwatch,
  isSwRunning,
  toggleSw,
  resetSw
}) => {
  return (
    <motion.div
      key="stopwatch"
      className={`w-full flex my-auto ${
        isSideNotch ? 'flex-col gap-3 justify-center items-center text-center py-1' : 'items-center justify-between'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className={`flex ${
          isSideNotch ? 'flex-col text-center items-center' : 'items-center'
        } gap-3 w-full`}
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
          <TimerIcon size={20} className="text-white/90 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-lg font-black tracking-wider text-white">
            {stopwatch >= 3600
              ? `${String(Math.floor(stopwatch / 3600)).padStart(2, '0')}:`
              : ''}
            {String(Math.floor((stopwatch % 3600) / 60)).padStart(2, '0')}:
            {String(stopwatch % 60).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">
            Stopwatch
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 justify-center w-full mt-1">
        <button
          type="button"
          aria-label="Reset Stopwatch"
          className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/60 hover:text-white"
          onClick={resetSw}
        >
          <RotateCcw size={14} />
        </button>
        <button
          type="button"
          aria-label={isSwRunning ? "Pause Stopwatch" : "Start Stopwatch"}
          className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all text-white shadow-md hover:scale-105"
          onClick={toggleSw}
        >
          {isSwRunning ? <Pause size={15} /> : <Play size={15} className="translate-x-[1px]" />}
        </button>
      </div>
    </motion.div>
  );
});
