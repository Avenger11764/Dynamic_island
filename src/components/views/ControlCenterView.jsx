import React from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, Volume1, VolumeX, Moon, BellOff, Sun, Bluetooth, Battery 
} from 'lucide-react';
import { CapsuleSlider } from '../ui/CapsuleSlider';
import { sendIpc } from '../../utils/ipc';

export const ControlCenterView = React.memo(({
  ipcRenderer,
  isMuted,
  setIsMuted,
  isNightLight,
  setIsNightLight,
  isDnd,
  setIsDnd,
  brightnessLevel,
  setBrightnessLevel,
  volumeLevel,
  setVolumeLevel,
  isBtAudio,
  activeBtDevice
}) => {
  const dispatchIpc = (channel, ...args) => {
    if (ipcRenderer && typeof ipcRenderer.send === 'function') {
      try { ipcRenderer.send(channel, ...args); return; } catch (_) {}
    }
    sendIpc(channel, ...args);
  };

  return (
    <motion.div
      key="control-center"
      className="w-full flex flex-col gap-2.5 px-0.5 py-0.5 justify-between h-full select-none"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
    >
      {/* Quick Toggles Row */}
      <div className="grid grid-cols-3 gap-2 w-full select-none">
        {/* Mute Toggle */}
        <button
          type="button"
          title="Toggle Audio Mute"
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(prev => !prev);
            dispatchIpc('toggle-mute');
          }}
          className={`flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all duration-150 border select-none cursor-pointer text-left active:scale-[0.98] no-drag ${
            isMuted
              ? 'bg-red-500/20 border-red-500/35 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
              : 'bg-white/[0.07] hover:bg-white/[0.12] border-white/[0.08] text-white/90'
          }`}
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white'
            }`}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold tracking-tight truncate leading-tight">Mute</span>
            <span className="text-[9px] text-white/50 truncate leading-tight mt-0.5 font-medium">
              {isMuted ? 'Muted' : 'Unmuted'}
            </span>
          </div>
        </button>

        {/* Night Light Toggle */}
        <button
          type="button"
          title="Toggle Night Light & Settings"
          onClick={(e) => {
            e.stopPropagation();
            setIsNightLight(prev => !prev);
            dispatchIpc('open-nightlight');
          }}
          className={`flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all duration-150 border select-none cursor-pointer text-left active:scale-[0.98] no-drag ${
            isNightLight
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.25)]'
              : 'bg-white/[0.07] hover:bg-white/[0.12] border-white/[0.08] text-white/90'
          }`}
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              isNightLight ? 'bg-amber-400 text-black' : 'bg-white/10 text-white'
            }`}
          >
            <Moon size={15} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold tracking-tight truncate leading-tight">Night Light</span>
            <span className="text-[9px] text-white/50 truncate leading-tight mt-0.5 font-medium">
              {isNightLight ? 'On' : 'Off'}
            </span>
          </div>
        </button>

        {/* Focus / DND Toggle */}
        <button
          type="button"
          title="Toggle Do Not Disturb Focus"
          onClick={(e) => {
            e.stopPropagation();
            setIsDnd(prev => !prev);
            dispatchIpc('open-focus');
          }}
          className={`flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all duration-150 border select-none cursor-pointer text-left active:scale-[0.98] no-drag ${
            isDnd
              ? 'bg-indigo-500/25 border-indigo-500/40 text-indigo-200 shadow-[0_0_14px_rgba(99,102,241,0.25)]'
              : 'bg-white/[0.07] hover:bg-white/[0.12] border-white/[0.08] text-white/90'
          }`}
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              isDnd ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white'
            }`}
          >
            <BellOff size={15} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold tracking-tight truncate leading-tight">Focus</span>
            <span className="text-[9px] text-white/50 truncate leading-tight mt-0.5 font-medium">
              {isDnd ? 'Active' : 'Off'}
            </span>
          </div>
        </button>
      </div>

      {/* Display Brightness Capsule Slider */}
      <div className="w-full flex flex-col gap-1">
        <CapsuleSlider
          icon={Sun}
          label="Display Brightness"
          value={brightnessLevel}
          accentGrad="from-amber-200/90 via-amber-100 to-white"
          onChange={(val) => {
            setBrightnessLevel(val);
            dispatchIpc('set-brightness', val);
          }}
          onWheel={(e) => {
            const delta = e.deltaY < 0 ? 5 : -5;
            const newVal = Math.max(0, Math.min(100, brightnessLevel + delta));
            setBrightnessLevel(newVal);
            dispatchIpc('set-brightness', newVal);
          }}
        />
      </div>

      {/* Sound Volume Capsule Slider */}
      <div className="w-full flex flex-col gap-1">
        <CapsuleSlider
          icon={volumeLevel === 0 || isMuted ? VolumeX : (volumeLevel < 50 ? Volume1 : Volume2)}
          label={isBtAudio ? "Bluetooth Audio" : "Sound Volume"}
          value={volumeLevel}
          accentGrad={isBtAudio ? "from-blue-300/90 via-blue-200 to-white" : "from-sky-200/90 via-sky-100 to-white"}
          onChange={(val) => {
            setVolumeLevel(val);
            dispatchIpc('set-volume', val);
          }}
          onWheel={(e) => {
            const delta = e.deltaY < 0 ? 4 : -4;
            const newVal = Math.max(0, Math.min(100, volumeLevel + delta));
            setVolumeLevel(newVal);
            dispatchIpc('set-volume', newVal);
          }}
        />
        {isBtAudio && (
          <div className="flex items-center gap-1.5 px-2 mt-0.5">
            <Bluetooth size={11} className="text-cyan-400" />
            <span className="text-[10px] text-cyan-300 font-semibold tracking-wide truncate">
              Output: {activeBtDevice?.name || 'Bluetooth Audio'}
            </span>
            {activeBtDevice?.battery > 0 && (
              <span className="ml-auto text-[10px] font-mono text-white/70 flex items-center gap-1 font-bold">
                <Battery size={11} className="text-emerald-400" />
                {activeBtDevice.battery}%
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default ControlCenterView;
