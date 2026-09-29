import React from 'react';
import {
  LayoutGrid, Music, Coffee, Timer as TimerIcon, Activity, Signal,
  SlidersHorizontal, Settings as SettingsIcon, Pin, X
} from 'lucide-react';
import WeatherIcon from '../../WeatherIcon';
import { BatteryRing } from '../ui/Glyphs';

const ipcRenderer = typeof window !== 'undefined'
  ? (window.electronAPI || (window.require ? window.require('electron').ipcRenderer : null))
  : null;

const ICON = { size: 14, strokeWidth: 1.9 };

const PrivacyDots = ({ privacy }) => (privacy.mic || privacy.cam) ? (
  <div className="flex gap-1 items-center px-1">
    {privacy.cam && <span title="Camera in use" className="w-[6px] h-[6px] rounded-full bg-[#30D158]" />}
    {privacy.mic && <span title="Microphone in use" className="w-[6px] h-[6px] rounded-full bg-[#FF9F0A]" />}
  </div>
) : null;

const StatusCluster = ({ config, weather, battery }) => (
  <div className="flex items-center gap-2.5 text-white/60">
    {(config.showWeather !== false && config.showWeatherWidget !== false) && weather.temp && (
      <button
        type="button"
        title="Weather"
        className="flex items-center gap-1 hover:text-white transition-colors"
        onClick={(e) => { e.stopPropagation(); ipcRenderer?.send('open-weather'); }}
      >
        <WeatherIcon desc={weather.desc} size={13} className="text-current" />
        <span className="tnum text-[11.5px] font-medium">{weather.temp}</span>
      </button>
    )}
    <div className="flex items-center gap-1.5" title={`Battery ${battery.level}%${battery.charging ? ', charging' : ''}`}>
      <span className="tnum text-[11.5px] font-medium">{battery.level}%</span>
      <BatteryRing level={battery.level} charging={battery.charging} size={16} />
    </div>
  </div>
);

export const ExpandedHeader = React.memo(({
  isSideNotch = false,
  viewMode,
  setViewMode,
  config,
  updateAvailable,
  whatsNewAvailable,
  isBoosting,
  handleBoost,
  isPinned,
  setIsPinned,
  privacy = {},
  weather = {},
  battery = {},
  onOpenSettings
}) => {
  const openSettings = (e) => {
    e.stopPropagation();
    if (onOpenSettings) onOpenSettings();
    else if (ipcRenderer) ipcRenderer.send('open-settings-window');
    else setViewMode('settings');
  };

  const showHw = config.showHardware !== false && config.showHardwareWidget !== false;
  const tabs = [
    { id: 'dashboard', title: 'Home', Icon: LayoutGrid, show: true },
    { id: 'media', title: 'Now playing', Icon: Music, show: config.showMediaWidget !== false },
    { id: 'control', title: 'Controls', Icon: SlidersHorizontal, show: true },
    { id: 'pomodoro', title: 'Focus timer', Icon: Coffee, show: config.showPomodoro !== false },
    { id: 'stopwatch', title: 'Stopwatch', Icon: TimerIcon, show: !!config.showStopwatch },
    { id: 'stats', title: 'System', Icon: Activity, show: showHw },
    { id: 'network', title: 'Network', Icon: Signal, show: showHw }
  ].filter((t) => t.show);

  const badge = updateAvailable ? '#FF453A' : (whatsNewAvailable ? '#0A84FF' : null);

  const tabButton = (t, stretch) => (
    <button
      key={t.id}
      type="button"
      title={t.title}
      className={`${stretch ? 'flex-1' : 'w-7'} h-7 rounded-full flex items-center justify-center transition-colors duration-150 ${
        viewMode === t.id ? 'bg-white/[0.16] text-white' : 'text-white/45 hover:text-white'
      }`}
      onClick={(e) => { e.stopPropagation(); setViewMode(t.id); }}
    >
      <t.Icon {...ICON} />
    </button>
  );

  const utilButton = ({ title, onClick, children, active = false, danger = false, disabled = false, extra = null }) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 disabled:opacity-40 ${
        active ? 'bg-white/[0.16] text-white' : (danger ? 'text-white/40 hover:text-[#FF453A] hover:bg-white/[0.06]' : 'text-white/40 hover:text-white hover:bg-white/[0.06]')
      }`}
    >
      {children}
      {extra}
    </button>
  );

  const utilities = (
    <>
      {utilButton({
        title: isPinned ? 'Unpin' : 'Keep open',
        active: isPinned,
        onClick: (e) => { e.stopPropagation(); setIsPinned(!isPinned); },
        children: <Pin {...ICON} size={13} className={isPinned ? 'rotate-45' : ''} />
      })}
      {utilButton({
        title: 'Settings',
        active: viewMode === 'settings',
        onClick: openSettings,
        children: <SettingsIcon {...ICON} />,
        extra: badge && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: badge }} />
      })}
      {utilButton({
        title: 'Quit Smart Notch',
        danger: true,
        onClick: (e) => { e.stopPropagation(); ipcRenderer?.send('quit-app'); },
        children: <X {...ICON} size={13} />
      })}
    </>
  );

  if (isSideNotch && viewMode !== 'settings') {
    return (
      <div className="w-full p-2 flex flex-col gap-2 z-20" style={{ WebkitAppRegion: 'no-drag', pointerEvents: 'auto' }}>
        <div className="flex items-center justify-between w-full px-1">
          <div className="flex items-center gap-1.5">
            <StatusCluster config={config} weather={weather} battery={battery} />
            <PrivacyDots privacy={privacy} />
          </div>
          <div className="flex items-center">{utilities}</div>
        </div>
        <div className="flex items-center gap-0.5 w-full card-fill p-0.5 rounded-full">
          {tabs.map((t) => tabButton(t, true))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-2 flex items-center justify-between z-20" style={{ WebkitAppRegion: 'no-drag', pointerEvents: 'auto' }}>
      <div className="flex items-center gap-0.5 card-fill rounded-full p-0.5">
        {tabs.map((t) => tabButton(t, false))}
      </div>
      <div className="flex items-center gap-1">
        <PrivacyDots privacy={privacy} />
        <div className="mr-1.5"><StatusCluster config={config} weather={weather} battery={battery} /></div>
        {utilities}
      </div>
    </div>
  );
});
