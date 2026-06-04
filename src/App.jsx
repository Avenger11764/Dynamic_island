import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, CloudSun, Music, Link as LinkIcon, ExternalLink, X, Timer as TimerIcon, Activity, ChevronRight, RotateCcw, Battery, BatteryCharging, Calendar, Sparkles, Power, LayoutGrid, Calculator, Folder, Settings as SettingsIcon, Signal, Volume2, Sun, Download, Home, Coffee, Briefcase, File, Trash2, Plus, Minus, Monitor, MonitorOff, Cpu, HardDrive, Wifi, Clock, GripVertical, GripHorizontal, Rocket, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Phone } from 'lucide-react';
import WeatherIcon from './WeatherIcon';
import AudioWaveform from './AudioWaveform';

const ipcRenderer = window.electronAPI || null;

const formatTime = (ms) => {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const renderSourceAppIcon = (appId) => {
  const name = String(appId).toLowerCase();
  if (name.includes('spotify')) {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#1DB954] fill-current">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.668-.135-.744-.47-.077-.337.135-.668.47-.745 3.856-.88 7.15-.502 9.82 1.13.295.18.387.563.207.86zm1.224-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.077-1.182-.413.125-.847-.107-.972-.52-.125-.413.108-.847.52-.972 3.67-1.114 8.243-.574 11.343 1.332.368.228.488.708.26 1.074zm.11-2.828C14.317 8.71 8.354 8.512 4.9 9.56c-.53.16-1.09-.14-1.25-.67-.16-.53.14-1.09.67-1.25 3.96-1.202 10.53-.98 14.656 1.474.48.284.636.9.35 1.38-.284.48-.9.637-1.38.35z"/>
      </svg>
    );
  }
  if (name.includes('youtube') || name.includes('chrome') || name.includes('edge') || name.includes('msedge') || name.includes('brave') || name.includes('firefox')) {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-red-500 fill-current">
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.513 3.545 12 3.545 12 3.545s-7.512 0-9.387.51A3.004 3.004 0 0 0 .503 6.163C0 8.046 0 12 0 12s0 3.954.503 5.837a3.003 3.003 0 0 0 2.11 2.107c1.875.51 9.387.51 9.387.51s7.513 0 9.388-.51a3.003 3.003 0 0 0 2.11-2.107C24 15.954 24 12 24 12s0-3.954-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }
  return <Music size={12} className="text-white/70" />;
};

