import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { formatSpeed } from '../../utils/formatters';

const Stat = ({ label, Icon, value }) => (
  <div className="surface flex-1 px-3 py-3 flex flex-col gap-1.5">
    <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-white/55">
      <Icon size={12} strokeWidth={2} />
      {label}
    </span>
    <span className="font-display text-[17px] font-semibold text-white leading-none">{formatSpeed(value || 0)}</span>
  </div>
);

export const NetworkView = React.memo(({ network }) => (
  <motion.div
    key="network"
    className="w-full flex flex-col justify-center gap-2 my-auto"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="flex items-center gap-2 w-full">
      <Stat label="Download" Icon={ArrowDown} value={network?.rx} />
      <Stat label="Upload" Icon={ArrowUp} value={network?.tx} />
    </div>
  </motion.div>
));
