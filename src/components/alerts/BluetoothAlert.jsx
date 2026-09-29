import React from 'react';
import { motion } from 'framer-motion';
import { Bluetooth, Headphones, Speaker, Keyboard, Mouse, Gamepad2, Smartphone } from 'lucide-react';
import { BatteryRing } from '../ui/Glyphs';

const pickDeviceIcon = (name = '') => {
  const n = name.toLowerCase();
  if (/airpod|buds|earbud|ear|tws|headphone|headset|rockerz|wh-|wf-|qc|soundcore|tune|studio|bass|anc|jabra|beats/.test(n)) return Headphones;
  if (/speaker|soundbar|boom|flip|charge|jbl go|stone/.test(n)) return Speaker;
  if (/keyboard|keys/.test(n)) return Keyboard;
  if (/mouse|mx master|trackpad/.test(n)) return Mouse;
  if (/controller|gamepad|xbox|dualsense|dualshock/.test(n)) return Gamepad2;
  if (/phone|galaxy|pixel|iphone|redmi|oneplus/.test(n)) return Smartphone;
  return Bluetooth;
};

export const BluetoothAlert = React.memo(React.forwardRef(({ btDevice, isSideNotch = false, screenPosition = 'top' }, ref) => {
  if (!btDevice) return null;

  const isConnected = btDevice.type === 'connected';
  const Icon = pickDeviceIcon(btDevice.name);
  const hasBattery = isConnected && btDevice.battery > 0;
  const name = btDevice.name || 'Bluetooth device';

  const badge = (
    <div className="relative w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
      <Icon size={17} strokeWidth={1.9} className={isConnected ? 'text-white' : 'text-white/45'} />
    </div>
  );

  if (isSideNotch) {
    return (
      <motion.div
        ref={ref}
        key="bt-notification-vertical"
        className="w-full h-full flex flex-col items-center justify-center gap-3 py-4 px-2 z-20 select-none overflow-hidden"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
      >
        {badge}
        <div className="flex flex-col items-center text-center w-full gap-1">
          <span className="text-[11.5px] font-semibold text-white leading-tight line-clamp-3 break-words w-full" title={name}>
            {name}
          </span>
          <span className="text-[10px] font-medium text-white/50">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {hasBattery && (
          <div className="flex flex-col items-center gap-1">
            <BatteryRing level={btDevice.battery} size={16} />
            <span className="font-display text-[11px] font-semibold text-white/85">{btDevice.battery}%</span>
          </div>
        )}
      </motion.div>
    );
  }

  const paddingClass = screenPosition === 'right' ? 'pl-3 pr-4' : (screenPosition === 'left' ? 'pl-4 pr-3' : 'px-4');

  return (
    <motion.div
      ref={ref}
      key="bt-notification"
      className={`w-full h-full ${paddingClass} flex items-center gap-3 z-10 select-none`}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
    >
      {badge}
      <div className="flex flex-col min-w-0 flex-1 justify-center gap-0.5">
        <span className="text-[13px] font-semibold text-white truncate leading-tight" title={name}>{name}</span>
        <span className="text-[11px] font-medium text-white/50 leading-tight">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      {hasBattery && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="font-display text-[12.5px] font-semibold text-white/85">{btDevice.battery}%</span>
          <BatteryRing level={btDevice.battery} size={18} />
        </div>
      )}
    </motion.div>
  );
}));

export default BluetoothAlert;