// --- Memoized Background Components to prevent stuttering during stat updates ---
const MatrixBackground = React.memo(() => {
  const columns = useMemo(() => Array.from({ length: 20 }).map(() => ({
    left: Math.random() * 100,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
    chars: Array.from({ length: 10 }).map(() => (Math.random() > 0.5 ? '1' : '0'))
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50 bg-black/80">
      {columns.map((col, i) => (
        <motion.div key={i} animate={{ y: [-50, 400], opacity: [0, 1, 0] }} transition={{ duration: col.duration, repeat: Infinity, delay: col.delay, ease: 'linear' }} className="absolute text-[8px] font-mono leading-[8px] text-green-500/80" style={{ left: `${col.left}%` }}>
           {col.chars.map((char, j) => <div key={j}>{char}</div>)}
        </motion.div>
      ))}
    </div>
  );
});

const HyperspaceBackground = React.memo(({ isPlaying }) => {
  const stars = useMemo(() => Array.from({ length: 40 }).map(() => ({
    top: Math.random() * 100,
    duration: 5 + Math.random() * 10,
    fastDuration: 0.2 + Math.random() * 0.5,
    delay: Math.random() * 5
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black/90">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_rgba(0,0,0,1)_100%)]" />
      {stars.map((star, i) => (
        <motion.div key={i} animate={{ x: [-10, 400], scaleX: isPlaying ? [1, 10, 1] : 1, opacity: [0, 1, 0] }} transition={{ duration: isPlaying ? star.fastDuration : star.duration, repeat: Infinity, delay: star.delay, ease: 'linear' }} className="absolute w-[2px] h-[2px] bg-white rounded-full shadow-[0_0_5px_#fff]" style={{ left: '-5%', top: `${star.top}%` }} />
      ))}
    </div>
  );
});

const RainBackground = React.memo(({ accentColor }) => {
  const drops = useMemo(() => Array.from({ length: 15 }).map(() => ({
    left: Math.random() * 100,
    duration: 1.5 + Math.random() * 2,
    delay: Math.random() * 3
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60 bg-slate-900/40 backdrop-blur-md">
      {drops.map((drop, i) => (
        <motion.div key={i} animate={{ y: [-20, 400], opacity: [0, 0.8, 0], scaleY: [1, 1.5, 1] }} transition={{ duration: drop.duration, repeat: Infinity, delay: drop.delay, ease: 'linear' }} className={`absolute w-[2px] h-[15px] rounded-full ${accentColor === 'cyan' ? 'bg-cyan-200/50' : (accentColor === 'purple' ? 'bg-purple-200/50' : (accentColor === 'green' ? 'bg-green-200/50' : 'bg-white/30'))}`} style={{ left: `${drop.left}%` }} />
      ))}
    </div>
  );
});

// ── Shelf Bar Component (full-width top bar for "Always On Screen OFF" mode) ──
const ShelfBar = React.memo(({ 
  isVisible, time, formatDate, weather, spotifyState, isSpotify, localProgress, 
  hardware, network, battery, privacy, config, onTogglePlay, onPrev, onSkip,
  onOpenMediaApp, onOpenWeather, onQuit, onShowSettings, formatSpeed, getCurrentLyric,
  pomodoro, isPomoRunning, pomoMode, isSwRunning, stopwatch, onBoost, isBoosting,
  onPointerDown, onPointerMove, onPointerUp, onPointerCancel,
  batteryEvent, boostAlert, boostProgress, greeting, activeCall, sysNotification, setSysNotification,
  updateAvailable, whatsNewAvailable, onSeek
}) => {
  // Parse accent color for inline styles (works with ANY hex color)
  const isRgb = config.accentColor === 'rgb';
  const accentHex = (!isRgb && config.accentColor?.startsWith('#')) ? config.accentColor : '#06b6d4';
  const hexToRgba = (hex, a) => {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r},${g},${b},${a})`;
  };

  // Glow intensity mapping
  const glowMap = {
    none: 'none',
    low: `0 4px 15px ${hexToRgba(accentHex, 0.15)}`,
    medium: `0 4px 30px ${hexToRgba(accentHex, 0.3)}`,
    high: `0 4px 50px ${hexToRgba(accentHex, 0.45)}`
  };
  const glowStyle = isRgb ? undefined : (glowMap[config.glowIntensity] || glowMap.medium);

  const isPlaying = spotifyState?.is_playing;
  const hasAlbumArt = Boolean(spotifyState?.item?.album?.images?.[0]?.url);
  const albumUrl = spotifyState?.item?.album?.images?.[0]?.url;

  const isSide = config.screenPosition === 'left' || config.screenPosition === 'right';
  const isLeft = config.screenPosition === 'left';

  const initialX = isSide ? (isLeft ? -160 : 160) : 0;
  const initialY = isSide ? 0 : -64;

  return (
    <motion.div
      initial={{ opacity: 0, x: initialX, y: initialY }}
      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : initialX, y: isVisible ? 0 : initialY }}
      exit={{ opacity: 0, x: initialX, y: initialY }}
      transition={{ type: 'spring', stiffness: 220, damping: 26, mass: 0.8 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={`shelf-bar fixed z-50 backdrop-blur-xl ${isSide ? 'custom-scrollbar' : ''}
        ${isSide ? `top-0 bottom-0 flex flex-col items-center justify-start py-4 px-2 gap-4 overflow-y-auto overflow-x-hidden ${isLeft ? 'border-r' : 'border-l'}` : 'top-0 left-0 right-0 flex items-center justify-between px-6 py-2 border-b overflow-hidden'}
        ${isLeft ? 'left-0' : (isSide ? 'right-0' : '')}
        ${isRgb ? 'rgb-border rgb-shadow-med' : ''}`}
      style={{ 
        backgroundColor: `${config.bgColor}e6`,
        ...(isSide ? { width: '160px' } : { height: '64px' }),
        pointerEvents: isVisible ? 'auto' : 'none',
        borderColor: isRgb ? undefined : hexToRgba(accentHex, 0.3),
        boxShadow: isRgb ? undefined : glowStyle
      }}
    >
      {config.customBgUrl && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden" 
          style={{ 
            opacity: 0.5,
            mixBlendMode: 'screen',
            borderRadius: 'inherit'
          }}
        >
          {config.customBgUrl.includes('.mp4') ? (
            <video 
              src={config.customBgUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              className="w-full h-full"
              style={{ 
                backgroundImage: `url(${config.customBgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }} 
            />
          )}
        </div>
      )}
      {/* Background Animations — full width */}
      {config.bgAnimation !== 'off' && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" style={{ mixBlendMode: 'screen' }}>
          {config.bgAnimation === 'liquid' && (
            <>
              {/* Blob 1 */}
              <motion.div 
                animate={isSide ? { 
                  y: isPlaying ? ['-5%', '30%', '-5%'] : ['-5%', '15%', '-5%'],
                  scale: isPlaying ? [1, 1.4, 1] : [1, 1.15, 1], 
                  opacity: isPlaying ? [0.4, 0.8, 0.4] : [0.25, 0.5, 0.25]
                } : { 
                  x: isPlaying ? ['-5%', '30%', '-5%'] : ['-5%', '15%', '-5%'],
                  scale: isPlaying ? [1, 1.4, 1] : [1, 1.15, 1], 
                  opacity: isPlaying ? [0.4, 0.8, 0.4] : [0.25, 0.5, 0.25]
                }}
                transition={{ duration: isPlaying ? 2.5 : 6, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute rounded-[100px] blur-[50px] ${isSide ? 'left-0 top-0 w-[160px] h-[50%]' : 'top-[-30px] left-0 w-[50%] h-[100px]'}`}
                style={{ background: hasAlbumArt 
                  ? `url(${albumUrl}) center/cover` 
                  : 'linear-gradient(135deg, #a855f7, #3b82f6, #06b6d4)' }}
              />
              {/* Blob 2 */}
              <motion.div 
                animate={isSide ? { 
                  y: isPlaying ? ['10%', '-25%', '10%'] : ['5%', '-10%', '5%'],
                  scale: isPlaying ? [1, 1.35, 1] : [1, 1.1, 1], 
                  opacity: isPlaying ? [0.35, 0.75, 0.35] : [0.2, 0.45, 0.2]
                } : { 
                  x: isPlaying ? ['10%', '-25%', '10%'] : ['5%', '-10%', '5%'],
                  scale: isPlaying ? [1, 1.35, 1] : [1, 1.1, 1], 
                  opacity: isPlaying ? [0.35, 0.75, 0.35] : [0.2, 0.45, 0.2]
                }}
                transition={{ duration: isPlaying ? 3 : 7, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className={`absolute rounded-[100px] blur-[55px] ${isSide ? 'left-0 top-[25%] w-[160px] h-[55%]' : 'top-[-25px] left-[25%] w-[55%] h-[90px]'}`}
                style={{ mixBlendMode: 'screen', background: hasAlbumArt 
                  ? `url(${albumUrl}) center/cover` 
                  : 'linear-gradient(135deg, #06b6d4, #a855f7, #ec4899)' }}
              />
              {/* Blob 3 */}
              <motion.div 
                animate={isSide ? { 
                  y: isPlaying ? ['5%', '-20%', '5%'] : ['0%', '-8%', '0%'],
                  scale: isPlaying ? [1, 1.3, 1] : [1, 1.1, 1],
                  opacity: isPlaying ? [0.3, 0.7, 0.3] : [0.2, 0.4, 0.2]
                } : { 
                  x: isPlaying ? ['5%', '-20%', '5%'] : ['0%', '-8%', '0%'],
                  scale: isPlaying ? [1, 1.3, 1] : [1, 1.1, 1],
                  opacity: isPlaying ? [0.3, 0.7, 0.3] : [0.2, 0.4, 0.2]
                }}
                transition={{ duration: isPlaying ? 2.8 : 8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className={`absolute rounded-[100px] blur-[60px] ${isSide ? 'left-0 top-[50%] w-[160px] h-[55%]' : 'top-[-20px] left-[50%] w-[55%] h-[85px]'}`}
                style={{ mixBlendMode: 'screen', background: hasAlbumArt 
                  ? `url(${albumUrl}) center/cover` 
                  : 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)' }}
              />
            </>
          )}
          {config.bgAnimation === 'aurora' && (
            <>
              <motion.div animate={isSide ? { y: ['-20%', '20%', '-20%'] } : { x: ['-20%', '20%', '-20%'] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} className={`absolute blur-[40px] rounded-[100%] bg-gradient-to-r from-teal-400/50 to-emerald-500/50 ${isSide ? 'left-0 top-[5%] w-[160px] h-[60%]' : 'top-[-15px] left-[5%] w-[60%] h-[80px]'}`} />
              <motion.div animate={isSide ? { y: ['20%', '-20%', '20%'] } : { x: ['20%', '-20%', '20%'] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} className={`absolute blur-[45px] rounded-[100%] bg-gradient-to-r from-purple-500/40 to-blue-500/40 ${isSide ? 'left-0 top-[30%] w-[160px] h-[65%]' : 'top-[-10px] left-[30%] w-[65%] h-[70px]'}`} />
              <motion.div animate={isSide ? { y: ['-10%', '15%', '-10%'] } : { x: ['-10%', '15%', '-10%'] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} className={`absolute blur-[35px] rounded-[100%] bg-gradient-to-r from-cyan-300/30 to-transparent ${isSide ? 'left-0 top-[15%] w-[160px] h-[50%]' : 'top-[-5px] left-[15%] w-[50%] h-[60px]'}`} />
            </>
          )}
          {config.bgAnimation === 'rain' && <RainBackground accentColor={config.accentColor} />}
          {config.bgAnimation === 'matrix' && <MatrixBackground />}
          {config.bgAnimation === 'hyperspace' && <HyperspaceBackground isPlaying={isPlaying} />}
          {config.bgAnimation === 'cosmic' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} className="absolute w-[200px] h-[200px] rounded-full border border-white/10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
              </motion.div>
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 35, repeat: Infinity, ease: 'linear' }} className="absolute w-[350px] h-[350px] rounded-full border border-white/5">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]" />
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* Side position: compact vertical layout */}
      {isSide ? (
        <>
          {/* Clock + Date */}
          <div className="flex flex-col items-center relative z-10 w-full mt-2 mb-2">
            {greeting ? (
              <span className="text-[11px] font-extrabold text-cyan-400 text-center animate-pulse px-1.5 leading-tight select-none mt-1">
                {greeting}
              </span>
            ) : (
              <>
                <span className={`text-4xl font-black tracking-tight leading-none ${isRgb ? 'rgb-text' : 'text-white'}`} style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                  {time.replace(/\s*[aApP]\.?[mM]\.?/, '')}
                </span>
                <span className="text-xs text-white/40 font-bold tracking-widest uppercase mt-2">{formatDate()}</span>
              </>
            )}
          </div>

          <div className="w-24 h-px bg-white/10 my-2" />

          {/* Weather */}
          {config.showWeather !== false && (
            <>
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-xl px-4 py-3 transition-colors w-full justify-center relative z-10"
                onClick={onOpenWeather}
              >
                <WeatherIcon desc={weather.desc} size={28} className="flex-shrink-0" />
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="text-xl font-bold text-white leading-none">{weather.temp}</span>
                  <span className="text-[11px] text-white/50 capitalize truncate w-full mt-1" title={weather.desc}>{weather.desc}</span>
                </div>
              </div>
              <div className="w-24 h-px bg-white/10 my-2" />
            </>
          )}

          {/* Media Controls */}
          {spotifyState?.item && (
            <>
              <div className="flex flex-col items-center gap-3 w-full relative z-10 px-2 mt-2">
                <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl relative group">
                  {spotifyState.item.album?.images?.[0] ? (
                    <img src={spotifyState.item.album.images[0].url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-purple-600/50 flex items-center justify-center"><Music size={32} className="text-white/80" /></div>
                  )}
                  {spotifyState?.sourceAppId && (
                    <div className="absolute bottom-0 right-0 bg-black/75 rounded-tl-md p-1 flex items-center justify-center border-t border-l border-white/10 z-10">
                      {renderSourceAppIcon(spotifyState.sourceAppId)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center w-full text-center">
                  <span className="text-sm font-bold text-white truncate w-full">{spotifyState.item.name}</span>
                  <span className="text-[11px] text-white/50 truncate w-full mt-0.5">{spotifyState.item.artists?.map(a => a.name).join(', ')}</span>
                </div>
                <div className="w-full flex flex-col gap-1 px-3">
                  <div 
                    className="w-full bg-white/10 rounded-full h-1.5 relative overflow-hidden cursor-pointer group/bar"
                    onClick={onSeek}
                  >
                    <div 
                      className="bg-white rounded-full h-full transition-all duration-300 group-hover/bar:bg-green-400"
                      style={{ width: `${Math.min(100, (localProgress / (spotifyState.duration_ms || 180000)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-white/40 font-mono w-full px-0.5">
                    <span>{formatTime(localProgress)}</span>
                    <span>{spotifyState.duration_ms ? formatTime(spotifyState.duration_ms) : '--:--'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/60 hover:text-white" onClick={onPrev}>
                    <SkipBack size={16} />
                  </button>
                  <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white shadow-lg hover:scale-105" onClick={onTogglePlay}>
                    {spotifyState.is_playing ? <Pause size={18} /> : <Play size={18} className="translate-x-[2px]" />}
                  </button>
                  <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/60 hover:text-white" onClick={onSkip}>
                    <SkipForward size={16} />
                  </button>
                </div>
              </div>
              <div className="w-24 h-px bg-white/10 my-4" />
            </>
          )}

          {/* Timers */}
          {(isPomoRunning || isSwRunning) && (
            <div className="flex flex-col gap-3 relative z-10 w-full px-4 mt-2">
              {isPomoRunning && (
                <div className="flex items-center justify-center gap-2 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20 w-full">
                  <Coffee size={14} className="text-red-400 flex-shrink-0" />
                  <span className="font-mono text-sm font-bold text-red-300">
                    {String(Math.floor(pomodoro / 60)).padStart(2, '0')}:{String(pomodoro % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
              {isSwRunning && (
                <div className="flex items-center justify-center gap-2 bg-yellow-500/10 px-3 py-2 rounded-xl border border-yellow-500/20 w-full">
                  <TimerIcon size={14} className="text-yellow-400 flex-shrink-0" />
                  <span className="font-mono text-sm font-bold text-yellow-300">
                    {String(Math.floor((stopwatch % 3600) / 60)).padStart(2, '0')}:{String(stopwatch % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
              <div className="w-24 h-px bg-white/10 my-1 mx-auto" />
            </div>
          )}

          {/* Stats & Battery */}
          <div className="flex flex-col gap-4 relative z-10 w-full px-5 mt-2">
            {config.showHardware !== false && (
              <>
                <div className="flex items-center justify-between" title={`CPU: ${hardware.cpu}%`}>
                  <div className="flex items-center gap-2.5"><Cpu size={16} className={hardware.cpu > 70 ? 'text-red-400' : 'text-cyan-400'} /><span className="text-[11px] font-medium text-white/50">CPU</span></div>
                  <span className="text-[13px] font-bold text-white tabular-nums">{hardware.cpu}%</span>
                </div>
                <div className="flex items-center justify-between" title={`RAM: ${hardware.ram}%`}>
                  <div className="flex items-center gap-2.5"><HardDrive size={16} className={hardware.ram > 80 ? 'text-red-400' : 'text-purple-400'} /><span className="text-[11px] font-medium text-white/50">RAM</span></div>
                  <span className="text-[13px] font-bold text-white tabular-nums">{hardware.ram}%</span>
                </div>
                <div className="flex items-center justify-between" title={`Network`}>
                  <div className="flex items-center gap-2.5"><Wifi size={16} className={network.tx > 0 || network.rx > 0 ? 'text-blue-400' : 'text-white/40'} /><span className="text-[11px] font-medium text-white/50">NET</span></div>
                  <span className="text-[11px] font-bold text-white tabular-nums truncate w-[60px] text-right">{formatSpeed(network.rx)}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between" title={`Battery: ${battery.level}%`}>
              <div className="flex items-center gap-2.5"><Battery size={16} className={battery.charging ? 'text-green-400' : (battery.level < 20 ? 'text-red-400' : 'text-emerald-400')} /><span className="text-[11px] font-medium text-white/50">PWR</span></div>
              <span className="text-[13px] font-bold text-white tabular-nums">{battery.level}%</span>
            </div>
            <button 
               className="mt-2 w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg py-1.5 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] disabled:opacity-50"
               onClick={onBoost}
               disabled={isBoosting}
            >
               <Rocket size={14} className={isBoosting ? "animate-pulse" : ""} />
               <span>BOOST</span>
            </button>
          </div>

          <div className="mt-auto flex items-center justify-center gap-4 w-full mb-6 relative z-10">
            {/* Settings */}
            <button 
              title="Settings"
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors text-white/60 hover:text-white"
              onClick={onShowSettings}
            >
              <SettingsIcon size={18} />
            </button>
            {/* Quit */}
            <button 
              title="Quit"
              className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
              onClick={onQuit}
            >
              <Power size={18} />
            </button>
          </div>
        </>
      ) : (
        <>
      {/* Left Section: Clock + Date */}
      <div className="flex items-center gap-5 min-w-[280px] relative z-10">
        {greeting ? (
          <div className="flex flex-col justify-center min-h-[40px]">
            <span className="text-[13px] font-extrabold text-cyan-400 animate-pulse tracking-wide select-none">
              {greeting}
            </span>
          </div>
        ) : (
          <div className="flex flex-col">
            <motion.span 
              className={`text-3xl font-black tracking-tight leading-none ${isRgb ? 'rgb-text' : 'text-white'}`}
              style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
            >
              {time}
            </motion.span>
            <span className="text-[11px] text-white/40 font-medium tracking-wider uppercase mt-0.5">{formatDate()}</span>
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-10 bg-white/10" />

        {/* Weather */}
        {config.showWeather !== false && (
          <div 
            className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 rounded-xl px-3 py-2 transition-colors"
            onClick={onOpenWeather}
          >
            <WeatherIcon desc={weather.desc} size={20} />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-none">{weather.temp}</span>
              <span className="text-[10px] text-white/40 leading-none mt-0.5">{weather.desc}</span>
            </div>
          </div>
        )}
      </div>

      {/* Center Section: Media Player */}
      <div className="flex items-center gap-4 flex-1 justify-center max-w-[500px] relative z-10">
        {spotifyState?.item ? (
          <>
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 relative">
              {spotifyState.item.album?.images?.[0] ? (
                <img src={spotifyState.item.album.images[0].url} className="w-full h-full object-cover" />
              ) : (
                <Music size={20} className="text-white/90" />
              )}
              {spotifyState?.sourceAppId && (
                <div className="absolute bottom-0 right-0 bg-black/75 rounded-tl-md p-0.5 flex items-center justify-center border-t border-l border-white/10 z-10">
                  {renderSourceAppIcon(spotifyState.sourceAppId)}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0 max-w-[200px] flex-grow gap-1 justify-center">
              <div 
                className="flex flex-col min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onOpenMediaApp(spotifyState?.sourceAppId)}
              >
                <span className="font-bold text-sm leading-none truncate">{spotifyState.item.name || 'Not Playing'}</span>
                <span className="text-[10px] text-white/50 truncate mt-0.5">{spotifyState.item.artists?.map(a => a.name).join(', ') || ''}</span>
              </div>
              <div className="w-full flex flex-col gap-0.5 mt-0.5 px-0.5">
                <div 
                  className="w-full bg-white/10 rounded-full h-1 relative overflow-hidden cursor-pointer group/bar"
                  onClick={onSeek}
                >
                  <div 
                    className="bg-white rounded-full h-full transition-all duration-300 group-hover/bar:bg-green-400"
                    style={{ width: `${Math.min(100, (localProgress / (spotifyState.duration_ms || 180000)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-white/40 font-mono w-full">
                  <span>{formatTime(localProgress)}</span>
                  <span>{spotifyState.duration_ms ? formatTime(spotifyState.duration_ms) : '--:--'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/60 hover:text-white" onClick={onPrev}>
                <SkipBack size={14} />
              </button>
              <button className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white" onClick={onTogglePlay}>
                {spotifyState.is_playing ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
              </button>
              <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/60 hover:text-white" onClick={onSkip}>
                <SkipForward size={14} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-white/30">
            <Music size={18} />
            <span className="text-sm font-medium">No Media Playing</span>
          </div>
        )}
      </div>

      {/* Lyrics Section — between media and stats */}
      {spotifyState?.lyrics?.length > 0 && (
        <>
          <div className="w-px h-8 bg-white/10 flex-shrink-0 relative z-10" />
          <div className="flex items-center justify-center w-[200px] relative z-10 flex-shrink-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={getCurrentLyric() || '_empty'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: getCurrentLyric() ? 1 : 0, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-[12px] font-medium text-white/70 text-center leading-snug line-clamp-2 italic"
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
              >
                {getCurrentLyric() ? `♪ ${getCurrentLyric()}` : '\u00A0'}
              </motion.span>
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Right Section: Stats + Battery + Privacy + Controls */}
      <div className="flex items-center gap-4 min-w-[280px] justify-end relative z-10">
        {/* Timers (if running) */}
        {isPomoRunning && (
          <div className="flex items-center gap-1.5 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
            <Coffee size={12} className="text-red-400" />
            <span className="font-mono text-xs font-bold text-red-300">
              {String(Math.floor(pomodoro / 60)).padStart(2, '0')}:{String(pomodoro % 60).padStart(2, '0')}
            </span>
          </div>
        )}
        {isSwRunning && (
          <div className="flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
            <TimerIcon size={12} className="text-yellow-400" />
            <span className="font-mono text-xs font-bold text-yellow-300">
              {String(Math.floor((stopwatch % 3600) / 60)).padStart(2, '0')}:{String(stopwatch % 60).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Hardware mini stats */}
        {config.showHardware !== false && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 flex-shrink-0" title={`CPU: ${hardware.cpu}%`}>
              <Cpu size={13} className={hardware.cpu > 70 ? 'text-red-400' : 'text-green-400'} />
              <span className="text-[11px] font-bold text-white/70 tabular-nums w-[30px] text-right">{hardware.cpu}%</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0" title={`RAM: ${hardware.ram}%`}>
              <HardDrive size={13} className={hardware.ram > 80 ? 'text-red-400' : 'text-blue-400'} />
              <span className="text-[11px] font-bold text-white/70 tabular-nums w-[30px] text-right">{hardware.ram}%</span>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0" title={`↓${formatSpeed(network.rx)} ↑${formatSpeed(network.tx)}`}>
              <Wifi size={12} className={(network.rx > 1024*500 || network.tx > 1024*500) ? 'text-purple-400' : 'text-white/30'} />
              <span className="text-[10px] font-bold text-white/50 tabular-nums w-[68px] text-left">{formatSpeed(network.rx)}</span>
            </div>
          </div>
        )}

        <div className="w-px h-8 bg-white/10" />

        {/* Battery */}
        <div className="flex items-center gap-1.5" title={`Battery: ${battery.level}%${battery.charging ? ' (Charging)' : ''}`}>
          <div className="relative w-[16px] h-[16px] flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/10" strokeWidth="4" />
              <circle cx="18" cy="18" r="16" fill="none" 
                className={battery.charging ? 'stroke-green-500' : (battery.level < 20 ? 'stroke-red-500' : 'stroke-white/70')} 
                strokeWidth="4" strokeDasharray="100" strokeDashoffset={100 - battery.level} strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-white/60 tabular-nums">{battery.level}%</span>
        </div>

        {/* Privacy dots */}
        {(privacy.mic || privacy.cam) && (
          <div className="flex gap-1.5">
            {privacy.mic && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)] animate-pulse" />}
            {privacy.cam && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)] animate-pulse" />}
          </div>
        )}

        {/* Settings + Quit */}
        <button 
           onClick={onBoost} 
           disabled={isBoosting}
           className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
           title="Boost System"
        >
           <Rocket size={14} className={isBoosting ? "animate-pulse" : ""} />
        </button>
        <button 
          title="Settings" 
          className="relative w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors text-white/50 hover:text-white"
          onClick={onShowSettings}
        >
          <SettingsIcon size={14} />
          {updateAvailable ? (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
          ) : whatsNewAvailable ? (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
          ) : null}
        </button>
        <button 
          title="Quit"
          className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
          onClick={onQuit}
        >
          <Power size={12} />
        </button>
      </div>
        </>
      )}

      {/* Notification overlay */}
      <AnimatePresence>
        {(batteryEvent || boostAlert || isBoosting || sysNotification) && (
          <motion.div 
            initial={{ opacity: 0, y: isSide ? -20 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isSide ? -20 : -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`absolute inset-0 z-[35] bg-[#070708f2] flex items-center justify-center border-white/10 backdrop-blur-xl
              ${isSide 
                ? 'w-full h-full flex-col px-4 py-8 justify-center text-center' 
                : 'w-full h-full px-8 gap-6 justify-center'}`}
          >
            {batteryEvent && (
              <div className={`flex ${isSide ? 'flex-col text-center' : 'row'} items-center gap-4`}>
                 <div className={`w-12 h-12 rounded-full ${batteryEvent.low ? 'bg-red-500/20 text-red-500' : (batteryEvent.charging ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')} flex items-center justify-center flex-shrink-0 animate-pulse`}>
                    {batteryEvent.charging ? <BatteryCharging size={24} /> : <Battery size={24} />}
                 </div>
                 <div className="flex flex-col text-left">
                    <span className="font-bold text-base text-white">{batteryEvent.low ? 'Battery Low' : (batteryEvent.charging ? 'Charging Started' : 'Power Disconnected')}</span>
                    <span className="text-xs text-white/50">{batteryEvent.level}% remaining</span>
                 </div>
              </div>
            )}

            {isBoosting && (
              <div className={`flex ${isSide ? 'flex-col text-center animate-pulse' : 'row'} items-center gap-4 w-full justify-center`}>
                 <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Rocket size={24} className="animate-ping" />
                 </div>
                 <div className={`flex flex-col max-w-[240px] w-full ${isSide ? 'items-center text-center' : 'items-start text-left'}`}>
                    <span className="font-bold text-sm text-white">Boosting System...</span>
                    <span className="text-xs text-cyan-300 truncate w-full mt-0.5">
                      {boostProgress ? `Killed ${boostProgress.name} (-${boostProgress.mb}MB, -${boostProgress.cpu}% CPU)` : 'Scanning memory...'}
                    </span>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2 relative">
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
              <div className={`flex ${isSide ? 'flex-col text-center' : 'row'} items-center gap-4`}>
                 <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Rocket size={24} className="animate-bounce" />
                 </div>
                 <div className="flex flex-col text-left">
                    <span className="font-bold text-base text-white">System Boosted</span>
                    <span className="text-xs text-cyan-300">Freed {boostAlert.freedMB} MB RAM & {boostAlert.freedCPU}% CPU</span>
                 </div>
              </div>
            )}

            {sysNotification && (
              <div className={`flex ${isSide ? 'flex-col text-center' : 'row'} items-center gap-4 w-full justify-center text-left`} style={{ pointerEvents: 'auto' }}>
                 <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase tracking-wider">
                   {sysNotification.appName ? sysNotification.appName.slice(0,2) : 'NT'}
                 </div>
                 <div className="flex flex-col text-left overflow-hidden flex-grow max-w-[280px]">
                   <div className="flex items-center gap-1.5 justify-between">
                     <span className="font-bold text-[10px] text-green-400 uppercase tracking-widest truncate max-w-[160px]">{sysNotification.appName || 'Notification'}</span>
                     <span className="text-[9px] text-white/40 flex-shrink-0">• Just Now</span>
                   </div>
                   <span className="font-bold text-xs text-white/90 truncate mt-0.5">{sysNotification.title || 'Alert'}</span>
                   <span className="text-[10px] text-white/60 line-clamp-1 leading-relaxed mt-0.5">{sysNotification.message}</span>
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

export default function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [time, setTime] = useState('');
  const [spotifyState, setSpotifyState] = useState(null);
  const [clipboardUrl, setClipboardUrl] = useState(null);
  const [privacy, setPrivacy] = useState({ cam: false, mic: false });
  const [localProgress, setLocalProgress] = useState(0);
  const [network, setNetwork] = useState({ rx: 0, tx: 0 });
  const [battery, setBattery] = useState({ level: 100, charging: false });
  const [greeting, setGreeting] = useState(null);

  useEffect(() => {
    const lastOpenedVersion = localStorage.getItem('smart-notch-version');
    if (lastOpenedVersion !== '6.0.5') {
      setGreeting("Updated to v6.0.4: Custom background links & video support! 🎉");
      localStorage.setItem('smart-notch-version', '6.0.5');
      setTimeout(() => setGreeting(null), 6000);
    } else {
      const hour = new Date().getHours();
      let text = "Good Evening";
      if (hour < 12) text = "Good Morning";
      else if (hour < 17) text = "Good Afternoon";
      setGreeting(text);
      setTimeout(() => setGreeting(null), 4000);
    }
  }, []);

  const [viewMode, setViewMode] = useState('media');
  
  const defaultConfig = {
    bgAnimation: 'liquid',
    bgColor: '#000000',
    idleColor: '#000000',
    panelStyle: 'glass',
    accentColor: 'cyan',
    glowIntensity: 'medium',
    cornerShape: 'pill',
    showWeather: true,
    showHardware: true,
    showPomodoro: true,
    showStopwatch: false,
    autoHide: true,
    clockFormat: '12h',
    mode: 'notch',
    screenPosition: 'top',
    lockDrag: false,
    customBgUrl: ''
  };
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('smart-notch-config');
      const parsed = saved ? JSON.parse(saved) : defaultConfig;
      // Remove any stored offsetX — we now track position with a motion value
      delete parsed.offsetX;
      // Migrate old alwaysOnScreen to new mode system
      if (!parsed.mode) {
        parsed.mode = parsed.alwaysOnScreen === false ? 'bar' : 'notch';
      }
      delete parsed.alwaysOnScreen;
      return parsed;
    } catch(e) { return defaultConfig; }
  });
  const [isResolvingBgUrl, setIsResolvingBgUrl] = useState(false);

  useEffect(() => {
    localStorage.setItem('smart-notch-config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (!config.customBgUrl) return;
    const cleanUrl = config.customBgUrl.trim();
    if (
      cleanUrl.includes('pin.it') || 
      cleanUrl.includes('pinterest.com') ||
      (cleanUrl.includes('giphy.com') && !cleanUrl.includes('media.giphy.com')) ||
      cleanUrl.includes('gph.is')
    ) {
      if (ipcRenderer && !isResolvingBgUrl) {
        const resolveUrl = async () => {
          setIsResolvingBgUrl(true);
          try {
            const resolved = await ipcRenderer.invoke('resolve-pinterest-url', cleanUrl);
            if (resolved) {
              setConfig(prev => ({ ...prev, customBgUrl: resolved }));
            }
          } catch (err) {
            console.error('Failed to resolve URL:', err);
          } finally {
            setIsResolvingBgUrl(false);
          }
        };
        resolveUrl();
      }
    }
  }, [config.customBgUrl]);

  const isRgb = config.accentColor === 'rgb';
  const accentHex = (!isRgb && config.accentColor?.startsWith('#')) ? config.accentColor : '#06b6d4';

  // Send screen position to main process when it changes
  useEffect(() => {
    if (ipcRenderer && config.screenPosition) {
      ipcRenderer.send('set-screen-position', config.screenPosition, { ignoreBounds: window.isDraggingUpdate });
      window.isDraggingUpdate = false;
    }
  }, [config.screenPosition]);

  useEffect(() => {
    if (!ipcRenderer) return;
    const handleWindowDragged = (newPos) => {
      window.isDraggingUpdate = true;
      setConfig(prev => ({...prev, screenPosition: newPos}));
    };
    ipcRenderer.on('window-dragged-to', handleWindowDragged);
    return () => ipcRenderer.removeAllListeners('window-dragged-to');
  }, []);
  
  // Helpers for Tailwind classes and dynamic inline styles based on config
  const getGlowStyle = () => {
     if (config.glowIntensity === 'none') return '';
     
     if (config.accentColor === 'rgb') {
        if (config.glowIntensity === 'high') return 'rgb-shadow-high';
        if (config.glowIntensity === 'low') return 'rgb-shadow-low';
        return 'rgb-shadow-med';
     }
     return '';
  };

  const getNotchGlowStyle = () => {
     if (config.glowIntensity === 'none') return {};
     if (config.accentColor === 'rgb') return {};
     
     const hex = config.accentColor.startsWith('#') ? config.accentColor : '#06b6d4';
     const hexToRgba = (hex, a) => {
       try {
         const r = parseInt(hex.slice(1,3), 16);
         const g = parseInt(hex.slice(3,5), 16);
         const b = parseInt(hex.slice(5,7), 16);
         return `rgba(${r},${g},${b},${a})`;
       } catch(e) { return `rgba(6,182,212,${a})`; }
     };

     const sizeMap = {
       low: { size: '15px', alpha: 0.15 },
       medium: { size: '30px', alpha: 0.25 },
       high: { size: '50px', alpha: 0.4 }
     };
     const { size, alpha } = sizeMap[config.glowIntensity] || sizeMap.medium;
     return {
       boxShadow: `0 0 ${size} ${hexToRgba(hex, alpha)}`
     };
  };

  const getTextGlowStyle = (isGreeting) => {
      if (config.glowIntensity === 'none') return isGreeting ? (idleTextColor === 'black' ? 'text-black/90' : 'text-white/90') : '';
      if (config.accentColor === 'rgb') return 'rgb-text';
      
      const colors = {
          '#06b6d4': isGreeting ? 'text-cyan-300' : 'text-cyan-100',
          '#a855f7': isGreeting ? 'text-purple-300' : 'text-purple-100',
          '#00cc44': isGreeting ? 'text-green-300' : 'text-green-100',
          '#ec4899': isGreeting ? 'text-pink-300' : 'text-pink-100',
          '#ff6600': isGreeting ? 'text-orange-300' : 'text-orange-100',
          '#ffffff': isGreeting ? 'text-white' : 'text-white/90'
      };
      return colors[config.accentColor] || (config.accentColor.startsWith('#') ? 'text-white/90' : 'text-cyan-100');
  };

  const getTextShadowStyle = (isGreeting) => {
     if (config.glowIntensity === 'none') return {};
     if (config.accentColor === 'rgb') return {};
     
     const hex = config.accentColor.startsWith('#') ? config.accentColor : '#06b6d4';
     const size = isGreeting ? '8px' : '5px';
     const alpha = isGreeting ? 0.8 : 0.6;
     
     const hexToRgba = (hex, a) => {
       try {
         const r = parseInt(hex.slice(1,3), 16);
         const g = parseInt(hex.slice(3,5), 16);
         const b = parseInt(hex.slice(5,7), 16);
         return `rgba(${r},${g},${b},${a})`;
       } catch(e) { return `rgba(6,182,212,${a})`; }
     };
     
     return {
       textShadow: `0 0 ${size} ${hexToRgba(hex, alpha)}`
     };
  };

  const getPanelBorderStyle = () => {
     if (config.panelStyle === 'solid') return 'bg-[#0f0f11] border border-white/[0.05] shadow-2xl';
     if (config.panelStyle === 'glass') return 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]';
     
     // dark-glass
     if (config.accentColor === 'rgb') return 'bg-black/[0.6] backdrop-blur-2xl border rgb-border shadow-2xl';
     return 'bg-black/[0.6] backdrop-blur-2xl border shadow-2xl';
  };

  const getPanelBorderStyleInline = () => {
    if (config.panelStyle === 'solid' || config.accentColor === 'rgb') return {};
    
    const hex = config.accentColor.startsWith('#') ? config.accentColor : '#06b6d4';
    const opacity = config.panelStyle === 'glass' ? 0.08 : 0.15;
    
    const hexToRgba = (hex, a) => {
      try {
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        return `rgba(${r},${g},${b},${a})`;
      } catch(e) { return `rgba(255,255,255,${a})`; }
    };
    
    return {
      borderColor: hexToRgba(hex, opacity)
    };
  };

  const getRadius = (stateType) => {
    if (config.cornerShape === 'rounded') {
      return stateType === 'expanded' ? 12 : 6;
    }
    return stateType === 'expanded' ? 24 : 16;
  };

  const viewModeRef = useRef('media');
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

  const [shelfSettingsOpen, setShelfSettingsOpen] = useState(false);
  const shelfSettingsOpenRef = useRef(false);
  useEffect(() => { shelfSettingsOpenRef.current = shelfSettingsOpen; }, [shelfSettingsOpen]);

  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  const [hardware, setHardware] = useState({ cpu: 0, ram: 0 });
  const [weather, setWeather] = useState({ temp: '--', desc: 'Fetching...' });
  const [stopwatch, setStopwatch] = useState(0);
  const [isSwRunning, setIsSwRunning] = useState(false);
  const swRef = useRef({ start: 0, accumulated: 0 });
  const [tasks, setTasks] = useState([]);

  // Pomodoro
  const [pomoWorkTime, setPomoWorkTime] = useState(25 * 60);
  const [pomoBreakTime, setPomoBreakTime] = useState(5 * 60);
  const [pomodoro, setPomodoro] = useState(25 * 60);
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const [pomoMode, setPomoMode] = useState('work');

  const [batteryEvent, setBatteryEvent] = useState(null);
  const [meetingAlert, setMeetingAlert] = useState(null);
  const [boostAlert, setBoostAlert] = useState(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const [boostProgress, setBoostProgress] = useState(null);
  const isMouseOverShelfRef = useRef(false);

  const [sysNotification, setSysNotification] = useState(null);
  const sysNotificationTimeoutRef = useRef(null);

  const [pomoTasks, setPomoTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('smart-notch-pomo-tasks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  useEffect(() => {
    localStorage.setItem('smart-notch-pomo-tasks', JSON.stringify(pomoTasks));
  }, [pomoTasks]);
  const [taskInput, setTaskInput] = useState('');
  
  const handleAddTask = () => {
    if (!taskInput.trim()) return;
    const newTask = {
      id: Date.now(),
      text: taskInput.trim(),
      completed: false
    };
    setPomoTasks([...pomoTasks, newTask]);
    setTaskInput('');
  };
  
  const handleToggleTask = (id) => {
    setPomoTasks(pomoTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };
  
  const handleDeleteTask = (id) => {
    setPomoTasks(pomoTasks.filter(t => t.id !== id));
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      const isInputFocused = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
      if (!isInputFocused) {
        if (configRef.current.mode === 'notch') {
          handleDismissNotch();
        } else if (configRef.current.mode === 'bar') {
          handleShelfMouseLeave();
        }
      }
    }, 150);
  };

  const playPomoChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      const playTone = (time, freq) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 1.2);
      };
      
      playTone(now, 587.33); // D5
      playTone(now + 0.15, 880); // A5
    } catch (err) {
      console.warn("Failed to play audio chime:", err);
    }
  };

  const CURRENT_VERSION = '6.0.5';
  const isWindowsStore = ipcRenderer?.isWindowsStore || false;
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(CURRENT_VERSION);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [whatsNewAvailable, setWhatsNewAvailable] = useState(false);
  const [changelog, setChangelog] = useState([]);

  useEffect(() => {
    if (isWindowsStore) {
      setUpdateAvailable(false);
      setWhatsNewAvailable(false);
      return;
    }

    const compareVersions = (v1, v2) => {
      const parts1 = v1.split('.').map(Number);
      const parts2 = v2.split('.').map(Number);
      for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
      }
      return 0;
    };

    const checkUpdates = async () => {
      try {
        const res = await fetch('https://raw.githubusercontent.com/Avenger11764/Dynamic_island/main/package.json?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (data && data.version) {
            setLatestVersion(data.version);
            if (data.changelog) {
              setChangelog(data.changelog);
            }
            // Enable update available state if repository is newer, OR if simulated in localhost dev mode
            if (compareVersions(data.version, CURRENT_VERSION) > 0 || window.location.search.includes('simulate-update')) {
              setUpdateAvailable(true);
            } else {
              setUpdateAvailable(false);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to check updates:", err);
      }
    };
    checkUpdates();
    const interval = setInterval(checkUpdates, 12 * 60 * 60 * 1000);

    // What's New logic: show only once if local version is newer than the last seen version.
    const lastSeen = localStorage.getItem('lastSeenVersion');
    const isExistingUser = localStorage.getItem('smart-notch-config') !== null || localStorage.getItem('smart-notch-version') !== null;
    if (!lastSeen) {
      localStorage.setItem('lastSeenVersion', CURRENT_VERSION);
      if (isExistingUser || window.location.search.includes('simulate-whats-new')) {
        setWhatsNewAvailable(true);
      } else {
        setWhatsNewAvailable(false);
      }
    } else {
      if (compareVersions(CURRENT_VERSION, lastSeen) > 0 || window.location.search.includes('simulate-whats-new')) {
        setWhatsNewAvailable(true);
      } else {
        setWhatsNewAvailable(false);
      }
    }

    return () => clearInterval(interval);
  }, []);

  const [activeCall, setActiveCall] = useState({ isActive: false, appName: '', title: '', handle: 0, isForeground: true });
  const isCallNotification = activeCall?.isActive && !activeCall?.isForeground;

  const isNotification = Boolean(clipboardUrl || batteryEvent || meetingAlert || boostAlert || isBoosting || sysNotification);
  const isNotificationRef = useRef(false);
  isNotificationRef.current = isNotification;

  const [isDeepIdle, setIsDeepIdle] = useState(false);
  const idleTimerRef = useRef(null);
  const isCompletelyIdle = (!isExpanded && !isNotification && !greeting);

  useEffect(() => {
    if (config.autoHide === false) {
      setIsDeepIdle(false);
      return;
    }
    if (isCompletelyIdle) {
      idleTimerRef.current = setTimeout(() => {
        setIsDeepIdle(true);
      }, 20000); // 20 seconds
    } else {
      setIsDeepIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    }
  }, [isCompletelyIdle, config.autoHide]);

  // Battery Polling
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(bat => {
        setBattery({ level: Math.round(bat.level * 100), charging: bat.charging });
        let lastCharging = bat.charging;
        let lastLevel = bat.level;
        bat.addEventListener('chargingchange', () => {
          setBattery(prev => ({ ...prev, charging: bat.charging }));
          if (bat.charging !== lastCharging) {
             lastCharging = bat.charging;
             setBatteryEvent({ charging: bat.charging, level: Math.round(bat.level * 100) });
             setTimeout(() => setBatteryEvent(null), 5000);
          }
        });
        bat.addEventListener('levelchange', () => {
          setBattery(prev => ({ ...prev, level: Math.round(bat.level * 100) }));
          if (!bat.charging && Math.round(bat.level*100) === 20 && Math.round(lastLevel*100) > 20) {
             setBatteryEvent({ charging: false, level: Math.round(bat.level * 100), low: true });
             setTimeout(() => setBatteryEvent(null), 8000);
          }
          lastLevel = bat.level;
        });
      });
    }
  }, []);

  useEffect(() => {
    fetch('https://wttr.in/?format=j1').then(r => r.json()).then(data => {
      const current = data.current_condition[0];
      setWeather({ temp: `${current.temp_C}°C`, desc: current.weatherDesc[0].value });
    }).catch(() => setWeather({ temp: 'Err', desc: 'Offline' }));
  }, []);

  useEffect(() => {
    let interval;
    if (isSwRunning) {
      swRef.current.start = Date.now();
      interval = setInterval(() => {
        setStopwatch(swRef.current.accumulated + Math.floor((Date.now() - swRef.current.start) / 1000));
      }, 250);
    } else {
      swRef.current.accumulated = stopwatch;
    }
    return () => clearInterval(interval);
  }, [isSwRunning]);

  const toggleSw = () => setIsSwRunning(!isSwRunning);
  const resetSw = () => {
    setIsSwRunning(false);
    setStopwatch(0);
    swRef.current = { start: 0, accumulated: 0 };
  };

  useEffect(() => {
    let interval;
    if (isPomoRunning && pomodoro > 0) {
      interval = setInterval(() => setPomodoro(p => p - 1), 1000);
    } else if (pomodoro === 0 && isPomoRunning) {
      setIsPomoRunning(false);
      playPomoChime();
      if (ipcRenderer) {
        ipcRenderer.send('show-notification', {
          title: pomoMode === 'work' ? 'Focus Session Complete' : 'Break Time is Over',
          body: pomoMode === 'work' ? 'Time to take a short break!' : 'Ready to get back to work?'
        });
      }
    }
    return () => clearInterval(interval);
  }, [isPomoRunning, pomodoro, pomoMode]);

  const togglePomo = () => setIsPomoRunning(!isPomoRunning);
  const resetPomo = () => {
    setIsPomoRunning(false);
    setPomodoro(pomoMode === 'work' ? pomoWorkTime : pomoBreakTime);
  };
  const switchPomoMode = (mode) => {
    setPomoMode(mode);
    setPomodoro(mode === 'work' ? pomoWorkTime : pomoBreakTime);
    setIsPomoRunning(false);
  };

  const adjustPomoTime = (change) => {
    if (isPomoRunning) return;
    if (pomoMode === 'work') {
      const newTime = Math.max(60, pomoWorkTime + change);
      setPomoWorkTime(newTime);
      setPomodoro(newTime);
    } else {
      const newTime = Math.max(60, pomoBreakTime + change);
      setPomoBreakTime(newTime);
      setPomodoro(newTime);
    }
  };



  useEffect(() => {
    const handleWheel = (e) => {
      if (!isExpanded) return;
      // Allow scrolling inside scrollable panels freely without adjusting volume/brightness
      if (
        viewModeRef.current === 'settings' || 
        shelfSettingsOpenRef.current || 
        e.target.closest('.overflow-y-auto') || 
        e.target.closest('.custom-scrollbar') || 
        e.target.closest('.overflow-auto')
      ) {
        return;
      }
      if (e.deltaY !== 0) {
        if (e.shiftKey) {
          if (ipcRenderer) ipcRenderer.send('adjust-brightness', e.deltaY > 0 ? -10 : 10);
          setViewMode('brightness');
        } else {
          if (ipcRenderer) ipcRenderer.send('adjust-volume', e.deltaY > 0 ? -2 : 2);
          setViewMode('volume');
        }
        clearTimeout(window.wheelTimeout);
        window.wheelTimeout = setTimeout(() => setViewMode('media'), 2000);
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isExpanded]);

  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.on('spotify-state', (data) => {
        setSpotifyState(data);
        if (data?.is_playing) setLocalProgress(data.progress_ms);
      });
      ipcRenderer.on('clipboard-url', (url) => {
        setClipboardUrl(url);
        ipcRenderer.send('set-ignore-mouse-events', false);
        setTimeout(() => setClipboardUrl(null), 6000);
      });
      ipcRenderer.on('hardware-stats', (stats) => {
        setHardware(stats);
      });
      ipcRenderer.on('privacy-dots', (state) => {
        setPrivacy(state);
      });
      ipcRenderer.on('network-stats', (stats) => {
        setNetwork(stats);
      });
      ipcRenderer.on('active-call-status', (status) => {
        setActiveCall(status);
      });
      ipcRenderer.on('system-notification', (payload) => {
        if (sysNotificationTimeoutRef.current) {
          clearTimeout(sysNotificationTimeoutRef.current);
        }
        setSysNotification(payload);
        ipcRenderer.send('set-ignore-mouse-events', false);
        sysNotificationTimeoutRef.current = setTimeout(() => {
          setSysNotification(null);
        }, 6000);
      });
      return () => {
        ipcRenderer.removeAllListeners('spotify-state');
        ipcRenderer.removeAllListeners('clipboard-url');
        ipcRenderer.removeAllListeners('hardware-stats');
        ipcRenderer.removeAllListeners('privacy-dots');
        ipcRenderer.removeAllListeners('network-stats');
        ipcRenderer.removeAllListeners('active-call-status');
        ipcRenderer.removeAllListeners('system-notification');
        if (sysNotificationTimeoutRef.current) {
          clearTimeout(sysNotificationTimeoutRef.current);
        }
      };
    }
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: config.clockFormat === '12h' }));
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, [config.clockFormat]);

  useEffect(() => {
    let interval;
    if (spotifyState?.is_playing) {
      interval = setInterval(() => setLocalProgress(p => p + 100), 100);
    }
    return () => clearInterval(interval);
  }, [spotifyState?.is_playing]);

  const getCurrentLyric = useCallback(() => {
    if (!spotifyState?.lyrics || spotifyState.lyrics.length === 0) return null;
    let active = '';
    for (let i = 0; i < spotifyState.lyrics.length; i++) {
       if (localProgress + 400 >= spotifyState.lyrics[i].timeMs) {
          active = spotifyState.lyrics[i].text;
       } else {
          break;
       }
    }
    return active;
  }, [spotifyState?.lyrics, localProgress]);

  const isSpotify = Boolean(spotifyState?.isSpotify);



  const handleProgressBarClick = (e) => {
    if (!spotifyState?.item) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    const duration = spotifyState.duration_ms || 180000;
    const targetProgressMs = Math.round(percentage * duration);
    
    // Update optimistically
    setLocalProgress(targetProgressMs);
    
    if (ipcRenderer) {
      ipcRenderer.send('spotify-seek', targetProgressMs);
    }
  };

  // ── Shelf mode (Always On Screen: OFF) ──
  const [shelfVisible, setShelfVisible] = useState(false);
  const shelfVisibleRef = useRef(false);
  shelfVisibleRef.current = shelfVisible;
  const isIntroActiveRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [snapDirection, setSnapDirection] = useState('top');
  const shelfTimeoutRef = useRef(null);

  const handleCustomDragStart = (e) => {
    if (config.lockDrag) {
      return;
    }
    if (
      e.target.closest('button') || 
      e.target.closest('input') || 
      e.target.closest('textarea') || 
      e.target.closest('.no-drag') || 
      e.target.closest('[role="button"]') || 
      e.target.closest('.cursor-pointer')
    ) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    
    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn("Failed to set pointer capture:", err);
    }

    if (ipcRenderer) ipcRenderer.send('custom-drag-start');

    let rafId = null;
    const handlePointerMove = (moveEvent) => {
      moveEvent.preventDefault();
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (ipcRenderer) ipcRenderer.send('custom-drag-move');
          rafId = null;
        });
      }
    };

    const handlePointerUpOrCancel = (endEvent) => {
      endEvent.preventDefault();
      setIsDragging(false);
      
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      
      try {
        target.releasePointerCapture(endEvent.pointerId);
      } catch (err) {}

      if (ipcRenderer) ipcRenderer.send('custom-drag-end');

      target.removeEventListener('pointermove', handlePointerMove);
      target.removeEventListener('pointerup', handlePointerUpOrCancel);
      target.removeEventListener('pointercancel', handlePointerUpOrCancel);
      target.removeEventListener('lostpointercapture', handlePointerUpOrCancel);
    };

    target.addEventListener('pointermove', handlePointerMove);
    target.addEventListener('pointerup', handlePointerUpOrCancel);
    target.addEventListener('pointercancel', handlePointerUpOrCancel);
    target.addEventListener('lostpointercapture', handlePointerUpOrCancel);
  };

  const handleCustomDragMove = () => {};
  const handleCustomDragEnd = () => {};
  const handleCustomDragCancel = () => {};

  useEffect(() => {
    if (ipcRenderer) {
      const handleSnapPreview = (event, direction) => {
        setSnapDirection(direction);
      };
      const handleSnapEnd = (event, direction) => {
        setIsDragging(false);
      };
      
      ipcRenderer.on('drag-snap-preview', handleSnapPreview);
      ipcRenderer.on('drag-snap-end', handleSnapEnd);
      
      return () => {
        ipcRenderer.removeAllListeners('drag-snap-preview');
        ipcRenderer.removeAllListeners('drag-snap-end');
      };
    }
  }, []);

  // Switch window mode when config changes
  useEffect(() => {
    if (!ipcRenderer) return;
    if (config.mode === 'bar') {
      const isSide = config.screenPosition === 'left' || config.screenPosition === 'right';
      ipcRenderer.send('set-window-mode', 'shelf');
      ipcRenderer.send('set-shelf-height', isSide ? 160 : 64);
      ipcRenderer.send('set-ignore-mouse-events', false);
      setShelfVisible(true);
      isIntroActiveRef.current = true;
      // Auto-hide after intro
      const introTimer = setTimeout(() => {
        isIntroActiveRef.current = false;
        setShelfVisible(false);
        ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
        setTimeout(() => {
          if (!shelfVisibleRef.current) {
            ipcRenderer.send('set-shelf-height', 6);
          }
        }, 400);
      }, 4000); // Keep visible for 4 seconds so users see what happened
      return () => {
        clearTimeout(introTimer);
        isIntroActiveRef.current = false;
      };
    } else {
      ipcRenderer.send('set-window-mode', 'notch');
      ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
      setShelfVisible(false);
      isIntroActiveRef.current = false;
    }
  }, [config.mode]);

  // Edge detection for bar mode — show bar when mouse reaches screen edge
  useEffect(() => {
    if (config.mode !== 'bar') return;

    const handleMouseMove = (e) => {
      const isLeft = config.screenPosition === 'left';
      const isRight = config.screenPosition === 'right';
      const atEdge = isLeft ? e.clientX <= 4 : (isRight ? e.clientX >= window.innerWidth - 4 : e.clientY <= 4);
      
      if (atEdge && !shelfVisible) {
        setShelfVisible(true);
        if (ipcRenderer) {
          const isSideLocal = config.screenPosition === 'left' || config.screenPosition === 'right';
          ipcRenderer.send('set-shelf-height', isSideLocal ? 160 : 64);
          ipcRenderer.send('set-ignore-mouse-events', false);
        }
        if (shelfTimeoutRef.current) {
          clearTimeout(shelfTimeoutRef.current);
          shelfTimeoutRef.current = null;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [config.mode, config.screenPosition, shelfVisible]);

  const handleShelfMouseEnter = () => {
    isIntroActiveRef.current = false; // Cancel intro if user interacts
    isMouseOverShelfRef.current = true;
    if (shelfTimeoutRef.current) {
      clearTimeout(shelfTimeoutRef.current);
      shelfTimeoutRef.current = null;
    }
    setShelfVisible(true);
    if (ipcRenderer) {
      const isSide = config.screenPosition === 'left' || config.screenPosition === 'right';
      ipcRenderer.send('set-shelf-height', shelfSettingsOpenRef.current ? (isSide ? 516 : 420) : (isSide ? 160 : 64));
      ipcRenderer.send('set-ignore-mouse-events', false);
    }
  };

  const handleShelfMouseLeave = () => {
    isMouseOverShelfRef.current = false;
    if (isNotificationRef.current) return;
    const isInputFocused = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
    if (isInputFocused) return;
    
    if (shelfTimeoutRef.current) clearTimeout(shelfTimeoutRef.current);
    
    shelfTimeoutRef.current = setTimeout(() => {
      setShelfVisible(false);
      setShelfSettingsOpen(false);
      shelfSettingsOpenRef.current = false;
      if (ipcRenderer) {
        ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
        setTimeout(() => {
          if (!shelfVisibleRef.current) {
            ipcRenderer.send('set-shelf-height', 6);
          }
        }, 400);
      }
    }, 150);
  };

  useEffect(() => {
    if (config.mode !== 'bar') return;
    if (!ipcRenderer) return;
    if (isIntroActiveRef.current) return; // Skip automatic hiding logic during the switch intro

    if (isNotification) {
      setShelfVisible(true);
      const isSide = config.screenPosition === 'left' || config.screenPosition === 'right';
      ipcRenderer.send('set-shelf-height', isSide ? 160 : 64);
      ipcRenderer.send('set-ignore-mouse-events', false);
    } else {
      if (!isMouseOverShelfRef.current) {
        setShelfVisible(false);
        setShelfSettingsOpen(false);
        shelfSettingsOpenRef.current = false;
        ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
        setTimeout(() => {
          if (!shelfVisibleRef.current) {
            ipcRenderer.send('set-shelf-height', 6);
          }
        }, 400);
      }
    }
  }, [isNotification, config.mode, config.screenPosition]);

  const dismissCooldownRef = useRef(false);

  const handleMouseEnter = () => {
    if (dismissCooldownRef.current) return; // Don't re-expand during cooldown
    if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', false);
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    const isInputFocused = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
    if (isInputFocused) return;
    setIsExpanded(false);
    if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
  };

  const handleDismissNotch = () => {
    dismissCooldownRef.current = true;
    setIsExpanded(false);
    if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
    // Allow re-expansion after a short cooldown
    setTimeout(() => { dismissCooldownRef.current = false; }, 500);
  };

  // Collapse notch/bar when user clicks or moves outside the window
  useEffect(() => {
    if (!ipcRenderer) return;
    const handleBlur = () => {
      if (config.mode === 'notch') {
        handleDismissNotch();
      } else if (config.mode === 'bar') {
        handleShelfMouseLeave();
      }
    };
    const handleForceCollapse = () => {
      if (config.mode === 'bar') {
        handleShelfMouseLeave();
      }
    };
    ipcRenderer.on('window-blur', handleBlur);
    ipcRenderer.on('force-collapse-shelf', handleForceCollapse);
    return () => {
      ipcRenderer.removeAllListeners('window-blur');
      ipcRenderer.removeAllListeners('force-collapse-shelf');
    };
  }, [config.mode]);

  const formatDate = useCallback(() => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  }, []);

  const formatSpeed = useCallback((bytes) => {
    if (bytes < 1024) return `${bytes} B/s`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
  }, []);

  // Returns 'black' or 'white' depending on luminance of a hex color
  const getContrastColor = (hex) => {
    try {
      const r = parseInt(hex.slice(1,3), 16);
      const g = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? 'black' : 'white';
    } catch { return 'white'; }
  };

  const idleBg = (!isExpanded && !isNotification) ? (config.idleColor || config.bgColor) : config.bgColor;
  const idleTextColor = getContrastColor(idleBg);
  const idleTextClass = idleTextColor === 'black' ? 'text-black' : 'text-white';
  const idleSubTextClass = idleTextColor === 'black' ? 'text-black/60' : 'text-white/70';

  // ── Shelf Mode Render ──
  const isSidePosition = config.screenPosition === 'left' || config.screenPosition === 'right';

  const handleTogglePlay = useCallback(() => {
    const nextState = !spotifyState?.is_playing;
    setSpotifyState(prev => prev ? {...prev, is_playing: nextState} : prev);
    if (ipcRenderer) ipcRenderer.send(nextState ? 'spotify-play' : 'spotify-pause');
  }, [spotifyState?.is_playing]);

  const handlePrev = useCallback(() => ipcRenderer?.send('spotify-prev'), []);
  const handleSkip = useCallback(() => ipcRenderer?.send('spotify-skip'), []);
  const handleOpenMediaApp = useCallback((appId) => { if (ipcRenderer) ipcRenderer.send('open-media-app', appId); }, []);
  const handleOpenWeather = useCallback(() => { if (ipcRenderer) ipcRenderer.send('open-weather'); }, []);
  const handleQuit = useCallback(() => ipcRenderer?.send('quit-app'), []);
  const handleShowSettings = useCallback(() => {
    setShelfSettingsOpen(prev => {
      const nextState = !prev;
      shelfSettingsOpenRef.current = nextState;
      if (ipcRenderer) {
        const isSideLocal = config.screenPosition === 'left' || config.screenPosition === 'right';
        ipcRenderer.send('set-shelf-height', nextState ? (isSideLocal ? 516 : 420) : (isSideLocal ? 160 : 64));
      }
      return nextState;
    });
  }, [config.screenPosition]);

  const handleBoost = useCallback(async () => {
    if (isBoosting) return;
    setIsBoosting(true);
    setBoostProgress(null);
    
    const onProgress = (e, data) => setBoostProgress(data);
    if (ipcRenderer) ipcRenderer.on('boost-progress', onProgress);

    try {
      const res = await ipcRenderer.invoke('boost-system');
      setBoostAlert({ freedMB: res.freedMB, freedCPU: res.freedCPU, killed: res.killed });
      setTimeout(() => setBoostAlert(null), 5000);
    } finally {
      if (ipcRenderer) ipcRenderer.removeAllListeners('boost-progress');
      setIsBoosting(false);
    }
  }, [isBoosting]);

  if (config.mode === 'bar') {
    return (
      <div 
        className="w-full h-full fixed top-0 left-0" 
        style={{ pointerEvents: 'none' }}
      >
        {/* Invisible trigger zone at screen edge */}
        <div 
          className={`fixed z-[100] ${isSidePosition 
            ? (config.screenPosition === 'left' ? 'top-0 left-0 bottom-0 w-[6px]' : 'top-0 right-0 bottom-0 w-[6px]')
            : 'top-0 left-0 right-0 h-[6px]'
          }`}
          style={{ pointerEvents: shelfVisible ? 'none' : 'auto', backgroundColor: 'rgba(255, 255, 255, 0.01)' }}
          onMouseEnter={handleShelfMouseEnter}
        />
        
        {/* Bar wrapper with mouse leave detection */}
        <div
          className="w-full h-full absolute inset-0"
          onMouseEnter={handleShelfMouseEnter}
          onMouseLeave={handleShelfMouseLeave}
          style={{ pointerEvents: shelfVisible ? 'auto' : 'none' }}
        >
          <AnimatePresence>
            {shelfVisible && (
              <ShelfBar
                isVisible={shelfVisible}
                time={time}
                formatDate={formatDate}
                weather={weather}
                spotifyState={spotifyState}
                isSpotify={isSpotify}
                localProgress={localProgress}
                hardware={hardware}
                network={network}
                battery={battery}
                privacy={privacy}
                config={config}
                getCurrentLyric={getCurrentLyric}
                formatSpeed={formatSpeed}
                pomodoro={pomodoro}
                isPomoRunning={isPomoRunning}
                pomoMode={pomoMode}
                isSwRunning={isSwRunning}
                stopwatch={stopwatch}
                onTogglePlay={handleTogglePlay}
                onPrev={handlePrev}
                onSkip={handleSkip}
                onOpenMediaApp={handleOpenMediaApp}
                onOpenWeather={handleOpenWeather}
                onQuit={handleQuit}
                onShowSettings={handleShowSettings}
                onBoost={handleBoost}
                isBoosting={isBoosting}
                batteryEvent={batteryEvent}
                boostAlert={boostAlert}
                boostProgress={boostProgress}
                greeting={greeting}
                activeCall={activeCall}
                sysNotification={sysNotification}
                setSysNotification={setSysNotification}
                updateAvailable={updateAvailable}
                whatsNewAvailable={whatsNewAvailable}
                onSeek={handleProgressBarClick}
                onPointerDown={handleCustomDragStart}
                onPointerMove={handleCustomDragMove}
                onPointerUp={handleCustomDragEnd}
                onPointerCancel={handleCustomDragCancel}
              />
            )}
          </AnimatePresence>

          {/* Bar Settings Panel */}
          <AnimatePresence>
            {shelfSettingsOpen && (() => {
              const isSide = config.screenPosition === 'left' || config.screenPosition === 'right';
              const isLeft = config.screenPosition === 'left';
              return (
                <motion.div
                  initial={isSide ? { x: isLeft ? -20 : 20, opacity: 0, width: 0 } : { y: -20, opacity: 0, height: 0 }}
                  animate={isSide ? { x: 0, opacity: 1, width: 356 } : { y: 0, opacity: 1, height: 'auto' }}
                  exit={isSide ? { x: isLeft ? -20 : 20, opacity: 0, width: 0 } : { y: -20, opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className={`fixed z-40 backdrop-blur-xl overflow-hidden ${
                    isSide 
                      ? `top-0 bottom-0 ${isLeft ? 'left-[160px] border-r' : 'right-[160px] border-l'} border-white/10` 
                      : 'top-[64px] left-0 right-0 border-b border-white/10'
                  }`}
                  style={{ 
                    backgroundColor: `${config.bgColor}ee`,
                    pointerEvents: 'auto'
                  }}
                >
                  <div className={`${isSide ? 'w-[356px] h-full overflow-y-auto px-5 py-6 flex flex-col gap-8' : 'max-w-[1200px] mx-auto px-6 py-5 grid grid-cols-4 gap-6'} relative`}>
                    <button 
                      className={`absolute ${isSide ? 'top-4 right-4' : 'top-2 right-2'} w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-colors z-50`}
                      onClick={() => {
                        setShelfSettingsOpen(false);
                        shelfSettingsOpenRef.current = false;
                        if (ipcRenderer) {
                          const isSideLocal = config.screenPosition === 'left' || config.screenPosition === 'right';
                          ipcRenderer.send('set-shelf-height', isSideLocal ? 160 : 64);
                        }
                      }}
                    >
                      <X size={14} />
                    </button>

                    {/* Update Available notification */}
                    {updateAvailable && (
                      <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col gap-1.5 text-left mb-4 cursor-pointer hover:bg-red-500/15 transition-colors select-none" style={{ gridColumn: isSide ? 'auto' : 'span 4' }} onClick={() => setShowReleaseNotes(!showReleaseNotes)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
                            <span className="text-xs font-bold text-red-300">Update Available! (v{latestVersion})</span>
                          </div>
                          <span className="text-[10px] text-white/50 underline">{showReleaseNotes ? 'Hide details' : 'View changelog'}</span>
                        </div>
                        {showReleaseNotes && (
                          <div className="text-[10px] text-white/70 flex flex-col gap-1 pl-3.5 border-l border-white/10 mt-1 select-none leading-relaxed">
                            {changelog && changelog.length > 0 ? (
                              changelog.map((point, index) => {
                                const colonIndex = point.indexOf(':');
                                if (colonIndex !== -1) {
                                  const title = point.substring(0, colonIndex);
                                  const desc = point.substring(colonIndex + 1);
                                  return (
                                    <div key={index}>• <b>{title}:</b>{desc}</div>
                                  );
                                }
                                return <div key={index}>• {point}</div>;
                              })
                            ) : (
                              <>
                                <div>• <b>Bar Mode:</b> Full layout support with interactive media & status integration.</div>
                                <div>• <b>Media Seek:</b> Click timeline to seek active media sessions directly on Windows.</div>
                                <div>• <b>App Badges:</b> Display playing source application icons (Spotify, Chrome, Edge).</div>
                                <div>• <b>Call Fixes:</b> Balanced alignment for caller UI details in collapsed Notch.</div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* What's New notification */}
                    {whatsNewAvailable && (
                      <div className="w-full bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 flex flex-col gap-1.5 text-left mb-4 select-none" style={{ gridColumn: isSide ? 'auto' : 'span 4' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                            <span className="text-xs font-bold text-cyan-300">What's New in v{CURRENT_VERSION}!</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              localStorage.setItem('lastSeenVersion', CURRENT_VERSION);
                              setWhatsNewAvailable(false);
                            }}
                            className="text-[10px] text-white/50 hover:text-white underline cursor-pointer"
                          >
                            Got it
                          </button>
                        </div>
                        <div className="text-[10px] text-white/70 flex flex-col gap-1 pl-3.5 border-l border-white/10 mt-1 leading-relaxed">
                          <div>• <b>Custom Backgrounds:</b> Paste high-quality GIF/image links from Pinterest or Giphy.</div>
                          <div>• <b>Link Resolution:</b> Short URLs (pin.it, gph.is) resolve automatically to direct media paths.</div>
                          <div>• <b>Video Support:</b> Native HTML5 video player renders video Pins (.mp4) inside the notch.</div>
                          <div>• <b>Input Lock Fix:</b> Fixed notch shifting coordinates when text inputs are focused.</div>
                        </div>
                      </div>
                    )}

                    {/* Column 1: Mode + Behavior */}
                  <div className="flex flex-col gap-4">
                    <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">Behavior</span>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-white/70">Mode</span>
                      <div className="flex bg-white/10 rounded-lg p-1 w-full gap-1">
                        <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.mode === 'notch' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, mode: 'notch'})}>Notch</button>
                        <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.mode === 'bar' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, mode: 'bar'})}>Bar</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white/70">Lock Position</span>
                      <button className={`w-10 h-6 rounded-full p-1 transition-colors ${config.lockDrag ? 'bg-green-500' : 'bg-white/20'}`} onClick={() => setConfig({...config, lockDrag: !config.lockDrag})}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.lockDrag ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white/70">Show Weather</span>
                      <button className={`w-10 h-6 rounded-full p-1 transition-colors ${config.showWeather !== false ? 'bg-green-500' : 'bg-white/20'}`} onClick={() => setConfig({...config, showWeather: config.showWeather === false ? true : false})}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.showWeather !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white/70">Show Hardware Stats</span>
                      <button className={`w-10 h-6 rounded-full p-1 transition-colors ${config.showHardware !== false ? 'bg-green-500' : 'bg-white/20'}`} onClick={() => setConfig({...config, showHardware: config.showHardware === false ? true : false})}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.showHardware !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 mt-1">
                      <span className="text-xs font-semibold text-white/70">Clock Format</span>
                      <div className="flex bg-white/10 rounded-lg p-1 w-full gap-1">
                        <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.clockFormat === '12h' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, clockFormat: '12h'})}>12h</button>
                        <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.clockFormat === '24h' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, clockFormat: '24h'})}>24h</button>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Background Animation */}
                  <div className="flex flex-col gap-4">
                    <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">Background</span>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-white/70">Animation</span>
                      <div className="flex flex-wrap bg-white/10 rounded-lg p-1 w-full gap-1">
                        {[['off','Off'],['liquid','Liquid'],['cosmic','Orbits'],['aurora','Aurora'],['matrix','Matrix'],['hyperspace','Starfield'],['rain','Rain']].map(([val,label]) => (
                          <button key={val} className={`flex-1 min-w-[30%] py-1.5 text-[10px] font-bold rounded-md transition-colors ${config.bgAnimation === val ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, bgAnimation: val})}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-white/70">Island Color</span>
                      <div className="flex items-center gap-2 flex-wrap bg-white/10 rounded-lg p-2 w-full">
                        {['#000000','#111111','#1a1a2e','#06b6d4','#3b82f6','#a855f7','#ec4899','#ffffff'].map(color => (
                          <button key={color} onClick={() => setConfig({...config, bgColor: color})} className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${config.bgColor === color ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Accent & Glow */}
                  <div className="flex flex-col gap-4">
                    <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">Style</span>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-white/70">Accent Color</span>
                      <div className="flex items-center gap-2 flex-wrap bg-white/10 rounded-lg p-2 w-full">
                        {['#ff0000','#ff6600','#ffcc00','#00cc44','#06b6d4','#3b82f6','#a855f7','#ec4899','#ffffff'].map(color => (
                          <button key={color} onClick={() => setConfig({...config, accentColor: color})} className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${config.accentColor === color ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                        ))}
                        <button title="RGB" onClick={() => setConfig({...config, accentColor: 'rgb'})} className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 rgb-bg ${config.accentColor === 'rgb' ? 'border-white scale-110' : 'border-transparent'}`} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-white/70">Glow Intensity</span>
                      <div className="flex bg-white/10 rounded-lg p-1 w-full gap-1">
                        {[['none','Off'],['low','Low'],['medium','Med'],['high','High']].map(([val,label]) => (
                          <button key={val} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${config.glowIntensity === val ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, glowIntensity: val})}>{label}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Column 4: Pomodoro & Task Checklist (For Bar Mode settings) */}
                  <div className="flex flex-col gap-4 text-left overflow-hidden h-[300px]">
                    <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">Productivity</span>
                    
                    {/* Timer control row */}
                    <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white/50">{pomoMode === 'work' ? 'Work Session' : 'Break Session'}</span>
                        <span className="text-base font-mono font-black text-white mt-0.5">
                          {String(Math.floor(pomodoro / 60)).padStart(2, '0')}:{String(pomodoro % 60).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/70" onClick={resetPomo}>
                          <RotateCcw size={10} />
                        </button>
                        <button className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors text-white shadow ${pomoMode === 'work' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`} onClick={togglePomo}>
                          {isPomoRunning ? <Pause size={12} /> : <Play size={12} className="translate-x-[0.5px]" />}
                        </button>
                      </div>
                    </div>

                    {/* Task Checklist */}
                    <div className="flex flex-col gap-2 overflow-hidden flex-grow">
                      <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase font-bold pl-1">Tasks</span>
                      
                      <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-1.5 max-h-[140px] pr-1">
                        <AnimatePresence initial={false}>
                          {pomoTasks.map(task => (
                            <motion.div 
                              key={task.id} 
                              className="flex items-center justify-between bg-white/5 p-1.5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                            >
                              <div className="flex items-center gap-2 overflow-hidden flex-grow cursor-pointer" onClick={() => handleToggleTask(task.id)}>
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-white/30 bg-transparent'}`}>
                                  {task.completed && <span className="text-[8px] font-black">✓</span>}
                                </div>
                                <span className={`text-[10px] truncate leading-none ${task.completed ? 'line-through text-white/30' : 'text-white/80'}`}>{task.text}</span>
                              </div>
                              <button className="text-white/30 hover:text-red-400 p-0.5 transition-colors flex-shrink-0" onClick={() => handleDeleteTask(task.id)}>
                                <Trash2 size={10} />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {pomoTasks.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-white/20 py-4">
                            <span className="text-[10px] font-bold">No tasks</span>
                          </div>
                        )}
                      </div>

                      {/* Add Task input */}
                      <div className="flex items-center gap-1.5 mt-auto pt-1 bg-inherit">
                        <input 
                          type="text" 
                          value={taskInput}
                          onChange={e => setTaskInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
                          onBlur={handleInputBlur}
                          placeholder="Add task..."
                          className="flex-grow bg-white/5 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
                        />
                        <button className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors" onClick={handleAddTask}>
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex overflow-hidden fixed top-0 left-0 ${
      config.screenPosition === 'left' ? 'justify-start items-center' :
      config.screenPosition === 'right' ? 'justify-end items-center' :
      config.screenPosition === 'top-left' ? 'justify-start items-start' :
      config.screenPosition === 'top-right' ? 'justify-end items-start' :
      'justify-center items-start'
    }`} style={{ pointerEvents: isExpanded ? 'auto' : 'none' }}
       onClick={() => { if (isExpanded) handleDismissNotch(); }}
    >
      {(() => {
        const isSideNotch = config.screenPosition === 'left' || config.screenPosition === 'right';
        const getNotchWidth = () => {
          if (isDragging) return 140;
          if (isNotification) return 360;
          if (isExpanded) {
            return isSideNotch ? (viewMode === 'settings' ? 400 : 260) : 450;
          }
          if (isSideNotch) {
            return isDeepIdle ? 26 : 36;
          }
          if (greeting) return 240;
          
          let baseWidth = 160;
          if (isPomoRunning || isSwRunning) {
            baseWidth = 190;
          } else if (config.clockFormat === '12h') {
            baseWidth = 180;
          }
          
          if (privacy.cam && privacy.mic) {
            return baseWidth + 40;
          }
          if (privacy.cam || privacy.mic) {
            return baseWidth + 20;
          }
          return baseWidth;
        };
        return (
          <motion.div
        onClick={(e) => e.stopPropagation()}
        onContextMenu={() => { if(ipcRenderer) ipcRenderer.send('show-context-menu'); }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={{ 
          borderBottomLeftRadius: config.screenPosition === 'left' ? 0 : 100, 
          borderBottomRightRadius: config.screenPosition === 'right' ? 0 : 100, 
          borderTopLeftRadius: (config.screenPosition === 'left' || config.screenPosition?.startsWith('top')) ? 0 : 100, 
          borderTopRightRadius: (config.screenPosition === 'right' || config.screenPosition?.startsWith('top')) ? 0 : 100
        }}
        animate={{
          width: getNotchWidth(),
          height: isDragging
            ? 64
            : (isNotification 
               ? 80 
               : (isExpanded ? (isSideNotch && viewMode !== 'settings' ? 400 : (viewMode === 'settings' ? 320 : (viewMode === 'network' ? 260 : (viewMode === 'stats' ? 240 : (viewMode === 'pomodoro' ? 360 : (['volume', 'brightness'].includes(viewMode) ? 140 : 220)))))) : (isSideNotch ? (greeting ? 260 : (privacy.cam && privacy.mic ? 220 : (privacy.cam || privacy.mic ? 200 : 180))) : (isDeepIdle ? 26 : 36)))),
          opacity: 1,
          borderBottomLeftRadius: config.screenPosition === 'left' ? 0 : (isDragging ? 16 : ((isExpanded || isNotification) ? getRadius('expanded') : getRadius('collapsed'))),
          borderBottomRightRadius: config.screenPosition === 'right' ? 0 : (isDragging ? 16 : ((isExpanded || isNotification) ? getRadius('expanded') : getRadius('collapsed'))),
          borderTopLeftRadius: (config.screenPosition === 'left' || config.screenPosition?.startsWith('top')) ? (isDragging ? 16 : 0) : (isDragging ? 16 : ((isExpanded || isNotification) ? getRadius('expanded') : getRadius('collapsed'))),
          borderTopRightRadius: (config.screenPosition === 'right' || config.screenPosition?.startsWith('top') || !config.screenPosition) ? (isDragging ? 16 : 0) : (isDragging ? 16 : ((isExpanded || isNotification) ? getRadius('expanded') : getRadius('collapsed'))),
          marginTop: config.screenPosition === 'left' || config.screenPosition === 'right' ? 0 : -1,
          marginLeft: config.screenPosition === 'left' ? -1 : (config.screenPosition === 'right' ? 1 : 0),
          backgroundColor: isDragging ? 'rgba(0,0,0,0)' : ((!isExpanded && !isNotification) ? (config.idleColor || config.bgColor) : config.bgColor)
        }}
        style={{ pointerEvents: 'auto', willChange: 'width, height, border-radius',
          originY: (config.screenPosition === 'left' || config.screenPosition === 'right') ? 0.5 : 0,
          originX: config.screenPosition === 'left' ? 0 : (config.screenPosition === 'right' ? 1 : 0.5),
          ...getNotchGlowStyle()
        }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 32, 
          mass: 0.4, 
          restDelta: 0.001,
          width: isDragging ? { duration: 0 } : undefined,
          height: isDragging ? { duration: 0 } : undefined,
          borderBottomLeftRadius: isDragging ? { duration: 0 } : undefined,
          borderBottomRightRadius: isDragging ? { duration: 0 } : undefined,
          borderTopLeftRadius: isDragging ? { duration: 0 } : undefined,
          borderTopRightRadius: isDragging ? { duration: 0 } : undefined
        }}
        className={`relative z-10 text-white flex flex-col transition-shadow duration-500 ${getGlowStyle()} group`}
        onPointerDown={handleCustomDragStart}
        onPointerMove={handleCustomDragMove}
        onPointerUp={handleCustomDragEnd}
        onPointerCancel={handleCustomDragCancel}
      >
        {/* Corner ears — only for top positions, hidden during drag */}
        {!isDragging && (!config.screenPosition || config.screenPosition.startsWith('top')) && (
          <>
            <div className="absolute top-0 -left-[12px] w-[12px] h-[12px] pointer-events-none transition-colors duration-500" style={{ backgroundImage: `radial-gradient(circle at 0% 100%, transparent 12px, ${(!isExpanded && !isNotification) ? (config.idleColor || config.bgColor) : config.bgColor} 12px)` }}></div>
            <div className="absolute top-0 -right-[12px] w-[12px] h-[12px] pointer-events-none transition-colors duration-500" style={{ backgroundImage: `radial-gradient(circle at 100% 100%, transparent 12px, ${(!isExpanded && !isNotification) ? (config.idleColor || config.bgColor) : config.bgColor} 12px)` }}></div>
          </>
        )}

        {/* Drag pill indicator — small rounded pill shown during drag */}
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div 
              layout
              className="rounded-2xl flex flex-col items-center justify-center gap-1.5 p-3"
              style={{ 
                width: 140, 
                height: 64, 
                backgroundColor: 'rgba(10, 10, 12, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: `0 12px 40px rgba(0,0,0,0.7), 0 0 20px ${accentHex}22`
              }}
            >
              <motion.div layout className="flex items-center gap-1">
                <GripHorizontal size={12} className="text-white/30 animate-pulse" />
                <span className="text-[8px] font-mono tracking-widest text-white/40 uppercase font-bold">DRAGGING</span>
              </motion.div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={snapDirection}
                  initial={{ opacity: 0, y: 5, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.9 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="flex items-center gap-1.5 text-white/90"
                >
                  {snapDirection === 'left' && (
                    <>
                      <motion.div animate={{ x: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                        <ArrowLeft size={12} className="text-cyan-400" />
                      </motion.div>
                      <span className="text-[9px] font-mono tracking-widest uppercase font-semibold">LEFT DOCK</span>
                    </>
                  )}
                  {snapDirection === 'right' && (
                    <>
                      <span className="text-[9px] font-mono tracking-widest uppercase font-semibold">RIGHT DOCK</span>
                      <motion.div animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                        <ArrowRight size={12} className="text-cyan-400" />
                      </motion.div>
                    </>
                  )}
                  {snapDirection === 'top' && (
                    <>
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                        <ArrowUp size={12} className="text-cyan-400" />
                      </motion.div>
                      <span className="text-[9px] font-mono tracking-widest uppercase font-semibold">TOP DOCK</span>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        <div className="w-full h-full flex flex-col overflow-hidden relative z-10" style={{ borderRadius: 'inherit', opacity: isDragging ? 0 : 1, transition: isDragging ? 'none' : 'opacity 0.25s ease' }}>
          {config.customBgUrl && (
            <div 
              className="absolute inset-0 pointer-events-none z-0 overflow-hidden" 
              style={{ 
                opacity: 0.5,
                mixBlendMode: 'screen',
                borderRadius: 'inherit'
              }}
            >
              {config.customBgUrl.includes('.mp4') ? (
                <video 
                  src={config.customBgUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full"
                  style={{ 
                    backgroundImage: `url(${config.customBgUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }} 
                />
              )}
            </div>
          )}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[32px]"
              style={{ 
                mixBlendMode: 'screen'
              }}
            >
              <motion.div
                animate={{ y: (viewMode === 'media' && config.bgAnimation === 'liquid') ? 170 : 0 }}
                transition={{ duration: 2.0, ease: "easeInOut" }}
                className="absolute inset-0 pointer-events-none"
              >
                {config.bgAnimation === 'cosmic' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ mixBlendMode: 'normal' }}>
                    <div className={`absolute w-[180px] h-[180px] rounded-full bg-black shadow-[0_0_60px_rgba(255,255,255,0.1),inset_0_0_40px_rgba(255,255,255,0.1)] border border-white/10`} />
                    
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 25, repeat: Infinity, ease: "linear" }} 
                      className="absolute w-[260px] h-[260px] rounded-full border border-white/10"
                    >
                       <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${config.accentColor === 'cyan' ? 'bg-cyan-400 shadow-[0_0_15px_#06b6d4]' : (config.accentColor === 'purple' ? 'bg-purple-400 shadow-[0_0_15px_#a855f7]' : 'bg-green-400 shadow-[0_0_15px_#22c55e]')}`} />
                    </motion.div>
                    
                    <motion.div 
                      animate={{ rotate: -360 }} 
                      transition={{ duration: 35, repeat: Infinity, ease: "linear" }} 
                      className="absolute w-[360px] h-[360px] rounded-full border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)_inset]"
                    >
                       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full bg-white/50 shadow-[0_0_15px_#ffffff]" />
                    </motion.div>
                    
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 50, repeat: Infinity, ease: "linear" }} 
                      className="absolute w-[480px] h-[480px] rounded-full border border-white/5"
                    >
                       <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_#3b82f6]" />
                    </motion.div>
                  </div>
                )}
                {config.bgAnimation === 'liquid' && (
                  <>
                    <motion.div 
                      animate={{ 
                        x: viewMode === 'media' ? [20, 40, 10, 20] : [-50, -20, -40, -50],
                        y: [-10, -20, -5, -10],
                        scale: [1.0, 1.15, 1.0],
                        opacity: [0.3, 0.7, 0.3]
                      }}
                      transition={{
                        x: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                        y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                        scale: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
                        opacity: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="absolute top-0 left-[-50px] w-[350px] h-[100px] rounded-[100px] blur-[50px]"
                      style={{ background: spotifyState?.item?.album?.images?.[0]?.url 
                        ? `url(${spotifyState.item.album.images[0].url}) center/cover` 
                        : 'linear-gradient(135deg, #a855f7, #3b82f6, #06b6d4)' }}
                    />
                    <motion.div 
                      animate={{ 
                        x: viewMode === 'media' ? [-20, -40, -10, -20] : [50, 20, 40, 50],
                        y: [-15, -25, -10, -15],
                        scale: [1.0, 1.15, 1.0],
                        opacity: [0.2, 0.6, 0.2]
                      }}
                      transition={{
                        x: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
                        y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
                        scale: { duration: 0.5, delay: 0.2, repeat: Infinity, ease: "easeInOut" },
                        opacity: { duration: 0.5, delay: 0.2, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="absolute top-0 right-[-50px] w-[400px] h-[120px] rounded-[100px] blur-[55px]"
                      style={{ 
                        mixBlendMode: 'screen',
                        background: spotifyState?.item?.album?.images?.[0]?.url 
                          ? `url(${spotifyState.item.album.images[0].url}) center/cover` 
                          : 'linear-gradient(135deg, #06b6d4, #a855f7, #ec4899)'
                      }}
                    />
                    <motion.div 
                      animate={{ 
                        x: viewMode === 'media' ? [-40, -60, -20, -40] : [20, 40, 10, 20],
                        y: [0, -10, 5, 0],
                        scale: [1.0, 1.15, 1.0],
                        opacity: [0.3, 0.65, 0.3]
                      }}
                      transition={{
                        x: { duration: 6.5, repeat: Infinity, ease: "easeInOut" },
                        y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                        scale: { duration: 0.5, delay: 0.35, repeat: Infinity, ease: "easeInOut" },
                        opacity: { duration: 0.5, delay: 0.35, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="absolute top-0 right-0 w-[300px] h-[80px] rounded-[100px] blur-[60px]"
                      style={{ 
                        mixBlendMode: 'screen',
                        background: spotifyState?.item?.album?.images?.[0]?.url 
                          ? `url(${spotifyState.item.album.images[0].url}) center/cover` 
                          : 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                      }}
                    />
                  </>
                )}
                
                {config.bgAnimation === 'aurora' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80" style={{ mixBlendMode: 'screen' }}>
                    <motion.div animate={{ x: [-100, 100, -100], y: [0, 10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} className="absolute w-[400px] h-[100px] blur-[40px] rounded-[100%] bg-gradient-to-r from-teal-400/60 to-emerald-500/60" />
                    <motion.div animate={{ x: [100, -100, 100], y: [-10, 5, -10], scale: [1, 1.3, 1] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} className="absolute w-[500px] h-[80px] blur-[50px] rounded-[100%] bg-gradient-to-r from-purple-500/50 to-blue-500/50" />
                    <motion.div animate={{ x: [-50, 50, -50], y: [5, -5, 5] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} className="absolute w-[300px] h-[120px] blur-[30px] rounded-[100%] bg-gradient-to-r from-cyan-300/40 to-transparent" />
                  </div>
                )}

                {config.bgAnimation === 'rain' && <RainBackground accentColor={config.accentColor} />}

                {config.bgAnimation === 'matrix' && <MatrixBackground />}

                {config.bgAnimation === 'hyperspace' && <HyperspaceBackground isPlaying={spotifyState?.is_playing} />}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="popLayout">
          {(!isExpanded && !isNotification) ? (
            <motion.div
              key="collapsed"
              className={`w-full h-full flex ${isSideNotch ? 'flex-col items-center justify-between py-4' : 'items-center justify-between px-4'} z-10 ${idleTextClass} relative group`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <div className={`flex ${isSideNotch ? 'flex-col gap-3 mt-1 items-center justify-start h-[50px]' : 'items-center gap-2 w-[60px] justify-start'}`}>
                 <div className="relative w-[14px] h-[14px] flex items-center justify-center mt-[-2px]">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                       <circle cx="18" cy="18" r="16" fill="none" className={idleTextColor === 'black' ? 'stroke-black/10' : 'stroke-white/10'} strokeWidth="4" />
                       <circle cx="18" cy="18" r="16" fill="none" className={idleTextColor === 'black' ? 'stroke-black/40' : 'stroke-white/40'} strokeWidth="6" strokeDasharray="100" strokeDashoffset={100 - battery.level} strokeLinecap="round" />
                       <circle cx="18" cy="18" r="16" fill="none" className={battery.charging ? 'stroke-green-500' : (battery.level < 20 ? 'stroke-red-500' : (idleTextColor === 'black' ? 'stroke-black/80' : 'stroke-white/80'))} strokeWidth="4" strokeDasharray="100" strokeDashoffset={100 - battery.level} strokeLinecap="round" />
                    </svg>
                 </div>
                 <div className={`flex ${isSideNotch ? 'flex-col gap-1.5 items-center' : 'gap-1 mt-[-2px]'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${(network.rx > 1024*500 || network.tx > 1024*500) ? 'bg-purple-500 shadow-[0_0_5px_#a855f7]' : (idleTextColor === 'black' ? 'bg-black/10' : 'bg-white/10')}`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${hardware.cpu > 50 ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6]' : (idleTextColor === 'black' ? 'bg-black/10' : 'bg-white/10')}`} />
                 </div>
              </div>
              <div className={`flex items-center justify-center ${isSideNotch ? 'flex-shrink-0 py-2' : 'mx-2 flex-shrink-0'}`}>
                <AnimatePresence mode="wait">
                  {greeting ? (
                     <motion.span key="greeting" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: -2 }} exit={{ opacity: 0, y: -5 }} className={`font-bold text-[11px] ${isSideNotch ? 'tracking-normal' : 'tracking-widest'} ${idleTextColor === 'black' ? 'text-black' : getTextGlowStyle(true)}`} style={{ writingMode: isSideNotch ? 'vertical-rl' : 'horizontal-tb', textOrientation: isSideNotch ? 'upright' : 'mixed', ...(idleTextColor === 'black' ? {} : getTextShadowStyle(true)) }}>
                       {greeting}
                     </motion.span>
                  ) : isPomoRunning ? (
                     <motion.span key="pomotimer" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: -2 }} exit={{ opacity: 0, y: -5 }} className={`font-mono font-bold text-[11px] ${isSideNotch ? 'tracking-normal' : 'tracking-widest'} ${config.glowIntensity !== 'none' ? 'text-orange-300' : 'text-orange-400'}`} style={{ ...(isSideNotch ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.1 } : {}), ...(config.glowIntensity !== 'none' ? { textShadow: '0 0 8px rgba(253,186,116,0.8)' } : {}) }}>
                        {isSideNotch ? (
                          <>
                            <span className="text-[12px] font-black">{String(Math.floor(pomodoro / 60)).padStart(2, '0')}</span>
                            <span className="text-[12px] font-black text-orange-400/80">{String(pomodoro % 60).padStart(2, '0')}</span>
                          </>
                        ) : (
                          `${String(Math.floor(pomodoro / 60)).padStart(2, '0')}:${String(pomodoro % 60).padStart(2, '0')}`
                        )}
                      </motion.span>
                  ) : isSwRunning ? (
                     <motion.span key="swtimer" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: -2 }} exit={{ opacity: 0, y: -5 }} className={`font-mono font-bold text-[11px] ${isSideNotch ? 'tracking-normal' : 'tracking-widest'} ${config.glowIntensity !== 'none' ? 'text-yellow-300' : 'text-yellow-400'}`} style={{ ...(isSideNotch ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.1 } : {}), ...(config.glowIntensity !== 'none' ? { textShadow: '0 0 8px rgba(253,224,71,0.8)' } : {}) }}>
                        {isSideNotch ? (
                          <>
                            <span className="text-[12px] font-black">{String(Math.floor((stopwatch % 3600) / 60)).padStart(2, '0')}</span>
                            <span className="text-[12px] font-black text-yellow-400/80">{String(stopwatch % 60).padStart(2, '0')}</span>
                          </>
                        ) : (
                          `${String(Math.floor((stopwatch % 3600) / 60)).padStart(2, '0')}:${String(stopwatch % 60).padStart(2, '0')}`
                        )}
                      </motion.span>
                  ) : (
                     <motion.span key="time" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: -2 }} exit={{ opacity: 0, y: -5 }} className={`font-bold text-xs ${isSideNotch ? 'tracking-normal text-center' : 'tracking-widest'} ${idleTextColor === 'black' ? 'text-black' : getTextGlowStyle(false)}`} style={{ ...(isSideNotch ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.1 } : {}), ...(idleTextColor === 'black' ? {} : getTextShadowStyle(false)) }}>
                        {isSideNotch ? (
                          <>
                            <span className="text-[12px] font-extrabold">{time.split(':')[0] || '12'}</span>
                            <span className={`text-[12px] font-extrabold ${idleTextColor === 'black' ? 'text-black/80' : 'text-white/80'}`}>{time.split(':')[1] ? time.split(':')[1].replace(/[^0-9]/g, '') : '00'}</span>
                          </>
                        ) : (
                          time
                        )}
                      </motion.span>
                  )}
                </AnimatePresence>
              </div>
              
              <div className={`flex items-center ${isSideNotch ? 'flex-col gap-3 w-full mb-1 justify-end h-[50px]' : 'justify-end gap-1.5 w-[60px]'}`}>
                 {spotifyState?.item ? (
                    <div className={isSideNotch ? 'h-[14px] mt-[-2px] overflow-hidden' : 'h-[10px] mt-[-3px] overflow-hidden'}>
                       <AudioWaveform 
                         isPlaying={spotifyState?.is_playing} 
                         color={isSpotify ? '#22c55e' : '#60a5fa'} 
                         width={isSideNotch ? 12 : 24} 
                         height={isSideNotch ? 14 : 10} 
                       />
                    </div>
                 ) : (
                    <div className={isSideNotch ? 'h-[14px]' : 'w-[10px]'} />
                 )}
                 {(privacy.mic || privacy.cam || activeCall?.isActive) && (
                    <div className={`flex items-center ${isSideNotch ? 'flex-col gap-1.5' : 'gap-1.5 mt-[-3px]'}`}>
                      {activeCall?.isActive && (
                        <motion.div
                          animate={{ scale: [1, 1.25, 1], opacity: [0.75, 1, 0.75] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className="text-green-400 drop-shadow-[0_0_5px_#22c55e]"
                          title={activeCall.title || `${activeCall.appName} Call`}
                        >
                          <Phone size={9} fill="currentColor" />
                        </motion.div>
                      )}
                      {privacy.mic && <div className={`w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)] ring-1 ${idleTextColor === 'black' ? 'ring-black/50' : 'ring-white/40'}`} />}
                      {privacy.cam && <div className={`w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)] ring-1 ${idleTextColor === 'black' ? 'ring-black/50' : 'ring-white/40'}`} />}
                    </div>
                 )}
              </div>
            </motion.div>
          ) : clipboardUrl ? (
            <motion.div
              key="clipboard-state"
              className="w-full h-full p-4 flex flex-col justify-center gap-3 z-10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <LinkIcon size={20} className="text-blue-400" />
                </div>
                <div className="flex flex-col flex-grow overflow-hidden">
                  <span className="font-bold text-sm">Link Copied!</span>
                  <span className="text-xs text-white/60 truncate">{clipboardUrl}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <button 
                  className="flex-grow bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  onClick={() => {
                    if (ipcRenderer) ipcRenderer.send('open-url', clipboardUrl);
                    setClipboardUrl(null);
                  }}
                >
                  <ExternalLink size={16} /> Open in Browser
                </button>
                <button 
                  className="w-8 flex-shrink-0 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                  onClick={() => setClipboardUrl(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="expanded-state"
              className="w-full h-full p-2 flex flex-col justify-start z-10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {batteryEvent ? (
                <motion.div key="battery-state" className="w-full h-full p-4 flex items-center justify-between" initial={{opacity:0}} animate={{opacity:1}}>
                   <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-full ${batteryEvent.low ? 'bg-red-500/20 text-red-500' : (batteryEvent.charging ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')} flex items-center justify-center flex-shrink-0 animate-pulse`}>
                        {batteryEvent.charging ? <BatteryCharging size={24} /> : <Battery size={24} />}
                     </div>
                     <div className="flex flex-col">
                        <span className="font-bold text-lg">{batteryEvent.low ? 'Battery Low' : (batteryEvent.charging ? 'Charging started' : 'Power Disconnected')}</span>
                        <span className="text-sm text-white/50">{batteryEvent.level}% remaining</span>
                     </div>
                  </div>
                </motion.div>
              ) : meetingAlert ? (
                <motion.div key="meeting-state" className="w-full h-full p-2 flex flex-col justify-center gap-1" initial={{opacity:0}} animate={{opacity:1}}>
                   <div className="flex items-center gap-3 px-2 mb-2">
                      <Calendar size={18} className="text-blue-400" />
                      <span className="font-bold text-sm">Meeting Starting Soon</span>
                   </div>
                   <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between border border-white/5 w-full">
                      <div className="flex flex-col max-w-[200px]">
                        <span className="text-sm font-semibold truncate">{meetingAlert.title}</span>
                        <span className="text-xs text-white/50">via {meetingAlert.platform}</span>
                      </div>
                      <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-lg" onClick={() => setMeetingAlert(null)}>
                        Join
                      </button>
                   </div>
                </motion.div>
              ) : isBoosting ? (
                <motion.div key="boosting-state" className="w-full h-full p-2 flex items-center justify-center gap-4" initial={{opacity:0}} animate={{opacity:1}}>
                   <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Rocket size={24} className="animate-ping" />
                   </div>
                   <div className="flex flex-col w-48">
                      <span className="font-bold text-lg text-white">Boosting System...</span>
                      <span className="text-sm text-cyan-300 truncate">
                        {boostProgress ? `Killed ${boostProgress.name} (-${boostProgress.mb}MB, -${boostProgress.cpu}% CPU)` : 'Scanning memory...'}
                      </span>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2 relative">
                         <motion.div 
                           className="absolute top-0 left-0 h-full bg-cyan-400 w-1/3 rounded-full" 
                           initial={{ x: "-100%" }} 
                           animate={{ x: "300%" }} 
                           transition={{ duration: 1, repeat: Infinity, ease: "linear" }} 
                         />
                      </div>
                   </div>
                </motion.div>
              ) : boostAlert ? (
                <motion.div key="boost-state" className="w-full h-full p-2 flex items-center justify-center gap-4" initial={{opacity:0}} animate={{opacity:1}}>
                   <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Rocket size={24} className="animate-bounce" />
                   </div>
                   <div className="flex flex-col">
                      <span className="font-bold text-lg text-white">System Boosted</span>
                      <span className="text-sm text-cyan-300">Freed {boostAlert.freedMB} MB RAM & {boostAlert.freedCPU}% CPU</span>
                   </div>
                </motion.div>
              ) : sysNotification ? (
                <motion.div key="sys-notification" className="w-full h-full p-3 flex flex-col justify-center gap-1.5 z-10" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                   <div className="flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase tracking-wider">
                       {sysNotification.appName ? sysNotification.appName.slice(0,2) : 'NT'}
                     </div>
                     <div className="flex flex-col overflow-hidden text-left flex-grow">
                       <div className="flex items-center gap-1.5 justify-between">
                         <span className="font-bold text-[10px] text-green-400 uppercase tracking-widest truncate max-w-[180px]">{sysNotification.appName || 'Notification'}</span>
                         <span className="text-[9px] text-white/40 flex-shrink-0">• Just Now</span>
                       </div>
                       <span className="font-bold text-xs text-white/90 truncate mt-0.5">{sysNotification.title || 'Alert'}</span>
                     </div>
                     <button className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors" onClick={() => setSysNotification(null)}>
                       <X size={12} />
                     </button>
                   </div>
                   <span className="text-[10px] text-white/60 line-clamp-2 pl-[38px] leading-relaxed text-left">{sysNotification.message}</span>
                </motion.div>
              ) : (
                <>
                  <div className="w-full p-2 flex flex-col justify-start z-20" style={{ WebkitAppRegion: 'no-drag' }}>
                    {isSideNotch && viewMode !== 'settings' ? (
                      <div className="flex flex-col gap-3 w-full">
                        {/* Top row: Weather and Quit */}
                        <div className="flex items-center justify-between w-full px-1.5 pt-1">
                          {config.showWeather !== false ? (
                            <div 
                              className="flex items-center gap-1.5 bg-white/10 py-1 px-2.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer" 
                              style={{ pointerEvents: 'auto', WebkitAppRegion: 'no-drag' }}
                              title="Weather"
                              onClick={(e) => { e.stopPropagation(); if (ipcRenderer) ipcRenderer.send('open-weather'); }}
                            >
                              <WeatherIcon desc={weather.desc} size={14} />
                              <span className="text-xs font-semibold">{weather.temp}</span>
                            </div>
                          ) : <div />}
                          
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1 mx-1">
                              {privacy.mic && <div className={`w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)] ring-1 ${idleTextColor === 'black' ? 'ring-black/50' : 'ring-white/40'}`} />}
                              {privacy.cam && <div className={`w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)] ring-1 ${idleTextColor === 'black' ? 'ring-black/50' : 'ring-white/40'}`} />}
                            </div>
                            <button 
                              title="Quit Dynamic Island"
                              className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                              style={{ pointerEvents: 'auto' }}
                              onClick={() => ipcRenderer.send('quit-app')}
                            >
                              <Power size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Middle row: Mode switcher buttons */}
                        <div className="flex items-center justify-center gap-1.5 w-full bg-white/5 py-1 px-2 rounded-xl border border-white/5" style={{ pointerEvents: 'auto', WebkitAppRegion: 'no-drag' }}>
                          <button title="Settings" className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'settings' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`} onClick={(e) => { e.stopPropagation(); setViewMode('settings'); }}>
                            <SettingsIcon size={13} />
                            {updateAvailable ? (
                              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
                            ) : whatsNewAvailable ? (
                              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                            ) : null}
                          </button>
                          {config.showPomodoro !== false && (
                            <button title="Pomodoro Timer" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'pomodoro' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`} onClick={(e) => { e.stopPropagation(); setViewMode('pomodoro'); }}>
                              <Coffee size={13} />
                            </button>
                          )}
                          {config.showStopwatch && (
                            <button title="Stopwatch" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'stopwatch' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`} onClick={(e) => { e.stopPropagation(); setViewMode('stopwatch'); }}>
                              <TimerIcon size={13} />
                            </button>
                          )}
                          {config.showHardware !== false && (
                            <>
                              <button title="Hardware Stats" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'stats' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`} onClick={(e) => { e.stopPropagation(); setViewMode('stats'); }}>
                                <Activity size={13} />
                              </button>
                              <button title="Network Stats" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'network' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`} onClick={(e) => { e.stopPropagation(); setViewMode('network'); }}>
                                <Signal size={13} />
                              </button>
                            </>
                          )}
                          <button title="Media Player" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'media' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`} onClick={() => setViewMode('media')}>
                            <Music size={13} />
                          </button>
                          <button 
                            title="Boost System" 
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isBoosting ? 'bg-cyan-500/50 text-white shadow-md' : 'text-cyan-400 hover:text-white hover:bg-cyan-500/80'} disabled:opacity-50`} 
                            onClick={(e) => { e.stopPropagation(); handleBoost(); }}
                            disabled={isBoosting}
                          >
                            <Rocket size={13} className={isBoosting ? "animate-pulse" : ""} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Original layout for top positions
                      <div className={`flex items-center justify-between w-full`}>
                        <div className="flex items-center gap-2">
                          {config.showWeather !== false && (
                            <div 
                              className="flex items-center gap-2 bg-white/10 py-1.5 px-3 rounded-full hover:bg-white/20 transition-colors cursor-pointer" 
                              style={{ pointerEvents: 'auto', WebkitAppRegion: 'no-drag' }}
                              title="Weather"
                              onClick={(e) => { e.stopPropagation(); if (ipcRenderer) ipcRenderer.send('open-weather'); }}
                            >
                              <WeatherIcon desc={weather.desc} size={16} />
                              <span className="text-sm font-medium">{weather.temp}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2" style={{ pointerEvents: 'auto', WebkitAppRegion: 'no-drag' }}>
                          <button title="Settings" className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'settings' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={(e) => { e.stopPropagation(); setViewMode('settings'); }}>
                            <SettingsIcon size={14} />
                            {updateAvailable ? (
                              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
                            ) : whatsNewAvailable ? (
                              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                            ) : null}
                          </button>
                          {config.showPomodoro !== false && (
                            <button title="Pomodoro Timer" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'pomodoro' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={(e) => { e.stopPropagation(); setViewMode('pomodoro'); }}>
                              <Coffee size={14} />
                            </button>
                          )}
                          {config.showStopwatch && (
                            <button title="Stopwatch" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'stopwatch' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={(e) => { e.stopPropagation(); setViewMode('stopwatch'); }}>
                              <TimerIcon size={14} />
                            </button>
                          )}
                          {config.showHardware !== false && (
                            <>
                              <button title="Hardware Stats" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'stats' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={(e) => { e.stopPropagation(); setViewMode('stats'); }}>
                                <Activity size={14} />
                              </button>
                              <button title="Network Stats" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'network' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={(e) => { e.stopPropagation(); setViewMode('network'); }}>
                                <Signal size={14} />
                              </button>
                            </>
                          )}
                          <button title="Media Player" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'media' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('media')}>
                            <Music size={14} />
                          </button>
                          <button 
                            title="Boost System" 
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isBoosting ? 'bg-cyan-500/50 text-white' : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white'} disabled:opacity-50`} 
                            onClick={(e) => { e.stopPropagation(); handleBoost(); }}
                            disabled={isBoosting}
                          >
                            <Rocket size={14} className={isBoosting ? "animate-pulse" : ""} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5 mx-1">
                            {privacy.mic && <div className={`w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)] ring-1 ${idleTextColor === 'black' ? 'ring-black/50' : 'ring-white/40'}`} />}
                            {privacy.cam && <div className={`w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)] ring-1 ${idleTextColor === 'black' ? 'ring-black/50' : 'ring-white/40'}`} />}
                          </div>
                          <button 
                            title="Quit Dynamic Island"
                            className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            style={{ pointerEvents: 'auto' }}
                            onClick={() => ipcRenderer.send('quit-app')}
                          >
                            <Power size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {viewMode === 'media' && spotifyState?.lyrics?.length > 0 && (
                      <motion.div 
                          key="lyrics-container"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={isSideNotch && viewMode !== 'settings'
                            ? "absolute left-0 right-0 top-[108px] h-[70px] flex flex-col justify-center items-center w-full px-4 z-10 pointer-events-none"
                            : "absolute left-0 right-0 top-10 bottom-[76px] flex flex-col justify-center items-center w-full px-5 z-10 pointer-events-none"
                          }
                      >
                         <AnimatePresence mode="wait">
                           <motion.div 
                              key={getCurrentLyric() || 'empty'}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="w-full text-center"
                           >
                              <span 
                                 className={`${isSideNotch && viewMode !== 'settings' ? 'text-[12px]' : 'text-[14px]'} font-semibold text-white/90 tracking-wide line-clamp-2 leading-snug inline-block`}
                                 style={{ textShadow: '0 2px 14px rgba(0,0,0,0.9)' }}
                              >
                                 {getCurrentLyric() || <span className="opacity-0">♪</span>}
                              </span>
                           </motion.div>
                         </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={`flex items-center mt-auto rounded-2xl relative ${viewMode === 'settings' ? 'overflow-hidden' : 'overflow-visible'} transition-all duration-300 ${getPanelBorderStyle()} ${isSideNotch && viewMode !== 'settings' ? 'flex-col justify-start' : 'justify-between'} ${viewMode === 'settings' ? 'p-4 h-full items-start flex-col overflow-y-auto custom-scrollbar pr-1' : (viewMode === 'network' ? (isSideNotch && viewMode !== 'settings' ? 'p-3 h-[125px]' : 'p-3 h-[160px]') : (viewMode === 'stats' ? (isSideNotch && viewMode !== 'settings' ? 'p-3 h-[180px]' : 'p-4 h-[120px]') : (viewMode === 'pomodoro' ? (isSideNotch && viewMode !== 'settings' ? 'p-3 h-[290px]' : 'p-4 h-[290px]') : (viewMode === 'media' ? (isSideNotch && viewMode !== 'settings' ? 'p-3 h-[210px]' : 'p-3 pb-2.5 h-[105px]') : (isSideNotch && viewMode !== 'settings' ? 'p-3 h-[145px]' : 'p-3 h-[76px]')))))}`} style={{ pointerEvents: 'auto', ...getPanelBorderStyleInline() }}>
                    <AnimatePresence mode="wait">
                      {viewMode === 'media' && (
                        <motion.div key="media" className={`w-full flex ${isSideNotch && viewMode !== 'settings' ? 'flex-col gap-2 justify-center text-center items-center h-full' : 'flex-col w-full h-full justify-between gap-1'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          {isSideNotch && viewMode !== 'settings' ? (
                            <div className="flex flex-col items-center gap-2.5 w-full">
                              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative group cursor-pointer" onClick={() => { if (ipcRenderer) ipcRenderer.send('open-media-app', spotifyState?.sourceAppId); }}>
                                {spotifyState?.item?.album?.images?.[0] ? (
                                  <img src={spotifyState.item.album.images[0].url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                  <Music size={32} className="text-white/80 animate-pulse" />
                                )}
                                {spotifyState?.sourceAppId && (
                                  <div className="absolute bottom-0 right-0 bg-black/75 rounded-tl-md p-0.5 flex items-center justify-center border-t border-l border-white/10 z-10">
                                    {renderSourceAppIcon(spotifyState.sourceAppId)}
                                  </div>
                                )}
                              </div>
                              <div 
                                className="flex flex-col items-center text-center cursor-pointer hover:opacity-80 transition-opacity w-full px-2"
                                onClick={() => { if (ipcRenderer) ipcRenderer.send('open-media-app', spotifyState?.sourceAppId); }}
                              >
                                <span className="font-extrabold text-xs text-white leading-tight truncate w-full hover:underline">
                                  {spotifyState?.item?.name || 'Not Playing'}
                                </span>
                                <span className="text-[10px] text-white/50 truncate w-full mt-0.5">
                                  {spotifyState?.item?.artists?.map(a => a.name).join(', ') || 'Spotify offline'}
                                </span>
                              </div>
                              
                              {spotifyState?.item && (
                                <div className="w-full flex flex-col gap-1 px-3">
                                  <div 
                                    className="w-full bg-white/10 rounded-full h-1.5 relative overflow-hidden cursor-pointer group/bar"
                                    onClick={handleProgressBarClick}
                                  >
                                    <div 
                                      className="bg-white rounded-full h-full transition-all duration-300 group-hover/bar:bg-green-400"
                                      style={{ width: `${Math.min(100, (localProgress / (spotifyState.duration_ms || 180000)) * 100)}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[8px] text-white/40 font-mono w-full">
                                    <span>{formatTime(localProgress)}</span>
                                    <span>{spotifyState.duration_ms ? formatTime(spotifyState.duration_ms) : '--:--'}</span>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-3 mt-1 justify-center">
                                <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/60 hover:text-white" onClick={() => ipcRenderer?.send('spotify-prev')}>
                                  <SkipBack size={14} />
                                </button>
                                <button className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all text-white shadow-md hover:scale-105" onClick={() => {
                                    const nextState = !spotifyState?.is_playing;
                                    setSpotifyState(prev => prev ? {...prev, is_playing: nextState} : prev);
                                    if (ipcRenderer) ipcRenderer.send(nextState ? 'spotify-play' : 'spotify-pause');
                                  }}>
                                  {spotifyState?.is_playing ? <Pause size={15} /> : <Play size={15} className="translate-x-[1px]" />}
                                </button>
                                <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/60 hover:text-white" onClick={() => ipcRenderer?.send('spotify-skip')}>
                                  <SkipForward size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between w-full">
                                <div className={`flex items-center gap-2.5 w-full`}>
                                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg relative flex-shrink-0">
                                    {spotifyState?.item?.album?.images?.[0] ? (
                                      <img src={spotifyState.item.album.images[0].url} className="w-full h-full object-cover" />
                                    ) : (
                                      <Music size={24} className="text-white/90" />
                                    )}
                                    {spotifyState?.sourceAppId && (
                                      <div className="absolute bottom-0 right-0 bg-black/75 rounded-tl-md p-0.5 flex items-center justify-center border-t border-l border-white/10 z-10">
                                        {renderSourceAppIcon(spotifyState.sourceAppId)}
                                      </div>
                                    )}
                                  </div>
                                  <div 
                                    className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity max-w-[130px]"
                                    onClick={() => { if (ipcRenderer) ipcRenderer.send('open-media-app', spotifyState?.sourceAppId); }}
                                  >
                                    <span className="font-bold text-sm leading-tight truncate hover:underline">
                                      {spotifyState?.item?.name || 'Not Playing'}
                                    </span>
                                    <span className="text-[10px] text-white/50 truncate">
                                      {spotifyState?.item?.artists?.map(a => a.name).join(', ') || 'Spotify offline'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-white" onClick={() => ipcRenderer?.send('spotify-prev')}>
                                    <SkipBack size={14} />
                                  </button>
                                  <button className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shadow-sm" onClick={() => {
                                      const nextState = !spotifyState?.is_playing;
                                      setSpotifyState(prev => prev ? {...prev, is_playing: nextState} : prev);
                                      if (ipcRenderer) ipcRenderer.send(nextState ? 'spotify-play' : 'spotify-pause');
                                    }}>
                                    {spotifyState?.is_playing ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
                                  </button>
                                  <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-white" onClick={() => ipcRenderer?.send('spotify-skip')}>
                                    <SkipForward size={14} />
                                  </button>
                                </div>
                              </div>
                              {spotifyState?.item && (
                                <div className="w-full flex flex-col gap-1 mt-1 px-0.5">
                                  <div 
                                    className="w-full bg-white/10 rounded-full h-1.5 relative overflow-hidden cursor-pointer group/bar"
                                    onClick={handleProgressBarClick}
                                  >
                                    <div 
                                      className="bg-white rounded-full h-full transition-all duration-300 group-hover/bar:bg-green-400"
                                      style={{ width: `${Math.min(100, (localProgress / (spotifyState.duration_ms || 180000)) * 100)}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[9px] text-white/40 font-mono w-full">
                                    <span>{formatTime(localProgress)}</span>
                                    <span>{spotifyState.duration_ms ? formatTime(spotifyState.duration_ms) : '--:--'}</span>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </motion.div>
                      )}

                      {viewMode === 'stats' && (
                        <motion.div key="stats" className={`w-full flex ${isSideNotch && viewMode !== 'settings' ? 'flex-col justify-center' : 'items-center justify-between'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                           <div className="w-full flex flex-col gap-3">
                              <div className="flex flex-col">
                                 <div className="flex items-center justify-between text-[10px] font-black tracking-widest mb-1.5 px-0.5 text-white/40 uppercase">
                                   <span className="flex items-center gap-2"><Activity size={12} className="text-green-400" /> CPU USAGE</span>
                                   <span className="text-white font-bold">{hardware.cpu}%</span>
                                 </div>
                                 <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                   <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${hardware.cpu}%` }}
                                     className="h-full bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                                   />
                                 </div>
                              </div>
                              <div className="flex flex-col">
                                 <div className="flex items-center justify-between text-[10px] font-black tracking-widest mb-1.5 px-0.5 text-white/40 uppercase">
                                   <span className="flex items-center gap-2"><Activity size={12} className="text-blue-400" /> RAM USAGE</span>
                                   <span className="text-white font-bold">{hardware.ram}%</span>
                                 </div>
                                 <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                   <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${hardware.ram}%` }}
                                     className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                                   />
                                 </div>
                              </div>
                              <button 
                                 className="mt-2 w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg py-1.5 flex items-center justify-center gap-2 text-[10px] font-bold transition-all shadow-md disabled:opacity-50"
                                 onClick={handleBoost}
                                 disabled={isBoosting}
                              >
                                 <Rocket size={12} className={isBoosting ? "animate-pulse" : ""} />
                                 <span>BOOST</span>
                              </button>
                           </div>
                        </motion.div>
                      )}

                      {viewMode === 'network' && (
                        <motion.div key="network" className="w-full flex flex-col justify-center px-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase">Network Speed</span>
                             <div className="flex items-center gap-1">
                               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                               <span className="text-[10px] font-bold text-green-500 uppercase">Live</span>
                             </div>
                           </div>
                           <div className="flex items-center justify-between gap-2 w-full">
                              <div className="flex-1 bg-white/5 rounded-2xl p-2.5 border border-white/5 flex flex-col items-center">
                                 <span className="text-[9px] font-black text-white/30 uppercase mb-0.5">Download</span>
                                 <span className="text-sm font-black text-white tracking-tight">{formatSpeed(network.rx)}</span>
                              </div>
                              <div className="flex-1 bg-white/5 rounded-2xl p-2.5 border border-white/5 flex flex-col items-center">
                                 <span className="text-[9px] font-black text-white/30 uppercase mb-0.5">Upload</span>
                                 <span className="text-sm font-black text-white tracking-tight">{formatSpeed(network.tx)}</span>
                              </div>
                           </div>
                        </motion.div>
                      )}

                      {viewMode === 'stopwatch' && (
                        <motion.div key="stopwatch" className={`w-full flex ${isSideNotch && viewMode !== 'settings' ? 'flex-col gap-2 justify-center text-center' : 'items-center justify-between'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                           <div className={`flex ${isSideNotch && viewMode !== 'settings' ? 'flex-col text-center items-center' : 'items-center'} gap-3 w-full`}>
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                                 <TimerIcon size={20} className="text-white/90 animate-pulse" />
                              </div>
                              <div className="flex flex-col">
                                 <span className="font-mono text-lg font-black tracking-wider text-white">
                                    {stopwatch >= 3600 ? `${String(Math.floor(stopwatch / 3600)).padStart(2, '0')}:` : ''}{String(Math.floor((stopwatch % 3600) / 60)).padStart(2, '0')}:{String(stopwatch % 60).padStart(2, '0')}
                                 </span>
                                 <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Stopwatch</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-2.5 justify-center w-full mt-1">
                              <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/60 hover:text-white" onClick={resetSw}>
                                 <RotateCcw size={14} />
                              </button>
                              <button className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all text-white shadow-md hover:scale-105" onClick={toggleSw}>
                                 {isSwRunning ? <Pause size={15} /> : <Play size={15} className="translate-x-[1px]" />}
                              </button>
                           </div>
                        </motion.div>
                      )}

                      {viewMode === 'pomodoro' && (
                        <motion.div key="pomodoro" className="w-full flex flex-col justify-start h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className="w-full flex gap-4 h-full items-start justify-between">
                            {/* Left Side: Pomodoro Timer & Customization */}
                            <div className="flex flex-col flex-[1.1] gap-2.5 text-left">
                              <div className="flex items-center justify-between">
                                <div className="flex bg-white/10 rounded-full p-0.5">
                                  <button className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors ${pomoMode === 'work' ? 'bg-red-500 text-white' : 'text-white/50'}`} onClick={() => switchPomoMode('work')}>Work</button>
                                  <button className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors ${pomoMode === 'break' ? 'bg-green-500 text-white' : 'text-white/50'}`} onClick={() => switchPomoMode('break')}>Break</button>
                                </div>
                                <span className="text-[9px] text-white/40 uppercase tracking-wider font-mono">Sessions</span>
                              </div>

                              <div className="flex flex-col gap-1.5 bg-white/5 p-2 rounded-xl border border-white/5">
                                <div className="flex items-center justify-between text-[10px] font-bold text-white/50">
                                  <span>Work Duration</span>
                                  <span>{Math.round(pomoWorkTime / 60)}m</span>
                                </div>
                                <div className="flex items-center justify-between gap-1 w-full mt-0.5">
                                  <button className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors disabled:opacity-20" onClick={() => { setPomoWorkTime(t => Math.max(300, t - 300)); if (pomoMode === 'work' && !isPomoRunning) setPomodoro(t => Math.max(300, t - 300)); }} disabled={isPomoRunning}>
                                    <Minus size={10} />
                                  </button>
                                  <div className="h-1 bg-white/10 rounded-full flex-grow mx-1.5 overflow-hidden">
                                    <div className="h-full bg-red-400" style={{ width: `${Math.min(100, (pomoWorkTime / 3600) * 100)}%` }} />
                                  </div>
                                  <button className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors disabled:opacity-20" onClick={() => { setPomoWorkTime(t => Math.min(7200, t + 300)); if (pomoMode === 'work' && !isPomoRunning) setPomodoro(t => Math.min(7200, t + 300)); }} disabled={isPomoRunning}>
                                    <Plus size={10} />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-bold text-white/50 mt-1">
                                  <span>Break Duration</span>
                                  <span>{Math.round(pomoBreakTime / 60)}m</span>
                                </div>
                                <div className="flex items-center justify-between gap-1 w-full mt-0.5">
                                  <button className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors disabled:opacity-20" onClick={() => { setPomoBreakTime(t => Math.max(60, t - 300)); if (pomoMode === 'break' && !isPomoRunning) setPomodoro(t => Math.max(60, t - 300)); }} disabled={isPomoRunning}>
                                    <Minus size={10} />
                                  </button>
                                  <div className="h-1 bg-white/10 rounded-full flex-grow mx-1.5 overflow-hidden">
                                    <div className="h-full bg-green-400" style={{ width: `${Math.min(100, (pomoBreakTime / 1800) * 100)}%` }} />
                                  </div>
                                  <button className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors disabled:opacity-20" onClick={() => { setPomoBreakTime(t => Math.min(3600, t + 300)); if (pomoMode === 'break' && !isPomoRunning) setPomodoro(t => Math.min(3600, t + 300)); }} disabled={isPomoRunning}>
                                    <Plus size={10} />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between w-full mt-1 bg-white/5 p-1.5 rounded-xl border border-white/5">
                                <div className="flex flex-col text-left pl-1">
                                  <span className="text-[11px] font-bold text-white/50 leading-tight">Session Time</span>
                                  <span className="text-[20px] font-mono font-black tracking-wide text-white leading-none mt-1">
                                    {String(Math.floor(pomodoro / 60)).padStart(2, '0')}:{String(pomodoro % 60).padStart(2, '0')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/70" onClick={resetPomo} title="Reset Timer">
                                    <RotateCcw size={12} />
                                  </button>
                                  <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors text-white shadow ${pomoMode === 'work' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`} onClick={togglePomo}>
                                    {isPomoRunning ? <Pause size={14} /> : <Play size={14} className="translate-x-[0.5px]" />}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Divider Line */}
                            <div className="w-px self-stretch bg-white/10 flex-shrink-0" />

                            {/* Right Side: Mini Task Checklist */}
                            <div className="flex flex-col flex-[0.9] h-full gap-2 text-left overflow-hidden">
                              <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase font-bold pl-1">Checklist</span>
                              
                              {/* Task List Container */}
                              <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-1.5 max-h-[190px] pr-1 select-none">
                                <AnimatePresence initial={false}>
                                  {pomoTasks.map(task => (
                                    <motion.div 
                                      key={task.id} 
                                      className="flex items-center justify-between bg-white/5 p-1.5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors"
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                    >
                                      <div className="flex items-center gap-2 overflow-hidden flex-grow cursor-pointer" onClick={() => handleToggleTask(task.id)}>
                                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-white/30 bg-transparent'}`}>
                                          {task.completed && <span className="text-[8px] font-black">✓</span>}
                                        </div>
                                        <span className={`text-[10px] truncate leading-none ${task.completed ? 'line-through text-white/30' : 'text-white/80'}`}>{task.text}</span>
                                      </div>
                                      <button className="text-white/30 hover:text-red-400 p-0.5 transition-colors flex-shrink-0" onClick={() => handleDeleteTask(task.id)}>
                                        <Trash2 size={10} />
                                      </button>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                                {pomoTasks.length === 0 && (
                                  <div className="flex flex-col items-center justify-center h-full text-white/20 py-8">
                                    <span className="text-[10px] font-bold">No tasks yet</span>
                                  </div>
                                )}
                              </div>

                              {/* Input box */}
                              <div className="flex items-center gap-1.5 mt-auto pt-1 bg-inherit">
                                <input 
                                  type="text" 
                                  value={taskInput}
                                  onChange={e => setTaskInput(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
                                  onBlur={handleInputBlur}
                                  placeholder="New task..."
                                  className="flex-grow bg-white/5 border border-white/5 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
                                />
                                <button className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors" onClick={handleAddTask}>
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {(viewMode === 'volume' || viewMode === 'brightness') && (
                        <motion.div key="quick-adjust" className="w-full h-full flex items-center justify-center gap-4 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                           {viewMode === 'volume' ? <Volume2 size={24} className="text-blue-400 animate-pulse" /> : <Sun size={24} className="text-yellow-400 animate-pulse" />}
                           <div className="flex flex-col items-center">
                             <span className="text-base font-black uppercase tracking-wider">{viewMode}</span>
                             <span className="text-[10px] text-white/50 uppercase tracking-widest">Scroll to adjust</span>
                           </div>
                        </motion.div>
                      )}

                      {viewMode === 'settings' && (
                        <motion.div key="settings" className="w-full flex flex-col gap-4 pb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                           {/* Update Available notification */}
                           {updateAvailable && (
                             <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col gap-1.5 text-left mb-1 cursor-pointer hover:bg-red-500/15 transition-colors select-none" onClick={() => setShowReleaseNotes(!showReleaseNotes)}>
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-1.5">
                                   <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
                                   <span className="text-xs font-bold text-red-300">Update Available! (v{latestVersion})</span>
                                 </div>
                                 <span className="text-[10px] text-white/50 underline">{showReleaseNotes ? 'Hide details' : 'View changelog'}</span>
                               </div>
                               {showReleaseNotes && (
                                 <div className="text-[10px] text-white/70 flex flex-col gap-1 pl-3.5 border-l border-white/10 mt-1 select-none leading-relaxed">
                                   {changelog && changelog.length > 0 ? (
                                     changelog.map((point, index) => {
                                       const colonIndex = point.indexOf(':');
                                       if (colonIndex !== -1) {
                                         const title = point.substring(0, colonIndex);
                                         const desc = point.substring(colonIndex + 1);
                                         return (
                                           <div key={index}>• <b>{title}:</b>{desc}</div>
                                         );
                                       }
                                       return <div key={index}>• {point}</div>;
                                     })
                                   ) : (
                                     <>
                                       <div>• <b>Bar Mode:</b> Full layout support with interactive media & status integration.</div>
                                       <div>• <b>Media Seek:</b> Click timeline to seek active media sessions directly on Windows.</div>
                                       <div>• <b>App Badges:</b> Display playing source application icons (Spotify, Chrome, Edge).</div>
                                       <div>• <b>Call Fixes:</b> Balanced alignment for caller UI details in collapsed Notch.</div>
                                     </>
                                   )}
                                 </div>
                               )}
                             </div>
                           )}

                           {/* What's New notification */}
                           {whatsNewAvailable && (
                             <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 flex flex-col gap-1.5 text-left mb-1 select-none">
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-1.5">
                                   <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                                   <span className="text-xs font-bold text-cyan-300">What's New in v{CURRENT_VERSION}!</span>
                                 </div>
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     localStorage.setItem('lastSeenVersion', CURRENT_VERSION);
                                     setWhatsNewAvailable(false);
                                   }}
                                   className="text-[10px] text-white/50 hover:text-white underline cursor-pointer"
                                 >
                                   Got it
                                 </button>
                               </div>
                               <div className="text-[10px] text-white/70 flex flex-col gap-1 pl-3.5 border-l border-white/10 mt-1 leading-relaxed">
                                 <div>• <b>Custom Backgrounds:</b> Paste high-quality GIF/image links from Pinterest or Giphy.</div>
                                 <div>• <b>Link Resolution:</b> Short URLs (pin.it, gph.is) resolve automatically to direct media paths.</div>
                                 <div>• <b>Video Support:</b> Native HTML5 video player renders video Pins (.mp4) inside the notch.</div>
                                 <div>• <b>Input Lock Fix:</b> Fixed notch shifting coordinates when text inputs are focused.</div>
                               </div>
                             </div>
                           )}

                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase sticky top-0 bg-inherit z-10">Island Customization</span>
                           </div>
                           
                           {/* Mode */}
                           <div className="flex flex-col gap-2">
                             <span className="text-xs font-semibold text-white/70">Mode (Notch / Bar)</span>
                             <div className="flex bg-white/10 rounded-lg p-1 w-full gap-1 text-[11px]" style={{ pointerEvents: 'auto' }}>
                               <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.mode === 'notch' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, mode: 'notch'})}>Notch</button>
                               <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.mode === 'bar' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, mode: 'bar'})}>Bar</button>
                             </div>
                           </div>

                           {/* Lock Position */}
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-semibold text-white/70">Lock Position</span>
                             <button className={`w-10 h-6 rounded-full p-1 transition-colors ${config.lockDrag ? 'bg-green-500' : 'bg-white/20'}`} onClick={() => setConfig({...config, lockDrag: !config.lockDrag})}>
                               <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.lockDrag ? 'translate-x-4' : 'translate-x-0'}`} />
                             </button>
                           </div>

                           {/* BG Animation */}
                           <div className="flex flex-col gap-2">
                             <span className="text-xs font-semibold text-white/70">Background Animation</span>
                             <div className="flex flex-wrap bg-white/10 rounded-lg p-1 w-full gap-1">
                               <button className={`flex-1 min-w-[30%] py-1.5 text-[10px] font-bold rounded-md transition-colors ${config.bgAnimation === 'off' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, bgAnimation: 'off'})}>Off</button>
                               <button className={`flex-1 min-w-[30%] py-1.5 text-[10px] font-bold rounded-md transition-colors ${config.bgAnimation === 'liquid' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, bgAnimation: 'liquid'})}>Liquid</button>
                               <button className={`flex-1 min-w-[30%] py-1.5 text-[10px] font-bold rounded-md transition-colors ${config.bgAnimation === 'cosmic' ? 'bg-cyan-500 text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, bgAnimation: 'cosmic'})}>Orbits</button>
                               <button className={`flex-1 min-w-[30%] py-1.5 text-[10px] font-bold rounded-md transition-colors ${config.bgAnimation === 'aurora' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, bgAnimation: 'aurora'})}>Aurora</button>
                               <button className={`flex-1 min-w-[30%] py-1.5 text-[10px] font-bold rounded-md transition-colors ${config.bgAnimation === 'matrix' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, bgAnimation: 'matrix'})}>Matrix</button>
                               <button className={`flex-1 min-w-[30%] py-1.5 text-[10px] font-bold rounded-md transition-colors ${config.bgAnimation === 'hyperspace' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, bgAnimation: 'hyperspace'})}>Starfield</button>
                               <button className={`flex-1 min-w-[30%] py-1.5 text-[10px] font-bold rounded-md transition-colors ${config.bgAnimation === 'rain' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, bgAnimation: 'rain'})}>Raindrops</button>
                             </div>
                           </div>

                            {/* Custom GIF Background */}
                            <div className="flex flex-col gap-2">
                               <span className="text-xs font-semibold text-white/70">Custom GIF Background URL</span>
                               <div className="flex gap-2 w-full font-sans">
                                 <input 
                                   type="text" 
                                   placeholder={isResolvingBgUrl ? "Resolving link..." : "Paste GIF/image URL here"} 
                                   value={config.customBgUrl || ''} 
                                   onChange={(e) => setConfig({...config, customBgUrl: e.target.value})} 
                                   disabled={isResolvingBgUrl}
                                   className="flex-grow bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/20 disabled:opacity-50"
                                   style={{ pointerEvents: 'auto' }}
                                 />
                                 {config.customBgUrl && (
                                   <button 
                                     className="bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                                     onClick={() => setConfig({...config, customBgUrl: ''})}
                                     disabled={isResolvingBgUrl}
                                     style={{ pointerEvents: 'auto' }}
                                   >
                                     Reset
                                   </button>
                                 )}
                               </div>
                               {isResolvingBgUrl && (
                                 <span className="text-[10px] text-cyan-400 mt-1 select-none leading-normal animate-pulse flex items-center gap-1 font-sans">
                                   <span>🔄</span> Resolving Pinterest link, please wait...
                                 </span>
                               )}
                               {!isResolvingBgUrl && config.customBgUrl && (
                                 config.customBgUrl.includes('pin.it') || 
                                 config.customBgUrl.includes('pinterest.com') || 
                                 (config.customBgUrl.includes('giphy.com') && !config.customBgUrl.includes('media.giphy.com'))
                               ) && (
                                 <span className="text-[10px] text-yellow-400 mt-1 select-none leading-normal font-sans">
                                   ⚠️ That is a webpage link, not a direct image file. To get the correct direct link, right-click the moving GIF and select <b>"Copy Image Address"</b> or <b>"Copy Image Link"</b>.
                                 </span>
                               )}
                             </div>

                           {/* Accent Color */}
                           <div className="flex flex-col gap-2">
                             <span className="text-xs font-semibold text-white/70">Accent Color</span>
                             <div className="flex items-center gap-2 flex-wrap bg-white/10 rounded-lg p-2 w-full">
                               {['#ff0000','#ff6600','#ffcc00','#00cc44','#06b6d4','#3b82f6','#a855f7','#ec4899','#ffffff'].map(color => (
                                 <button key={color} title={color} onClick={() => setConfig({...config, accentColor: color})} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${config.accentColor === color ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                               ))}
                               <button title="RGB Mode" onClick={() => setConfig({...config, accentColor: 'rgb'})} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 rgb-bg ${config.accentColor === 'rgb' ? 'border-white scale-110' : 'border-transparent'}`} />
                               <div className="w-6 h-6 rounded-full border-2 border-dashed border-white/40 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform" title="Custom accent color">
                                 <input type="color" value={config.accentColor.startsWith('#') ? config.accentColor : '#06b6d4'} onChange={(e) => setConfig({...config, accentColor: e.target.value})} className="opacity-0 w-full h-full cursor-pointer" style={{ pointerEvents: 'auto' }} />
                               </div>
                             </div>
                           </div>

                           {/* Island Color */}
                           <div className="flex flex-col gap-2">
                             <span className="text-xs font-semibold text-white/70">Island Color</span>
                             <div className="flex items-center gap-2 flex-wrap bg-white/10 rounded-lg p-2 w-full">
                               {['#000000','#111111','#1a1a2e','#ff0000','#ff6600','#ffcc00','#00cc44','#06b6d4','#3b82f6','#a855f7','#ec4899','#ffffff'].map(color => (
                                 <button key={color} title={color} onClick={() => setConfig({...config, bgColor: color})} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${config.bgColor === color ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                               ))}
                               <div className="w-6 h-6 rounded-full border-2 border-dashed border-white/40 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform" title="Custom color">
                                 <input type="color" value={config.bgColor} onChange={(e) => setConfig({...config, bgColor: e.target.value})} className="opacity-0 w-full h-full cursor-pointer" style={{ pointerEvents: 'auto' }} />
                               </div>
                             </div>
                           </div>

                           {/* Shrink / Idle Color */}
                           <div className="flex flex-col gap-2">
                             <span className="text-xs font-semibold text-white/70">Shrink Mode Color</span>
                             <div className="flex items-center gap-2 flex-wrap bg-white/10 rounded-lg p-2 w-full">
                               {['#000000','#111111','#1a1a2e','#ff0000','#ff6600','#ffcc00','#00cc44','#06b6d4','#3b82f6','#a855f7','#ec4899','#ffffff'].map(color => (
                                 <button key={color} title={color} onClick={() => setConfig({...config, idleColor: color})} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${(config.idleColor || '#000000') === color ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                               ))}
                               <div className="w-6 h-6 rounded-full border-2 border-dashed border-white/40 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform" title="Custom color">
                                 <input type="color" value={config.idleColor || '#000000'} onChange={(e) => setConfig({...config, idleColor: e.target.value})} className="opacity-0 w-full h-full cursor-pointer" style={{ pointerEvents: 'auto' }} />
                               </div>
                             </div>
                           </div>

                           {/* Panel Style */}
                           <div className="flex flex-col gap-2">
                             <span className="text-xs font-semibold text-white/70">Panel Material</span>
                             <div className="flex bg-white/10 rounded-lg p-1 w-full gap-1">
                               <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.panelStyle === 'glass' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, panelStyle: 'glass'})}>Frosted</button>
                               <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.panelStyle === 'dark-glass' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, panelStyle: 'dark-glass'})}>Dark Glass</button>
                               <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.panelStyle === 'solid' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, panelStyle: 'solid'})}>Solid</button>
                             </div>
                           </div>

                           {/* Corner Shape */}
                           <div className="flex flex-col gap-2">
                             <span className="text-xs font-semibold text-white/70">Corner Shape</span>
                             <div className="flex bg-white/10 rounded-lg p-1 w-full gap-1">
                               <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.cornerShape === 'pill' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, cornerShape: 'pill'})}>Pill (Smooth)</button>
                               <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.cornerShape === 'rounded' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, cornerShape: 'rounded'})}>Rectangle</button>
                             </div>
                           </div>

                           {/* Glow Intensity */}
                           <div className="flex flex-col gap-2">
                             <span className="text-xs font-semibold text-white/70">Neon Glow Intensity</span>
                             <div className="flex bg-white/10 rounded-lg p-1 w-full gap-1">
                               <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.glowIntensity === 'none' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, glowIntensity: 'none'})}>Off</button>
                               <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.glowIntensity === 'low' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, glowIntensity: 'low'})}>Low</button>
                               <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.glowIntensity === 'medium' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, glowIntensity: 'medium'})}>Med</button>
                               <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.glowIntensity === 'high' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, glowIntensity: 'high'})}>High</button>
                             </div>
                           </div>
                           
                           <div className="flex items-center justify-between mt-4">
                              <span className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase sticky top-0 bg-inherit z-10">Behavior & Features</span>
                           </div>

                           {/* Show Weather */}
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-semibold text-white/70">Show Weather Indicator</span>
                             <button className={`w-10 h-6 rounded-full p-1 transition-colors ${config.showWeather !== false ? 'bg-green-500' : 'bg-white/20'}`} onClick={() => setConfig({...config, showWeather: config.showWeather === false ? true : false})}>
                               <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.showWeather !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                             </button>
                           </div>

                           {/* Show Pomodoro */}
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-semibold text-white/70">Show Pomodoro Timer</span>
                             <button className={`w-10 h-6 rounded-full p-1 transition-colors ${config.showPomodoro !== false ? 'bg-green-500' : 'bg-white/20'}`} onClick={() => setConfig({...config, showPomodoro: config.showPomodoro === false ? true : false})}>
                               <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.showPomodoro !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                             </button>
                           </div>

                           {/* Show Stopwatch */}
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-semibold text-white/70">Show Stopwatch</span>
                             <button className={`w-10 h-6 rounded-full p-1 transition-colors ${config.showStopwatch ? 'bg-green-500' : 'bg-white/20'}`} onClick={() => setConfig({...config, showStopwatch: !config.showStopwatch})}>
                               <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.showStopwatch ? 'translate-x-4' : 'translate-x-0'}`} />
                             </button>
                           </div>

                           {/* Show Hardware */}
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-semibold text-white/70">Show Hardware & Network Stats</span>
                             <button className={`w-10 h-6 rounded-full p-1 transition-colors ${config.showHardware !== false ? 'bg-green-500' : 'bg-white/20'}`} onClick={() => setConfig({...config, showHardware: config.showHardware === false ? true : false})}>
                               <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.showHardware !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                             </button>
                           </div>

                           {/* Auto Hide */}
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-semibold text-white/70">Deep Idle (Auto-shrink on inactivity)</span>
                             <button className={`w-10 h-6 rounded-full p-1 transition-colors ${config.autoHide !== false ? 'bg-green-500' : 'bg-white/20'}`} onClick={() => setConfig({...config, autoHide: config.autoHide === false ? true : false})}>
                               <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.autoHide !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                             </button>
                           </div>

                           {/* Clock Format */}
                           <div className="flex flex-col gap-2">
                             <span className="text-xs font-semibold text-white/70">Clock Format</span>
                             <div className="flex bg-white/10 rounded-lg p-1 w-full gap-1">
                               <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.clockFormat === '12h' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, clockFormat: '12h'})}>12 Hour</button>
                               <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${config.clockFormat === '24h' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`} onClick={() => setConfig({...config, clockFormat: '24h'})}>24 Hour</button>
                             </div>
                           </div>

                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
        </motion.div>
        );
      })()}
    </div>
  );
}
