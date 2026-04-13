import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, CloudSun, Music, Link as LinkIcon, ExternalLink, X, Timer as TimerIcon, Activity, ChevronRight, RotateCcw, Battery, BatteryCharging, Calendar, Sparkles, Power } from 'lucide-react';

const { ipcRenderer } = window.require ? window.require('electron') : {};

export default function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [time, setTime] = useState('');
  const [spotifyState, setSpotifyState] = useState(null);
  const [clipboardUrl, setClipboardUrl] = useState(null);
  const [privacy, setPrivacy] = useState({ cam: false, mic: false });
  const [localProgress, setLocalProgress] = useState(0);

  const [viewMode, setViewMode] = useState('media');
  const [hardware, setHardware] = useState({ cpu: 0, ram: 0 });
  const [weather, setWeather] = useState({ temp: '--', desc: 'Fetching...' });
  const [stopwatch, setStopwatch] = useState(0);
  const [isSwRunning, setIsSwRunning] = useState(false);

  const [batteryEvent, setBatteryEvent] = useState(null);
  const [meetingAlert, setMeetingAlert] = useState(null);

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
      interval = setInterval(() => setStopwatch(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isSwRunning]);

  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.on('spotify-state', (event, data) => {
        setSpotifyState(data);
        if (data?.is_playing) setLocalProgress(data.progress_ms);
      });
      ipcRenderer.on('clipboard-url', (event, url) => {
        setClipboardUrl(url);
        ipcRenderer.send('set-ignore-mouse-events', false);
        setTimeout(() => setClipboardUrl(null), 6000);
      });
      ipcRenderer.on('hardware-stats', (event, stats) => {
        setHardware(stats);
      });
      ipcRenderer.on('privacy-dots', (event, state) => {
        setPrivacy(state);
      });
      return () => {
        ipcRenderer.removeAllListeners('spotify-state');
        ipcRenderer.removeAllListeners('clipboard-url');
        ipcRenderer.removeAllListeners('hardware-stats');
        ipcRenderer.removeAllListeners('privacy-dots');
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

  const handleMouseEnter = () => {
    if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', false);
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
    if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
  };

  // Variants for Framer Motion
  const islandVariants = {
    collapsed: {
      width: 200,
      height: 40,
      borderRadius: 40,
      transition: { type: 'spring', stiffness: 300, damping: 25 }
    },
    expanded: {
      width: 400,
      height: 160,
      borderRadius: 30,
      transition: { type: 'spring', stiffness: 300, damping: 25 }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { delay: 0.1, type: 'spring', stiffness: 300, damping: 25 } 
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.1 } }
  };

  const formatDate = () => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <div className="w-screen h-screen flex justify-center items-start overflow-hidden pointer-events-none fixed top-0 left-0" style={{ pointerEvents: 'none' }}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        layout
        initial={{ borderBottomLeftRadius: 100, borderBottomRightRadius: 100, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        animate={{
          width: isNotification
            ? 340
            : (isExpanded 
               ? 380 
               : (privacy.cam && privacy.mic ? 160 : (privacy.cam || privacy.mic ? 140 : 120))),
          height: isNotification ? 80 : (isExpanded ? 200 : 36),
          borderBottomLeftRadius: (isExpanded || isNotification) ? 32 : 100,
          borderBottomRightRadius: (isExpanded || isNotification) ? 32 : 100,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          y: -1
        }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={`text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border-b border-l border-r border-white/10 transition-colors duration-500 ${(isExpanded || isNotification) ? 'bg-black/75 backdrop-blur-2xl' : 'bg-black/95 backdrop-blur-md'}`}
        style={{ pointerEvents: 'auto', originY: 0 }}
      >
        <AnimatePresence mode="popLayout">
          {(!isExpanded && !isNotification) ? (
            <motion.div
              key="collapsed"
              className="w-full h-full flex items-center justify-center gap-3"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <span className="font-bold text-xs tracking-wider mt-[-2px]">{time}</span>
              
              {(privacy.mic || privacy.cam || spotifyState?.is_playing) && (
                <div className="flex items-center gap-1.5 mt-[-2px]">
                  {spotifyState?.is_playing && <Music size={12} className="text-green-500" />}
                  {privacy.mic && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]" />}
                  {privacy.cam && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]" />}
                </div>
              )}
            </motion.div>
          ) : clipboardUrl ? (
            <motion.div
              key="clipboard-state"
              className="w-full h-full p-4 flex flex-col justify-center gap-3"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
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
              className="w-full h-full p-2 flex flex-col justify-start"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
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
                  {/* Expanded Layout Reorganization */}
              <div className="w-full h-full p-2 flex flex-col justify-start">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div 
                      className="flex items-center gap-2 bg-white/10 py-1.5 px-3 rounded-full hover:bg-white/20 transition-colors cursor-pointer" 
                      style={{ pointerEvents: 'auto' }}
                      onClick={() => setViewMode(viewMode === 'stats' ? 'media' : 'stats')}
                    >
                      <CloudSun size={16} className="text-yellow-300" />
                      <span className="text-sm font-medium">{weather.temp}</span>
                    </div>


                  </div>

                  <div className="flex items-center gap-2" style={{ pointerEvents: 'auto' }}>
                    <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'stats' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('stats')}>
                      <Activity size={14} />
                    </button>
                    <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'timer' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('timer')}>
                      <TimerIcon size={14} />
                    </button>
                    <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'media' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('media')}>
                      <Music size={14} />
                    </button>
                  </div>

                  <button 
                    className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                    onClick={() => ipcRenderer.send('quit-app')}
                  >
                    <Power size={14} />
                  </button>
                </div>
                
                {/* Privacy Dots in Expanded View */}
                <div className="absolute left-1/2 -translate-x-1/2 flex gap-1.5 mt-2">
                  {privacy.mic && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]" />}
                  {privacy.cam && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]" />}
                </div>
              </div>

              {/* Lyrics Display */}
              <AnimatePresence>
                {viewMode === 'media' && spotifyState?.lyrics?.length > 0 && (
                  <motion.div 
                      key="lyrics-container"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute left-0 right-0 top-[54px] flex flex-col justify-center items-center w-full px-5 z-10 pointer-events-none"
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

              {/* Bottom Section: Dynamic based on mode */}
              <div className="flex items-center justify-between mt-auto bg-white/5 rounded-2xl p-3 border border-white/5 h-[76px] relative overflow-hidden" style={{ pointerEvents: 'auto' }}>
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
                        <div className="flex flex-col max-w-[140px]">
                          <span className="font-bold text-base leading-tight truncate">
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
                    <motion.div key="stats" className="w-full flex items-center justify-between px-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="w-full flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold tracking-wide">
                          <span className="flex items-center gap-2"><Activity size={12} className="text-green-400" /> CPU Usage</span>
                          <span className="text-white/80">{hardware.cpu}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-green-400 transition-all duration-500 ease-out" style={{ width: `${hardware.cpu}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold tracking-wide mt-0.5">
                          <span className="flex items-center gap-2"><Activity size={12} className="text-blue-400" /> RAM Usage</span>
                          <span className="text-white/80">{hardware.ram}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 transition-all duration-500 ease-out" style={{ width: `${hardware.ram}%` }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {viewMode === 'timer' && (
                    <motion.div key="timer" className="w-full flex items-center justify-between px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white/50 tracking-wider uppercase mb-1">Stopwatch</span>
                        <span className="font-mono text-3xl font-bold tracking-tight">
                          {Math.floor(stopwatch / 60).toString().padStart(2, '0')}:{Math.floor(stopwatch % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-white" onClick={() => { setStopwatch(0); setIsSwRunning(false); }}>
                          <RotateCcw size={20} />
                        </button>
                        <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shadow-sm" onClick={() => setIsSwRunning(!isSwRunning)}>
                          {isSwRunning ? <Pause size={20} /> : <Play size={20} className="translate-x-[1px]" />}
                        </button>
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
