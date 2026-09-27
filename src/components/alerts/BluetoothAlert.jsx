import React from 'react';
import { motion } from 'framer-motion';
import { Battery, Bluetooth } from 'lucide-react';
import { PremiumHeadphonesIcon } from '../ui/PremiumIcons';

export const BluetoothAlert = React.memo(React.forwardRef(({ btDevice, isSideNotch = false, screenPosition = 'top' }, ref) => {
  if (!btDevice) return null;

  const isConnected = btDevice.type === 'connected';
  const isAirPods = btDevice.name?.toLowerCase().includes('airpod');
  const isHeadphones = btDevice.name?.toLowerCase().match(/rockerz|headphone|wh-|qc|soundcore|tune|studio|over-ear|bass|anc|buds|ear/i);

  // Bezel-aware padding
  const paddingClass = screenPosition === 'right' 
    ? 'pl-3 pr-4' 
    : (screenPosition === 'left' ? 'pl-4 pr-3' : 'px-4');

  if (isSideNotch) {
    return (
      <motion.div
        ref={ref}
        key="bt-notification-vertical"
        className="w-full h-full flex flex-col items-center justify-between py-3 px-1.5 z-20 select-none overflow-hidden"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      >
        {/* Top: Device Icon with Status Jewel */}
        <div className="relative w-11 h-11 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center flex-shrink-0 shadow-sm">
          {isAirPods ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M7 3C5.34 3 4 4.34 4 6v5c0 1.66 1.34 3 3 3 .35 0 .68-.06.98-.17L7 19c0 1.1.9 2 2 2s2-.9 2-2V6c0-1.66-1.34-3-3-3zm10 0c-1.66 0-3 1.34-3 3v13c0 1.1.9 2 2 2s2-.9 2-2l-.98-5.17c.3-.11.63-.17.98-.17 1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3z"/>
            </svg>
          ) : isHeadphones ? (
            <PremiumHeadphonesIcon size={20} className="text-cyan-300" />
          ) : (
            <Bluetooth size={20} className="text-cyan-400" />
          )}

          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${
              isConnected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]' : 'bg-red-400'
            }`}
          />
        </div>

        {/* Center: Device Name & Status */}
        <div className="flex flex-col items-center text-center w-full px-1">
          <span 
            className="font-extrabold text-[12px] text-white tracking-tight line-clamp-2 leading-snug w-full"
            title={btDevice.name}
          >
            {btDevice.name || 'BT Device'}
          </span>
          <span className={`text-[8.5px] font-black uppercase tracking-wider mt-1.5 px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm ${
            isConnected ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/35' : 'text-red-300 bg-red-500/20 border border-red-500/35'
          }`}>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Bottom: Battery Badge */}
        {isConnected && (
          <div className="flex items-center justify-center w-full pb-0.5">
            {isAirPods ? (
              <div className="flex flex-col items-center gap-0.5 text-[8.5px] font-mono font-bold bg-white/[0.06] border border-white/[0.08] px-2 py-1 rounded-xl text-white/90">
                <span>L 100%</span>
                <span>R 100%</span>
              </div>
            ) : btDevice.battery > 0 ? (
              <div className="flex items-center gap-1.5 bg-emerald-500/[0.15] border border-emerald-500/30 px-3 py-1 rounded-full shadow-sm">
                <Battery size={13} className="text-emerald-400" />
                <span className="text-[12px] font-mono font-black text-emerald-300">{btDevice.battery}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-cyan-500/[0.12] border border-cyan-500/25 px-2 py-0.5 rounded-full text-cyan-300 text-[9px] font-bold">
                <Bluetooth size={11} className="text-cyan-400" />
                <span>Active</span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      ref={ref}
      key="bt-notification" 
      className={`w-full h-full ${paddingClass} py-2 flex items-center justify-between gap-3 z-10 select-none`} 
      initial={{ opacity: 0, scale: 0.95, y: -4 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
    >
      {/* Device Icon in Glass Squircle Badge */}
      <div className="relative w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center flex-shrink-0 shadow-sm">
        {isAirPods ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" className="text-white">
            <path d="M7 3C5.34 3 4 4.34 4 6v5c0 1.66 1.34 3 3 3 .35 0 .68-.06.98-.17L7 19c0 1.1.9 2 2 2s2-.9 2-2V6c0-1.66-1.34-3-3-3zm10 0c-1.66 0-3 1.34-3 3v13c0 1.1.9 2 2 2s2-.9 2-2l-.98-5.17c.3-.11.63-.17.98-.17 1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3z"/>
          </svg>
        ) : isHeadphones ? (
          <PremiumHeadphonesIcon size={18} className="text-cyan-300" />
        ) : (
          <Bluetooth size={18} className="text-cyan-400" />
        )}

        {/* Micro status jewel on badge corner */}
        <div 
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black ${
            isConnected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]' : 'bg-red-400'
          }`}
        />
      </div>

      {/* Center: Device Name & Status */}
      <div className="flex flex-col min-w-0 flex-1 justify-center">
        <span className="font-extrabold text-[13px] text-white tracking-tight truncate leading-tight">
          {btDevice.name || 'Bluetooth Device'}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[10.5px] font-semibold tracking-wide ${isConnected ? 'text-emerald-400/90' : 'text-white/40'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Right: Battery or Connection Pill */}
      {isConnected && (
        <div className="flex-shrink-0 flex items-center">
          {isAirPods ? (
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-white/[0.06] border border-white/[0.08] px-2 py-1 rounded-full text-white/90">
              <span className="text-white/40">L</span><span>100%</span>
              <span className="text-white/40 ml-0.5">R</span><span>100%</span>
            </div>
          ) : btDevice.battery > 0 ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/[0.12] border border-emerald-500/25 px-2.5 py-1 rounded-full shadow-sm">
              <Battery size={13} className="text-emerald-400" />
              <span className="text-xs font-mono font-extrabold text-emerald-300">{btDevice.battery}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-cyan-500/[0.12] border border-cyan-500/25 px-2 py-0.5 rounded-full text-cyan-300 text-[10px] font-bold">
              <Bluetooth size={11} className="text-cyan-400" />
              <span>Active</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}));

export default BluetoothAlert;
