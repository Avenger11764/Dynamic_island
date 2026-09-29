import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Volume1, Volume2, VolumeX, Headphones } from 'lucide-react';
import { LevelTrack } from '../ui/Glyphs';

const OsdIcon = ({ osdAlert, isBtAudio, size }) => {
  const props = { size, strokeWidth: 2, className: 'text-white' };
  if (osdAlert.type === 'brightness') return <Sun {...props} />;
  if (osdAlert.isMuted || osdAlert.value === 0) return <VolumeX {...props} className="text-white/60" />;
  if (isBtAudio) return <Headphones {...props} />;
  return osdAlert.value < 50 ? <Volume1 {...props} /> : <Volume2 {...props} />;
};

export const OsdAlert = React.memo(React.forwardRef(({ osdAlert, isBtAudio, activeBtDevice, isSideNotch }, ref) => {
  if (!osdAlert) return null;

  const muted = osdAlert.type === 'volume' && (osdAlert.isMuted || osdAlert.value === 0);
  const trackColor = muted ? 'rgba(255,255,255,0.35)' : '#ffffff';
  const deviceName = osdAlert.type === 'volume' && isBtAudio ? (activeBtDevice?.name || 'Headphones') : null;
  const dataAttrs = {
    'data-volume-slider': osdAlert.type === 'volume' ? 'true' : undefined,
    'data-brightness-slider': osdAlert.type === 'brightness' ? 'true' : undefined,
    'data-scroll-volume': osdAlert.type === 'volume' ? 'true' : undefined,
    'data-scroll-brightness': osdAlert.type === 'brightness' ? 'true' : undefined
  };

  if (isSideNotch) {
    return (
      <motion.div
        ref={ref}
        key="osd-hud-vertical"
        {...dataAttrs}
        className="w-full h-full flex flex-col items-center justify-between py-4 z-20 select-none overflow-hidden"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
      >
        <OsdIcon osdAlert={osdAlert} isBtAudio={isBtAudio} size={16} />
        <div className="flex-1 w-full flex justify-center py-3">
          <LevelTrack value={osdAlert.value} vertical color={trackColor} />
        </div>
        <span className="font-display text-[12px] font-semibold text-white/90">{osdAlert.value}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      key="osd-hud"
      {...dataAttrs}
      className="w-full h-full flex items-center gap-3 px-5 z-20 select-none overflow-hidden"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
    >
      <div className="w-5 flex justify-center flex-shrink-0">
        <OsdIcon osdAlert={osdAlert} isBtAudio={isBtAudio} size={16} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        {deviceName && (
          <span className="text-[10.5px] font-medium text-white/50 truncate leading-none" title={deviceName}>
            {deviceName}
          </span>
        )}
        <LevelTrack value={osdAlert.value} color={trackColor} />
      </div>
      <span className="font-display w-8 text-right text-[13px] font-semibold text-white/90 flex-shrink-0">
        {osdAlert.value}
      </span>
    </motion.div>
  );
}));

export default OsdAlert;
