import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, CloudSun, Music, Link as LinkIcon, ExternalLink, X, Timer as TimerIcon, Activity, ChevronRight, RotateCcw, Battery, BatteryCharging, Calendar, Sparkles, Power, LayoutGrid, Calculator, Folder, Settings as SettingsIcon, Signal, Volume2, Sun, Download, Home, Coffee, Briefcase, File, Trash2, Plus, Minus } from 'lucide-react';
const ipcRenderer = window.electronAPI || null;

export default function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [time, setTime] = useState('');
  const [spotifyState, setSpotifyState] = useState(null);
  const [clipboardUrl, setClipboardUrl] = useState(null);
  const [privacy, setPrivacy] = useState({ cam: false, mic: false });
  const [localProgress, setLocalProgress] = useState(0);
  const [network, setNetwork] = useState({ rx: 0, tx: 0 });

  const [viewMode, setViewMode] = useState('media');
  const viewModeRef = useRef('media');
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

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
  const [showSongName, setShowSongName] = useState(false);

  const isNotification = Boolean(clipboardUrl || batteryEvent || meetingAlert);

  // Battery Polling
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(bat => {
        let lastCharging = bat.charging;
        let lastLevel = bat.level;
        bat.addEventListener('chargingchange', () => {
          if (bat.charging !== lastCharging) {
             lastCharging = bat.charging;
             setBatteryEvent({ charging: bat.charging, level: Math.round(bat.level * 100) });
             setTimeout(() => setBatteryEvent(null), 5000);
          }
        });
        bat.addEventListener('levelchange', () => {
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
        if (viewModeRef.current === 'stats') setHardware(stats);
      });
      ipcRenderer.on('privacy-dots', (state) => {
        setPrivacy(state);
      });
      ipcRenderer.on('network-stats', (stats) => {
        if (viewModeRef.current === 'network') setNetwork(stats);
      });
      return () => {
        ipcRenderer.removeAllListeners('spotify-state');
        ipcRenderer.removeAllListeners('clipboard-url');
        ipcRenderer.removeAllListeners('hardware-stats');
        ipcRenderer.removeAllListeners('privacy-dots');
        ipcRenderer.removeAllListeners('network-stats');
      };
    }
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let interval;
    if (spotifyState?.is_playing) {
      interval = setInterval(() => setLocalProgress(p => p + 100), 100);
    }
    return () => clearInterval(interval);
  }, [spotifyState?.is_playing]);

  const getCurrentLyric = () => {
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
  };

  const isSpotify = Boolean(spotifyState?.isSpotify);

  useEffect(() => {
    let interval;
    if (spotifyState?.is_playing && isSpotify && !isExpanded) {
      interval = setInterval(() => {
        setShowSongName(prev => !prev);
      }, 4000); // Toggle every 4 seconds
    } else {
      setShowSongName(false);
    }
    return () => clearInterval(interval);
  }, [spotifyState?.is_playing, isSpotify, isExpanded]);

  const handleMouseEnter = () => {
    if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', false);
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
    if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
  };

  const formatDate = () => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const formatSpeed = (bytes) => {
    if (bytes < 1024) return `${bytes} B/s`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  return (
    <div className="w-full h-full flex justify-center items-start overflow-hidden pointer-events-none fixed top-0 left-0" style={{ pointerEvents: 'none' }}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        onContextMenu={() => { if(ipcRenderer) ipcRenderer.send('show-context-menu'); }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        layout
        initial={{ borderBottomLeftRadius: 100, borderBottomRightRadius: 100, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        animate={{
          width: isNotification
            ? 340
            : (isExpanded 
               ? 380 
               : (privacy.cam && privacy.mic ? 160 : (privacy.cam || privacy.mic ? 140 : (showSongName ? 180 : 120)))),
          height: isNotification ? 80 : (isExpanded ? (viewMode === 'network' ? 250 : (viewMode === 'stats' ? 230 : (viewMode === 'pomodoro' ? 210 : (['volume', 'brightness'].includes(viewMode) ? 140 : 200)))) : 36),
          borderBottomLeftRadius: (isExpanded || isNotification) ? 32 : 100,
          borderBottomRightRadius: (isExpanded || isNotification) ? 32 : 100,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          y: -1
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25, mass: 0.8 }}
        className={`relative z-10 text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border-b border-l border-r border-white/10 transition-colors duration-500 ${(isExpanded || isNotification) ? 'bg-black/75 backdrop-blur-2xl' : 'bg-black/95 backdrop-blur-md'}`}
        style={{ pointerEvents: 'auto', originY: 0 }}
      >
        <AnimatePresence>
          {spotifyState?.is_playing && viewMode === 'media' && spotifyState?.item?.album?.images?.[0]?.url && (
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              src={spotifyState.item.album.images[0].url}
              className="absolute inset-0 w-full h-full object-cover blur-3xl z-0 pointer-events-none"
              style={{ mixBlendMode: 'screen' }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence mode="popLayout">
          {(!isExpanded && !isNotification) ? (
            <motion.div
              key="collapsed"
              className="w-full h-full flex items-center justify-center gap-3 z-10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <AnimatePresence mode="wait">
                {showSongName && isSpotify ? (
                   <motion.span 
                    key="songname"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: -2 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="font-bold text-[10px] tracking-tight truncate max-w-[120px] text-green-400"
                  >
                    {spotifyState?.item?.name}
                  </motion.span>
                ) : (
                  <motion.span 
                    key="time"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: -2 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="font-bold text-xs tracking-wider"
                  >
                    {time}
                  </motion.span>
                )}
              </AnimatePresence>
              
              {(privacy.mic || privacy.cam || spotifyState?.is_playing) && (
                <div className="flex items-center gap-1.5 mt-[-2px]">
                  {spotifyState?.is_playing && <Music size={12} className={isSpotify ? "text-green-500" : "text-blue-400"} />}
                  {privacy.mic && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]" />}
                  {privacy.cam && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]" />}
                </div>
              )}
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
              ) : (
                <>
                  <div className="w-full h-full p-2 flex flex-col justify-start">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div 
                          className="flex items-center gap-2 bg-white/10 py-1.5 px-3 rounded-full hover:bg-white/20 transition-colors cursor-pointer" 
                          style={{ pointerEvents: 'auto' }}
                          onClick={() => { if (ipcRenderer) ipcRenderer.send('open-weather'); }}
                        >
                          <CloudSun size={16} className="text-yellow-300" />
                          <span className="text-sm font-medium">{weather.temp}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2" style={{ pointerEvents: 'auto' }}>
                        <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'pomodoro' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('pomodoro')}>
                          <Coffee size={14} />
                        </button>
                        <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'stopwatch' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('stopwatch')}>
                          <TimerIcon size={14} />
                        </button>
                        <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'stats' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('stats')}>
                          <Activity size={14} />
                        </button>
                        <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'network' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('network')}>
                          <Signal size={14} />
                        </button>
                        <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'media' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('media')}>
                          <Music size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5 mx-1">
                          {privacy.mic && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]" />}
                          {privacy.cam && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]" />}
                        </div>
                        <button 
                          className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          style={{ pointerEvents: 'auto' }}
                          onClick={() => ipcRenderer.send('quit-app')}
                        >
                          <Power size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {viewMode === 'media' && spotifyState?.lyrics?.length > 0 && (
                      <motion.div 
                          key="lyrics-container"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute left-0 right-0 top-10 bottom-[76px] flex flex-col justify-center items-center w-full px-5 z-10 pointer-events-none"
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
                                 className="text-[14px] font-semibold text-white/90 tracking-wide line-clamp-2 leading-snug inline-block"
                                 style={{ textShadow: '0 2px 14px rgba(0,0,0,0.9)' }}
                              >
                                 {getCurrentLyric() || <span className="opacity-0">♪</span>}
                              </span>
                           </motion.div>
                         </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={`flex items-center justify-between mt-auto bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden transition-all duration-300 ${viewMode === 'network' ? 'p-3 h-[160px]' : (viewMode === 'stats' ? 'p-4 h-[120px]' : (viewMode === 'pomodoro' ? 'p-4 h-[100px]' : 'p-3 h-[76px]'))}`} style={{ pointerEvents: 'auto' }}>
                    <AnimatePresence mode="wait">
                      {viewMode === 'media' && (
                        <motion.div key="media" className="w-full flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                              {spotifyState?.item?.album?.images?.[0] ? (
                                <img src={spotifyState.item.album.images[0].url} className="w-full h-full object-cover" />
                              ) : (
                                <Music size={24} className="text-white/90" />
                              )}
                            </div>
                            <div 
                              className="flex flex-col max-w-[140px] cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => { if (ipcRenderer) ipcRenderer.send('open-media-app', spotifyState?.sourceAppId); }}
                            >
                              <span className="font-bold text-base leading-tight truncate hover:underline">
                                {spotifyState?.item?.name || 'Not Playing'}
                              </span>
                              <span className="text-xs text-white/50 truncate">
                                {spotifyState?.item?.artists?.[0]?.name || 'Spotify offline'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-white" onClick={() => ipcRenderer?.send('spotify-prev')}>
                              <SkipBack size={16} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shadow-sm" onClick={() => {
                                const nextState = !spotifyState?.is_playing;
                                setSpotifyState(prev => prev ? {...prev, is_playing: nextState} : prev);
                                if (ipcRenderer) ipcRenderer.send(nextState ? 'spotify-play' : 'spotify-pause');
                            }}>
                              {spotifyState?.is_playing ? <Pause size={18} /> : <Play size={18} className="translate-x-[1px]" />}
                            </button>
                            <button className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-white" onClick={() => ipcRenderer?.send('spotify-skip')}>
                              <SkipForward size={16} />
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {viewMode === 'stats' && (
                        <motion.div key="stats" className="w-full flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                          </div>
                        </motion.div>
                      )}

                      {viewMode === 'network' && (
                        <motion.div key="network" className="w-full flex flex-col justify-center px-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase">Network Speed</span>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-[10px] font-bold text-green-500 uppercase">Live</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                             <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                                <span className="text-[10px] font-black text-white/30 uppercase mb-1">Download</span>
                                <span className="text-lg font-black text-white tracking-tight">{formatSpeed(network.rx)}</span>
                             </div>
                             <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                                <span className="text-[10px] font-black text-white/30 uppercase mb-1">Upload</span>
                                <span className="text-lg font-black text-white tracking-tight">{formatSpeed(network.tx)}</span>
                             </div>
                          </div>
                        </motion.div>
                      )}

                      {viewMode === 'stopwatch' && (
                        <motion.div key="stopwatch" className="w-full flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                                 <TimerIcon size={24} className="text-white/90" />
                              </div>
                              <div className="flex flex-col">
                                 <span className="font-mono text-xl font-bold tracking-wider">
                                    {stopwatch >= 3600 ? `${String(Math.floor(stopwatch / 3600)).padStart(2, '0')}:` : ''}{String(Math.floor((stopwatch % 3600) / 60)).padStart(2, '0')}:{String(stopwatch % 60).padStart(2, '0')}
                                 </span>
                                 <span className="text-[10px] text-white/50 uppercase tracking-widest">Stopwatch</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <button className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-white" onClick={resetSw}>
                                 <RotateCcw size={16} />
                              </button>
                              <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shadow-sm" onClick={toggleSw}>
                                 {isSwRunning ? <Pause size={18} /> : <Play size={18} className="translate-x-[1px]" />}
                              </button>
                           </div>
                        </motion.div>
                      )}

                      {viewMode === 'pomodoro' && (
                        <motion.div key="pomodoro" className="w-full flex flex-col justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className="flex items-center justify-between mb-3 px-2">
                             <div className="flex bg-white/10 rounded-full p-1">
                               <button className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${pomoMode === 'work' ? 'bg-red-500 text-white' : 'text-white/50'}`} onClick={() => switchPomoMode('work')}>Work</button>
                               <button className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${pomoMode === 'break' ? 'bg-green-500 text-white' : 'text-white/50'}`} onClick={() => switchPomoMode('break')}>Break</button>
                             </div>
                             <span className="text-[10px] text-white/50 uppercase tracking-widest">{pomoMode} Mode</span>
                          </div>
                          <div className="flex items-center justify-between px-2">
                             <div className="flex items-center gap-1">
                                <button className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors disabled:opacity-10 disabled:hover:bg-transparent" onClick={() => adjustPomoTime(-60)} disabled={isPomoRunning}>
                                  <Minus size={16} />
                                </button>
                                <span className="font-mono text-3xl font-black tracking-wider text-white w-20 text-center">
                                   {String(Math.floor(pomodoro / 60)).padStart(2, '0')}:{String(pomodoro % 60).padStart(2, '0')}
                                </span>
                                <button className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors disabled:opacity-10 disabled:hover:bg-transparent" onClick={() => adjustPomoTime(60)} disabled={isPomoRunning}>
                                  <Plus size={16} />
                                </button>
                             </div>
                             <div className="flex items-center gap-2">
                                <button className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-white" onClick={resetPomo}>
                                   <RotateCcw size={16} />
                                </button>
                                <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${pomoMode === 'work' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`} onClick={togglePomo}>
                                   {isPomoRunning ? <Pause size={18} /> : <Play size={18} className="translate-x-[1px]" />}
                                </button>
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
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
