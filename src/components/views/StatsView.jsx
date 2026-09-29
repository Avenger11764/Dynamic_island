import React from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

const Bar = ({ label, value }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-baseline justify-between">
      <span className="text-[12px] font-medium text-white/60">{label}</span>
      <span className="font-display text-[15px] font-semibold text-white">{value}%</span>
    </div>
    <div className="w-full h-[6px] bg-white/[0.1] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }}
        className="h-full rounded-full"
        style={{ background: value >= 85 ? '#FF9F0A' : 'rgba(255,255,255,0.9)' }}
      />
    </div>
  </div>
);

export const StatsView = React.memo(({
  isSideNotch = false,
  hardware,
  handleBoost,
  isBoosting
}) => (
  <motion.div
    key="stats"
    className={`w-full flex flex-col my-auto ${isSideNotch ? 'gap-3.5 py-1' : 'gap-4 px-1 py-1'}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <Bar label="Processor" value={hardware.cpu} />
    <Bar label="Memory" value={hardware.ram} />
    <button
      type="button"
      className="w-full h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-white/90 flex items-center justify-center gap-2 text-[12px] font-medium transition-colors disabled:opacity-50"
      onClick={handleBoost}
      disabled={isBoosting}
    >
      <Rocket size={14} strokeWidth={1.9} />
      {isBoosting ? 'Optimizing…' : 'Optimize memory'}
    </button>
  </motion.div>
));
