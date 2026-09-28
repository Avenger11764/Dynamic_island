import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  SlidersHorizontal, Palette, LayoutGrid, Info, BookOpen, 
  X, Monitor, Sparkles, Check, RefreshCw, ExternalLink,
  Volume2, Sun, Wifi, Cpu, Battery, Eye, Lock, Pin, Play, Music,
  ChevronDown, Layers, Zap, Clock, Timer, Wrench, Minimize2, Image, Terminal, Activity,
  Coffee
} from 'lucide-react';

import appLogo from './assets/logo.png';

const ipcRenderer = typeof window !== 'undefined' ? window.electronAPI : null;

const DEFAULT_CONFIG = {
  mode: 'notch',
  islandScale: 1.0,
  lockDrag: false,
  pinMode: false,
  hoverToShow: false,
  hideBehindMaximized: false,
  runOnStartup: true,
  bgAnimation: 'off',
  customBgUrl: '',
  accentColor: '#06b6d4',
  bgColor: '#000000',
  idleColor: '#000000',
  panelStyle: 'glass',
  cornerShape: 'pill',
  glowIntensity: 'medium',
  selectedMonitor: 'primary',
  showWeather: true,
  showHardware: true,
  showPomodoro: true,
  showNetworkWidget: true,
  showMediaWidget: true,
  showHardwareWidget: true,
  showWeatherWidget: true,
  showQuickTools: true,
  showAudioWaveform: true
};

