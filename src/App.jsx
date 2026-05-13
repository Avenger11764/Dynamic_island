import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, CloudSun, Music, Link as LinkIcon, ExternalLink, X, Timer as TimerIcon, Activity, ChevronRight, RotateCcw, Battery, BatteryCharging, Calendar, Sparkles, Power, LayoutGrid, Calculator, Folder, Settings as SettingsIcon, Signal, Volume2, Sun, Download, Home, Coffee, Briefcase, File, Trash2, Plus, Minus } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';

const ipcRenderer = window.electronAPI || null;

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
    const hour = new Date().getHours();
    let text = "Good Evening";
    if (hour < 12) text = "Good Morning";
    else if (hour < 17) text = "Good Afternoon";
    setGreeting(text);
    setTimeout(() => setGreeting(null), 4000);
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
    clockFormat: '12h'
  };
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('smart-notch-config');
      const parsed = saved ? JSON.parse(saved) : defaultConfig;
      // Remove any stored offsetX — we now track position with a motion value
      delete parsed.offsetX;
      return parsed;
    } catch(e) { return defaultConfig; }
  });
  useEffect(() => {
    localStorage.setItem('smart-notch-config', JSON.stringify(config));
  }, [config]);
  
  // Helpers for Tailwind classes based on config
  const getGlowStyle = () => {
     if (config.glowIntensity === 'none') return '';
     
     if (config.accentColor === 'rgb') {
        if (config.glowIntensity === 'high') return 'rgb-shadow-high';
        if (config.glowIntensity === 'low') return 'rgb-shadow-low';
        return 'rgb-shadow-med';
     }

     const colors = {
        '#06b6d4': { h: 'shadow-[0_0_50px_rgba(6,182,212,0.4)]', m: 'shadow-[0_0_30px_rgba(6,182,212,0.25)]', l: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]' },
        '#a855f7': { h: 'shadow-[0_0_50px_rgba(168,85,247,0.4)]', m: 'shadow-[0_0_30px_rgba(168,85,247,0.25)]', l: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
        '#00cc44': { h: 'shadow-[0_0_50px_rgba(34,197,94,0.4)]', m: 'shadow-[0_0_30px_rgba(34,197,94,0.25)]', l: 'shadow-[0_0_15px_rgba(34,197,94,0.15)]' },
        '#ec4899': { h: 'shadow-[0_0_50px_rgba(236,72,153,0.4)]', m: 'shadow-[0_0_30px_rgba(236,72,153,0.25)]', l: 'shadow-[0_0_15px_rgba(236,72,153,0.15)]' },
        '#ff6600': { h: 'shadow-[0_0_50px_rgba(249,115,22,0.4)]', m: 'shadow-[0_0_30px_rgba(249,115,22,0.25)]', l: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]' },
        '#ffffff': { h: 'shadow-[0_0_50px_rgba(255,255,255,0.4)]', m: 'shadow-[0_0_30px_rgba(255,255,255,0.25)]', l: 'shadow-[0_0_15px_rgba(255,255,255,0.15)]' }
     };
     
     const c = colors[config.accentColor] || (config.accentColor.startsWith('#') ? { h: '', m: '', l: '' } : colors['#06b6d4']);
     if (config.glowIntensity === 'high') return c.h;
     if (config.glowIntensity === 'low') return c.l;
     return c.m;
  };

  const getTextGlowStyle = (isGreeting) => {
      if (config.glowIntensity === 'none') return isGreeting ? (idleTextColor === 'black' ? 'text-black/90' : 'text-white/90') : '';
      if (config.accentColor === 'rgb') return 'rgb-text';
      
      const colors = {
          '#06b6d4': isGreeting ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]' : 'text-cyan-100 drop-shadow-[0_0_5px_rgba(103,232,249,0.6)]',
          '#a855f7': isGreeting ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(216,180,254,0.8)]' : 'text-purple-100 drop-shadow-[0_0_5px_rgba(216,180,254,0.6)]',
          '#00cc44': isGreeting ? 'text-green-300 drop-shadow-[0_0_8px_rgba(134,239,172,0.8)]' : 'text-green-100 drop-shadow-[0_0_5px_rgba(134,239,172,0.6)]',
          '#ec4899': isGreeting ? 'text-pink-300 drop-shadow-[0_0_8px_rgba(249,168,212,0.8)]' : 'text-pink-100 drop-shadow-[0_0_5px_rgba(249,168,212,0.6)]',
          '#ff6600': isGreeting ? 'text-orange-300 drop-shadow-[0_0_8px_rgba(253,186,116,0.8)]' : 'text-orange-100 drop-shadow-[0_0_5px_rgba(253,186,116,0.6)]',
          '#ffffff': isGreeting ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-white/90 drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]'
      };
      return colors[config.accentColor] || (config.accentColor.startsWith('#') ? (idleTextColor === 'black' ? 'text-black' : 'text-white') : colors['#06b6d4']);
  };

  const getPanelBorderStyle = () => {
     if (config.panelStyle === 'solid') return 'bg-[#111] border border-white/5';
     if (config.panelStyle === 'glass') return 'bg-white/5 border border-white/5 backdrop-blur-md';
     
     // dark-glass
     if (config.accentColor === 'rgb') return 'bg-black/50 backdrop-blur-md border rgb-border';
     const borders = {
         '#06b6d4': 'border-cyan-500/30',
         '#a855f7': 'border-purple-500/30',
         '#00cc44': 'border-green-500/30',
         '#ec4899': 'border-pink-500/30',
         '#ff6600': 'border-orange-500/30',
         '#ffffff': 'border-white/30'
     };
     return `bg-black/50 backdrop-blur-md border ${borders[config.accentColor] || (config.accentColor.startsWith('#') ? 'border-white/10' : borders['#06b6d4'])}`;

  };

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
      if (viewModeRef.current === 'settings') return; // Let user scroll settings freely
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

  return (
    <div className="w-full h-full flex justify-center items-start overflow-hidden pointer-events-none fixed top-0 left-0" style={{ pointerEvents: 'none' }}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        onContextMenu={() => { if(ipcRenderer) ipcRenderer.send('show-context-menu'); }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={{ borderBottomLeftRadius: 100, borderBottomRightRadius: 100, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        animate={{
          width: isNotification
            ? 360
            : (isExpanded 
               ? 400 
               : (greeting ? 240 : (privacy.cam && privacy.mic ? 200 : (privacy.cam || privacy.mic ? 180 : 160)))),
          height: isNotification ? 80 : (isExpanded ? (viewMode === 'settings' ? 320 : (viewMode === 'network' ? 260 : (viewMode === 'stats' ? 240 : (viewMode === 'pomodoro' ? 220 : (['volume', 'brightness'].includes(viewMode) ? 140 : 220))))) : (isDeepIdle ? 26 : 36)),
          opacity: 1,
          borderBottomLeftRadius: (isExpanded || isNotification) ? 24 : 12,
          borderBottomRightRadius: (isExpanded || isNotification) ? 24 : 12,
          borderTopLeftRadius: 0,
          y: -1,
          backgroundColor: (!isExpanded && !isNotification) ? (config.idleColor || config.bgColor) : config.bgColor
        }}
        style={{ pointerEvents: 'auto', originY: 0, willChange: 'width, height, border-radius' }}
        transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.4, restDelta: 0.001 }}
        className={`relative z-10 text-white flex flex-col transition-shadow duration-500 ${getGlowStyle()} ${config.cornerShape === 'pill' ? 'rounded-b-[24px]' : 'rounded-b-[12px]'}`}
      >
        <div className="absolute top-0 -left-[12px] w-[12px] h-[12px] pointer-events-none transition-colors duration-500" style={{ backgroundImage: `radial-gradient(circle at 0% 100%, transparent 12px, ${(!isExpanded && !isNotification) ? (config.idleColor || config.bgColor) : config.bgColor} 12px)` }}></div>
        <div className="absolute top-0 -right-[12px] w-[12px] h-[12px] pointer-events-none transition-colors duration-500" style={{ backgroundImage: `radial-gradient(circle at 100% 100%, transparent 12px, ${(!isExpanded && !isNotification) ? (config.idleColor || config.bgColor) : config.bgColor} 12px)` }}></div>
        <div className="w-full h-full flex flex-col overflow-hidden relative z-10" style={{ borderBottomLeftRadius: 'inherit', borderBottomRightRadius: 'inherit' }}>
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
              className={`w-full h-full flex items-center justify-between px-4 z-10 ${idleTextClass}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <div className="flex items-center gap-2">
                 <div className="relative w-[14px] h-[14px] flex items-center justify-center mt-[-2px]">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                       <circle cx="18" cy="18" r="16" fill="none" className={idleTextColor === 'black' ? 'stroke-black/10' : 'stroke-white/10'} strokeWidth="4" />
                       <circle cx="18" cy="18" r="16" fill="none" className={idleTextColor === 'black' ? 'stroke-black/40' : 'stroke-white/40'} strokeWidth="6" strokeDasharray="100" strokeDashoffset={100 - battery.level} strokeLinecap="round" />
                       <circle cx="18" cy="18" r="16" fill="none" className={battery.charging ? 'stroke-green-500' : (battery.level < 20 ? 'stroke-red-500' : (idleTextColor === 'black' ? 'stroke-black/80' : 'stroke-white/80'))} strokeWidth="4" strokeDasharray="100" strokeDashoffset={100 - battery.level} strokeLinecap="round" />
                    </svg>
                 </div>
                 <div className="flex gap-1 mt-[-2px]">
                    <div className={`w-1.5 h-1.5 rounded-full ${(network.rx > 1024*500 || network.tx > 1024*500) ? 'bg-purple-500 shadow-[0_0_5px_#a855f7]' : (idleTextColor === 'black' ? 'bg-black/10' : 'bg-white/10')}`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${hardware.cpu > 50 ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6]' : (idleTextColor === 'black' ? 'bg-black/10' : 'bg-white/10')}`} />
                 </div>
              </div>
               <AnimatePresence mode="wait">
                 {greeting ? (
                    <motion.span key="greeting" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: -2 }} exit={{ opacity: 0, y: -5 }} className={`font-bold text-[11px] tracking-wide ${idleTextColor === 'black' ? 'text-black' : getTextGlowStyle(true)}`}>
                      {greeting}
                    </motion.span>
                 ) : isPomoRunning ? (
                    <motion.span key="pomotimer" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: -2 }} exit={{ opacity: 0, y: -5 }} className={`font-mono font-bold text-[11px] tracking-wider ${config.glowIntensity !== 'none' ? 'text-orange-300 drop-shadow-[0_0_8px_rgba(253,186,116,0.8)]' : 'text-orange-400'}`}>
                      {String(Math.floor(pomodoro / 60)).padStart(2, '0')}:{String(pomodoro % 60).padStart(2, '0')}
                    </motion.span>
                 ) : isSwRunning ? (
                    <motion.span key="swtimer" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: -2 }} exit={{ opacity: 0, y: -5 }} className={`font-mono font-bold text-[11px] tracking-wider ${config.glowIntensity !== 'none' ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]' : 'text-yellow-400'}`}>
                      {String(Math.floor((stopwatch % 3600) / 60)).padStart(2, '0')}:{String(stopwatch % 60).padStart(2, '0')}
                    </motion.span>
                 ) : (
                    <motion.span key="time" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: -2 }} exit={{ opacity: 0, y: -5 }} className={`font-bold text-xs tracking-wider ${idleTextColor === 'black' ? 'text-black' : getTextGlowStyle(false)}`}>
                      {time}
                    </motion.span>
                 )}
              </AnimatePresence>
              
              <div className="flex items-center justify-end gap-1.5 w-[20px]">
                 {spotifyState?.is_playing ? (
                    <div className="flex items-end justify-center gap-[2px] h-[10px] mt-[-3px]">
                       <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }} className={`w-[2px] rounded-t-sm ${isSpotify ? 'bg-green-500' : 'bg-blue-400'}`} />
                       <motion.div animate={{ height: [8, 4, 12, 8] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }} className={`w-[2px] rounded-t-sm ${isSpotify ? 'bg-green-500' : 'bg-blue-400'}`} />
                       <motion.div animate={{ height: [5, 12, 5] }} transition={{ repeat: Infinity, duration: 0.4, ease: "easeInOut" }} className={`w-[2px] rounded-t-sm ${isSpotify ? 'bg-green-500' : 'bg-blue-400'}`} />
                    </div>
                 ) : (
                    <div className="w-[10px]" />
                 )}
                 {(privacy.mic || privacy.cam) && (
                   <div className="flex gap-1 mt-[-3px]">
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
              ) : (
                <>
                  <div className="w-full p-2 flex flex-col justify-start z-20">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {config.showWeather !== false && (
                          <div 
                            className="flex items-center gap-2 bg-white/10 py-1.5 px-3 rounded-full hover:bg-white/20 transition-colors cursor-pointer" 
                            style={{ pointerEvents: 'auto' }}
                            title="Weather"
                            onClick={() => { if (ipcRenderer) ipcRenderer.send('open-weather'); }}
                          >
                            <CloudSun size={16} className="text-yellow-300" />
                            <span className="text-sm font-medium">{weather.temp}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2" style={{ pointerEvents: 'auto' }}>
                        <button title="Settings" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'settings' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('settings')}>
                          <SettingsIcon size={14} />
                        </button>
                        {config.showPomodoro !== false && (
                          <button title="Pomodoro Timer" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'pomodoro' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('pomodoro')}>
                            <Coffee size={14} />
                          </button>
                        )}
                        {config.showStopwatch && (
                          <button title="Stopwatch" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'stopwatch' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('stopwatch')}>
                            <TimerIcon size={14} />
                          </button>
                        )}
                        {config.showHardware !== false && (
                          <>
                            <button title="Hardware Stats" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'stats' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('stats')}>
                              <Activity size={14} />
                            </button>
                            <button title="Network Stats" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'network' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('network')}>
                              <Signal size={14} />
                            </button>
                          </>
                        )}
                        <button title="Media Player" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewMode === 'media' ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setViewMode('media')}>
                          <Music size={14} />
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

                  <div className={`flex items-center justify-between mt-auto rounded-2xl relative overflow-hidden transition-all duration-300 ${getPanelBorderStyle()} ${viewMode === 'settings' ? 'p-4 h-[300px] items-start flex-col overflow-y-auto custom-scrollbar pr-1' : (viewMode === 'network' ? 'p-3 h-[160px]' : (viewMode === 'stats' ? 'p-4 h-[120px]' : (viewMode === 'pomodoro' ? 'p-4 h-[100px]' : 'p-3 h-[76px]')))}`} style={{ pointerEvents: 'auto' }}>
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

                      {viewMode === 'settings' && (
                        <motion.div key="settings" className="w-full flex flex-col gap-4 pb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase sticky top-0 bg-inherit z-10">Island Customization</span>
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
    </div>
  );
}
