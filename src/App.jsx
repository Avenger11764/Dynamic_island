import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, CloudSun, Music, Link as LinkIcon, ExternalLink, X, 
  Timer as TimerIcon, Activity, ChevronRight, RotateCcw, Battery, BatteryCharging, Calendar, 
  Sparkles, Power, LayoutGrid, Calculator, Folder, Settings as SettingsIcon, Signal, Volume2, 
  Sun, Download, Home, Coffee, Briefcase, File, Trash2, Plus, Minus, Monitor, MonitorOff, 
  Cpu, HardDrive, Wifi, Clock, GripVertical, GripHorizontal, Rocket, ArrowLeft, ArrowRight, ArrowUp 
} from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import WeatherIcon from './WeatherIcon';
import AudioWaveform from './AudioWaveform';

import { 
  DashboardView, 
  ControlCenterView, 
  MediaView, 
  StatsView, 
  NetworkView, 
  StopwatchView, 
  PomodoroView, 
  SettingsView, 
  ExpandedHeader, 
  ShelfBar 
} from './components/views';
import { 
  OsdAlert, 
  BluetoothAlert, 
  NotificationBanners 
} from './components/alerts';
import { BackgroundEffect } from './components/background';
import { getMaterialSurface, applyCardStyle } from './utils/materials';
import { useAlbumColors } from './utils/useAlbumColors';
import { setAudioMeter } from './utils/audioReactive';
import { useAppUpdates, splitChangelog } from './utils/useAppUpdates';
import { SourceAppIcon, BrandMark, BatteryRing } from './components/ui';
import { formatTime, formatSpeed } from './utils/formatters';
const ipcRenderer = window.electronAPI || null;

