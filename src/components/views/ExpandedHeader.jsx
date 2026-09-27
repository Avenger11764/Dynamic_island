import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, Music, Coffee, Timer as TimerIcon, Activity, Signal, 
  SlidersHorizontal, Settings as SettingsIcon, Rocket, Pin, Power, 
  BatteryCharging, Battery 
} from 'lucide-react';
import WeatherIcon from '../../WeatherIcon';

const ipcRenderer = typeof window !== 'undefined' 
  ? (window.electronAPI || (window.require ? window.require('electron').ipcRenderer : null)) 
  : null;

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
  idleTextColor = 'white'
}) => {
  return (
    <div className="w-full p-2 flex flex-col justify-start z-20" style={{ WebkitAppRegion: 'no-drag' }}>
      {isSideNotch && viewMode !== 'settings' ? (
        <div className="flex flex-col gap-2.5 w-full">
          {/* Top row: Weather, Battery and Utilities (Pin + Power) */}
          <div className="flex items-center justify-between w-full px-1 pt-0.5">
            <div className="flex items-center gap-2" style={{ pointerEvents: 'auto', WebkitAppRegion: 'no-drag' }}>
              {config.showWeather !== false && (
                <div 
                  className="flex items-center gap-1.5 cursor-pointer group px-1 py-0.5 rounded-md hover:bg-white/5 transition-colors" 
                  title="Weather"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (ipcRenderer) ipcRenderer.send('open-weather');
                  }}
                >
                  <WeatherIcon desc={weather.desc} size={13} className="text-white/70 group-hover:text-yellow-400 transition-colors" />
                  <span className="text-[11px] font-semibold text-white/70 group-hover:text-white transition-colors">
                    {weather.temp}
                  </span>
                </div>
              )}
              <div className="w-[1px] h-3 bg-white/10" />
              <div className="flex items-center gap-1.5 cursor-default group px-1 py-0.5" title="System Battery">
                {battery.charging ? (
                  <BatteryCharging size={13} className="text-green-400/90 group-hover:text-green-400 transition-colors" />
                ) : (
                  <Battery size={13} className={battery.level <= 20 ? 'text-red-400/90 group-hover:text-red-400' : 'text-white/60 group-hover:text-white transition-colors'} />
                )}
                <span className={`text-[11px] font-semibold tracking-tight transition-colors ${battery.charging ? 'text-green-400 font-bold' : (battery.level <= 20 ? 'text-red-400 font-bold' : 'text-white/70 group-hover:text-white')}`}>
                  {battery.level}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {(privacy.mic || privacy.cam) && (
                <div className="flex gap-1.5 mx-1 items-center bg-white/[0.05] border border-white/10 px-1.5 py-1 rounded-full">
                  {privacy.cam && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="relative flex items-center justify-center flex-shrink-0"
                      title="Camera in use"
                    >
                      <div 
                        className="w-[7.5px] h-[7.5px] rounded-full bg-[#30D158]" 
                        style={{
                          boxShadow: '0 0 8px 1.5px rgba(48, 209, 88, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.7)'
                        }}
                      />
                    </motion.div>
                  )}
                  {privacy.mic && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="relative flex items-center justify-center flex-shrink-0"
                      title="Microphone in use"
                    >
                      <div 
                        className="w-[7.5px] h-[7.5px] rounded-full bg-[#FF9F0A]" 
                        style={{
                          boxShadow: '0 0 8px 1.5px rgba(255, 159, 10, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.7)'
                        }}
                      />
                    </motion.div>
                  )}
                </div>
              )}
              <button 
                type="button"
                title={isPinned ? "Unpin (Auto-collapse)" : "Pin (Keep open)"}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isPinned ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/40' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                style={{ pointerEvents: 'auto' }}
                onClick={(e) => { e.stopPropagation(); setIsPinned(!isPinned); }}
              >
                <Pin size={12} className={isPinned ? "rotate-45" : ""} />
              </button>
              <button 
                type="button"
                title="Quit Smart Notch"
                className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                style={{ pointerEvents: 'auto' }}
                onClick={() => ipcRenderer?.send('quit-app')}
              >
                <Power size={12} />
              </button>
            </div>
          </div>

          {/* Navigation Bar: Mode switcher buttons */}
          <div className="flex items-center justify-between gap-1 w-full bg-white/[0.04] p-1 rounded-xl border border-white/5" style={{ pointerEvents: 'auto', WebkitAppRegion: 'no-drag' }}>
            <button 
              type="button"
              title="Dashboard" 
              className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'dashboard' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`} 
              onClick={(e) => { e.stopPropagation(); setViewMode('dashboard'); }}
            >
              <LayoutGrid size={13} />
            </button>
            <button 
              type="button"
              title="Media Player" 
              className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'media' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`} 
              onClick={() => setViewMode('media')}
            >
              <Music size={13} />
            </button>
            <button 
              type="button"
              title="Control Center" 
              className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'control' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`} 
              onClick={(e) => { e.stopPropagation(); setViewMode('control'); }}
            >
              <SlidersHorizontal size={13} />
            </button>
            {config.showPomodoro !== false && (
              <button 
                type="button"
                title="Pomodoro Timer" 
                className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'pomodoro' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`} 
                onClick={(e) => { e.stopPropagation(); setViewMode('pomodoro'); }}
              >
                <Coffee size={13} />
              </button>
            )}
            {config.showHardware !== false && (
              <>
                <button 
                  type="button"
                  title="Hardware Stats" 
                  className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'stats' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`} 
                  onClick={(e) => { e.stopPropagation(); setViewMode('stats'); }}
                >
                  <Activity size={13} />
                </button>
                <button 
                  type="button"
                  title="Network Stats" 
                  className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'network' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`} 
                  onClick={(e) => { e.stopPropagation(); setViewMode('network'); }}
                >
                  <Signal size={13} />
                </button>
              </>
            )}
            <button 
              type="button"
              title="Boost System" 
              className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-all ${isBoosting ? 'bg-cyan-500/50 text-white shadow-md' : 'text-cyan-400 hover:text-white hover:bg-cyan-500/80'} disabled:opacity-50`} 
              onClick={(e) => { e.stopPropagation(); handleBoost(); }}
              disabled={isBoosting}
            >
              <Rocket size={13} className={isBoosting ? "animate-pulse" : ""} />
            </button>
            <button 
              type="button"
              title="Settings" 
              className={`relative flex-1 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'settings' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`} 
              onClick={(e) => { e.stopPropagation(); setViewMode('settings'); }}
            >
              <SettingsIcon size={13} />
              {updateAvailable ? (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
              ) : whatsNewAvailable ? (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
              ) : null}
            </button>
          </div>
        </div>
      ) : (
        // ── Clean top-position header matching reference design ──
        <div className="flex items-center justify-between w-full">
          {/* Left: Compact icon pill nav */}
          <div className="flex items-center gap-0.5 bg-white/[0.06] rounded-full p-1" style={{ pointerEvents: 'auto', WebkitAppRegion: 'no-drag' }}>
            <button 
              type="button"
              title="Dashboard" 
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${viewMode === 'dashboard' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`} 
              onClick={(e) => { e.stopPropagation(); setViewMode('dashboard'); }}
            >
              <LayoutGrid size={13} />
            </button>
            <button 
              type="button"
              title="Media Player" 
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${viewMode === 'media' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`} 
              onClick={(e) => { e.stopPropagation(); setViewMode('media'); }}
            >
              <Music size={13} />
            </button>
            {config.showPomodoro !== false && (
              <button 
                type="button"
                title="Pomodoro Timer" 
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${viewMode === 'pomodoro' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`} 
                onClick={(e) => { e.stopPropagation(); setViewMode('pomodoro'); }}
              >
                <Coffee size={13} />
              </button>
            )}
            {config.showStopwatch && (
              <button 
                type="button"
                title="Stopwatch" 
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${viewMode === 'stopwatch' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`} 
                onClick={(e) => { e.stopPropagation(); setViewMode('stopwatch'); }}
              >
                <TimerIcon size={13} />
              </button>
            )}
            {config.showHardware !== false && (
              <>
                <button 
                  type="button"
                  title="Hardware Stats" 
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${viewMode === 'stats' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`} 
                  onClick={(e) => { e.stopPropagation(); setViewMode('stats'); }}
                >
                  <Activity size={13} />
                </button>
                <button 
                  type="button"
                  title="Network Stats" 
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${viewMode === 'network' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`} 
                  onClick={(e) => { e.stopPropagation(); setViewMode('network'); }}
                >
                  <Signal size={13} />
                </button>
              </>
            )}
            <button 
              type="button"
              title="Control Center" 
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${viewMode === 'control' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`} 
              onClick={(e) => { e.stopPropagation(); setViewMode('control'); }}
            >
              <SlidersHorizontal size={13} />
            </button>
          </div>

          {/* Right side: Privacy dots + Weather + Pin + Settings */}
          <div className="flex items-center gap-1.5" style={{ pointerEvents: 'auto', WebkitAppRegion: 'no-drag' }}>
            {(privacy.mic || privacy.cam) && (
              <div className="flex gap-1.5 mx-1 items-center bg-white/[0.05] border border-white/10 px-2 py-1 rounded-full">
                {privacy.cam && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="relative flex items-center justify-center flex-shrink-0"
                    title="Camera in use"
                  >
                    <div 
                      className="w-[7.5px] h-[7.5px] rounded-full bg-[#30D158]" 
                      style={{
                        boxShadow: '0 0 8px 1.5px rgba(48, 209, 88, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.7)'
                      }}
                    />
                  </motion.div>
                )}
                {privacy.mic && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="relative flex items-center justify-center flex-shrink-0"
                    title="Microphone in use"
                  >
                    <div 
                      className="w-[7.5px] h-[7.5px] rounded-full bg-[#FF9F0A]" 
                      style={{
                        boxShadow: '0 0 8px 1.5px rgba(255, 159, 10, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.7)'
                      }}
                    />
                  </motion.div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2.5 mr-2" style={{ pointerEvents: 'auto' }}>
              <div 
                className="flex items-center gap-1.5 cursor-pointer group" 
                title="Weather"
                onClick={(e) => {
                  e.stopPropagation();
                  if (ipcRenderer) ipcRenderer.send('open-weather');
                }}
              >
                <WeatherIcon desc={weather.desc} size={13} className="text-white/60 group-hover:text-yellow-400 transition-colors" />
                <span className="text-[11px] font-semibold text-white/60 group-hover:text-white transition-colors tracking-tight">
                  {weather.temp}
                </span>
              </div>
              <div className="w-[1px] h-3 bg-white/15" />
              <div className="flex items-center gap-1.5 cursor-default group" title="System Battery">
                {battery.charging ? (
                  <BatteryCharging size={13} className="text-green-400/80 group-hover:text-green-400 transition-colors" />
                ) : (
                  <Battery size={13} className={battery.level <= 20 ? 'text-red-400/80 group-hover:text-red-400' : 'text-white/50 group-hover:text-white transition-colors'} />
                )}
                <span className={`text-[11px] font-semibold tracking-tight transition-colors ${battery.charging ? 'text-green-400/90 group-hover:text-green-400' : (battery.level <= 20 ? 'text-red-400/90 group-hover:text-red-400' : 'text-white/60 group-hover:text-white')}`}>
                  {battery.level}%
                </span>
              </div>
            </div>
            <button 
              type="button"
              title={isPinned ? "Unpin" : "Pin"}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${isPinned ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
              onClick={(e) => { e.stopPropagation(); setIsPinned(!isPinned); }}
            >
              <Pin size={12} className={isPinned ? "rotate-45" : ""} />
            </button>
            <button 
              type="button"
              title="Settings" 
              className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${viewMode === 'settings' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`} 
              onClick={(e) => { e.stopPropagation(); setViewMode('settings'); }}
            >
              <SettingsIcon size={14} />
              {updateAvailable ? (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
              ) : whatsNewAvailable ? (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
              ) : null}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
