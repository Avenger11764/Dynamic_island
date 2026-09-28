import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, Music, X, Activity, 
  Battery, BatteryCharging, Calendar, Rocket, 
  Settings as SettingsIcon, Signal, Coffee, Timer as TimerIcon, 
  Phone, GripVertical, GripHorizontal, Cpu, HardDrive, Wifi, Power,
  ArrowDown, ArrowUp, Volume2, VolumeX, Volume1, Sun, Moon, BellOff, Headphones, Bluetooth, Sparkles,
  Scissors, RotateCcw
} from 'lucide-react';
import WeatherIcon from '../../WeatherIcon';
import AudioWaveform from '../../AudioWaveform';
import { 
  MatrixBackground, 
  HyperspaceBackground, 
  RainBackground,
  LiquidGlowBackground,
  CosmicOrbitsBackground,
  AuroraWaveBackground
} from '../background';
import { formatTime, formatSpeed } from '../../utils/formatters';
import { SourceAppIcon } from '../ui/SourceAppIcon';

export const ShelfBar = React.memo(({ 
  isVisible, time, formatDate, weather, spotifyState, isSpotify, localProgress, 
  hardware, network, battery, privacy, config, onTogglePlay, onPrev, onSkip,
  onOpenMediaApp, onOpenWeather, onQuit, onShowSettings, getCurrentLyric,
  pomodoro, isPomoRunning, pomoMode, isSwRunning, stopwatch, onBoost, isBoosting,
  togglePomo, resetPomo, switchPomoMode, toggleSw, resetSw,
  onPointerDown, onPointerMove, onPointerUp, onPointerCancel,
  batteryEvent, boostAlert, boostProgress, greeting, activeCall, sysNotification, setSysNotification,
  updateAvailable, whatsNewAvailable, onSeek,
  volumeLevel = 65, setVolumeLevel,
  brightnessLevel = 80, setBrightnessLevel,
  isMuted = false, setIsMuted,
  isDnd = false, setIsDnd,
  isNightLight = false, setIsNightLight,
  isBtAudio = false, activeBtDevice,
  ipcRenderer
}) => {
  const [sideTimerTab, setSideTimerTab] = useState('focus');
  const isRgb = config.accentColor === 'rgb';
  const accentHex = (!isRgb && config.accentColor?.startsWith('#')) ? config.accentColor : '#06b6d4';
  const hexToRgba = (hex, a) => {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r},${g},${b},${a})`;
  };

  const isSide = config.screenPosition === 'left' || config.screenPosition === 'right';
  const isLeft = config.screenPosition === 'left';

  // Apple Notch signature polished glass shadows (seamless with screen border, zero bezel white line)
  const polishedBarShadow = isSide ? (
    isLeft 
      ? '10px 0 36px -10px rgba(0, 0, 0, 0.85)'
      : '-10px 0 36px -10px rgba(0, 0, 0, 0.85)'
  ) : (
    '0 16px 36px -8px rgba(0, 0, 0, 0.85)'
  );

  const glowMap = {
    none: 'none',
    low: `0 4px 18px ${hexToRgba(accentHex, 0.18)}`,
    medium: `0 6px 32px ${hexToRgba(accentHex, 0.32)}`,
    high: `0 8px 50px ${hexToRgba(accentHex, 0.48)}`
  };
  const extraGlow = isRgb ? undefined : (glowMap[config.glowIntensity] || glowMap.none);
  const combinedBoxShadow = extraGlow && extraGlow !== 'none' ? `${polishedBarShadow}, ${extraGlow}` : polishedBarShadow;

  const isPlaying = spotifyState?.is_playing;
  const hasAlbumArt = Boolean(spotifyState?.item?.album?.images?.[0]?.url);
  const albumUrl = spotifyState?.item?.album?.images?.[0]?.url;

  const initialX = isSide ? (isLeft ? -160 : 160) : 0;
  const initialY = isSide ? 0 : -64;

  const mediaDuration = spotifyState?.duration_ms || spotifyState?.item?.duration_ms || 0;
  const mediaProgressPercent = mediaDuration > 0 ? Math.min(100, Math.max(0, (localProgress / mediaDuration) * 100)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: initialX, y: initialY }}
      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : initialX, y: isVisible ? 0 : initialY }}
      exit={{ opacity: 0, x: initialX, y: initialY }}
      transition={{ type: 'spring', stiffness: 260, damping: 27, mass: 0.75 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={`shelf-bar fixed z-50 select-none overflow-hidden
        ${isSide ? 'custom-scrollbar top-0 bottom-0 py-3 px-2 flex flex-col items-center justify-between overflow-y-auto overflow-x-hidden' : 'top-0 left-0 right-0 h-16 flex items-center justify-between px-6 py-2 overflow-hidden'}
        ${isSide ? (isLeft ? 'left-0 rounded-r-3xl' : 'right-0 rounded-l-3xl') : 'rounded-b-2xl'}
        ${isRgb ? 'rgb-border' : ''}`}
      style={{ 
        backgroundColor: (!config.bgColor || config.bgColor === '#000000') ? 'rgba(10, 10, 14, 0.92)' : `${config.bgColor}e6`,
        ...(isSide ? { width: '160px', height: '100vh' } : { height: '64px' }),
        backdropFilter: 'blur(36px) saturate(190%)',
        WebkitBackdropFilter: 'blur(36px) saturate(190%)',
        pointerEvents: isVisible ? 'auto' : 'none',
        boxShadow: combinedBoxShadow
      }}
    >
      {/* Dynamic Background Custom Wallpaper */}
      {config.customBgUrl && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" style={{ opacity: 0.45, mixBlendMode: 'screen', borderRadius: 'inherit' }}>
          {config.customBgUrl.includes('.mp4') ? (
            <video src={config.customBgUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ backgroundImage: `url(${config.customBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          )}
        </div>
      )}

      {/* Dynamic Animation Backgrounds */}
      {config.bgAnimation !== 'off' && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" style={{ mixBlendMode: 'screen' }}>
          {config.bgAnimation === 'rain' && <RainBackground accentColor={config.accentColor} />}
          {config.bgAnimation === 'matrix' && <MatrixBackground />}
          {config.bgAnimation === 'hyperspace' && <HyperspaceBackground isPlaying={isPlaying} />}
          {config.bgAnimation === 'liquid' && <LiquidGlowBackground accentColor={config.accentColor} />}
          {config.bgAnimation === 'cosmic' && <CosmicOrbitsBackground />}
          {config.bgAnimation === 'aurora' && <AuroraWaveBackground />}
        </div>
      )}

      {/* ────────────────── VERTICAL SIDE BAR MODE ────────────────── */}
      {isSide ? (
        <div className="w-full h-full flex flex-col justify-between py-2 px-1 relative z-10 overflow-hidden">
          
          {/* Header Card: Clock & Date */}
          <div className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-2.5 flex flex-col items-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] transition-all flex-shrink-0">
            {greeting ? (
              <span className={greeting.startsWith('Good') ? "mac-hello-text text-[23px] text-center px-1 select-none" : "text-[11px] font-extrabold text-center uppercase tracking-wider px-1 leading-tight select-none"} style={accentHex !== '#ffffff' && !isRgb ? { color: accentHex } : { color: '#67e8f9' }}>
                {greeting.startsWith('Good') ? greeting.toLowerCase() : greeting}
              </span>
            ) : (
              <>
                <span className={`text-[30px] font-black tracking-tight leading-none tabular-nums ${isRgb ? 'rgb-text' : 'text-white'}`} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif", ...(accentHex !== '#ffffff' && !isRgb ? { color: accentHex } : {}) }}>
                  {time.replace(/\s*[aApP]\.?[mM]\.?/, '')}
                </span>
                <span className="text-[9.5px] text-white/50 font-bold tracking-widest uppercase mt-1.5 bg-white/[0.06] px-2 py-0.5 rounded-full">
                  {formatDate()}
                </span>
              </>
            )}
          </div>

          {/* Weather Card */}
          {config.showWeather !== false && config.showWeatherWidget !== false && (
            <div 
              className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] rounded-2xl p-2.5 flex items-center gap-2.5 cursor-pointer transition-all active:scale-[0.98] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex-shrink-0"
              onClick={onOpenWeather}
              title={weather.desc}
            >
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                <WeatherIcon desc={weather.desc} size={20} />
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-extrabold text-white leading-tight font-mono">{weather.temp}</span>
                <span className="text-[9.5px] text-white/50 capitalize truncate w-full mt-0.5">{weather.desc}</span>
              </div>
            </div>
          )}

          {/* Media Player Card OR Ambient Glance */}
          {spotifyState?.item && config.showMediaWidget !== false ? (
            <div 
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-2.5 flex flex-col items-center gap-2 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex-shrink-0 cursor-pointer hover:bg-white/[0.07] transition-all group"
              title={spotifyState?.item ? `Click to open application: ${spotifyState.item.name}` : 'Click to open media player'}
              onClick={() => onOpenMediaApp && onOpenMediaApp(spotifyState?.sourceAppId, spotifyState?.item?.name, spotifyState?.item?.artists?.[0]?.name)}
            >
              {/* Artwork */}
              <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md relative border border-white/10 flex-shrink-0">
                {spotifyState.item.album?.images?.[0] ? (
                  <img src={spotifyState.item.album.images[0].url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-cyan-900/40 flex items-center justify-center"><Music size={24} className="text-white/80" /></div>
                )}
                {spotifyState?.sourceAppId && (
                  <div className="absolute bottom-0 right-0 bg-black/80 rounded-tl-lg p-0.5 flex items-center justify-center border-t border-l border-white/15 z-10">
                    <SourceAppIcon appId={spotifyState.sourceAppId} />
                  </div>
                )}
              </div>

              {/* Title & Artist */}
              <div className="flex flex-col items-center w-full text-center px-0.5">
                <span className="text-xs font-bold text-white truncate w-full tracking-tight">{spotifyState.item.name}</span>
                <span className="text-[9.5px] text-white/50 truncate w-full mt-0.5">{spotifyState.item.artists?.map(a => a.name).join(', ')}</span>
                {config.showAudioWaveform !== false && (
                  <div className="mt-1 flex justify-center">
                    <AudioWaveform isPlaying={spotifyState.is_playing} color={accentHex !== '#ffffff' ? accentHex : '#22c55e'} width={22} height={10} />
                  </div>
                )}
              </div>

              {/* Progress Slider */}
              <div className="w-full flex flex-col gap-1 px-0.5" onClick={(e) => e.stopPropagation()}>
                <div 
                  className="w-full bg-white/[0.12] rounded-full h-1.5 relative overflow-hidden cursor-pointer group/bar"
                  onClick={onSeek}
                >
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full h-full transition-all duration-150"
                    style={{ width: `${mediaProgressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-white/45 font-mono w-full px-0.5">
                  <span>{formatTime(localProgress)}</span>
                  <span>{mediaDuration > 0 ? formatTime(mediaDuration) : '--:--'}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.15] flex items-center justify-center transition-all text-white/70 hover:text-white"
                  onClick={onPrev}
                  title="Previous"
                >
                  <SkipBack size={13} />
                </button>
                <button 
                  className="w-9 h-9 rounded-full bg-white text-black hover:bg-white/90 flex items-center justify-center transition-all shadow-[0_2px_12px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95"
                  onClick={onTogglePlay}
                  title={spotifyState.is_playing ? "Pause" : "Play"}
                >
                  {spotifyState.is_playing ? <Pause size={15} /> : <Play size={15} className="translate-x-[1px]" />}
                </button>
                <button 
                  className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.15] flex items-center justify-center transition-all text-white/70 hover:text-white"
                  onClick={onSkip}
                  title="Next"
                >
                  <SkipForward size={13} />
                </button>
              </div>
            </div>
          ) : (
            /* Ambient Glance Card when no media playing */
            <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-2.5 flex flex-col gap-2 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-300">
                  <Sparkles size={14} />
                </div>
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-[11px] font-bold text-white/90 tracking-tight">Smart Island</span>
                  <span className="text-[8.5px] text-white/40 uppercase tracking-wider">Active Glance</span>
                </div>
              </div>
              {activeBtDevice?.name && (
                <div className="flex items-center justify-between bg-white/[0.05] px-2 py-1.5 rounded-xl border border-white/[0.06]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Headphones size={11} className="text-cyan-400 flex-shrink-0" />
                    <span className="text-[9.5px] font-bold text-white/80 truncate">{activeBtDevice.name}</span>
                  </div>
                  <span className="text-[9.5px] font-mono text-cyan-300 font-bold ml-1">{activeBtDevice.battery}%</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Controls Card: Volume & Brightness sliders */}
          <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-2.5 flex flex-col gap-2 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex-shrink-0">
            {/* Volume */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-white/50 uppercase">
                <div 
                  className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
                  onClick={() => {
                    if (setIsMuted) setIsMuted(prev => !prev);
                    if (ipcRenderer) ipcRenderer.send('toggle-mute');
                  }}
                  title="Click to Mute / Unmute"
                >
                  {volumeLevel === 0 || isMuted ? (
                    <VolumeX size={12} className="text-red-400" />
                  ) : isBtAudio ? (
                    <Headphones size={12} className="text-cyan-400" />
                  ) : (
                    <Volume2 size={12} className="text-cyan-400" />
                  )}
                  <span>{isBtAudio ? (activeBtDevice?.name?.split(' ')[0] || 'BT Vol') : 'Volume'}</span>
                </div>
                <span className="font-mono text-white/80 tabular-nums">{isMuted ? 'Muted' : `${volumeLevel}%`}</span>
              </div>
              <div 
                className="w-full bg-white/[0.08] h-2.5 rounded-full overflow-hidden cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                  if (setVolumeLevel) setVolumeLevel(percent);
                  if (ipcRenderer) ipcRenderer.send('set-volume', percent);
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                  const delta = e.deltaY < 0 ? 3 : -3;
                  const newVal = Math.max(0, Math.min(100, volumeLevel + delta));
                  if (setVolumeLevel) setVolumeLevel(newVal);
                  if (ipcRenderer) ipcRenderer.send('set-volume', newVal);
                }}
                title="Click or scroll to adjust volume"
              >
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all duration-75"
                  style={{ width: `${isMuted ? 0 : volumeLevel}%` }}
                />
              </div>
            </div>

            {/* Brightness */}
            <div className="flex flex-col gap-1 pt-0.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-white/50 uppercase">
                <div className="flex items-center gap-1.5">
                  <Sun size={12} className="text-amber-400" />
                  <span>Display</span>
                </div>
                <span className="font-mono text-white/80 tabular-nums">{brightnessLevel}%</span>
              </div>
              <div 
                className="w-full bg-white/[0.08] h-2.5 rounded-full overflow-hidden cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                  if (setBrightnessLevel) setBrightnessLevel(percent);
                  if (ipcRenderer) ipcRenderer.send('set-brightness', percent);
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                  const delta = e.deltaY < 0 ? 5 : -5;
                  const newVal = Math.max(0, Math.min(100, brightnessLevel + delta));
                  if (setBrightnessLevel) setBrightnessLevel(newVal);
                  if (ipcRenderer) ipcRenderer.send('set-brightness', newVal);
                }}
                title="Click or scroll to adjust brightness"
              >
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-75"
                  style={{ width: `${brightnessLevel}%` }}
                />
              </div>
            </div>
          </div>

          {/* System Performance Card */}
          <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-2.5 flex flex-col gap-2 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex-shrink-0">
            {config.showHardware !== false && config.showHardwareWidget !== false && (
              <>
                {/* CPU */}
                <div className="flex flex-col gap-0.5" title={`CPU: ${hardware.cpu}%`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white/50 text-[9.5px] font-bold uppercase"><Cpu size={11} className="text-cyan-400" />CPU</div>
                    <span className="text-[11px] font-mono font-bold text-white tabular-nums">{hardware.cpu}%</span>
                  </div>
                  <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${hardware.cpu > 70 ? 'bg-red-400' : 'bg-cyan-400'}`} style={{ width: `${Math.min(100, hardware.cpu)}%` }} />
                  </div>
                </div>

                {/* RAM */}
                <div className="flex flex-col gap-0.5" title={`RAM: ${hardware.ram}%`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white/50 text-[9.5px] font-bold uppercase"><HardDrive size={11} className="text-purple-400" />RAM</div>
                    <span className="text-[11px] font-mono font-bold text-white tabular-nums">{hardware.ram}%</span>
                  </div>
                  <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${hardware.ram > 80 ? 'bg-red-400' : 'bg-purple-400'}`} style={{ width: `${Math.min(100, hardware.ram)}%` }} />
                  </div>
                </div>

                {/* Network */}
                <div className="flex items-center justify-between pt-0.5 text-[9.5px] text-white/60">
                  <div className="flex items-center gap-1"><Wifi size={11} className="text-blue-400" />NET</div>
                  <span className="font-mono font-bold text-white/80 tabular-nums">{formatSpeed(network.rx)}</span>
                </div>
              </>
            )}

            {/* Battery */}
            <div className="flex items-center justify-between pt-1 border-t border-white/[0.08]" title={`Battery: ${battery.level}%`}>
              <div className="flex items-center gap-1.5">
                <Battery size={13} className={battery.charging ? 'text-green-400' : (battery.level < 20 ? 'text-red-400' : 'text-emerald-400')} />
                <span className="text-[9.5px] font-bold text-white/50 uppercase">Battery</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-white tabular-nums">{battery.level}%</span>
            </div>
          </div>

          {/* Bottom Dock Section: Balanced cleanly at the bottom */}
          <div className="w-full pt-1 pb-1 flex-shrink-0">
            <div className="w-full bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.12] rounded-2xl p-1.5 flex items-center justify-around shadow-md transition-all">
              <button 
                type="button"
                onClick={onBoost} 
                disabled={isBoosting}
                className="w-9 h-9 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 flex items-center justify-center transition-all border border-cyan-400/20 active:scale-95 disabled:opacity-50"
                title="Boost Memory"
              >
                <Rocket size={15} className={isBoosting ? "animate-pulse" : ""} />
              </button>
              <button 
                type="button"
                onClick={onShowSettings}
                className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] text-white/70 hover:text-white flex items-center justify-center transition-all border border-white/[0.08] active:scale-95 relative"
                title="Settings"
              >
                <SettingsIcon size={15} />
                {updateAvailable ? (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
                ) : whatsNewAvailable ? (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                ) : null}
              </button>
              <button 
                type="button"
                onClick={onQuit}
                className="w-9 h-9 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-200 flex items-center justify-center transition-all border border-red-500/20 active:scale-95"
                title="Quit App"
              >
                <Power size={14} />
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* ────────────────── HORIZONTAL TOP BAR MODE ────────────────── */
        <div className="w-full h-full flex items-center justify-between relative z-10">
          
          {/* Left Section: Time, Date, Weather Capsule */}
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 rounded-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
            {greeting ? (
              <span className={greeting.startsWith('Good') ? "mac-hello-text text-[24px] animate-pulse select-none px-1" : "text-xs font-extrabold uppercase tracking-wider select-none"} style={accentHex !== '#ffffff' && !isRgb ? { color: accentHex } : { color: '#67e8f9' }}>
                {greeting.startsWith('Good') ? greeting.toLowerCase() : greeting}
              </span>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-black tracking-tight leading-none tabular-nums ${isRgb ? 'rgb-text' : 'text-white'}`} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif", ...(accentHex !== '#ffffff' && !isRgb ? { color: accentHex } : {}) }}>
                  {time}
                </span>
                <span className="text-[10px] text-white/45 font-bold tracking-wider uppercase">{formatDate()}</span>
              </div>
            )}

            {config.showWeather !== false && config.showWeatherWidget !== false && (
              <>
                <div className="w-px h-4 bg-white/[0.12] mx-0.5" />
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={onOpenWeather}
                  title={weather.desc}
                >
                  <WeatherIcon desc={weather.desc} size={18} />
                  <span className="text-xs font-bold font-mono text-white/90">{weather.temp}</span>
                </div>
              </>
            )}
          </div>

          {/* Center Section: Media Player Capsule */}
          <div className="flex items-center gap-3.5 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-xl max-w-[460px] flex-1 justify-center mx-4 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
            {spotifyState?.item && config.showMediaWidget !== false ? (
              <>
                {/* Thumbnail */}
                <div 
                  className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0 relative border border-white/10 shadow-sm cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                  title="Click to open player"
                  onClick={() => onOpenMediaApp && onOpenMediaApp(spotifyState?.sourceAppId, spotifyState?.item?.name, spotifyState?.item?.artists?.[0]?.name)}
                >
                  {spotifyState.item.album?.images?.[0] ? (
                    <img src={spotifyState.item.album.images[0].url} className="w-full h-full object-cover" />
                  ) : (
                    <Music size={16} className="text-white/80" />
                  )}
                  {spotifyState?.sourceAppId && (
                    <div className="absolute bottom-0 right-0 bg-black/80 rounded-tl-sm p-0.5 flex items-center justify-center">
                      <SourceAppIcon appId={spotifyState.sourceAppId} />
                    </div>
                  )}
                </div>

                {/* Track info & slider */}
                <div className="flex flex-col min-w-0 max-w-[190px] flex-grow gap-0.5">
                  <div 
                    className="flex flex-col min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                    title="Click to open player"
                    onClick={() => onOpenMediaApp && onOpenMediaApp(spotifyState?.sourceAppId, spotifyState?.item?.name, spotifyState?.item?.artists?.[0]?.name)}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="font-bold text-xs leading-none truncate text-white">{spotifyState.item.name || 'Unknown Track'}</span>
                      {config.showAudioWaveform !== false && (
                        <div className="flex-shrink-0">
                          <AudioWaveform isPlaying={spotifyState.is_playing} color={accentHex !== '#ffffff' ? accentHex : '#22c55e'} width={16} height={9} />
                        </div>
                      )}
                    </div>
                    <span className="text-[9.5px] text-white/50 truncate mt-0.5">{spotifyState.item.artists?.map(a => a.name).join(', ') || ''}</span>
                  </div>
                  <div 
                    className="w-full bg-white/[0.12] rounded-full h-1 relative overflow-hidden cursor-pointer mt-0.5"
                    onClick={onSeek}
                  >
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full h-full transition-all duration-150"
                      style={{ width: `${mediaProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Playback buttons */}
                <div className="flex items-center gap-1">
                  <button className="w-7 h-7 rounded-full hover:bg-white/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-colors" onClick={onPrev}>
                    <SkipBack size={13} />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-white text-black hover:bg-white/90 flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95" onClick={onTogglePlay}>
                    {spotifyState.is_playing ? <Pause size={14} /> : <Play size={14} className="translate-x-[0.5px]" />}
                  </button>
                  <button className="w-7 h-7 rounded-full hover:bg-white/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-colors" onClick={onSkip}>
                    <SkipForward size={13} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-white/40 py-0.5">
                <Music size={15} />
                <span className="text-xs font-medium">Smart Notch • Dynamic Island</span>
              </div>
            )}
          </div>

          {/* Right Section: Hardware, Battery, Quick Actions */}
          <div className="flex items-center gap-3">
            
            {/* Stats Capsule */}
            {config.showHardware !== false && config.showHardwareWidget !== false && (
              <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-white/80" title={`CPU: ${hardware.cpu}%`}>
                  <Cpu size={12} className="text-cyan-400" />
                  <span>{hardware.cpu}%</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-white/80" title={`RAM: ${hardware.ram}%`}>
                  <HardDrive size={12} className="text-purple-400" />
                  <span>{hardware.ram}%</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px] text-white/60" title={`Network Activity`}>
                  <Wifi size={11} className="text-blue-400" />
                  <span>{formatSpeed(network.rx)}</span>
                </div>
              </div>
            )}

            {/* Battery Capsule */}
            <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1.5 rounded-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]" title={`Battery: ${battery.level}%`}>
              <Battery size={14} className={battery.charging ? 'text-green-400' : (battery.level < 20 ? 'text-red-400' : 'text-emerald-400')} />
              <span className="text-[11px] font-mono font-bold text-white/90">{battery.level}%</span>
            </div>

            {/* Privacy Dots Capsule */}
            {(privacy?.mic || privacy?.cam) && (
              <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-2.5 py-2 rounded-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                {privacy.cam && (
                  <div 
                    className="w-[7px] h-[7px] rounded-full bg-[#30D158]" 
                    style={{ boxShadow: '0 0 8px 1.5px rgba(48, 209, 88, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.6)' }}
                    title="Camera in use"
                  />
                )}
                {privacy.mic && (
                  <div 
                    className="w-[7px] h-[7px] rounded-full bg-[#FF9F0A]" 
                    style={{ boxShadow: '0 0 8px 1.5px rgba(255, 159, 10, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.6)' }}
                    title="Microphone in use"
                  />
                )}
              </div>
            )}

            {/* Actions Dock */}
            <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] p-1 rounded-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
              {config.showQuickTools !== false && (
                <button 
                  onClick={onBoost} 
                  disabled={isBoosting}
                  className="w-7 h-7 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 flex items-center justify-center transition-all disabled:opacity-50"
                  title="Boost Memory"
                >
                  <Rocket size={13} className={isBoosting ? "animate-pulse" : ""} />
                </button>
              )}
              <button 
                onClick={onShowSettings}
                className="w-7 h-7 rounded-lg hover:bg-white/[0.12] text-white/60 hover:text-white flex items-center justify-center transition-all relative"
                title="Settings"
              >
                <SettingsIcon size={13} />
                {updateAvailable ? (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
                ) : whatsNewAvailable ? (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                ) : null}
              </button>
              <button 
                onClick={onQuit}
                className="w-7 h-7 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all"
                title="Quit App"
              >
                <Power size={12} />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ────────────────── NOTIFICATION OVERLAY ────────────────── */}
      <AnimatePresence>
        {(batteryEvent || boostAlert || isBoosting || sysNotification) && (
          <motion.div 
            initial={{ opacity: 0, y: isSide ? -20 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isSide ? -20 : -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`absolute inset-0 z-[35] bg-[#0a0a0ee6] flex items-center justify-center border-white/10 backdrop-blur-xl
              ${isSide 
                ? 'w-full h-full flex-col px-3 py-6 justify-center text-center gap-3' 
                : 'w-full h-full px-8 gap-6 justify-center'}`}
          >
            {batteryEvent && (
              <div className={`flex ${isSide ? 'flex-col text-center' : 'row'} items-center gap-3`}>
                <div className={`w-10 h-10 rounded-full ${batteryEvent.low ? 'bg-red-500/20 text-red-400' : (batteryEvent.charging ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')} flex items-center justify-center flex-shrink-0 animate-pulse`}>
                  {batteryEvent.charging ? <BatteryCharging size={20} /> : <Battery size={20} />}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-sm text-white">{batteryEvent.low ? 'Battery Low' : (batteryEvent.charging ? 'Charging Started' : 'Power Disconnected')}</span>
                  <span className="text-[11px] text-white/50">{batteryEvent.level}% remaining</span>
                </div>
              </div>
            )}

            {isBoosting && (
              <div className={`flex ${isSide ? 'flex-col text-center' : 'row'} items-center gap-3 w-full justify-center`}>
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center flex-shrink-0">
                  <Rocket size={20} className="animate-bounce" />
                </div>
                <div className={`flex flex-col max-w-[200px] w-full ${isSide ? 'items-center text-center' : 'items-start text-left'}`}>
                  <span className="font-bold text-xs text-white">Boosting System...</span>
                  <span className="text-[10px] text-cyan-300 truncate w-full mt-0.5">
                    {boostProgress ? `Killed ${boostProgress.name}` : 'Freeing memory...'}
                  </span>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1.5 relative">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-cyan-400 w-1/3 rounded-full" 
                      initial={{ x: "-100%" }} 
                      animate={{ x: "300%" }} 
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }} 
                    />
                  </div>
                </div>
              </div>
            )}

            {boostAlert && (
              <div className={`flex ${isSide ? 'flex-col text-center' : 'row'} items-center gap-3`}>
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center flex-shrink-0">
                  <Rocket size={20} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-sm text-white">System Boosted</span>
                  <span className="text-[10px] text-cyan-300">Freed {boostAlert.freedMB} MB RAM & {boostAlert.freedCPU}% CPU</span>
                </div>
              </div>
            )}

            {sysNotification && (
              <div className="flex items-center gap-3 w-full justify-center text-left" style={{ pointerEvents: 'auto' }}>
                <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase">
                  {sysNotification.appName ? sysNotification.appName.slice(0,2) : 'NT'}
                </div>
                <div className="flex flex-col text-left overflow-hidden flex-grow max-w-[240px]">
                  <span className="font-bold text-[11px] text-white truncate">{sysNotification.title || 'Notification'}</span>
                  <span className="text-[10px] text-white/60 line-clamp-1 mt-0.5">{sysNotification.message}</span>
                </div>
                <button className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors" onClick={() => setSysNotification(null)}>
                  <X size={12} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
});

export default ShelfBar;
