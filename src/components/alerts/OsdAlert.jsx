import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Volume2, VolumeX, Headphones, Bluetooth } from 'lucide-react';

export const OsdAlert = React.memo(React.forwardRef(({ osdAlert, isBtAudio, activeBtDevice, isSideNotch }, ref) => {
  if (!osdAlert) return null;

  if (isSideNotch) {
    return (
      <motion.div
        ref={ref}
        key="osd-hud-vertical"
        data-volume-slider={osdAlert.type === 'volume' ? 'true' : undefined}
        data-brightness-slider={osdAlert.type === 'brightness' ? 'true' : undefined}
        data-scroll-volume={osdAlert.type === 'volume' ? 'true' : undefined}
        data-scroll-brightness={osdAlert.type === 'brightness' ? 'true' : undefined}
        className="w-full h-full flex flex-col items-center justify-between py-3 px-1.5 z-20 select-none overflow-hidden"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.15 }}
      >
        {/* Top: Icon, Device Pill, Percentage */}
        <div className="flex flex-col items-center gap-1 w-full">
          <div className="flex items-center justify-center text-white">
            {osdAlert.type === 'brightness' ? (
              <Sun size={17} strokeWidth={2.4} className="text-amber-300" />
            ) : osdAlert.isMuted || osdAlert.value === 0 ? (
              <VolumeX size={17} strokeWidth={2.4} className="text-red-400" />
            ) : isBtAudio ? (
              <div className="flex items-center gap-1">
                <Headphones size={15} strokeWidth={2.4} className="text-cyan-400" />
                <Bluetooth size={11} className="text-cyan-300" />
              </div>
            ) : (
              <Volume2 size={17} strokeWidth={2.4} className="text-white" />
            )}
          </div>

          {osdAlert.type === 'volume' && isBtAudio && (
            <span
              className="text-[7.5px] font-medium text-white/45 tracking-tight truncate max-w-[48px] text-center select-none"
              title={activeBtDevice?.name || 'BT Audio'}
            >
              {activeBtDevice?.name?.split(' ')[0] || 'BT'}
            </span>
          )}

          <span className="text-[11px] font-bold tracking-tight text-white/95 font-mono mt-0.5">
            {osdAlert.value}%
          </span>
        </div>

        {/* Center: Vertical Segmented Meter (Bottom-to-Top Fill) */}
        <div className="flex flex-col-reverse items-center justify-center w-full flex-1 my-1.5 gap-[3px]">
          {Array.from({ length: 18 }).map((_, i) => {
            const tickPercent = ((i + 1) / 18) * 100;
            const isFilled = osdAlert.value >= tickPercent;
            return (
              <div
                key={i}
                className={`w-[26px] h-[3.5px] rounded-full transition-all duration-75 ${
                  isFilled
                    ? (osdAlert.type === 'brightness'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-200 shadow-[0_0_5px_rgba(251,191,36,0.7)]'
                        : isBtAudio
                        ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-white shadow-[0_0_5px_rgba(6,182,212,0.6)]'
                        : 'bg-gradient-to-r from-amber-500 via-amber-300 to-white shadow-[0_0_5px_rgba(245,158,11,0.6)]')
                    : 'bg-white/[0.12]'
                }`}
              />
            );
          })}
        </div>

        {/* Bottom: Type Label */}
        <div className="flex items-center justify-center w-full pb-0.5">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/40">
            {osdAlert.type === 'brightness' ? 'BRT' : 'VOL'}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      key="osd-hud"
      data-volume-slider={osdAlert.type === 'volume' ? 'true' : undefined}
      data-brightness-slider={osdAlert.type === 'brightness' ? 'true' : undefined}
      data-scroll-volume={osdAlert.type === 'volume' ? 'true' : undefined}
      data-scroll-brightness={osdAlert.type === 'brightness' ? 'true' : undefined}
      className="w-full h-full flex flex-col justify-between px-5 py-2.5 z-20 select-none overflow-hidden"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.15 }}
    >
      {/* Top Row: Leading Icon and Percentage */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 text-white">
          {osdAlert.type === 'brightness' ? (
            <Sun size={15} strokeWidth={2.4} className="text-amber-300" />
          ) : osdAlert.isMuted || osdAlert.value === 0 ? (
            <VolumeX size={15} strokeWidth={2.4} className="text-red-400" />
          ) : isBtAudio ? (
            <div className="flex items-center gap-1.5">
              <Headphones size={15} strokeWidth={2.4} className="text-cyan-400" />
              <Bluetooth size={12} className="text-cyan-300" />
            </div>
          ) : (
            <Volume2 size={15} strokeWidth={2.4} className="text-white" />
          )}
          {osdAlert.type === 'volume' && isBtAudio && (
            <span 
              className="text-[8px] font-medium text-white/45 tracking-tight truncate max-w-[105px] select-none pl-0.5"
              title={activeBtDevice?.name || 'BT Audio'}
            >
              {activeBtDevice?.name || 'BT Audio'}
            </span>
          )}
        </div>

        {/* Percentage */}
        <div className="w-12 flex items-center justify-end">
          <span className="text-xs font-bold tracking-tight text-white/95 font-mono">
            {osdAlert.value}%
          </span>
        </div>
      </div>

      {/* Bottom Row: 32-Segment Vertical Tick Meter */}
      <div className="flex items-center justify-between w-full h-3.5 px-0.5 mt-0.5">
        {Array.from({ length: 32 }).map((_, i) => {
          const tickPercent = ((i + 1) / 32) * 100;
          const isFilled = osdAlert.value >= tickPercent;
          return (
            <div
              key={i}
              className={`w-[3px] h-[13px] rounded-full transition-all duration-75 ${
                isFilled
                  ? (osdAlert.type === 'brightness'
                      ? 'bg-gradient-to-t from-amber-400 to-amber-200 shadow-[0_0_5px_rgba(251,191,36,0.7)]'
                      : isBtAudio
                      ? 'bg-gradient-to-t from-cyan-400 via-sky-300 to-white shadow-[0_0_5px_rgba(6,182,212,0.6)]'
                      : 'bg-gradient-to-t from-amber-500 via-amber-300 to-white shadow-[0_0_5px_rgba(245,158,11,0.6)]')
                  : 'bg-white/[0.12]'
              }`}
            />
          );
        })}
      </div>
    </motion.div>
  );
}));

export default OsdAlert;
