import React from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, Volume1, VolumeX, Moon, BellOff, Sun 
} from 'lucide-react';
import { CapsuleSlider } from '../ui/CapsuleSlider';
import { sendIpc } from '../../utils/ipc';

const Toggle = ({ title, label, state, active, Icon, onClick, onContextMenu, compact }) => (
  <button
    type="button"
    title={title}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    onContextMenu={onContextMenu ? (e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(); } : undefined}
    className={`flex ${compact ? 'flex-col items-center text-center gap-1.5 py-2.5' : 'items-center gap-2 py-2'} px-2 rounded-[14px] card-fill card-fill-hover text-left active:scale-[0.98] no-drag min-w-0`}
    style={{ WebkitAppRegion: 'no-drag' }}
  >
    <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${active ? 'bg-white text-black' : 'bg-white/[0.1] text-white/85'}`}>
      <Icon size={14} strokeWidth={2} />
    </span>
    <span className={`flex flex-col min-w-0 ${compact ? 'items-center' : ''}`}>
      <span className="text-[11.5px] font-medium text-white/90 truncate leading-tight">{label}</span>
      <span className="text-[10.5px] text-white/45 truncate leading-tight mt-0.5">{state}</span>
    </span>
  </button>
);

export const ControlCenterView = React.memo(({
  compact = false,
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
      className="w-full flex flex-col gap-2 select-none"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
    >
      {/* Quick toggles */}
      <div className="grid grid-cols-3 gap-2 w-full select-none">
        <Toggle
          title="Mute audio"
          label="Mute"
          state={isMuted ? 'On' : 'Off'}
          active={isMuted}
          Icon={isMuted ? VolumeX : Volume2}
          compact={compact}
          onClick={() => { setIsMuted(prev => !prev); dispatchIpc('toggle-mute'); }}
        />
        <Toggle
          title="Night light (right-click for settings)"
          label="Night light"
          state={isNightLight ? 'On' : 'Off'}
          active={isNightLight}
          Icon={Moon}
          compact={compact}
          onClick={() => { const next = !isNightLight; setIsNightLight(next); dispatchIpc('set-night-light', next); }}
          onContextMenu={() => dispatchIpc('open-nightlight')}
        />
        <Toggle
          title="Do not disturb (right-click for settings)"
          label="Focus"
          state={isDnd ? 'On' : 'Off'}
          active={isDnd}
          Icon={BellOff}
          compact={compact}
          onClick={() => { const next = !isDnd; setIsDnd(next); dispatchIpc('set-dnd', next); }}
          onContextMenu={() => dispatchIpc('open-focus')}
        />
      </div>

      {/* Display Brightness Capsule Slider */}
      <div className="w-full flex flex-col gap-1">
        <CapsuleSlider
          icon={Sun}
          label="Brightness"
          value={brightnessLevel}
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
          label={isBtAudio ? (activeBtDevice?.name || 'Headphones') : 'Volume'}
          value={volumeLevel}
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
      </div>
    </motion.div>
  );
});

export default ControlCenterView;
