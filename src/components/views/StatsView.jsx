import React from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { CpuChipIcon, RamStickIcon, PremiumBadge } from '../ui/PremiumIcons';

export const StatsView = React.memo(({
  isSideNotch = false,
  hardware,
  handleBoost,
  isBoosting
}) => {
  return (
    <motion.div
      key="stats"
      className={`w-full flex my-auto ${
        isSideNotch ? 'flex-col justify-center items-center py-1' : 'items-center justify-between'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={`w-full flex flex-col ${isSideNotch ? 'gap-3 px-1 py-0.5 justify-center' : 'gap-4 px-1 py-1'}`}>
        {/* CPU Row */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <PremiumBadge variant="green" size="sm">
                <CpuChipIcon size={11} className="text-emerald-300" />
              </PremiumBadge>
              <span className="text-[10px] font-bold tracking-wider text-white/70 uppercase">
                CPU Usage
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-white/90">{hardware.cpu}%</span>
          </div>
          <div className="w-full bg-white/[0.04] h-2.5 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${hardware.cpu}%` }}
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.5)]"
            />
          </div>
        </div>

        {/* RAM Row */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <PremiumBadge variant="blue" size="sm">
                <RamStickIcon size={11} className="text-cyan-300" />
              </PremiumBadge>
              <span className="text-[10px] font-bold tracking-wider text-white/70 uppercase">
                RAM Usage
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-white/90">{hardware.ram}%</span>
          </div>
          <div className="w-full bg-white/[0.04] h-2.5 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${hardware.ram}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.5)]"
            />
          </div>
        </div>

        <button
          type="button"
          className="mt-1 w-full relative overflow-hidden bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white rounded-xl py-2 flex items-center justify-center gap-2 text-[11px] font-extrabold tracking-widest transition-all shadow-lg hover:shadow-cyan-500/20 group disabled:opacity-50"
          onClick={handleBoost}
          disabled={isBoosting}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Rocket
            size={13}
            className={`${
              isBoosting
                ? "animate-pulse text-cyan-400"
                : "text-cyan-400 group-hover:text-cyan-300 transition-colors"
            }`}
          />
          <span className="relative z-10 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            BOOST SYSTEM
          </span>
        </button>
      </div>
    </motion.div>
  );
});