export default function SettingsWindow() {
  const [activeTab, setActiveTab] = useState('general');
  const [monitors, setMonitors] = useState([]);
  const [autostartEnabled, setAutostartEnabled] = useState(true);
  const [version, setVersion] = useState('7.0.2');

  // Update & Changelog State
  const CURRENT_VERSION = '7.0.2';
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(CURRENT_VERSION);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [whatsNewAvailable, setWhatsNewAvailable] = useState(false);
  const [changelog, setChangelog] = useState([]);

  useEffect(() => {
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

    const checkUpdate = async () => {
      try {
        const res = await fetch(`https://raw.githubusercontent.com/Avenger11764/Dynamic_island/main/package.json?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.version) {
            setLatestVersion(data.version);
            if (data.changelog) setChangelog(data.changelog);
            if (compareVersions(data.version, CURRENT_VERSION) > 0 || window.location.search.includes('simulate-update')) {
              setUpdateAvailable(true);
            } else {
              setUpdateAvailable(false);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to check updates in SettingsWindow:', e);
      }
    };

    checkUpdate();
    const lastSeen = localStorage.getItem('lastSeenVersion');
    const hasConfig = localStorage.getItem('smart-notch-config') !== null;

    if (lastSeen) {
      if (compareVersions(CURRENT_VERSION, lastSeen) > 0 || window.location.search.includes('simulate-whats-new')) {
        setWhatsNewAvailable(true);
      } else {
        setWhatsNewAvailable(false);
      }
    } else {
      localStorage.setItem('lastSeenVersion', CURRENT_VERSION);
      if (window.location.search.includes('simulate-whats-new')) {
        setWhatsNewAvailable(true);
      } else {
        setWhatsNewAvailable(false);
      }
    }
  }, []);

  // Load config from localStorage
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('smart-notch-config');
      const parsed = saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
      if (parsed.mode === 'bar') {
        parsed.hoverToShow = parsed.barHoverToShow !== undefined ? parsed.barHoverToShow : true;
      } else {
        parsed.hoverToShow = parsed.notchHoverToShow !== undefined ? parsed.notchHoverToShow : false;
      }
      return parsed;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  // Sync config with main window & localStorage
  const updateConfig = useCallback((patch) => {
    setConfig(prev => {
      const copy = { ...patch };
      if ('showWeatherWidget' in copy) {
        copy.showWeather = copy.showWeatherWidget;
      }
      if ('showHardwareWidget' in copy) {
        copy.showHardware = copy.showHardwareWidget;
      }
      const updated = { ...prev, ...copy };
      try {
        localStorage.setItem('smart-notch-config', JSON.stringify(updated));
      } catch (_) {}
      if (ipcRenderer) {
        ipcRenderer.send('sync-config', updated);
      }
      return updated;
    });
  }, []);

  // Listen for external config updates
  useEffect(() => {
    if (!ipcRenderer) return;
    const handleSync = (remoteConfig) => {
      if (remoteConfig) {
        setConfig(prev => ({ ...prev, ...remoteConfig }));
      }
    };
    ipcRenderer.on('config-updated', handleSync);

    ipcRenderer.invoke('get-monitors').then(res => {
      if (Array.isArray(res) && res.length > 0) setMonitors(res);
    }).catch(() => {});

    ipcRenderer.invoke('get-autostart-status').then(status => {
      setAutostartEnabled(!!status);
    }).catch(() => {});

    return () => {
      ipcRenderer.removeAllListeners?.('config-updated');
    };
  }, []);

  const handleClose = useCallback(() => {
    if (ipcRenderer) {
      ipcRenderer.send('close-settings-window');
    } else {
      window.close();
    }
  }, []);

  const toggleAutostart = useCallback(() => {
    const next = !autostartEnabled;
    setAutostartEnabled(next);
    updateConfig({ runOnStartup: next });
    if (ipcRenderer) {
      ipcRenderer.send('set-autostart', next);
    }
  }, [autostartEnabled, updateConfig]);

  // Tab definitions with bespoke Apple-style gradient icon badges
  const navTabs = [
    { 
      id: 'general', 
      label: 'General', 
      icon: SlidersHorizontal, 
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-[0_2px_10px_rgba(59,130,246,0.35)]'
    },
    { 
      id: 'appearance', 
      label: 'Appearance', 
      icon: Palette, 
      gradient: 'from-purple-500 to-pink-600',
      shadow: 'shadow-[0_2px_10px_rgba(168,85,247,0.35)]'
    },
    { 
      id: 'widgets', 
      label: 'Widgets', 
      icon: LayoutGrid, 
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-[0_2px_10px_rgba(16,185,129,0.35)]'
    },
    { 
      id: 'about', 
      label: 'About', 
      icon: Info, 
      gradient: 'from-sky-400 to-blue-600',
      shadow: 'shadow-[0_2px_10px_rgba(14,165,233,0.35)]'
    },
    { 
      id: 'howtouse', 
      label: 'How to Use', 
      icon: BookOpen, 
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-[0_2px_10px_rgba(245,158,11,0.35)]'
    },
  ];

  return (
    <div className="w-screen h-screen p-4 flex items-center justify-center select-none font-sans overflow-hidden bg-transparent">
      {/* Main Glass Modal Window */}
      <div className="w-full h-full max-w-[880px] max-h-[630px] rounded-3xl bg-[#090d16]/95 backdrop-blur-2xl border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.85)] flex overflow-hidden text-white relative">
        
        {/* Left Sidebar */}
        <aside className="w-[230px] flex-shrink-0 bg-black/30 border-r border-white/[0.08] flex flex-col p-4 z-10">
          {/* Draggable Title Header with Hardware Logo Mark */}
          <div className="pb-5 pt-1 px-2 flex items-center gap-3" style={{ WebkitAppRegion: 'drag' }}>
            <img 
              src={appLogo} 
              alt="Smart Notch" 
              className="w-9 h-9 rounded-xl object-cover shadow-md border border-white/20 drop-shadow-[0_2px_10px_rgba(56,189,248,0.3)] flex-shrink-0" 
            />
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                Smart Notch
              </h1>
              <p className="text-[10px] text-white/40 font-semibold tracking-wider uppercase">Settings</p>
            </div>
          </div>

          {/* Navigation List */}
          <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto no-scrollbar" style={{ WebkitAppRegion: 'no-drag' }}>
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasBadge = tab.id === 'about' && (updateAvailable || whatsNewAvailable);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-white/[0.12] text-white shadow-sm ring-1 ring-white/15' 
                      : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-b ${tab.gradient} text-white ${tab.shadow}`}>
                      <Icon size={14} strokeWidth={2.4} />
                    </div>
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {hasBadge && (
                    <span className={`w-2 h-2 rounded-full ${updateAvailable ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'} animate-pulse flex-shrink-0`} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Buy Me a Coffee Support Button */}
          <div className="pt-2" style={{ WebkitAppRegion: 'no-drag' }}>
            <button
              type="button"
              onClick={() => {
                if (ipcRenderer) {
                  ipcRenderer.send('open-url', 'https://buymeacoffee.com/dev_avinash');
                } else {
                  window.open('https://buymeacoffee.com/dev_avinash', '_blank');
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer"
            >
              <Coffee size={14} className="text-amber-400" />
              <span>Buy Me a Coffee ☕</span>
            </button>
          </div>

          {/* Bottom Version Tag */}
          <div className="pt-2.5 border-t border-white/[0.08] px-2 flex items-center justify-between text-[11px] text-white/40">
            <span>Version {version}</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${updateAvailable ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse`} />
              <span className={`text-[10px] font-medium ${updateAvailable ? 'text-red-400' : 'text-emerald-400/90'}`}>
                {updateAvailable ? 'Update ready' : 'Up to date'}
              </span>
            </div>
          </div>
        </aside>

        {/* Right Main Content Panel */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white/[0.01]">
          {/* Top Bar with draggable header & close button */}
          <div 
            className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06] flex-shrink-0"
            style={{ WebkitAppRegion: 'drag' }}
          >
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-white capitalize">
                {navTabs.find(t => t.id === activeTab)?.label}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Settings"
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Settings View */}
          <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar flex flex-col gap-5" style={{ WebkitAppRegion: 'no-drag' }}>
            
            {/* Update Available notification banner */}
            {updateAvailable && (
              <div 
                className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:bg-red-500/15 transition-all select-none shadow-[0_4px_20px_rgba(239,68,68,0.15)]"
                onClick={() => setShowReleaseNotes(!showReleaseNotes)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
                    <div>
                      <span className="text-xs font-bold text-red-200">
                        New Version Available (v{latestVersion})
                      </span>
                      <p className="text-[11px] text-red-300/70">Click to view release notes & download.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://apps.microsoft.com/store/detail/9N1D46F5X565?cid=DevShareMCLPCS"
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] px-3 py-1 rounded-full bg-red-500/25 hover:bg-red-500/40 text-red-100 font-semibold border border-red-400/40 transition-colors flex items-center gap-1"
                    >
                      Store <ExternalLink size={11} />
                    </a>
                    <span className="text-[11px] text-white/50 underline ml-1">
                      {showReleaseNotes ? 'Hide details' : 'Changelog'}
                    </span>
                  </div>
                </div>
                {showReleaseNotes && (
                  <div className="text-[11px] text-white/80 flex flex-col gap-1.5 pl-3 border-l-2 border-red-500/40 mt-1.5 leading-relaxed">
                    {changelog && changelog.length > 0 ? (
                      changelog.map((point, index) => {
                        const colonIndex = point.indexOf(':');
                        if (colonIndex !== -1) {
                          const title = point.substring(0, colonIndex);
                          const desc = point.substring(colonIndex + 1);
                          return (
                            <div key={index} className="flex items-start gap-1.5">
                              <span className="text-red-400">•</span>
                              <span><b className="text-white">{title}:</b>{desc}</span>
                            </div>
                          );
                        }
                        return <div key={index} className="flex items-start gap-1.5"><span className="text-red-400">•</span><span>{point}</span></div>;
                      })
                    ) : (
                      <p className="text-white/60">New performance improvements and features available in Microsoft Store.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* What's New in Current Version Banner */}
            {whatsNewAvailable && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 flex flex-col gap-2 select-none shadow-[0_4px_20px_rgba(34,211,238,0.12)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                    <div>
                      <span className="text-xs font-bold text-cyan-200">
                        What's New in v{CURRENT_VERSION}!
                      </span>
                      <p className="text-[11px] text-cyan-300/70">Welcome to your updated Smart Notch experience.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      localStorage.setItem('lastSeenVersion', CURRENT_VERSION);
                      setWhatsNewAvailable(false);
                      if (ipcRenderer) {
                        ipcRenderer.send('dismiss-whats-new');
                      }
                    }}
                    className="text-[11px] px-3 py-1 rounded-full bg-cyan-500/25 hover:bg-cyan-500/40 text-cyan-100 font-semibold border border-cyan-400/40 transition-colors cursor-pointer"
                  >
                    Got it
                  </button>
                </div>
                <div className="text-[11px] text-white/80 flex flex-col gap-1.5 pl-3 border-l-2 border-cyan-500/40 mt-1.5 leading-relaxed">
                  <div className="flex items-start gap-1.5">
                    <span className="text-cyan-400">•</span>
                    <span><b className="text-white">Floating Settings Window:</b> Real-time live customization preview window with persistent controls.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-cyan-400">•</span>
                    <span><b className="text-white">Authentic Apple Silicon Badges:</b> Bespoke CPU microchip, DRAM memory, and acoustic headphone icons.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-cyan-400">•</span>
                    <span><b className="text-white">Island Mode Hover Auto-Hide:</b> 2-second graceful dismiss for Bar mode; persistent 5-second mode for Notch.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-cyan-400">•</span>
                    <span><b className="text-white">GPU Hardware Acceleration:</b> Zero-copy rasterization for seamless 60/120Hz liquid animations.</span>
                  </div>
                </div>
              </div>
            )}

            
            {/* ────────────────── GENERAL TAB ────────────────── */}
            {activeTab === 'general' && (
              <>
                {/* Section 1: Island Shape & Mode */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-sky-400 to-blue-600 shadow-[0_2px_8px_rgba(14,165,233,0.35)] text-white flex items-center justify-center">
                      <Monitor size={16} strokeWidth={2.3} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Island & Display</h3>
                      <p className="text-xs text-white/40">Choose mode, scale sizing, and anchor display monitor.</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-4 divide-y divide-white/[0.06]">
                    {/* Island Mode */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-sm font-semibold text-white/90">Island Mode</span>
                        <p className="text-xs text-white/40">Switch between floating Dynamic Island and bezel-anchored Notch.</p>
                      </div>
                      <div className="bg-black/60 border border-white/10 p-1 rounded-xl flex gap-1 shadow-inner">
                        <button
                          type="button"
                          onClick={() => {
                            const newHover = config.barHoverToShow !== undefined ? config.barHoverToShow : true;
                            updateConfig({ mode: 'bar', hoverToShow: newHover });
                            if (ipcRenderer) ipcRenderer.send('set-window-mode', 'shelf', config.screenPosition);
                          }}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            config.mode === 'bar' 
                              ? 'bg-white text-zinc-900 shadow-md' 
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Island
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newHover = config.notchHoverToShow !== undefined ? config.notchHoverToShow : false;
                            updateConfig({ mode: 'notch', hoverToShow: newHover });
                            if (ipcRenderer) ipcRenderer.send('set-window-mode', 'notch', config.screenPosition);
                          }}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            config.mode === 'notch' 
                              ? 'bg-white text-zinc-900 shadow-md' 
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Notch
                        </button>
                      </div>
                    </div>

                    {/* Notch Scale / Size - Only valid for Notch Mode */}
                    {config.mode === 'notch' ? (
                      <div className="flex flex-col gap-2.5 pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-semibold text-white/90">Notch Size</span>
                            <p className="text-xs text-white/40">Scale the Notch dimensions smoothly to match your camera bezel.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {Math.round((config.islandScale || 1.0) * 100)}%
                            </span>
                          </div>
                        </div>

                        {/* Slider Bar */}
                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-[10px] font-semibold text-white/40">70%</span>
                          <input
                            type="range"
                            min="0.70"
                            max="1.30"
                            step="0.05"
                            value={config.islandScale || 1.0}
                            onChange={(e) => updateConfig({ islandScale: parseFloat(e.target.value) })}
                            className="flex-1 accent-white cursor-pointer h-1.5 bg-white/20 rounded-full"
                          />
                          <span className="text-[10px] font-semibold text-white/40">130%</span>
                        </div>

                        {/* Quick Size Presets */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {[
                            { label: 'Compact', scale: 0.80 },
                            { label: 'Small', scale: 0.90 },
                            { label: 'Default', scale: 1.00 },
                            { label: 'Large', scale: 1.15 },
                            { label: 'Extra', scale: 1.25 }
                          ].map(preset => {
                            const isSelected = Math.abs((config.islandScale || 1.0) - preset.scale) < 0.03;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => updateConfig({ islandScale: preset.scale })}
                                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all border ${
                                  isSelected
                                    ? 'bg-white text-black border-white shadow-sm'
                                    : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border-white/5'
                                }`}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-4 opacity-50">
                        <div>
                          <span className="text-sm font-semibold text-white/90">Notch Size</span>
                          <p className="text-xs text-white/40">Size scaling is only applicable in Notch mode.</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/10 text-white/60">
                          Notch Only
                        </span>
                      </div>
                    )}

                    {/* Selected Monitor */}
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <span className="text-sm font-semibold text-white/90">Selected Monitor</span>
                        <p className="text-xs text-white/40">Anchor the dynamic island to a specific screen display.</p>
                      </div>
                      <div className="relative">
                        <select
                          value={config.selectedMonitor || 'primary'}
                          onChange={(e) => updateConfig({ selectedMonitor: e.target.value })}
                          className="bg-black/60 border border-white/15 text-xs font-semibold text-white/90 rounded-xl px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-white/40 cursor-pointer shadow-sm"
                        >
                          <option value="primary">Primary Display</option>
                          {monitors.filter(m => !m.isPrimary).map(m => (
                            <option key={m.id} value={m.id.toString()}>{m.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Behaviour */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-indigo-500 to-purple-600 shadow-[0_2px_8px_rgba(99,102,241,0.35)] text-white flex items-center justify-center">
                      <Zap size={16} strokeWidth={2.3} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">System Behaviour</h3>
                      <p className="text-xs text-white/40">Manage window positioning, auto-launch, and hover gestures.</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-4 divide-y divide-white/[0.06]">
                    {[
                      {
                        title: 'Run App on System Startup',
                        desc: 'Smart Notch starts automatically when your PC turns on.',
                        icon: Zap,
                        badgeColor: 'from-amber-400 to-orange-500',
                        checked: autostartEnabled,
                        onToggle: toggleAutostart
                      },
                      {
                        title: 'Hover to Show',
                        desc: config.mode === 'bar' ? 'Bar hides off-screen and reveals on top edge hover (2s leave timer).' : 'Notch hides off-screen and reveals on edge hover (5s leave timer).',
                        icon: Eye,
                        badgeColor: 'from-sky-400 to-blue-500',
                        checked: !!config.hoverToShow,
                        onToggle: () => {
                          const nextVal = !config.hoverToShow;
                          if (config.mode === 'bar') {
                            updateConfig({ hoverToShow: nextVal, barHoverToShow: nextVal });
                          } else {
                            updateConfig({ hoverToShow: nextVal, notchHoverToShow: nextVal });
                          }
                        }
                      },
                      {
                        title: 'Hide behind maximized windows',
                        desc: 'When a window is maximized (not fullscreen), island drops behind it.',
                        icon: Minimize2,
                        badgeColor: 'from-indigo-500 to-violet-600',
                        checked: !!config.hideBehindMaximized,
                        onToggle: () => updateConfig({ hideBehindMaximized: !config.hideBehindMaximized })
                      },
                      {
                        title: 'Persistent Pin Mode',
                        desc: 'Keep dynamic notch pinned open without accidental closing.',
                        icon: Pin,
                        badgeColor: 'from-rose-500 to-pink-600',
                        checked: !!config.pinMode,
                        onToggle: () => updateConfig({ pinMode: !config.pinMode })
                      },
                      {
                        title: 'Lock Position',
                        desc: 'Prevent accidental dragging or repositioning on the desktop.',
                        icon: Lock,
                        badgeColor: 'from-slate-500 to-zinc-700',
                        checked: !!config.lockDrag,
                        onToggle: () => updateConfig({ lockDrag: !config.lockDrag })
                      }
                    ].map((item, idx) => {
                      const ItemIcon = item.icon;
                      return (
                        <div key={item.title} className={`flex items-center justify-between ${idx === 0 ? 'pt-1' : 'pt-3.5'}`}>
                          <div className="flex items-center gap-3 pr-4">
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-b ${item.badgeColor} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                              <ItemIcon size={14} strokeWidth={2.4} />
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-white/90">{item.title}</span>
                              <p className="text-xs text-white/40">{item.desc}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={item.onToggle}
                            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                              item.checked ? 'bg-[#34c759]' : 'bg-white/20'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-150 absolute top-0.5 ${
                              item.checked ? 'left-5' : 'left-0.5'
                            }`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ────────────────── APPEARANCE TAB ────────────────── */}
            {activeTab === 'appearance' && (
              <>
                {/* Panel Material Style */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-purple-500 to-pink-600 shadow-[0_2px_8px_rgba(168,85,247,0.35)] text-white flex items-center justify-center">
                      <Layers size={16} strokeWidth={2.3} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Panel Material Style</h3>
                      <p className="text-xs text-white/40">Glass blur and transparency texture for the island body.</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-4">
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'glass', label: 'Frosted Glass', desc: 'Sleek frosted blur' },
                        { id: 'dark-glass', label: 'Dark Glass', desc: 'Deeper obsidian tint' },
                        { id: 'solid', label: 'Solid Black', desc: 'Opaque contrast' }
                      ].map(mat => (
                        <button
                          key={mat.id}
                          type="button"
                          onClick={() => updateConfig({ panelStyle: mat.id })}
                          className={`py-3 px-3 rounded-xl text-left transition-all border ${
                            (config.panelStyle || 'glass') === mat.id
                              ? 'bg-white text-zinc-900 border-white shadow-md'
                              : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white/70'
                          }`}
                        >
                          <div className="text-xs font-bold">{mat.label}</div>
                          <div className={`text-[10px] mt-0.5 ${(config.panelStyle || 'glass') === mat.id ? 'text-zinc-600' : 'text-white/40'}`}>{mat.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Corner Shape */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-blue-500 to-cyan-500 shadow-[0_2px_8px_rgba(6,182,212,0.35)] text-white flex items-center justify-center">
                      <Monitor size={16} strokeWidth={2.3} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Corner Geometry</h3>
                      <p className="text-xs text-white/40">Choose capsule curvature for notch and widgets.</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-4">
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'pill', label: 'Pill (Smooth Curved)', desc: 'Organic curved Apple Dynamic Island style' },
                        { id: 'rounded', label: 'Modern Rounded', desc: 'Contemporary crisp 18px rounded rectangle' }
                      ].map(shape => (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => updateConfig({ cornerShape: shape.id })}
                          className={`py-3 px-3.5 rounded-xl text-left transition-all border ${
                            (config.cornerShape || 'pill') === shape.id
                              ? 'bg-white text-zinc-900 border-white shadow-md'
                              : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white/70'
                          }`}
                        >
                          <div className="text-xs font-bold">{shape.label}</div>
                          <div className={`text-[10px] mt-0.5 ${(config.cornerShape || 'pill') === shape.id ? 'text-zinc-600' : 'text-white/40'}`}>{shape.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Neon Glow Intensity */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 shadow-[0_2px_8px_rgba(245,158,11,0.35)] text-white flex items-center justify-center">
                      <Sun size={16} strokeWidth={2.3} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Neon Glow Halo</h3>
                      <p className="text-xs text-white/40">Peripheral neon halo emitted around the notch perimeter.</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-4">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'none', label: 'Off' },
                        { id: 'low', label: 'Subtle' },
                        { id: 'medium', label: 'Balanced' },
                        { id: 'high', label: 'Vibrant' }
                      ].map(glow => (
                        <button
                          key={glow.id}
                          type="button"
                          onClick={() => updateConfig({ glowIntensity: glow.id })}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold text-center transition-all border ${
                            (config.glowIntensity || 'medium') === glow.id
                              ? 'bg-white text-zinc-900 border-white shadow-md'
                              : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white/70'
                          }`}
                        >
                          {glow.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Accent Color Palette */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-rose-500 to-pink-600 shadow-[0_2px_8px_rgba(244,63,94,0.35)] text-white flex items-center justify-center">
                      <Palette size={16} strokeWidth={2.3} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Accent Theme Color</h3>
                      <p className="text-xs text-white/40">Highlights sliders, active badges, and waveforms.</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-3 flex-wrap">
                    {['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#06b6d4', '#007aff', '#af52de', '#ff2d55', '#ffffff'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateConfig({ accentColor: color })}
                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center shadow-md ${
                          config.accentColor === color ? 'border-white scale-110 ring-2 ring-white/30' : 'border-black/40'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {config.accentColor === color && (
                          <Check size={14} strokeWidth={3} className={color === '#ffffff' ? 'text-black' : 'text-white'} />
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateConfig({ accentColor: 'rgb' })}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        config.accentColor === 'rgb' 
                          ? 'border-white scale-105 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white shadow-lg ring-2 ring-white/30' 
                          : 'border-white/10 text-white/70 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      RGB Cycle
                    </button>
                    <div
                      className="w-8 h-8 rounded-full border-2 border-dashed border-white/40 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform relative flex items-center justify-center bg-white/5"
                      title="Custom color picker"
                    >
                      <input
                        type="color"
                        value={config.accentColor?.startsWith('#') ? config.accentColor : '#06b6d4'}
                        onChange={(e) => updateConfig({ accentColor: e.target.value })}
                        className="opacity-0 w-full h-full cursor-pointer absolute inset-0"
                      />
                      <Palette size={13} className="text-white/70 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Island Background Color */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-slate-600 to-zinc-800 shadow-[0_2px_8px_rgba(71,85,105,0.35)] text-white flex items-center justify-center">
                      <Layers size={16} strokeWidth={2.3} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Expanded Notch Background</h3>
                      <p className="text-xs text-white/40">Custom background tint when the notch expands.</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-3 flex-wrap">
                    {['#000000', '#0a0f1d', '#131b2e', '#1e1b4b', '#064e3b', '#1e3a8a', '#4c1d95', '#701a75', '#ffffff'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateConfig({ bgColor: color })}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center shadow-md ${
                          (config.bgColor || '#000000') === color ? 'border-white scale-110 ring-2 ring-white/30' : 'border-black/40'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {(config.bgColor || '#000000') === color && (
                          <Check size={14} strokeWidth={3} className={color === '#ffffff' ? 'text-black' : 'text-white'} />
                        )}
                      </button>
                    ))}
                    <div
                      className="w-8 h-8 rounded-full border-2 border-dashed border-white/40 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform relative flex items-center justify-center bg-white/5"
                      title="Custom color picker"
                    >
                      <input
                        type="color"
                        value={config.bgColor || '#000000'}
                        onChange={(e) => updateConfig({ bgColor: e.target.value })}
                        className="opacity-0 w-full h-full cursor-pointer absolute inset-0"
                      />
                      <Palette size={13} className="text-white/70 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Idle / Collapsed Notch Color */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-teal-500 to-emerald-600 shadow-[0_2px_8px_rgba(20,184,166,0.35)] text-white flex items-center justify-center">
                      <Eye size={16} strokeWidth={2.3} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Idle Notch Capsule Color</h3>
                      <p className="text-xs text-white/40">Capsule pill color when resting quietly at the top screen edge.</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-3 flex-wrap">
                    {['#000000', '#0a0f1d', '#131b2e', '#1e1b4b', '#064e3b', '#1e3a8a', '#4c1d95', '#701a75', '#ffffff'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateConfig({ idleColor: color })}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center shadow-md ${
                          (config.idleColor || '#000000') === color ? 'border-white scale-110 ring-2 ring-white/30' : 'border-black/40'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {(config.idleColor || '#000000') === color && (
                          <Check size={14} strokeWidth={3} className={color === '#ffffff' ? 'text-black' : 'text-white'} />
                        )}
                      </button>
                    ))}
                    <div
                      className="w-8 h-8 rounded-full border-2 border-dashed border-white/40 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform relative flex items-center justify-center bg-white/5"
                      title="Custom color picker"
                    >
                      <input
                        type="color"
                        value={config.idleColor || '#000000'}
                        onChange={(e) => updateConfig({ idleColor: e.target.value })}
                        className="opacity-0 w-full h-full cursor-pointer absolute inset-0"
                      />
                      <Palette size={13} className="text-white/70 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Background Visual Animations */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-fuchsia-500 to-indigo-600 shadow-[0_2px_8px_rgba(217,70,239,0.35)] text-white flex items-center justify-center">
                      <Sparkles size={16} strokeWidth={2.3} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Visual Background Effects</h3>
                      <p className="text-xs text-white/40">Dynamic particle animations rendered inside the expanded notch.</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-4">
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'off', label: 'Off (Clean)', desc: 'Pure dark aesthetic' },
                        { id: 'liquid', label: 'Liquid Glow', desc: 'Organic pulsating light' },
                        { id: 'cosmic', label: 'Cosmic Orbits', desc: 'Gentle particle field' },
                        { id: 'aurora', label: 'Aurora Wave', desc: 'Northern lights ribbon' },
                        { id: 'matrix', label: 'Matrix Digital', desc: 'Falling cipher streams' },
                        { id: 'hyperspace', label: 'Starfield Warp', desc: 'Deep space speed warp' },
                        { id: 'rain', label: 'Raindrops', desc: 'Subtle water ripples' }
                      ].map(anim => (
                        <button
                          key={anim.id}
                          type="button"
                          onClick={() => updateConfig({ bgAnimation: anim.id })}
                          className={`py-2.5 px-3 rounded-xl text-left transition-all border ${
                            config.bgAnimation === anim.id
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400/30'
                              : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white/70'
                          }`}
                        >
                          <div className="text-xs font-bold">{anim.label}</div>
                          <div className="text-[10px] text-white/40 mt-0.5">{anim.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Custom GIF Background */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-cyan-500 to-blue-600 shadow-[0_2px_8px_rgba(6,182,212,0.35)] text-white flex items-center justify-center">
                      <Image size={16} strokeWidth={2.3} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Custom GIF / Wallpaper URL</h3>
                      <p className="text-xs text-white/40">Display an animated GIF or background image inside the expanded notch.</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-2.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste image or GIF direct URL here..."
                        value={config.customBgUrl || ''}
                        onChange={(e) => updateConfig({ customBgUrl: e.target.value })}
                        className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                      />
                      {config.customBgUrl && (
                        <button
                          type="button"
                          onClick={() => updateConfig({ customBgUrl: '' })}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border border-red-500/30"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ────────────────── WIDGETS TAB ────────────────── */}
            {activeTab === 'widgets' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-emerald-500 to-teal-600 shadow-[0_2px_8px_rgba(16,185,129,0.35)] text-white flex items-center justify-center">
                    <LayoutGrid size={16} strokeWidth={2.3} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Enabled Modules</h3>
                    <p className="text-xs text-white/40">Toggle which cards and controls appear in the island.</p>
                  </div>
                </div>

                <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-4 divide-y divide-white/[0.06]">
                  {[
                    { 
                      key: 'showMediaWidget', 
                      title: 'Media & Spotify Player', 
                      desc: 'Display album art, seekable progress bar, and playback controls.',
                      icon: Music,
                      badgeColor: 'from-emerald-400 to-green-600'
                    },
                    { 
                      key: 'showHardwareWidget', 
                      title: 'Hardware Diagnostics', 
                      desc: 'Real-time CPU load, RAM usage, and battery statistics.',
                      icon: Cpu,
                      badgeColor: 'from-blue-500 to-indigo-600'
                    },
                    { 
                      key: 'showWeatherWidget', 
                      title: 'Weather & Forecast', 
                      desc: 'Live temperature, conditions, and weather alerts.',
                      icon: Sun,
                      badgeColor: 'from-amber-400 to-orange-500'
                    },
                    { 
                      key: 'showNetworkWidget', 
                      title: 'Network Speed Monitor', 
                      desc: 'Live download and upload transfer rate meters.',
                      icon: Wifi,
                      badgeColor: 'from-violet-500 to-purple-600'
                    },
                    { 
                      key: 'showPomodoro', 
                      title: 'Focus & Pomodoro Timer', 
                      desc: 'Customizable work/break timer directly on your screen.',
                      icon: Timer,
                      badgeColor: 'from-rose-500 to-red-600'
                    },
                    { 
                      key: 'showQuickTools', 
                      title: 'Quick Utilities Bar', 
                      desc: 'One-click shortcuts to Calculator, Screen Snip, and Task Manager.',
                      icon: Wrench,
                      badgeColor: 'from-slate-500 to-zinc-700'
                    },
                    { 
                      key: 'showAudioWaveform', 
                      title: 'Dynamic Audio Waveform', 
                      desc: 'Sculpted audio visualizer waves during active song playback.',
                      icon: Volume2,
                      badgeColor: 'from-fuchsia-500 to-pink-600'
                    }
                  ].map((w, idx) => {
                    const isEnabled = config[w.key] !== false;
                    const ModuleIcon = w.icon;
                    return (
                      <div key={w.key} className={`flex items-center justify-between ${idx === 0 ? 'pt-1' : 'pt-3.5'}`}>
                        <div className="flex items-center gap-3 pr-4">
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-b ${w.badgeColor} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                            <ModuleIcon size={14} strokeWidth={2.4} />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-white/90">{w.title}</span>
                            <p className="text-xs text-white/40">{w.desc}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateConfig({ [w.key]: !isEnabled })}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                            isEnabled ? 'bg-[#34c759]' : 'bg-white/20'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-150 absolute top-0.5 ${
                            isEnabled ? 'left-5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ────────────────── ABOUT TAB ────────────────── */}
            {activeTab === 'about' && (
              <div className="flex flex-col gap-4">
                <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-6 flex flex-col items-center text-center gap-3">
                  <img 
                    src={appLogo} 
                    alt="Smart Notch App Logo" 
                    className="w-16 h-16 rounded-2xl object-cover shadow-2xl border border-white/20 drop-shadow-[0_4px_24px_rgba(56,189,248,0.4)] hover:scale-105 transition-transform" 
                  />
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Smart Notch</h3>
                    <p className="text-xs text-white/50">Version {version} • Dynamic Island for Windows</p>
                  </div>
                  <p className="text-xs text-white/60 max-w-md leading-relaxed">
                    A beautiful, intelligent dynamic notch and island experience for Windows 10 & 11 with live hardware telemetry, media controls, and instant HUD alerts.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-[11px] px-3 py-1 rounded-full bg-white/10 text-white/80 font-semibold border border-white/10">
                      Author: Avinash
                    </span>
                    <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      Store Edition v{version}
                    </span>
                    <button
                      onClick={() => {
                        if (ipcRenderer) {
                          ipcRenderer.send('open-url', 'https://buymeacoffee.com/dev_avinash');
                        } else {
                          window.open('https://buymeacoffee.com/dev_avinash', '_blank');
                        }
                      }}
                      className="text-[11px] px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1.5 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                      title="Support the development of Smart Notch"
                    >
                      <Coffee size={12} className="text-amber-400" />
                      <span>Support Smart Notch ☕</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-2">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wider px-1">Changelog Highlights</span>
                  <div className="text-xs text-white/70 flex flex-col gap-2 p-2 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                      <span><b>Separated Floating Settings:</b> Real-time live customization preview window with persistent controls.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      <span><b>Zero-Overhead HUD:</b> Native background audio & brightness notification notch popups.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span><b>Bluetooth System:</b> Instant battery telemetry and device connection alerts.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <span><b>Auto Start Architecture:</b> Seamless launch on system startup.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ────────────────── HOW TO USE TAB ────────────────── */}
            {activeTab === 'howtouse' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 shadow-[0_2px_8px_rgba(245,158,11,0.35)] text-white flex items-center justify-center">
                    <BookOpen size={16} strokeWidth={2.3} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Quick Start Guide</h3>
                    <p className="text-xs text-white/40">Tips and gestures to get the most out of Smart Notch.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { title: 'Hover or Click to Expand', desc: 'Move your mouse to the top notch or click it to reveal media playback and quick controls.' },
                    { title: 'Live Settings Preview', desc: 'Drag the Island Size slider or switch between Island & Notch mode to see changes immediately.' },
                    { title: 'Persistent Pin Mode', desc: 'Click the Pin icon in the top header to lock the expanded island open during multitasking.' },
                    { title: 'Keyboard HUD Alerts', desc: 'Press your volume or brightness keys to see the seamless floating island notch bar.' },
                    { title: 'Drag & Dock to Edges', desc: 'Drag the handle to snap the island to Top, Left, or Right screen edges.' },
                    { title: 'Media Timeline Seeking', desc: 'Click directly on the song timeline bar to scrub playback position in Spotify or Media Player.' }
                  ].map((tip, idx) => (
                    <div key={idx} className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-white/90">{tip.title}</span>
                      <p className="text-xs text-white/50 leading-relaxed">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