export default function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isPinnedRef = useRef(false);
  isPinnedRef.current = isPinned;
  const isSettingsWindowOpenRef = useRef(false);
  const [isSettingsWindowOpen, setIsSettingsWindowOpen] = useState(false);
  const [viewMode, setViewMode] = useState('dashboard');

  const togglePin = useCallback((val) => {
    setIsPinned(prev => {
      const next = typeof val === 'boolean' ? val : !prev;
      isPinnedRef.current = next;
      if (next) {
        setIsExpanded(true);
        if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', false);
      }
      return next;
    });
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const [time, setTime] = useState('');
  const [spotifyState, setSpotifyState] = useState(null);
  const [clipboardUrl, setClipboardUrl] = useState(null);
  const [privacy, setPrivacy] = useState({ cam: false, mic: false });
  const effectivePrivacy = privacy;
  const [localProgress, setLocalProgress] = useState(0);
  const [network, setNetwork] = useState({ rx: 0, tx: 0 });
  const [battery, setBattery] = useState({ level: 100, charging: false });
  const [greeting, setGreeting] = useState(null);
  const [volumeLevel, setVolumeLevel] = useState(65);
  const [brightnessLevel, setBrightnessLevel] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isNightLight, setIsNightLight] = useState(false);
  const [isDnd, setIsDnd] = useState(false);

  // Real Night light / Do not disturb state from Windows (kept in sync by the system worker)
  useEffect(() => {
    if (!ipcRenderer) return undefined;
    const apply = (t) => { if (!t) return; setIsNightLight(!!t.nightLight); setIsDnd(!!t.dnd); };
    ipcRenderer.invoke?.('get-system-toggles').then(apply).catch(() => {});
    ipcRenderer.on('system-toggles', apply);
    return () => ipcRenderer.removeAllListeners?.('system-toggles');
  }, []);
  const [osdAlert, setOsdAlert] = useState(null);
  const [sysAlert, setSysAlert] = useState(null);
  const [btAlert, setBtAlert] = useState(null);
  const [activeBtDevice, setActiveBtDevice] = useState(null);
  const [isBtAudio, setIsBtAudio] = useState(false);

  const btTimeoutRef = useRef(null);
  const osdTimeoutRef = useRef(null);
  const isExpandedRef = useRef(isExpanded);
  const notchContainerRef = useRef(null);
  const notchHideTimeoutRef = useRef(null);

  useEffect(() => {
    isExpandedRef.current = isExpanded;
    if (isExpanded) {
      setViewMode('dashboard');
    }
  }, [isExpanded]);

  const handleOsdEvent = useCallback((e) => {
    if (e.type === 'volume') {
      setVolumeLevel(e.value);
      if (e.isMuted !== undefined) setIsMuted(e.isMuted);
    } else if (e.type === 'brightness') {
      setBrightnessLevel(e.value);
    }
    if (!isExpandedRef.current) {
      setBtAlert(null);
      setOsdAlert(e);
      if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
      osdTimeoutRef.current = setTimeout(() => {
        setOsdAlert(null);
      }, 1800);
    }
  }, []);

  useEffect(() => {
    if (!ipcRenderer) return;
    ipcRenderer.on('osd-level', (e) => {
      handleOsdEvent(e);
    });
    ipcRenderer.on('init-levels', (levels) => {
      if (levels.volume !== undefined) setVolumeLevel(levels.volume);
      if (levels.isMuted !== undefined) setIsMuted(levels.isMuted);
      if (levels.brightness !== undefined) setBrightnessLevel(levels.brightness);
      if (levels.isBtAudio !== undefined) setIsBtAudio(levels.isBtAudio);
    });
    return () => {
      ipcRenderer.removeAllListeners('osd-level');
      ipcRenderer.removeAllListeners('init-levels');
    };
  }, [handleOsdEvent]);

  useEffect(() => {
    if (!ipcRenderer) return;
    ipcRenderer.on('bt-device-event', (e) => {
      if (e.type === 'connected') {
        setActiveBtDevice({ name: e.name, battery: e.battery });
        setBtAlert({ name: e.name, battery: e.battery, type: 'connected' });
        if (btTimeoutRef.current) clearTimeout(btTimeoutRef.current);
        btTimeoutRef.current = setTimeout(() => setBtAlert(null), 5000);
      } else if (e.type === 'battery') {
        setActiveBtDevice({ name: e.name, battery: e.battery });
      } else if (e.type === 'disconnected') {
        setActiveBtDevice(prev => (prev && prev.name !== e.name ? prev : null));
        setBtAlert({ name: e.name, type: 'disconnected' });
        if (btTimeoutRef.current) clearTimeout(btTimeoutRef.current);
        btTimeoutRef.current = setTimeout(() => setBtAlert(null), 4000);
      } else if (e.type === 'present') {
        setActiveBtDevice({ name: e.name, battery: e.battery });
        setBtAlert({ name: e.name, battery: e.battery, type: 'connected' });
        if (btTimeoutRef.current) clearTimeout(btTimeoutRef.current);
        btTimeoutRef.current = setTimeout(() => setBtAlert(null), 4000);
      }
    });
    ipcRenderer.on('bt-audio-status', (status) => {
      setIsBtAudio(status);
    });
    return () => {
      ipcRenderer.removeAllListeners('bt-device-event');
      ipcRenderer.removeAllListeners('bt-audio-status');
    };
  }, []);

  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.send('set-ignore-mouse-events', false);
      if (ipcRenderer.invoke) {
        ipcRenderer.invoke('get-volume')
          .then((v) => {
            if (v && typeof v.volume === 'number' && !isNaN(v.volume)) {
              setVolumeLevel(v.volume);
              if (v.isMuted !== undefined) setIsMuted(v.isMuted);
              if (v.isBtAudio !== undefined) setIsBtAudio(v.isBtAudio);
            }
          })
          .catch(() => {});
        ipcRenderer.invoke('get-brightness')
          .then((b) => {
            if (typeof b === 'number' && !isNaN(b)) setBrightnessLevel(b);
          })
          .catch(() => {});
      }
    }

    setGreeting('Smart Notch');
    setTimeout(() => setGreeting(null), 4000);
  }, []);

  const defaultConfig = {
    bgAnimation: 'off',
    bgColor: '#000000',
    idleColor: '#000000',
    panelStyle: 'dark-glass',
    cardStyle: 'dark',
    accentColor: 'cyan',
    glowIntensity: 'none',
    cornerShape: 'rounded',
    showWeather: true,
    showHardware: true,
    showPomodoro: true,
    showStopwatch: false,
    clockFormat: '12h',
    mode: 'notch',
    screenPosition: 'top',
    lockDrag: false,
    customBgUrl: '',
    islandScale: 1.0,
    hoverToShow: false,
    hideBehindMaximized: false,
    pinMode: false,
    runOnStartup: true,
    showMediaWidget: true,
    showHardwareWidget: true,
    showWeatherWidget: true,
    showQuickTools: true,
    showAudioWaveform: true
  };

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('smart-notch-config');
      const parsed = saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
      if (!localStorage.getItem('smart-notch-bg-off-default')) {
        parsed.bgAnimation = 'off';
        localStorage.setItem('smart-notch-bg-off-default', 'true');
      }
      delete parsed.offsetX;
      parsed.mode = parsed.mode || 'notch';
      delete parsed.autoHide;
      delete parsed.alwaysOnScreen;
      if (!localStorage.getItem('smart-notch-unlocked-drag-v2')) {
        parsed.lockDrag = false;
        localStorage.setItem('smart-notch-unlocked-drag-v2', 'true');
      }
      if (parsed.mode === 'bar') {
        parsed.hoverToShow = parsed.barHoverToShow !== undefined ? parsed.barHoverToShow : true;
      } else {
        parsed.hoverToShow = parsed.notchHoverToShow !== undefined ? parsed.notchHoverToShow : false;
      }
      return parsed;
    } catch {
      return defaultConfig;
    }
  });

  const [isResolvingBgUrl, setIsResolvingBgUrl] = useState(false);

  useEffect(() => {
    localStorage.setItem('smart-notch-config', JSON.stringify(config));
  }, [config]);

  // Real-time synchronization with external Settings window
  useEffect(() => {
    if (!ipcRenderer) return;
    const handleConfigSync = (newConfig) => {
      if (newConfig) {
        setConfig((prev) => ({ ...prev, ...newConfig }));
      }
    };
    ipcRenderer.on('config-updated', handleConfigSync);

    const handleStorage = (e) => {
      if (e.key === 'smart-notch-config' && e.newValue) {
        try {
          setConfig(JSON.parse(e.newValue));
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      ipcRenderer.removeAllListeners?.('config-updated');
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!config.customBgUrl) return;
    const url = config.customBgUrl.trim();
    if (
      (url.includes('pin.it') || url.includes('pinterest.com') || (url.includes('giphy.com') && !url.includes('media.giphy.com')) || url.includes('gph.is')) &&
      ipcRenderer && !isResolvingBgUrl
    ) {
      (async () => {
        setIsResolvingBgUrl(true);
        try {
          const res = await ipcRenderer.invoke('resolve-pinterest-url', url);
          if (res) setConfig((c) => ({ ...c, customBgUrl: res }));
        } catch (e) {
          console.error('Failed to resolve URL:', e);
        } finally {
          setIsResolvingBgUrl(false);
        }
      })();
    }
  }, [config.customBgUrl]);

  const activeAccentHex = config.accentColor !== 'rgb' && config.accentColor?.startsWith('#') ? config.accentColor : '#06b6d4';
  const albumColors = useAlbumColors(spotifyState?.item?.album?.images?.[0]?.url || '');
  // Stream output levels for the beat-synced lights only while something is playing
  const isMediaPlaying = !!spotifyState?.is_playing;
  useEffect(() => {
    setAudioMeter(isMediaPlaying);
  }, [isMediaPlaying]);
  useEffect(() => () => setAudioMeter(false), []);

  useEffect(() => {
    if (ipcRenderer && config.screenPosition) {
      ipcRenderer.send('set-screen-position', config.screenPosition, { ignoreBounds: window.isDraggingUpdate });
      window.isDraggingUpdate = false;
    }
  }, [config.screenPosition]);

  useEffect(() => {
    if (config.pinMode) {
      setIsPinned(true);
      setIsExpanded(true);
      if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', false);
    } else {
      setIsPinned(false);
    }
  }, [config.pinMode]);

  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.send('set-hide-behind-maximized', !!config.hideBehindMaximized);
    }
  }, [config.hideBehindMaximized]);

  const [isHoverRevealed, setIsHoverRevealed] = useState(false);
  const hoverHideTimeoutRef = useRef(null);

  const handleHoverRevealEnter = useCallback(() => {
    if (hoverHideTimeoutRef.current) {
      clearTimeout(hoverHideTimeoutRef.current);
      hoverHideTimeoutRef.current = null;
    }
    setIsHoverRevealed(true);
    if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', false);
  }, []);

  const handleHoverRevealLeave = useCallback(() => {
    if (hoverHideTimeoutRef.current) clearTimeout(hoverHideTimeoutRef.current);
    const delay = config.hoverToShow ? 5000 : 350;
    hoverHideTimeoutRef.current = setTimeout(() => {
      setIsHoverRevealed(false);
      if (!isExpandedRef.current && !isPinnedRef.current) {
        if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
      }
    }, delay);
  }, [config.hoverToShow]);

  useEffect(() => {
    if (!ipcRenderer) return;
    ipcRenderer.on('window-dragged-to', (pos) => {
      window.isDraggingUpdate = true;
      setConfig((c) => ({ ...c, screenPosition: pos }));
    });
    return () => ipcRenderer.removeAllListeners('window-dragged-to');
  }, []);

  const getRgbGlowClass = () => {
    if (config.glowIntensity === 'none') return '';
    if (config.accentColor === 'rgb') {
      if (config.glowIntensity === 'high') return 'rgb-shadow-high';
      if (config.glowIntensity === 'low') return 'rgb-shadow-low';
      return 'rgb-shadow-med';
    }
    return '';
  };

  const getNotchGlowStyle = () => {
    const baseShadows = [
      '0 12px 32px -10px rgba(0, 0, 0, 0.7)',
      '0 4px 12px -4px rgba(0, 0, 0, 0.5)'
    ];
    if (isDragging) return { boxShadow: 'none' };
    // Hairline keeps the black notch legible on dark wallpapers
    baseShadows.unshift(`0 0 0 1px rgba(255, 255, 255, ${isExpanded ? 0.08 : 0.05})`);
    if ((isExpanded || isNotification) && config.panelStyle === 'glass') {
      baseShadows.unshift('inset 0 1px 0 rgba(255, 255, 255, 0.12)');
    }
    const glow = { low: [14, 0.12], medium: [14, 0.12], high: [28, 0.24] }[config.glowIntensity];
    if (config.accentColor !== 'rgb' && glow) {
      const hex = config.accentColor?.startsWith('#') ? config.accentColor : '#06b6d4';
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      baseShadows.push(`0 0 ${glow[0]}px rgba(${r},${g},${b},${glow[1]})`);
    }
    return { boxShadow: baseShadows.join(', ') };
  };

  const getTextGlowStyle = (isIdle) => {
    if (config.glowIntensity === 'none') {
      return isIdle ? (idleTextColor === 'black' ? 'text-black/90' : 'text-white/90') : '';
    }
    if (config.accentColor === 'rgb') return 'rgb-text';
    const textColors = {
      '#06b6d4': isIdle ? 'text-cyan-300' : 'text-cyan-100',
      '#a855f7': isIdle ? 'text-purple-300' : 'text-purple-100',
      '#00cc44': isIdle ? 'text-green-300' : 'text-green-100',
      '#ec4899': isIdle ? 'text-pink-300' : 'text-pink-100',
      '#ff6600': isIdle ? 'text-orange-300' : 'text-orange-100',
      '#ff0000': isIdle ? 'text-red-300' : 'text-red-100',
      '#ffcc00': isIdle ? 'text-yellow-300' : 'text-yellow-100',
      '#3b82f6': isIdle ? 'text-blue-300' : 'text-blue-100',
      '#ffffff': isIdle ? 'text-white' : 'text-white/90'
    };
    return textColors[config.accentColor] || (config.accentColor?.startsWith('#') ? '' : 'text-cyan-100');
  };

  const getTextShadowStyle = (isIdle) => {
    if (config.accentColor === 'rgb') return {};
    const hex = config.accentColor?.startsWith('#') ? config.accentColor : '#06b6d4';
    const hexToRgba = (h, a) => {
      try {
        return `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
      } catch {
        return `rgba(6,182,212,${a})`;
      }
    };
    const style = {};
    if (hex && hex !== '#ffffff') {
      style.color = hex;
    }
    if (config.glowIntensity !== 'none') {
      style.textShadow = `0 0 ${isIdle ? '8px' : '5px'} ${hexToRgba(hex, isIdle ? 0.8 : 0.6)}`;
    }
    return style;
  };

  // Views sit directly on the notch surface; cards inside provide their own subtle fills.
  const getPanelBorderStyle = () => '';
  const getPanelBorderStyleInline = () => ({});

  // Widget card darkness (Settings → Appearance → Cards)
  useEffect(() => { applyCardStyle(config.cardStyle); }, [config.cardStyle]);

  // Expanded-notch material (Settings → Appearance → Material)
  const expandedSurface = getMaterialSurface(config.panelStyle, config.bgColor);

  const getRadius = (type) => {
    if (config.cornerShape === 'rounded') {
      return type === 'expanded' ? 18 : 8;
    }
    return type === 'expanded' ? 38 : 20;
  };

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
    } catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem('smart-notch-pomo-tasks', JSON.stringify(pomoTasks));
  }, [pomoTasks]);

  const [taskInput, setTaskInput] = useState('');
  const handleAddTask = () => {
    if (!taskInput.trim()) return;
    const newTask = { id: Date.now(), text: taskInput.trim(), completed: false };
    setPomoTasks([...pomoTasks, newTask]);
    setTaskInput('');
  };

  const handleToggleTask = (id) => {
    setPomoTasks(pomoTasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleDeleteTask = (id) => {
    setPomoTasks(pomoTasks.filter((t) => t.id !== id));
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
      playTone(now, 587.33);
      playTone(now + 0.15, 880);
    } catch (err) {
      console.warn('Failed to play audio chime:', err);
    }
  };

  // Version, update status and "what's new" come from the main process (updater.js)
  const updates = useAppUpdates();
  const CURRENT_VERSION = updates.currentVersion || '';
  const updateAvailable = updates.updateAvailable;
  const latestVersion = updates.latestVersion;
  const whatsNewAvailable = updates.whatsNew;
  const changelog = updates.changelog;
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const setWhatsNewAvailable = (v) => { if (!v) updates.dismissWhatsNew(); };

  // One-time notch notices: "What's new" after an update, "Update available" once per version
  const [appNotice, setAppNotice] = useState(null);
  const appNoticeTimerRef = useRef(null);
  const whatsNewShownRef = useRef(false);

  const closeAppNotice = useCallback((kind) => {
    if (appNoticeTimerRef.current) clearTimeout(appNoticeTimerRef.current);
    appNoticeTimerRef.current = null;
    setAppNotice(null);
    if (kind === 'whatsnew') updates.dismissWhatsNew();
  }, [updates.dismissWhatsNew]);

  const handleAppNoticeAction = useCallback((notice) => {
    if (!notice) return;
    if (notice.kind === 'update') updates.openUpdate();
    else if (ipcRenderer) {
      isSettingsWindowOpenRef.current = true;
      setIsSettingsWindowOpen(true);
      ipcRenderer.send('open-settings-window', 'about');
    }
    closeAppNotice(notice.kind);
  }, [closeAppNotice, updates.openUpdate]);

  const [activeCall, setActiveCall] = useState({ isActive: false, appName: '', title: '', handle: 0, isForeground: true });
  useEffect(() => {
    if (appNotice || greeting) return undefined;
    if (clipboardUrl || batteryEvent || meetingAlert || boostAlert || isBoosting || sysNotification || osdAlert || btAlert) return undefined;
    let next = null;
    if (updates.whatsNew && !whatsNewShownRef.current && updates.currentVersion) {
      const first = splitChangelog(updates.changelog[0] || '');
      next = { kind: 'whatsnew', version: updates.currentVersion, detail: first.title || first.body || 'See what changed' };
    } else if (updates.updateNeedsNotice && updates.latestVersion) {
      next = { kind: 'update', version: updates.latestVersion, detail: 'Update from the Microsoft Store' };
    }
    if (!next) return undefined;
    const t = setTimeout(() => {
      if (next.kind === 'whatsnew') whatsNewShownRef.current = true;
      else updates.markUpdateNotified();
      setAppNotice(next);
      if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', false);
      appNoticeTimerRef.current = setTimeout(() => closeAppNotice(next.kind), 12000);
    }, 2500);
    return () => clearTimeout(t);
  }, [appNotice, greeting, clipboardUrl, batteryEvent, meetingAlert, boostAlert, isBoosting, sysNotification, osdAlert, btAlert,
      updates.whatsNew, updates.updateNeedsNotice, updates.currentVersion, updates.latestVersion, updates.changelog, updates.isStore,
      updates.markUpdateNotified, closeAppNotice]);

  const isNotification = !!(clipboardUrl || batteryEvent || meetingAlert || boostAlert || isBoosting || sysNotification || appNotice || osdAlert || btAlert);
  const isNotificationRef = useRef(false);
  isNotificationRef.current = isNotification;

  const isNotchHidden = Boolean(
    config.hoverToShow &&
    !isHoverRevealed &&
    !isExpanded &&
    !osdAlert &&
    !btAlert &&
    !isNotification &&
    !isPinned &&
    !isDragging
  );

  useEffect(() => {
    let battRef = null;
    let onChargingChange = null;
    let onLevelChange = null;

    if ('getBattery' in navigator) {
      navigator.getBattery().then((batt) => {
        battRef = batt;
        setBattery({ level: Math.round(batt.level * 100), charging: batt.charging });
        let prevCharging = batt.charging;
        let prevLevel = batt.level;

        onChargingChange = () => {
          setBattery((b) => ({ ...b, charging: batt.charging }));
          if (batt.charging !== prevCharging) {
            prevCharging = batt.charging;
            setBatteryEvent({ charging: batt.charging, level: Math.round(batt.level * 100), seconds: batt.charging ? batt.chargingTime : batt.dischargingTime });
            setTimeout(() => setBatteryEvent(null), 5000);
          }
        };

        onLevelChange = () => {
          setBattery((b) => ({ ...b, level: Math.round(batt.level * 100) }));
          if (!batt.charging && Math.round(batt.level * 100) === 20 && Math.round(prevLevel * 100) > 20) {
            setBatteryEvent({ charging: false, level: Math.round(batt.level * 100), low: true, seconds: batt.dischargingTime });
            setTimeout(() => setBatteryEvent(null), 8000);
          }
          prevLevel = batt.level;
        };

        batt.addEventListener('chargingchange', onChargingChange);
        batt.addEventListener('levelchange', onLevelChange);
      });
    }

    return () => {
      if (battRef) {
        if (onChargingChange) battRef.removeEventListener('chargingchange', onChargingChange);
        if (onLevelChange) battRef.removeEventListener('levelchange', onLevelChange);
      }
    };
  }, []);

  useEffect(() => {
    fetch('https://wttr.in/?format=j1')
      .then((res) => res.json())
      .then((data) => {
        const cond = data.current_condition[0];
        setWeather({ temp: `${cond.temp_C}°C`, desc: cond.weatherDesc[0].value });
      })
      .catch(() => setWeather({ temp: 'Err', desc: 'Offline' }));
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
      interval = setInterval(() => setPomodoro((p) => p - 1), 1000);
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

  useEffect(() => {
    const handleWheel = (e) => {
      const volTarget = e.target.closest('[data-volume-slider], [data-scroll-volume], .volume-control-target');
      const brightTarget = e.target.closest('[data-brightness-slider], [data-scroll-brightness], .brightness-control-target');
      if (!volTarget && !brightTarget) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY !== 0) {
        if (brightTarget) {
          if (ipcRenderer) ipcRenderer.send('adjust-brightness', e.deltaY > 0 ? -5 : 5);
        } else {
          if (ipcRenderer) ipcRenderer.send('adjust-volume', e.deltaY > 0 ? -2 : 2);
        }
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    if (!ipcRenderer) return;
    ipcRenderer.on('spotify-state', (state) => {
      // Media updates arrive every ~0.8s. Only re-render when something visible changed
      // (track, play state, artwork, lyrics); the position is tracked locally and only
      // re-synced when it drifts.
      setSpotifyState((prev) => {
        if (!state) return prev === null ? prev : null;
        const album = state.artUnchanged && state.item && !state.item.album
          ? (prev?.item?.album || { images: [{ url: '' }] })
          : state.item?.album;
        const same = prev && prev.item && state.item &&
          prev.item.id === state.item.id &&
          prev.is_playing === state.is_playing &&
          prev.duration_ms === state.duration_ms &&
          prev.sourceAppId === state.sourceAppId &&
          (prev.lyrics?.length || 0) === (state.lyrics?.length || 0) &&
          prev.item.album === album;
        if (same) return prev;
        return { ...state, item: state.item ? { ...state.item, album } : state.item };
      });
      if (state && typeof state.progress_ms === 'number') {
        setLocalProgress((p) => (Math.abs(p - state.progress_ms) > 1200 || !state.is_playing ? state.progress_ms : p));
      }
    });
    ipcRenderer.on('clipboard-url', (url) => {
      setClipboardUrl(url);
      ipcRenderer.send('set-ignore-mouse-events', false);
      setTimeout(() => setClipboardUrl(null), 6000);
    });
    // Skip re-renders when the values didn't actually change
    const shallowSame = (a, b) => a && b && Object.keys(b).every((k) => a[k] === b[k]);
    ipcRenderer.on('hardware-stats', (stats) => setHardware((prev) => (shallowSame(prev, stats) ? prev : stats)));
    ipcRenderer.on('privacy-dots', (p) => setPrivacy((prev) => (shallowSame(prev, p) ? prev : p)));
    ipcRenderer.on('network-stats', (stats) => setNetwork((prev) => (shallowSame(prev, stats) ? prev : stats)));
    ipcRenderer.on('active-call-status', (call) => setActiveCall((prev) => (shallowSame(prev, call) ? prev : call)));
    ipcRenderer.on('system-notification', (n) => {
      if (sysNotificationTimeoutRef.current) clearTimeout(sysNotificationTimeoutRef.current);
      setSysNotification(n);
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
      if (sysNotificationTimeoutRef.current) clearTimeout(sysNotificationTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: config.clockFormat === '12h' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [config.clockFormat]);

  // Advance the song position locally. Fine-grained only when a progress bar or
  // lyrics can be on screen (expanded notch or bar mode); once a second otherwise.
  const progressStep = isExpanded || config.mode === 'bar' ? 250 : 1000;
  useEffect(() => {
    let interval;
    if (spotifyState?.is_playing) {
      interval = setInterval(() => setLocalProgress((p) => p + progressStep), progressStep);
    }
    return () => clearInterval(interval);
  }, [spotifyState?.is_playing, progressStep]);

  const getCurrentLyric = useCallback(() => {
    if (!spotifyState?.lyrics || spotifyState.lyrics.length === 0) return null;
    let current = '';
    for (let i = 0; i < spotifyState.lyrics.length && localProgress + 400 >= spotifyState.lyrics[i].timeMs; i++) {
      current = spotifyState.lyrics[i].text;
    }
    return current;
  }, [spotifyState?.lyrics, localProgress]);

  const isSpotify = !!spotifyState?.isSpotify;
  const handleProgressBarClick = (e) => {
    if (!spotifyState?.item) return;
    const duration = spotifyState.duration_ms || spotifyState.item?.duration_ms || 0;
    if (!duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    const targetMs = Math.round(percentage * duration);
    setLocalProgress(targetMs);
    if (ipcRenderer) ipcRenderer.send('spotify-seek', targetMs);
  };

  const [shelfVisible, setShelfVisible] = useState(() => (config.mode === 'bar' ? !config.hoverToShow : false));
  const shelfVisibleRef = useRef(false);
  shelfVisibleRef.current = shelfVisible;
  const initialShelfHoldRef = useRef(false);
  const [isDragMoving, setIsDragMoving] = useState(false);
  const [dragPreviewPosition, setDragPreviewPosition] = useState('top');
  const shelfHideTimeoutRef = useRef(null);

  const handleCustomDragStart = (e) => {
    if (
      e.button !== 0 ||
      config.lockDrag ||
      e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('textarea') ||
      e.target.closest('select') ||
      e.target.closest('a') ||
      e.target.closest('.no-drag') ||
      e.target.closest('[role="button"]') ||
      e.target.closest('.cursor-pointer')
    ) {
      return;
    }
    const startX = e.clientX;
    const startY = e.clientY;
    // Capture on <body>: it never unmounts (the bar is swapped for the drag card mid-drag)
    const target = document.body;
    const pointerId = e.pointerId;
    let hasStartedDrag = false;

    const handlePointerMove = (moveEvent) => {
      if (hasStartedDrag) return; // the main process follows the cursor once dragging
      if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) > 6) {
        hasStartedDrag = true;
        // Keep receiving pointerup even if the cursor leaves the small drag window
        try { target?.setPointerCapture?.(pointerId); } catch (_) {}
        setDragPreviewPosition(config.screenPosition === 'left' || config.screenPosition === 'right' ? config.screenPosition : 'top');
        setIsDragging(true);
        if (ipcRenderer) ipcRenderer.send('custom-drag-start');
      }
    };

    const handlePointerUpOrCancel = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUpOrCancel);
      window.removeEventListener('pointercancel', handlePointerUpOrCancel);
      target?.removeEventListener?.('lostpointercapture', handlePointerUpOrCancel);
      try { target?.releasePointerCapture?.(pointerId); } catch (_) {}
      if (hasStartedDrag) {
        hasStartedDrag = false;
        setIsDragging(false);
        setIsExpanded(false);
        if (ipcRenderer) ipcRenderer.send('custom-drag-end');
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUpOrCancel);
    window.addEventListener('pointercancel', handlePointerUpOrCancel);
    target?.addEventListener?.('lostpointercapture', handlePointerUpOrCancel);
  };

  useEffect(() => {
    if (!ipcRenderer) return;
    ipcRenderer.on('drag-snap-preview', (pos) => { if (pos) setDragPreviewPosition(pos); });
    ipcRenderer.on('drag-snap-end', () => setIsDragging(false));
    return () => {
      ipcRenderer.removeAllListeners('drag-snap-preview');
      ipcRenderer.removeAllListeners('drag-snap-end');
    };
  }, []);

  useEffect(() => {
    if (!ipcRenderer) return;
    if (config.mode === 'bar') {
      const isSide = config.screenPosition === 'left' || config.screenPosition === 'right';
      ipcRenderer.send('set-window-mode', 'shelf', config.screenPosition);
      ipcRenderer.send('set-shelf-height', isSide ? 160 : 64);
      ipcRenderer.send('set-ignore-mouse-events', false);
      setShelfVisible(true);
      setIsExpanded(false);
      initialShelfHoldRef.current = false;
    } else {
      ipcRenderer.send('set-window-mode', 'notch', config.screenPosition);
      ipcRenderer.send('set-ignore-mouse-events', isExpanded ? false : true, { forward: true });
      setShelfVisible(false);
      initialShelfHoldRef.current = false;
    }
  }, [config.mode, config.screenPosition]);

  useEffect(() => {
    if (!ipcRenderer || config.mode === 'bar') return;
    ipcRenderer.send('set-ignore-mouse-events', isExpanded ? false : true, { forward: true });
  }, [isExpanded, config.mode]);

  useEffect(() => {
    if (config.mode !== 'bar') return;
    const handleBarHoverTrigger = (e) => {
      const isLeft = config.screenPosition === 'left';
      const isRight = config.screenPosition === 'right';
      const inEdge = isLeft ? e.clientX <= 5 : (isRight ? e.clientX >= window.innerWidth - 5 : e.clientY <= 5);
      if (inEdge && !shelfVisible) {
        handleShelfMouseEnter();
      }
    };
    window.addEventListener('mousemove', handleBarHoverTrigger);
    return () => window.removeEventListener('mousemove', handleBarHoverTrigger);
  }, [config.mode, config.screenPosition, shelfVisible]);

  const handleShelfMouseEnter = () => {
    initialShelfHoldRef.current = false;
    isMouseOverShelfRef.current = true;
    if (shelfHideTimeoutRef.current) {
      clearTimeout(shelfHideTimeoutRef.current);
      shelfHideTimeoutRef.current = null;
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
    if (isDragging) return;
    if (isNotificationRef.current) return;
    const isInput = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
    if (isInput) return;
    if (shelfSettingsOpenRef.current) return;
    if (isSettingsWindowOpenRef.current) return;
    if (!config.hoverToShow) return; // Persistent unless user explicitly enabled hoverToShow

    if (shelfHideTimeoutRef.current) clearTimeout(shelfHideTimeoutRef.current);
    const delay = config.hoverToShow ? 2000 : 150;
    shelfHideTimeoutRef.current = setTimeout(() => {
      setShelfVisible(false);
      if (ipcRenderer) {
        setTimeout(() => {
          if (!shelfVisibleRef.current) ipcRenderer.send('set-shelf-height', 6);
        }, 220);
      }
    }, delay);
  };

  useEffect(() => {
    if (config.mode === 'bar' && ipcRenderer) {
      if (isNotification || !config.hoverToShow) {
        setShelfVisible(true);
        const isSide = config.screenPosition === 'left' || config.screenPosition === 'right';
        ipcRenderer.send('set-shelf-height', isSide ? 160 : 64);
        ipcRenderer.send('set-ignore-mouse-events', false);
      } else if (!isMouseOverShelfRef.current) {
        handleShelfMouseLeave();
      }
    }
  }, [isNotification, config.mode, config.screenPosition, config.hoverToShow]);

  // Auto-shrink logic: Automatically compress notch to 28px mode after 15s of complete inactivity
  const isIgnoringHoverRef = useRef(false);
  const [isAutoShrunk, setIsAutoShrunk] = useState(false);
  const autoShrinkTimerRef = useRef(null);

  const startAutoShrinkTimer = useCallback(() => {
    if (autoShrinkTimerRef.current) {
      clearTimeout(autoShrinkTimerRef.current);
      autoShrinkTimerRef.current = null;
    }
    autoShrinkTimerRef.current = setTimeout(() => {
      setIsAutoShrunk(true);
    }, 15000);
  }, []);

  const resetAutoShrinkTimer = useCallback(() => {
    if (autoShrinkTimerRef.current) {
      clearTimeout(autoShrinkTimerRef.current);
      autoShrinkTimerRef.current = null;
    }
    setIsAutoShrunk(false);
  }, []);

  useEffect(() => {
    if (isExpanded || isDragging || osdAlert || isNotification || isPinned) {
      resetAutoShrinkTimer();
    } else {
      startAutoShrinkTimer();
    }
    return () => {
      if (autoShrinkTimerRef.current) clearTimeout(autoShrinkTimerRef.current);
    };
  }, [isExpanded, isDragging, osdAlert, isNotification, isPinned, startAutoShrinkTimer, resetAutoShrinkTimer]);

  const handleMouseEnter = () => {
    if (notchHideTimeoutRef.current) {
      clearTimeout(notchHideTimeoutRef.current);
      notchHideTimeoutRef.current = null;
    }
    resetAutoShrinkTimer();
    if (!isIgnoringHoverRef.current) {
      if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', false);
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = (e) => {
    if (isDragging || isPinnedRef.current) return;
    const isInput = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
    if (isInput) return;

    // Check if cursor is still within a tiny boundary around the notch
    if (isExpanded && notchContainerRef.current && e && e.clientX !== undefined && e.clientY !== undefined) {
      const rect = notchContainerRef.current.getBoundingClientRect();
      const buffer = 4;
      const inBox = (
        e.clientX >= rect.left - buffer &&
        e.clientX <= rect.right + buffer &&
        e.clientY >= rect.top - buffer &&
        e.clientY <= rect.bottom + buffer
      );
      if (inBox) return;
    }

    if (notchHideTimeoutRef.current) clearTimeout(notchHideTimeoutRef.current);
    notchHideTimeoutRef.current = setTimeout(() => {
      if (isDragging || isPinnedRef.current) return;
      setIsExpanded(false);
      if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
    }, 220);
  };

  // Reliably collapse notch whenever cursor moves outside of its bounds
  useEffect(() => {
    if (!isExpanded || isPinned || isDragging || config.mode !== 'notch') return;

    const handleWindowMouseMove = (e) => {
      if (isPinnedRef.current || isDragging) return;
      const isInput = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
      if (isInput) return;

      if (!notchContainerRef.current) return;
      const rect = notchContainerRef.current.getBoundingClientRect();
      const buffer = 6;
      const inside = (
        e.clientX >= rect.left - buffer &&
        e.clientX <= rect.right + buffer &&
        e.clientY >= rect.top - buffer &&
        e.clientY <= rect.bottom + buffer
      );

      if (!inside) {
        if (!notchHideTimeoutRef.current) {
          notchHideTimeoutRef.current = setTimeout(() => {
            if (isDragging || isPinnedRef.current) return;
            setIsExpanded(false);
            if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
          }, 220);
        }
      } else {
        if (notchHideTimeoutRef.current) {
          clearTimeout(notchHideTimeoutRef.current);
          notchHideTimeoutRef.current = null;
        }
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
    };
  }, [isExpanded, isPinned, isDragging, config.mode]);

  const handleDismissNotch = (force = false) => {
    if (notchHideTimeoutRef.current) {
      clearTimeout(notchHideTimeoutRef.current);
      notchHideTimeoutRef.current = null;
    }
    if (isDragging) return;
    if (isPinnedRef.current && !force) return;
    setIsPinned(false);
    isPinnedRef.current = false;
    isIgnoringHoverRef.current = true;
    setIsExpanded(false);
    if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
    setTimeout(() => {
      isIgnoringHoverRef.current = false;
    }, 500);
  };

  useEffect(() => {
    if (!ipcRenderer) return;

    const onSettingsOpen = () => {
      isSettingsWindowOpenRef.current = true;
      setIsSettingsWindowOpen(true);
      if (config.mode === 'notch') {
        if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', false);
        setIsExpanded(true);
      } else if (config.mode === 'bar') {
        handleShelfMouseEnter();
      }
    };

    const onSettingsClose = () => {
      isSettingsWindowOpenRef.current = false;
      setIsSettingsWindowOpen(false);
      if (config.mode === 'notch') {
        handleDismissNotch(true);
      } else if (config.mode === 'bar') {
        handleShelfMouseLeave();
      }
    };

    ipcRenderer.on('settings-window-opened', onSettingsOpen);
    ipcRenderer.on('settings-window-closed', onSettingsClose);

    ipcRenderer.on('window-blur', () => {
      if (!isDragging && !isPinnedRef.current && !isSettingsWindowOpenRef.current) {
        if (config.mode === 'notch') handleDismissNotch();
        else if (config.mode === 'bar' && config.hoverToShow) handleShelfMouseLeave();
      }
    });
    ipcRenderer.on('force-collapse-shelf', () => {
      if (!isDragging && config.mode === 'bar' && !isSettingsWindowOpenRef.current && config.hoverToShow) {
        handleShelfMouseLeave();
      }
    });
    ipcRenderer.on('expand-shelf', handleShelfMouseEnter);
    return () => {
      ipcRenderer.removeAllListeners('settings-window-opened');
      ipcRenderer.removeAllListeners('settings-window-closed');
      ipcRenderer.removeAllListeners('window-blur');
      ipcRenderer.removeAllListeners('force-collapse-shelf');
      ipcRenderer.removeAllListeners('expand-shelf');
    };
  }, [config.mode, isDragging, config.hoverToShow]);

  const formatDate = useCallback(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, []);

  const idleTextColor = useMemo(() => {
    try {
      const hex = (!isExpanded && !isNotification && config.idleColor) || config.bgColor;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? 'black' : 'white';
    } catch {
      return 'white';
    }
  }, [isExpanded, isNotification, config.idleColor, config.bgColor]);

  const idleTextClass = idleTextColor === 'black' ? 'text-black' : 'text-white';
  const isSidePosition = config.screenPosition === 'left' || config.screenPosition === 'right';

  const handleTogglePlay = useCallback(() => {
    const nextPlay = !spotifyState?.is_playing;
    setSpotifyState((s) => s && { ...s, is_playing: nextPlay });
    if (ipcRenderer) ipcRenderer.send(nextPlay ? 'spotify-play' : 'spotify-pause');
  }, [spotifyState?.is_playing]);

  const handlePrev = useCallback(() => ipcRenderer?.send('spotify-prev'), []);
  const handleSkip = useCallback(() => ipcRenderer?.send('spotify-skip'), []);
  const handleOpenMediaApp = useCallback((appId, title, artist) => {
    if (ipcRenderer) ipcRenderer.send('open-media-app', appId, title, artist);
  }, []);
  const handleOpenWeather = useCallback(() => {
    if (ipcRenderer) ipcRenderer.send('open-weather');
  }, []);
  const handleQuit = useCallback(() => ipcRenderer?.send('quit-app'), []);
  const handleShowSettings = useCallback(() => {
    if (ipcRenderer) {
      isSettingsWindowOpenRef.current = true;
      setIsSettingsWindowOpen(true);
      if (config.mode === 'notch') {
        setIsExpanded(false);
        ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
      }
      ipcRenderer.send('open-settings-window');
    } else {
      setShelfSettingsOpen((prev) => !prev);
    }
  }, [config.mode]);

  const handleBoost = useCallback(async () => {
    if (isBoosting) return;
    setIsBoosting(true);
    setBoostProgress(null);
    if (ipcRenderer) ipcRenderer.on('boost-progress', (e, p) => setBoostProgress(p));
    try {
      const res = await ipcRenderer.invoke('boost-system');
      setBoostAlert({ freedMB: res?.freedMB || 0, apps: res?.apps || 0 });
      setTimeout(() => setBoostAlert(null), 5000);
    } finally {
      if (ipcRenderer) ipcRenderer.removeAllListeners('boost-progress');
      setIsBoosting(false);
    }
  }, [isBoosting]);

  const renderDragCard = () => (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
              >
                <div
                  className="h-[44px] pl-2 pr-4 rounded-full flex items-center gap-2.5"
                  style={{
                    backgroundColor: '#0b0b0d',
                    boxShadow: '0 14px 32px -6px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.1)'
                  }}
                >
                  <span className="w-7 h-7 rounded-full bg-white/[0.1] flex items-center justify-center text-white">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={dragPreviewPosition}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.12 }}
                        className="flex"
                      >
                        {dragPreviewPosition === 'left' ? <ArrowLeft size={14} strokeWidth={2.2} /> : dragPreviewPosition === 'right' ? <ArrowRight size={14} strokeWidth={2.2} /> : <ArrowUp size={14} strokeWidth={2.2} />}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[10px] font-medium text-white/45">Drop to dock</span>
                    <span className="text-[12.5px] font-semibold text-white">
                      {dragPreviewPosition === 'left' ? 'Left edge' : dragPreviewPosition === 'right' ? 'Right edge' : 'Top'}
                    </span>
                  </span>
                </div>
              </motion.div>
  );

  if (config.mode === 'bar') {
    return (
      <div className="w-full h-full fixed top-0 left-0" style={{ pointerEvents: 'none' }}>
        <div 
          className={`fixed z-[100] ${isSidePosition ? (config.screenPosition === 'left' ? 'top-0 left-0 bottom-0 w-[6px]' : 'top-0 right-0 bottom-0 w-[6px]') : 'top-0 left-0 right-0 h-[6px]'}`}
          style={{ pointerEvents: shelfVisible ? 'none' : 'auto', backgroundColor: 'rgba(255, 255, 255, 0.01)' }}
          onMouseEnter={handleShelfMouseEnter}
        />
        <div 
          className="w-full h-full absolute inset-0"
          onMouseEnter={handleShelfMouseEnter}
          onMouseLeave={handleShelfMouseLeave}
          style={{ pointerEvents: shelfVisible ? 'auto' : 'none' }}
        >
          {isDragging && (
            <div className="fixed inset-0" style={{ pointerEvents: 'auto' }}>{renderDragCard()}</div>
          )}
          <AnimatePresence>
            {shelfVisible && !isDragging && (
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
                privacy={effectivePrivacy}
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
                appNotice={appNotice}
                onAppNoticeAction={handleAppNoticeAction}
                onAppNoticeClose={closeAppNotice}
                updateAvailable={updateAvailable}
                whatsNewAvailable={whatsNewAvailable}
                onSeek={handleProgressBarClick}
                volumeLevel={volumeLevel}
                setVolumeLevel={setVolumeLevel}
                brightnessLevel={brightnessLevel}
                setBrightnessLevel={setBrightnessLevel}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                isDnd={isDnd}
                setIsDnd={setIsDnd}
                isNightLight={isNightLight}
                setIsNightLight={setIsNightLight}
                togglePomo={togglePomo}
                resetPomo={resetPomo}
                switchPomoMode={switchPomoMode}
                toggleSw={toggleSw}
                resetSw={resetSw}
                isBtAudio={isBtAudio}
                activeBtDevice={activeBtDevice}
                ipcRenderer={ipcRenderer}
                onPointerDown={handleCustomDragStart}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full h-full flex overflow-hidden fixed top-0 left-0 ${isDragging ? 'justify-center items-center' : (config.screenPosition === 'left' ? 'justify-start items-center' : (config.screenPosition === 'right' ? 'justify-end items-center' : (config.screenPosition === 'top-left' ? 'justify-start items-start' : (config.screenPosition === 'top-right' ? 'justify-end items-start' : 'justify-center items-start'))))}`}
      style={{ pointerEvents: isExpanded || isDragging ? 'auto' : 'none' }}
      onClick={() => {
        if (isExpanded && !isDragging) handleDismissNotch();
      }}
    >
      {/* Edge Hover Strip for Hover-to-Show Mode - Only active when notch is hidden off-screen */}
      {config.hoverToShow && isNotchHidden && (
        <div
          className={`fixed z-[99] ${
            config.screenPosition === 'left' || config.screenPosition === 'right'
              ? (config.screenPosition === 'left' ? 'top-1/4 bottom-1/4 left-0 w-8' : 'top-1/4 bottom-1/4 right-0 w-8')
              : (config.screenPosition === 'top-left' ? 'top-0 left-0 w-80 h-7' : (config.screenPosition === 'top-right' ? 'top-0 right-0 w-80 h-7' : 'top-0 left-1/2 -translate-x-1/2 w-96 h-7'))
          }`}
          style={{ pointerEvents: 'auto', backgroundColor: 'rgba(255, 255, 255, 0.01)' }}
          onMouseEnter={() => {
            handleHoverRevealEnter();
            handleMouseEnter();
          }}
          onMouseMove={() => {
            handleHoverRevealEnter();
            handleMouseEnter();
          }}
        />
      )}
      {(() => {
        const isSideNotch = config.screenPosition === 'left' || config.screenPosition === 'right';
        return (
          <motion.div
            ref={notchContainerRef}
            onClick={(e) => {
              e.stopPropagation();
              handleHoverRevealEnter();
              if (!isExpanded) {
                if (ipcRenderer) ipcRenderer.send('set-ignore-mouse-events', false);
                setIsExpanded(true);
              }
            }}
            onContextMenu={() => {
              if (ipcRenderer) ipcRenderer.send('show-context-menu');
            }}
            onMouseMove={() => {
              if (notchHideTimeoutRef.current) {
                clearTimeout(notchHideTimeoutRef.current);
                notchHideTimeoutRef.current = null;
              }
              if (hoverHideTimeoutRef.current) {
                clearTimeout(hoverHideTimeoutRef.current);
                hoverHideTimeoutRef.current = null;
              }
            }}
            onMouseEnter={() => {
              handleHoverRevealEnter();
              handleMouseEnter();
            }}
            onMouseLeave={(e) => {
              handleHoverRevealLeave();
              handleMouseLeave(e);
            }}
            initial={{
              borderBottomLeftRadius: config.screenPosition === 'left' ? 0 : 100,
              borderBottomRightRadius: config.screenPosition === 'right' ? 0 : 100,
              borderTopLeftRadius: (config.screenPosition === 'left' || config.screenPosition?.startsWith('top')) ? 0 : 100,
              borderTopRightRadius: (config.screenPosition === 'right' || config.screenPosition?.startsWith('top')) ? 0 : 100
            }}
            animate={{
              y: isNotchHidden ? (isSideNotch ? 0 : -70) : 0,
              x: isNotchHidden ? (isSideNotch ? (config.screenPosition === 'left' ? -70 : 70) : 0) : 0,
              opacity: isNotchHidden ? 0 : 1,
              scale: config.islandScale || 1.0,
              width: (() => {
                if (isDragging) return 140;
                if (osdAlert) return isSideNotch ? 46 : 300;
                if (btAlert) return isSideNotch ? 104 : 340;
                if (isNotification && isSideNotch) return 150; // side dock: popups grow vertically
                if (batteryEvent && !osdAlert && !btAlert && !appNotice) return 340;
                if (appNotice && !osdAlert && !btAlert) return 420;
                if (isNotification) return 360;
                if (isExpanded) {
                  return isSideNotch ? (viewMode === 'settings' ? 380 : 340) : (viewMode === 'dashboard' ? 560 : 480);
                }
                if (isSideNotch) return 42;
                if (greeting) return 240;
                let baseWidth = 170;
                if (isPomoRunning || isSwRunning) {
                  baseWidth = 200;
                } else if (config.clockFormat === '12h') {
                  baseWidth = 195;
                }
                let extra = 0;
                if (spotifyState?.is_playing && spotifyState?.item) extra += 30;
                if (effectivePrivacy.cam && effectivePrivacy.mic) {
                  extra += 36;
                } else if (effectivePrivacy.cam || effectivePrivacy.mic) {
                  extra += 20;
                }
                return baseWidth + extra;
              })(),
              height: isDragging 
                ? 64 
                : (() => {
                    if (osdAlert) return isSideNotch ? 200 : ((osdAlert.type === 'volume' && isBtAudio) ? 54 : 44);
                    if (btAlert) return isSideNotch ? 210 : 60;
                    if (isNotification && isSideNotch) {
                      if (sysNotification || appNotice) return 250;
                      if (meetingAlert) return 230;
                      if (isBoosting) return 200;
                      return 190;
                    }
                    if (batteryEvent && !osdAlert && !btAlert && !appNotice) return 70;
                    if (appNotice && !osdAlert && !btAlert) return 72;
                    if (isNotification) return 80;
                    if (isExpanded) {
                      if (isSideNotch && viewMode !== 'settings') {
                        if (viewMode === 'control') return 350;
                        if (viewMode === 'dashboard') return (effectivePrivacy.cam || effectivePrivacy.mic) ? 420 : 380;
                        if (viewMode === 'stats') return 275;
                        if (viewMode === 'network') return 200;
                        if (viewMode === 'stopwatch') return 260;
                        if (viewMode === 'pomodoro') return 420;
                        if (viewMode === 'media') return spotifyState?.lyrics?.length > 0 ? 400 : 350;
                        return 360;
                      }
                      if (viewMode === 'settings') return 320;
                      if (viewMode === 'dashboard') return (effectivePrivacy.cam || effectivePrivacy.mic) ? 336 : 292;
                      if (viewMode === 'control') return 236;
                      if (viewMode === 'network') return 168;
                      if (viewMode === 'stats') return 214;
                      if (viewMode === 'pomodoro') return 282;
                      if (['volume', 'brightness'].includes(viewMode)) return 140;
                      return 220;
                    }
                    if (isSideNotch) {
                      if (isAutoShrunk) return 130;
                      if (greeting) return 260;
                      if (effectivePrivacy.cam && effectivePrivacy.mic) return 220;
                      if (effectivePrivacy.cam || effectivePrivacy.mic) return 200;
                      return 180;
                    }
                    return isAutoShrunk ? 28 : 40;
                  })(),
              borderBottomLeftRadius: config.screenPosition === 'left' ? 0 : (isDragging ? 16 : ((isExpanded || isNotification) ? getRadius('expanded') : (isAutoShrunk ? 14 : getRadius('collapsed')))),
              borderBottomRightRadius: config.screenPosition === 'right' ? 0 : (isDragging ? 16 : ((isExpanded || isNotification) ? getRadius('expanded') : (isAutoShrunk ? 14 : getRadius('collapsed')))),
              borderTopLeftRadius: (config.screenPosition === 'left' || config.screenPosition?.startsWith('top')) ? (isDragging ? 16 : 0) : (isDragging ? 16 : getRadius((isExpanded || isNotification) ? 'expanded' : 'collapsed')),
              borderTopRightRadius: (config.screenPosition === 'right' || config.screenPosition?.startsWith('top') || !config.screenPosition) ? (isDragging ? 16 : 0) : (isDragging ? 16 : getRadius((isExpanded || isNotification) ? 'expanded' : 'collapsed')),
              marginTop: isDragging || config.screenPosition === 'left' || config.screenPosition === 'right' ? 0 : -1,
              marginLeft: isDragging ? 0 : (config.screenPosition === 'left' ? -1 : (config.screenPosition === 'right' ? 1 : 0)),
              backgroundColor: isDragging 
                ? 'rgba(0,0,0,0)' 
                : (!isExpanded && !isNotification 
                  ? (config.idleColor || config.bgColor || '#000000') 
                  : expandedSurface)
            }}
            style={{
              pointerEvents: isNotchHidden ? 'none' : 'auto',
              willChange: 'width, height, border-radius, transform',
              transformOrigin: isSideNotch ? (config.screenPosition === 'left' ? 'left center' : 'right center') : 'top center',
              originY: isSideNotch ? 0.5 : 0,
              originX: config.screenPosition === 'left' ? 0 : (config.screenPosition === 'right' ? 1 : 0.5),
              backdropFilter: isExpanded || isNotification ? 'blur(36px) saturate(190%)' : 'blur(20px)',
              WebkitBackdropFilter: isExpanded || isNotification ? 'blur(36px) saturate(190%)' : 'blur(20px)',
              ...getNotchGlowStyle()
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 28,
              mass: 0.75,
              restDelta: 0.001,
              scale: { type: 'spring', stiffness: 350, damping: 26 },
              width: isDragging ? { duration: 0 } : undefined,
              height: isDragging ? { duration: 0 } : undefined,
              borderBottomLeftRadius: isDragging ? { duration: 0 } : undefined,
              borderBottomRightRadius: isDragging ? { duration: 0 } : undefined,
              borderTopLeftRadius: isDragging ? { duration: 0 } : undefined,
              borderTopRightRadius: isDragging ? { duration: 0 } : undefined
            }}
            className={`relative z-10 text-white flex flex-col transition-shadow duration-500 ${getRgbGlowClass()} group`}
            onPointerDown={handleCustomDragStart}
          >
            {!isDragging && (!config.screenPosition || config.screenPosition.startsWith('top')) && (
              <>
                <div 
                  className="absolute top-0 -left-[14px] w-[14px] h-[14px] pointer-events-none transition-colors duration-500"
                  style={{ backgroundImage: `radial-gradient(circle at 0% 100%, transparent 14px, ${!isExpanded && !isNotification ? (config.idleColor || config.bgColor || '#000000') : expandedSurface} 14px)` }}
                />
                <div 
                  className="absolute top-0 -right-[14px] w-[14px] h-[14px] pointer-events-none transition-colors duration-500"
                  style={{ backgroundImage: `radial-gradient(circle at 100% 100%, transparent 14px, ${!isExpanded && !isNotification ? (config.idleColor || config.bgColor || '#000000') : expandedSurface} 14px)` }}
                />
              </>
            )}

            {isDragging && renderDragCard()}

            <div 
              className="w-full h-full flex flex-col overflow-hidden relative z-10"
              style={{
                borderRadius: 'inherit',
                opacity: isDragging ? 0 : 1,
                transition: isDragging ? 'none' : 'opacity 0.25s ease'
              }}
            >
              {config.customBgUrl && (
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" style={{ opacity: 0.5, mixBlendMode: 'screen', borderRadius: 'inherit' }}>
                  {config.customBgUrl.includes('.mp4') ? (
                    <video src={config.customBgUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ backgroundImage: `url(${config.customBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
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
                    style={{ mixBlendMode: 'screen' }}
                  >
                    <BackgroundEffect
                      className="opacity-[0.72]"
                      id={config.bgAnimation}
                      accent={activeAccentHex}
                      colors={spotifyState?.item?.album?.images?.[0]?.url ? albumColors : null}
                      isPlaying={!!spotifyState?.is_playing}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="popLayout">
                {osdAlert ? (
                  <OsdAlert
                    osdAlert={osdAlert}
                    isBtAudio={isBtAudio}
                    activeBtDevice={activeBtDevice}
                    isSideNotch={isSideNotch}
                  />
                ) : btAlert ? (
                  <BluetoothAlert 
                    btDevice={btAlert} 
                    isSideNotch={isSideNotch} 
                    screenPosition={config.screenPosition} 
                  />
                ) : !isExpanded && !isNotification ? (
                  <motion.div
                    key="collapsed"
                    className={`w-full h-full flex ${isSideNotch ? 'flex-col items-center justify-between py-4' : 'items-center justify-between px-5'} z-10 ${idleTextClass} relative group`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: isAutoShrunk ? 0.9 : 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  >
                    <div className={`flex ${isSideNotch ? 'flex-col gap-3 items-center justify-start' : 'items-center gap-2 flex-1 justify-start'}`}>
                      <div className="flex items-center justify-center" title={`Battery ${battery.level}%${battery.charging ? ', charging' : ''}`}>
                        <BatteryRing level={battery.level} charging={battery.charging} size={isSideNotch ? 16 : 17} tone={idleTextColor === 'black' ? 'dark' : 'light'} />
                      </div>
                    </div>

                    <div className={`flex items-center justify-center ${isSideNotch ? 'flex-shrink-0 py-2' : 'mx-2 flex-shrink-0'}`}>
                      <AnimatePresence mode="wait">
                        {greeting ? (
                          <motion.span
                            key="greeting"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.25 }}
                            className={`smart-notch-brand-text ${isSideNotch ? 'text-[12px] py-1 select-none text-center' : 'text-[13px] mx-2 select-none'} ${idleTextColor === 'black' ? '!text-black' : ''}`}
                            style={{
                              writingMode: isSideNotch ? 'vertical-rl' : 'horizontal-tb',
                              textOrientation: isSideNotch ? 'mixed' : 'mixed',
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {greeting}
                          </motion.span>
                        ) : isPomoRunning ? (
                          <motion.span
                            key="pomotimer"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="font-display flex items-center justify-center"
                          >
                            {isSideNotch ? (
                              <div className="flex flex-col items-center leading-none gap-1">
                                <span className="text-[9.5px] font-medium" style={{ color: '#FF9F0A' }}>Focus</span>
                                <span className="text-[14px] font-semibold">{String(Math.floor(pomodoro / 60)).padStart(2, '0')}</span>
                                <span className="text-[14px] font-semibold opacity-60">{String(pomodoro % 60).padStart(2, '0')}</span>
                              </div>
                            ) : (
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF9F0A' }} />
                                <span className="text-[14.5px] font-semibold">{String(Math.floor(pomodoro / 60)).padStart(2, '0')}:{String(pomodoro % 60).padStart(2, '0')}</span>
                              </span>
                            )}
                          </motion.span>
                        ) : isSwRunning ? (
                          <motion.span
                            key="swtimer"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="font-display flex items-center justify-center"
                          >
                            {isSideNotch ? (
                              <div className="flex flex-col items-center leading-none gap-1">
                                <span className="text-[9.5px] font-medium" style={{ color: '#FFD60A' }}>Timer</span>
                                <span className="text-[14px] font-semibold">{String(Math.floor((stopwatch % 3600) / 60)).padStart(2, '0')}</span>
                                <span className="text-[14px] font-semibold opacity-60">{String(stopwatch % 60).padStart(2, '0')}</span>
                              </div>
                            ) : (
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FFD60A' }} />
                                <span className="text-[14.5px] font-semibold">{String(Math.floor((stopwatch % 3600) / 60)).padStart(2, '0')}:{String(stopwatch % 60).padStart(2, '0')}</span>
                              </span>
                            )}
                          </motion.span>
                        ) : (
                          <motion.span
                            key="time"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="font-display flex items-center justify-center"
                          >
                            {isSideNotch ? (
                              <div className="flex flex-col items-center leading-none gap-1">
                                <span className={`text-[14px] font-semibold ${idleTextColor === 'black' ? 'text-black' : 'text-white'}`}>
                                  {time.split(':')[0] || '12'}
                                </span>
                                <span className={`text-[14px] font-semibold ${idleTextColor === 'black' ? 'text-black/55' : 'text-white/55'}`}>
                                  {time.split(':')[1] ? time.split(':')[1].replace(/[^0-9]/g, '') : '00'}
                                </span>
                                <span className={`text-[9.5px] font-medium mt-0.5 ${idleTextColor === 'black' ? 'text-black/45' : 'text-white/45'}`}>
                                  {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-baseline gap-1.5 justify-center">
                                <span className={`text-[12.5px] font-medium ${idleTextColor === 'black' ? 'text-black/50' : 'text-white/50'}`}>
                                  {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <span className={`text-[14.5px] font-semibold ${idleTextColor === 'black' ? 'text-black' : 'text-white'}`}>
                                  {time.split(' ')[0]}
                                </span>
                                {time.split(' ')[1] && (
                                  <span className={`text-[11px] font-medium ${idleTextColor === 'black' ? 'text-black/50' : 'text-white/50'}`}>
                                    {time.split(' ')[1]}
                                  </span>
                                )}
                              </div>
                            )}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className={`flex items-center ${isSideNotch ? 'flex-col gap-3 w-full mb-1 justify-end' : 'justify-end gap-2 flex-1'}`}>
                      {greeting ? (
                        <motion.div
                          key="greeting-right-anim"
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className={`relative flex items-center justify-center ${isSideNotch ? 'py-1' : 'pr-1.5'}`}
                          title="Smart Notch"
                        >
                          <BrandMark size={18} />
                        </motion.div>
                      ) : spotifyState?.is_playing && spotifyState?.item && config.showAudioWaveform !== false ? (
                        <div className={isSideNotch ? 'h-[14px] overflow-hidden flex items-center' : 'h-[12px] overflow-hidden flex items-center'}>
                          <AudioWaveform isPlaying={true} colors={albumColors} isSideNotch={isSideNotch} width={isSideNotch ? 14 : 22} height={isSideNotch ? 14 : 13} />
                        </div>
                      ) : (
                        <div className={isSideNotch ? 'h-[14px]' : 'w-[10px]'} />
                      )}

                      {(effectivePrivacy.mic || effectivePrivacy.cam) && (
                        <div className={`flex items-center ${isSideNotch ? 'flex-col gap-1.5' : 'gap-2'} pl-1 pr-0.5`}>
                          {effectivePrivacy.cam && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              className="relative flex items-center justify-center flex-shrink-0"
                              title="Camera in use"
                            >
                              <div className="w-[7px] h-[7px] rounded-full bg-[#30D158]" />
                            </motion.div>
                          )}
                          {effectivePrivacy.mic && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              className="relative flex items-center justify-center flex-shrink-0"
                              title="Microphone in use"
                            >
                              <div className="w-[7px] h-[7px] rounded-full bg-[#FF9F0A]" />
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : clipboardUrl ? (
                  <motion.div
                    key="clipboard-state"
                    className={`w-full h-full flex flex-col justify-center z-10 ${isSideNotch ? 'px-2.5 py-4 gap-2.5 items-center text-center' : 'p-4 gap-3'}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <div className={`flex gap-3 ${isSideNotch ? 'flex-col items-center w-full' : 'items-center'}`}>
                      <div className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                        <LinkIcon size={17} strokeWidth={1.9} className="text-white" />
                      </div>
                      <div className={`flex flex-col overflow-hidden ${isSideNotch ? 'w-full items-center' : 'flex-grow'}`}>
                        <span className="font-semibold text-[13px]">Link copied</span>
                        <span className="text-[11.5px] text-white/50 truncate">{clipboardUrl}</span>
                      </div>
                    </div>
                    <div className={`flex gap-2 mt-1 ${isSideNotch ? 'w-full' : ''}`}>
                      <button
                        className="flex-grow bg-white hover:bg-white/90 text-black py-1.5 rounded-full text-[12.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        onClick={() => {
                          if (ipcRenderer) ipcRenderer.send('open-url', clipboardUrl);
                          setClipboardUrl(null);
                        }}
                      >
                        <ExternalLink size={14} /> {isSideNotch ? 'Open' : 'Open in browser'}
                      </button>
                      <button
                        className="w-8 h-8 flex-shrink-0 bg-white/[0.08] hover:bg-white/[0.14] rounded-full flex items-center justify-center transition-colors"
                        onClick={() => setClipboardUrl(null)}
                      >
                        <X size={14} />
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
                    {batteryEvent || meetingAlert || isBoosting || boostAlert || sysNotification || appNotice ? (
                      <NotificationBanners
                        batteryEvent={batteryEvent}
                        meetingAlert={meetingAlert}
                        setMeetingAlert={setMeetingAlert}
                        isBoosting={isBoosting}
                        boostAlert={boostAlert}
                        boostProgress={boostProgress}
                        sysNotification={sysNotification}
                        setSysNotification={setSysNotification}
                        appNotice={appNotice}
                        onAppNoticeAction={handleAppNoticeAction}
                        onAppNoticeClose={closeAppNotice}
                        vertical={isSideNotch}
                      />
                    ) : btAlert ? (
                      <BluetoothAlert 
                        btDevice={btAlert} 
                        isSideNotch={isSideNotch} 
                        screenPosition={config.screenPosition} 
                      />
                    ) : (
                      <>
                        <ExpandedHeader
                          isSideNotch={isSideNotch}
                          viewMode={viewMode}
                          setViewMode={setViewMode}
                          config={config}
                          updateAvailable={updateAvailable}
                          whatsNewAvailable={whatsNewAvailable}
                          isBoosting={isBoosting}
                          handleBoost={handleBoost}
                          isPinned={isPinned}
                          setIsPinned={togglePin}
                          privacy={effectivePrivacy}
                          weather={weather}
                          battery={battery}
                          idleTextColor={idleTextColor}
                          onOpenSettings={handleShowSettings}
                        />

                        <AnimatePresence>
                          {viewMode === 'media' && !isSideNotch && spotifyState?.lyrics?.length > 0 && (
                            <motion.div
                              key="lyrics-container"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className={isSideNotch && viewMode !== 'settings' ? 'absolute left-0 right-0 top-[108px] h-[70px] flex flex-col justify-center items-center w-full px-4 z-10 pointer-events-none' : 'absolute left-0 right-0 top-[85px] bottom-[35px] flex flex-col justify-center items-center w-full px-5 z-10 pointer-events-none'}
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

                        <div
                          className={`flex flex-grow rounded-2xl relative transition-all duration-300 ${getPanelBorderStyle()} ${isSideNotch && viewMode !== 'settings' ? 'flex-col justify-center items-center overflow-y-auto no-scrollbar p-2 my-auto' : 'justify-between'} ${viewMode === 'settings' ? 'p-3.5 items-start flex-col overflow-y-auto custom-scrollbar overflow-hidden' : (viewMode === 'control' ? (isSideNotch && viewMode !== 'settings' ? 'p-2.5 justify-center' : 'px-2.5 pb-2.5 pt-1') : (viewMode === 'pomodoro' ? (isSideNotch && viewMode !== 'settings' ? 'p-2.5' : 'px-3 pb-3 pt-1') : (viewMode === 'dashboard' ? 'px-2 pb-2 pt-1 items-stretch justify-center' : (viewMode === 'media' ? 'p-0 overflow-hidden items-center justify-center' : 'px-2.5 pb-2.5 pt-0.5 items-center justify-center'))))}`}
                          style={{ pointerEvents: 'auto', ...getPanelBorderStyleInline() }}
                        >
                          <AnimatePresence mode="wait">
                            {viewMode === 'dashboard' && (
                              <DashboardView
                                isSideNotch={isSideNotch && viewMode !== 'settings'}
                                spotifyState={spotifyState}
                                setSpotifyState={setSpotifyState}
                                localProgress={localProgress}
                                handleProgressBarClick={handleProgressBarClick}
                                isPomoRunning={isPomoRunning}
                                pomoMode={pomoMode}
                                pomodoro={pomodoro}
                                activeBtDevice={activeBtDevice}
                                hardware={hardware}
                                network={network}
                                privacy={effectivePrivacy}
                                setViewMode={setViewMode}
                                config={config}
                              />
                            )}

                            {viewMode === 'media' && (
                              <MediaView
                                isSideNotch={isSideNotch && viewMode !== 'settings'}
                                spotifyState={spotifyState}
                                setSpotifyState={setSpotifyState}
                                localProgress={localProgress}
                                handleProgressBarClick={handleProgressBarClick}
                                lyric={spotifyState?.lyrics?.length > 0 ? (getCurrentLyric() || '') : null}
                              />
                            )}

                            {viewMode === 'stats' && (
                              <StatsView
                                isSideNotch={isSideNotch && viewMode !== 'settings'}
                                hardware={hardware}
                                handleBoost={handleBoost}
                                isBoosting={isBoosting}
                              />
                            )}

                            {viewMode === 'network' && (
                              <NetworkView network={network} />
                            )}

                            {viewMode === 'stopwatch' && (
                              <StopwatchView
                                isSideNotch={isSideNotch && viewMode !== 'settings'}
                                stopwatch={stopwatch}
                                isSwRunning={isSwRunning}
                                toggleSw={toggleSw}
                                resetSw={resetSw}
                              />
                            )}

                            {viewMode === 'pomodoro' && (
                              <PomodoroView
                                isSideNotch={isSideNotch && viewMode !== 'settings'}
                                pomoMode={pomoMode}
                                switchPomoMode={switchPomoMode}
                                pomoWorkTime={pomoWorkTime}
                                setPomoWorkTime={setPomoWorkTime}
                                pomoBreakTime={pomoBreakTime}
                                setPomoBreakTime={setPomoBreakTime}
                                pomodoro={pomodoro}
                                setPomodoro={setPomodoro}
                                isPomoRunning={isPomoRunning}
                                togglePomo={togglePomo}
                                resetPomo={resetPomo}
                                pomoTasks={pomoTasks}
                                handleToggleTask={handleToggleTask}
                                handleDeleteTask={handleDeleteTask}
                                taskInput={taskInput}
                                setTaskInput={setTaskInput}
                                handleAddTask={handleAddTask}
                                handleInputBlur={handleInputBlur}
                              />
                            )}

                            {(viewMode === 'volume' || viewMode === 'brightness') && (
                              <motion.div
                                key="quick-adjust"
                                className="w-full h-full flex items-center justify-center gap-4 px-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              >
                                {viewMode === 'volume' ? (
                                  <Volume2 size={20} strokeWidth={1.9} className="text-white/80" />
                                ) : (
                                  <Sun size={20} strokeWidth={1.9} className="text-white/80" />
                                )}
                                <div className="flex flex-col items-center">
                                  <span className="text-[14px] font-semibold capitalize">{viewMode}</span>
                                  <span className="text-[11px] text-white/50">Scroll to adjust</span>
                                </div>
                              </motion.div>
                            )}

                            {viewMode === 'control' && (
                              <ControlCenterView
                                compact={isSideNotch && viewMode !== 'settings'}
                                ipcRenderer={ipcRenderer}
                                isMuted={isMuted}
                                setIsMuted={setIsMuted}
                                isNightLight={isNightLight}
                                setIsNightLight={setIsNightLight}
                                isDnd={isDnd}
                                setIsDnd={setIsDnd}
                                brightnessLevel={brightnessLevel}
                                setBrightnessLevel={setBrightnessLevel}
                                volumeLevel={volumeLevel}
                                setVolumeLevel={setVolumeLevel}
                                isBtAudio={isBtAudio}
                                activeBtDevice={activeBtDevice}
                              />
                            )}

                            {viewMode === 'settings' && (
                              <SettingsView
                                updateAvailable={updateAvailable}
                                latestVersion={latestVersion}
                                showReleaseNotes={showReleaseNotes}
                                setShowReleaseNotes={setShowReleaseNotes}
                                changelog={changelog}
                                whatsNewAvailable={whatsNewAvailable}
                                setWhatsNewAvailable={setWhatsNewAvailable}
                                CURRENT_VERSION={CURRENT_VERSION}
                                config={config}
                                setConfig={setConfig}
                                isResolvingBgUrl={isResolvingBgUrl}
                              />
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
