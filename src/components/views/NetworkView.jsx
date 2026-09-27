import React from 'react';
import { motion } from 'framer-motion';
import { formatSpeed } from '../../utils/formatters';
import { PremiumWifiIcon, PremiumBadge } from '../ui/PremiumIcons';

export const NetworkView = React.memo(({ network }) => {
  return (
    <motion.div
      key="network"
      className="w-full flex flex-col justify-center px-1 my-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <PremiumBadge variant="purple" size="sm">
            <PremiumWifiIcon size={11} className="text-purple-300" />
          </PremiumBadge>
          <span className="text-[10px] font-bold text-white/70 tracking-wider uppercase">
            Network Speed
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] font-extrabold text-green-400 uppercase tracking-wider">Live</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2.5 w-full">
        <div className="flex-1 bg-white/[0.05] hover:bg-white/[0.08] transition-colors rounded-2xl p-2.5 border border-white/5 flex flex-col items-center">
          <span className="text-[9px] font-black text-white/40 uppercase mb-0.5 tracking-wider">Download</span>
          <span className="text-sm font-black text-white tracking-tight">
            {formatSpeed(network?.rx || 0)}
          </span>
        </div>
        <div className="flex-1 bg-white/[0.05] hover:bg-white/[0.08] transition-colors rounded-2xl p-2.5 border border-white/5 flex flex-col items-center">
          <span className="text-[9px] font-black text-white/40 uppercase mb-0.5 tracking-wider">Upload</span>
          <span className="text-sm font-black text-white tracking-tight">
            {formatSpeed(network?.tx || 0)}
          </span>
        </div>
      </div>
    </motion.div>
  );
});
