import React, { useState, useEffect, useCallback } from 'react';
import {
  SlidersHorizontal, Palette, LayoutGrid, Info, BookOpen, X, Monitor, Check,
  ExternalLink, Volume2, Sun, Wifi, Cpu, Eye, Lock, Pin, Music, ChevronDown,
  Zap, Timer, Wrench, Minimize2, Coffee, Maximize2, MousePointer2, Keyboard,
  Move, Pointer, SkipForward
} from 'lucide-react';

import { BrandMark } from './components/ui/Glyphs';
import { useAppUpdates, splitChangelog } from './utils/useAppUpdates';
import { getMaterialSurface, applyCardStyle } from './utils/materials';
import { BackgroundEffect, BACKGROUND_EFFECTS, normalizeBackgroundId } from './components/background';

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
  panelStyle: 'dark-glass',
  cardStyle: 'dark',
  cornerShape: 'rounded',
  glowIntensity: 'none',
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

const ACCENTS = ['#0a84ff', '#06b6d4', '#30d158', '#ffd60a', '#ff9f0a', '#ff453a', '#ff375f', '#bf5af2', '#ffffff'];
const TINTS = ['#000000', '#0b0b0f', '#111827', '#1c1917', '#172554', '#1e1b4b', '#052e16', '#3b0764', '#ffffff'];

const openExternal = (url) => {
  if (ipcRenderer) ipcRenderer.send('open-url', url);
  else window.open(url, '_blank');
};

/* ───────────────────────── primitives ───────────────────────── */

const Section = ({ title, hint, children }) => (
  <section className="flex flex-col gap-2 flex-shrink-0">
    {(title || hint) && (
      <div className="px-1 flex items-baseline justify-between">
        {title && <h3 className="text-[12px] font-semibold text-white/55">{title}</h3>}
        {hint && <span className="text-[11px] text-white/35">{hint}</span>}
      </div>
    )}
    <div className="rounded-[14px] bg-white/[0.045] divide-y divide-white/[0.06] overflow-hidden">{children}</div>
  </section>
);

const Row = ({ icon: Icon, title, desc, children, disabled }) => (
  <div className={`flex items-center justify-between gap-4 px-4 py-3 min-h-[56px] ${disabled ? 'opacity-45' : ''}`}>
    <div className="flex items-center gap-3 min-w-0">
      {Icon && (
        <span className="w-8 h-8 rounded-[9px] bg-white/[0.06] flex items-center justify-center text-white/75 flex-shrink-0">
          <Icon size={16} strokeWidth={1.8} />
        </span>
      )}
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-white/92">{title}</div>
        {desc && <div className="text-[11.5px] text-white/45 leading-snug mt-0.5">{desc}</div>}
      </div>
    </div>
    <div className="flex-shrink-0 flex items-center">{children}</div>
  </div>
);

const Switch = ({ checked, onChange, accent, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={!!checked}
    aria-label={label}
    onClick={onChange}
    className="relative w-[42px] h-[24px] rounded-full transition-colors duration-200 flex-shrink-0"
    style={{ background: checked ? accent : 'rgba(255,255,255,0.16)' }}
  >
    <span
      className="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-transform duration-200"
      style={{ transform: checked ? 'translateX(18px)' : 'translateX(0)' }}
    />
  </button>
);

const Segmented = ({ value, options, onChange }) => (
  <div className="flex bg-black/40 rounded-[10px] p-[3px] gap-[2px]">
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        onClick={() => onChange(o.id)}
        className={`px-3 h-7 rounded-[7px] text-[12px] font-medium transition-colors whitespace-nowrap ${
          value === o.id ? 'bg-white/[0.16] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)]' : 'text-white/55 hover:text-white'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const Swatches = ({ colors, value, onChange, extra, fallback }) => (
  <div className="flex items-center gap-2 flex-wrap justify-end">
    {colors.map((c) => {
      const selected = (value || fallback) === c;
      return (
        <button
          key={c}
          type="button"
          title={c}
          onClick={() => onChange(c)}
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center transition-transform hover:scale-110"
          style={{
            background: c,
            boxShadow: selected ? `0 0 0 2px #151517, 0 0 0 3.5px ${c === '#000000' || c === '#0b0b0f' ? '#fff' : c}` : 'inset 0 0 0 1px rgba(255,255,255,0.14)'
          }}
        >
          {selected && <Check size={11} strokeWidth={3} className={c === '#ffffff' || c === '#ffd60a' ? 'text-black' : 'text-white'} />}
        </button>
      );
    })}
    {extra}
    <label
      className="w-[22px] h-[22px] rounded-full relative cursor-pointer overflow-hidden hover:scale-110 transition-transform"
      title="Custom colour"
      style={{ background: 'conic-gradient(#ff453a, #ffd60a, #30d158, #0a84ff, #bf5af2, #ff453a)' }}
    >
      <input
        type="color"
        value={/^#([0-9a-f]{6})$/i.test(value || '') ? value : fallback}
        onChange={(e) => onChange(e.target.value)}
        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
      />
    </label>
  </div>
);

/* ───────────────────────── previews ───────────────────────── */

const EffectTile = ({ effect, selected, accent, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex flex-col gap-1.5 text-left"
  >
    <div
      className="relative w-full aspect-[16/9] rounded-[10px] overflow-hidden bg-black transition-shadow"
      style={{ boxShadow: selected ? `0 0 0 2px ${accent}` : '0 0 0 1px rgba(255,255,255,0.08)' }}
    >
      <div className="absolute inset-0" style={{ mixBlendMode: 'screen' }}>
        <BackgroundEffect id={effect.id} accent={accent} isPlaying />
      </div>
      {effect.reactive && (
        <span className="absolute bottom-1.5 left-1.5 h-4 px-1.5 rounded-full bg-black/55 text-[9.5px] font-medium text-white/80 flex items-center gap-1" title="Reacts to music">
          ♪ Music
        </span>
      )}
      {selected && (
        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: accent }}>
          <Check size={10} strokeWidth={3} className="text-white" />
        </span>
      )}
    </div>
    <div className="px-0.5">
      <div className={`text-[12px] font-medium ${selected ? 'text-white' : 'text-white/80'}`}>{effect.label}</div>
      <div className="text-[10.5px] text-white/40">{effect.desc}</div>
    </div>
  </button>
);

const NotchPreview = ({ config, accent }) => {
  const radius = config.cornerShape === 'rounded' ? 14 : 26;
  const idle = config.idleColor || '#000000';
  const idleText = idle.toLowerCase() === '#ffffff' ? '#000' : '#fff';
  return (
    <div className="relative flex-shrink-0 h-[168px] rounded-[14px] overflow-hidden bg-gradient-to-br from-[#2b3550] via-[#4b5a7d] to-[#8f8277] flex flex-col items-center gap-3">
      {/* collapsed */}
      <div
        className="mt-0 px-4 h-[26px] flex items-center gap-3"
        style={{ background: idle, color: idleText, borderBottomLeftRadius: radius * 0.55, borderBottomRightRadius: radius * 0.55 }}
      >
        <span className="text-[10px] opacity-55">Tue</span>
        <span className="font-display text-[11.5px] font-semibold">9:41</span>
        <span className="flex gap-[2px] items-end h-2.5">
          {[6, 10, 7, 9].map((h, i) => <span key={i} className="w-[2px] rounded-full" style={{ height: h, background: accent }} />)}
        </span>
      </div>
      {/* expanded */}
      <div
        className="relative w-[70%] flex-1 mb-4 overflow-hidden"
        style={{
          background: getMaterialSurface(config.panelStyle, config.bgColor),
          borderRadius: radius,
          boxShadow: `0 10px 30px -8px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)${config.panelStyle === 'glass' ? ', inset 0 1px 0 rgba(255,255,255,0.12)' : ''}`
        }}
      >
        <div className="absolute inset-0" style={{ mixBlendMode: 'screen' }}>
          <BackgroundEffect id={config.bgAnimation} accent={accent} isPlaying />
        </div>
        <div className="relative p-2.5 flex gap-2 h-full">
          <div className="w-[42%] rounded-[8px] surface" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-3 rounded-[5px] surface" />
            <div className="h-3 rounded-[5px] surface" />
            <div className="flex-1 rounded-[6px] surface relative overflow-hidden">
              <div className="absolute left-2 right-2 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/15">
                <div className="h-full w-[60%] rounded-full bg-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChangeList = ({ items, max }) => {
  const list = (items || []).slice(0, max || undefined);
  if (list.length === 0) return <p className="text-[12px] text-white/50">Performance improvements and fixes.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {list.map((entry, i) => {
        const { title, body } = splitChangelog(entry);
        return (
          <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed">
            <span className="w-1 h-1 rounded-full bg-white/40 mt-[9px] flex-shrink-0" />
            <span className="text-white/65">{title && <span className="text-white/90 font-medium">{title}. </span>}{body}</span>
          </li>
        );
      })}
    </ul>
  );
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

/* ───────────────────────── window ───────────────────────── */

export default function SettingsWindow() {
  // Opened as "#settings/<tab>" when the notch links to a specific page (e.g. What's new)
  const [activeTab, setActiveTab] = useState(() => {
    const m = (typeof window !== 'undefined' ? window.location.hash : '').match(/settings\/(\w+)/);
    return m ? m[1] : 'general';
  });
  const [monitors, setMonitors] = useState([]);
  const [autostartEnabled, setAutostartEnabled] = useState(true);

  const updates = useAppUpdates();
  const version = updates.currentVersion || '';
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  useEffect(() => {
    if (!ipcRenderer?.on) return undefined;
    ipcRenderer.on('settings-open-tab', (tab) => { if (tab) setActiveTab(tab); });
    return () => ipcRenderer.removeAllListeners?.('settings-open-tab');
  }, []);

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

  const updateConfig = useCallback((patch) => {
    setConfig(prev => {
      const copy = { ...patch };
      if ('showWeatherWidget' in copy) copy.showWeather = copy.showWeatherWidget;
      if ('showHardwareWidget' in copy) copy.showHardware = copy.showHardwareWidget;
      // Merge into the latest saved config, not just this window's copy, so we never
      // write back stale values (e.g. an old position after the notch was dragged).
      let latest = {};
      try { latest = JSON.parse(localStorage.getItem('smart-notch-config') || '{}'); } catch (_) {}
      const updated = { ...prev, ...latest, ...copy };
      try { localStorage.setItem('smart-notch-config', JSON.stringify(updated)); } catch (_) {}
      if (ipcRenderer) ipcRenderer.send('sync-config', updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    if (!ipcRenderer) return;
    ipcRenderer.on('config-updated', (remoteConfig) => {
      if (remoteConfig) setConfig(prev => ({ ...prev, ...remoteConfig }));
    });
    ipcRenderer.invoke('get-monitors').then(res => {
      if (Array.isArray(res) && res.length > 0) setMonitors(res);
    }).catch(() => {});
    ipcRenderer.invoke('get-autostart-status').then(status => {
      setAutostartEnabled(!!status);
    }).catch(() => {});
    return () => { ipcRenderer.removeAllListeners?.('config-updated'); };
  }, []);

  // Stay in sync with changes made by the notch window (drag position, pin, etc.)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'smart-notch-config' || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue);
        setConfig(prev => ({ ...prev, ...next, hoverToShow: prev.hoverToShow }));
      } catch (_) {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleClose = useCallback(() => {
    if (ipcRenderer) ipcRenderer.send('close-settings-window');
    else window.close();
  }, []);

  const toggleAutostart = useCallback(() => {
    const next = !autostartEnabled;
    setAutostartEnabled(next);
    updateConfig({ runOnStartup: next });
    if (ipcRenderer) ipcRenderer.send('set-autostart', next);
  }, [autostartEnabled, updateConfig]);

  const setMode = (mode) => {
    if (mode === config.mode) return;
    if (mode === 'bar') {
      updateConfig({ mode: 'bar', hoverToShow: config.barHoverToShow !== undefined ? config.barHoverToShow : true });
      ipcRenderer?.send('set-window-mode', 'shelf', config.screenPosition);
    } else {
      updateConfig({ mode: 'notch', hoverToShow: config.notchHoverToShow !== undefined ? config.notchHoverToShow : false });
      ipcRenderer?.send('set-window-mode', 'notch', config.screenPosition);
    }
  };

  const accent = /^#([0-9a-f]{6})$/i.test(config.accentColor || '') && config.accentColor.toLowerCase() !== '#ffffff'
    ? config.accentColor
    : '#0a84ff';
  const selectedEffect = normalizeBackgroundId(config.bgAnimation);
  useEffect(() => { applyCardStyle(config.cardStyle); }, [config.cardStyle]);

  const navTabs = [
    { id: 'general', label: 'General', icon: SlidersHorizontal },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'widgets', label: 'Widgets', icon: LayoutGrid },
    { id: 'howtouse', label: 'Tips', icon: BookOpen },
    { id: 'about', label: 'About', icon: Info }
  ];
  const aboutBadge = updates.updateAvailable ? '#ff9f0a' : (updates.whatsNew ? accent : null);

  return (
    <div className="w-screen h-screen p-4 flex items-center justify-center select-none overflow-hidden bg-transparent">
      <div className="w-full h-full max-w-[880px] max-h-[630px] rounded-[18px] bg-[#151517]/[0.97] backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.08)] flex overflow-hidden text-white relative">

        {/* Sidebar */}
        <aside className="w-[216px] flex-shrink-0 bg-black/25 flex flex-col px-3 pt-4 pb-3">
          <div className="px-2 pb-5 flex items-center gap-2.5" style={{ WebkitAppRegion: 'drag' }}>
            <BrandMark size={30} />
            <div className="leading-tight">
              <div className="text-[13px] font-semibold text-white">Smart Notch</div>
              <div className="text-[11px] text-white/45">Settings</div>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto no-scrollbar" style={{ WebkitAppRegion: 'no-drag' }}>
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative w-full flex items-center gap-3 h-9 px-3 rounded-[8px] text-[13px] transition-colors ${
                    active ? 'bg-white/[0.09] text-white font-medium' : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full" style={{ background: accent }} />}
                  <Icon size={16} strokeWidth={1.8} className={active ? 'text-white' : 'text-white/55'} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.id === 'about' && aboutBadge && <span className="w-1.5 h-1.5 rounded-full" style={{ background: aboutBadge }} />}
                </button>
              );
            })}
          </nav>

          <div className="flex flex-col gap-2 pt-3" style={{ WebkitAppRegion: 'no-drag' }}>
            <button
              type="button"
              onClick={() => openExternal('https://buymeacoffee.com/dev_avinash')}
              className="w-full flex items-center gap-2.5 h-9 px-3 rounded-[8px] text-[12.5px] text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Coffee size={15} strokeWidth={1.8} />
              Support development
            </button>
            <div className="px-3 flex items-center justify-between text-[11px] text-white/35">
              <span>Version {version}</span>
              <span className={updates.updateAvailable ? 'text-[#ff9f0a]' : ''}>{updates.updateAvailable ? 'Update available' : (updates.checking ? 'Checking…' : 'Up to date')}</span>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between px-8 pt-6 pb-4 flex-shrink-0" style={{ WebkitAppRegion: 'drag' }}>
            <h2 className="text-[22px] font-semibold tracking-[-0.01em]">{navTabs.find(t => t.id === activeTab)?.label}</h2>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Close"
              aria-label="Close settings"
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              <X size={17} strokeWidth={1.8} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 flex flex-col gap-6" style={{ WebkitAppRegion: 'no-drag' }}>

            {updates.updateAvailable && (
              <div className="flex-shrink-0 rounded-[14px] bg-white/[0.045] px-4 py-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#ff9f0a]" />
                    <div>
                      <div className="text-[13px] font-medium">Smart Notch {updates.latestVersion} is available</div>
                      <div className="text-[11.5px] text-white/45">Install it from the Microsoft Store.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setShowReleaseNotes(v => !v)} className="h-7 px-3 rounded-[7px] text-[12px] text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors">
                      {showReleaseNotes ? 'Hide notes' : 'What’s in it'}
                    </button>
                    <button
                      type="button"
                      onClick={updates.openUpdate}
                      className="h-7 px-3 rounded-[7px] text-[12px] font-medium text-white flex items-center gap-1.5"
                      style={{ background: accent }}
                    >
                      Update <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
                {showReleaseNotes && <div className="pl-5"><ChangeList items={updates.latestChangelog} /></div>}
              </div>
            )}

            {updates.whatsNew && (
              <div className="flex-shrink-0 rounded-[14px] bg-white/[0.045] px-4 py-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[13px] font-medium">You’re now on Smart Notch {version}</div>
                    <div className="text-[11.5px] text-white/45">Here’s what changed in this update.</div>
                  </div>
                  <button
                    type="button"
                    onClick={updates.dismissWhatsNew}
                    className="h-7 px-3 rounded-[7px] text-[12px] font-medium bg-white/[0.1] hover:bg-white/[0.16] transition-colors"
                  >
                    Got it
                  </button>
                </div>
                <ChangeList items={updates.changelog} />
              </div>
            )}

            {/* ─────────── General ─────────── */}
            {activeTab === 'general' && (
              <>
                <Section title="Display">
                  <Row icon={Monitor} title="Style" desc="A floating notch, or a full-width bar along the screen edge.">
                    <Segmented value={config.mode} onChange={setMode} options={[{ id: 'notch', label: 'Notch' }, { id: 'bar', label: 'Bar' }]} />
                  </Row>
                  <Row icon={Maximize2} title="Notch size" desc={config.mode === 'notch' ? 'Scale the notch to match your screen.' : 'Available in notch style.'} disabled={config.mode !== 'notch'}>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.70"
                        max="1.30"
                        step="0.05"
                        disabled={config.mode !== 'notch'}
                        value={config.islandScale || 1.0}
                        onChange={(e) => updateConfig({ islandScale: parseFloat(e.target.value) })}
                        className="w-[150px] cursor-pointer"
                        style={{ accentColor: accent }}
                      />
                      <span className="tnum text-[12px] text-white/70 w-9 text-right">{Math.round((config.islandScale || 1.0) * 100)}%</span>
                    </div>
                  </Row>
                  <Row icon={Monitor} title="Show on" desc="Choose which display the notch appears on.">
                    <div className="relative">
                      <select
                        value={config.selectedMonitor || 'primary'}
                        onChange={(e) => updateConfig({ selectedMonitor: e.target.value })}
                        className="bg-black/40 text-[12.5px] text-white/90 rounded-[8px] h-8 pl-3 pr-8 appearance-none focus:outline-none cursor-pointer shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                      >
                        <option value="primary">Primary display</option>
                        {monitors.filter(m => !m.isPrimary).map(m => (
                          <option key={m.id} value={m.id.toString()}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    </div>
                  </Row>
                </Section>

                <Section title="Behaviour">
                  <Row icon={Zap} title="Open at sign-in" desc="Start Smart Notch when Windows starts.">
                    <Switch checked={autostartEnabled} onChange={toggleAutostart} accent={accent} label="Open at sign-in" />
                  </Row>
                  <Row
                    icon={Eye}
                    title="Hide until hovered"
                    desc={config.mode === 'bar' ? 'The bar slides away and returns when you point at the edge.' : 'The notch slides away and returns when you point at the edge.'}
                  >
                    <Switch
                      checked={!!config.hoverToShow}
                      accent={accent}
                      label="Hide until hovered"
                      onChange={() => {
                        const next = !config.hoverToShow;
                        updateConfig(config.mode === 'bar' ? { hoverToShow: next, barHoverToShow: next } : { hoverToShow: next, notchHoverToShow: next });
                      }}
                    />
                  </Row>
                  <Row icon={Minimize2} title="Hide behind maximised windows" desc="Step out of the way when a window fills the screen.">
                    <Switch checked={!!config.hideBehindMaximized} onChange={() => updateConfig({ hideBehindMaximized: !config.hideBehindMaximized })} accent={accent} label="Hide behind maximised windows" />
                  </Row>
                  <Row icon={Pin} title="Keep open" desc="Don’t collapse the expanded notch when the pointer leaves.">
                    <Switch checked={!!config.pinMode} onChange={() => updateConfig({ pinMode: !config.pinMode })} accent={accent} label="Keep open" />
                  </Row>
                  <Row icon={Lock} title="Lock position" desc="Prevent the notch from being dragged.">
                    <Switch checked={!!config.lockDrag} onChange={() => updateConfig({ lockDrag: !config.lockDrag })} accent={accent} label="Lock position" />
                  </Row>
                </Section>
              </>
            )}

            {/* ─────────── Appearance ─────────── */}
            {activeTab === 'appearance' && (
              <>
                <NotchPreview config={config} accent={accent} />

                <Section title="Background effect" hint="♪ effects move with your music">
                  <div className="p-4 grid grid-cols-3 gap-3">
                    {BACKGROUND_EFFECTS.map((effect) => (
                      <EffectTile
                        key={effect.id}
                        effect={effect}
                        accent={accent}
                        selected={selectedEffect === effect.id}
                        onClick={() => updateConfig({ bgAnimation: effect.id })}
                      />
                    ))}
                  </div>
                </Section>

                <Section title="Colour">
                  <Row title="Accent" desc="Switches, highlights and effects.">
                    <Swatches
                      colors={ACCENTS}
                      value={config.accentColor}
                      fallback="#0a84ff"
                      onChange={(c) => updateConfig({ accentColor: c })}
                      extra={
                        <button
                          type="button"
                          title="Cycle colours"
                          onClick={() => updateConfig({ accentColor: 'rgb' })}
                          className="h-[22px] px-2 rounded-full text-[10.5px] font-medium transition-colors"
                          style={config.accentColor === 'rgb'
                            ? { background: 'linear-gradient(90deg,#ff453a,#30d158,#0a84ff)', color: '#fff' }
                            : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                        >
                          Cycle
                        </button>
                      }
                    />
                  </Row>
                  <Row title="Resting notch" desc="Colour of the collapsed notch.">
                    <Swatches colors={TINTS} value={config.idleColor} fallback="#000000" onChange={(c) => updateConfig({ idleColor: c })} />
                  </Row>
                  <Row title="Expanded notch" desc="Used when the material is set to Solid.">
                    <Swatches colors={TINTS} value={config.bgColor} fallback="#000000" onChange={(c) => updateConfig({ bgColor: c })} />
                  </Row>
                </Section>

                <Section title="Shape & material">
                  <Row title="Corners">
                    <Segmented value={config.cornerShape || 'rounded'} onChange={(id) => updateConfig({ cornerShape: id })} options={[{ id: 'pill', label: 'Rounded' }, { id: 'rounded', label: 'Squared' }]} />
                  </Row>
                  <Row title="Material" desc="Glass is lighter and see-through; Solid uses the Expanded notch colour.">
                    <Segmented
                      value={config.panelStyle || 'dark-glass'}
                      onChange={(id) => updateConfig({ panelStyle: id })}
                      options={[{ id: 'glass', label: 'Glass' }, { id: 'dark-glass', label: 'Dark glass' }, { id: 'solid', label: 'Solid' }]}
                    />
                  </Row>
                  <Row title="Cards" desc="Darker cards keep text readable over background effects.">
                    <Segmented
                      value={config.cardStyle || 'dark'}
                      onChange={(id) => updateConfig({ cardStyle: id })}
                      options={[{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'darker', label: 'Darker' }]}
                    />
                  </Row>
                  <Row title="Edge glow" desc="A soft accent-coloured halo around the notch.">
                    <Segmented
                      value={config.glowIntensity || 'none'}
                      onChange={(id) => updateConfig({ glowIntensity: id })}
                      options={[{ id: 'none', label: 'Off' }, { id: 'medium', label: 'Subtle' }, { id: 'high', label: 'Strong' }]}
                    />
                  </Row>
                </Section>

                <Section title="Custom wallpaper">
                  <div className="p-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste an image or GIF link"
                      value={config.customBgUrl || ''}
                      onChange={(e) => updateConfig({ customBgUrl: e.target.value })}
                      className="flex-1 bg-black/40 rounded-[8px] h-8 px-3 text-[12.5px] text-white placeholder-white/30 focus:outline-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]"
                    />
                    {config.customBgUrl && (
                      <button type="button" onClick={() => updateConfig({ customBgUrl: '' })} className="h-8 px-3 rounded-[8px] text-[12px] text-white/75 bg-white/[0.08] hover:bg-white/[0.14] transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                </Section>
              </>
            )}

            {/* ─────────── Widgets ─────────── */}
            {activeTab === 'widgets' && (
              <Section title="Show in the notch">
                {[
                  { key: 'showMediaWidget', title: 'Now playing', desc: 'Artwork, progress and playback controls.', icon: Music },
                  { key: 'showAudioWaveform', title: 'Music lights', desc: 'Animated bars while something is playing.', icon: Volume2 },
                  { key: 'showHardwareWidget', title: 'System', desc: 'Processor and memory usage.', icon: Cpu },
                  { key: 'showNetworkWidget', title: 'Network', desc: 'Download and upload speed.', icon: Wifi },
                  { key: 'showWeatherWidget', title: 'Weather', desc: 'Current temperature and conditions.', icon: Sun },
                  { key: 'showPomodoro', title: 'Focus timer', desc: 'Work and break sessions with a task list.', icon: Timer },
                  { key: 'showQuickTools', title: 'Shortcuts', desc: 'Calculator, Snipping Tool and Task Manager.', icon: Wrench }
                ].map((w) => {
                  const on = config[w.key] !== false;
                  return (
                    <Row key={w.key} icon={w.icon} title={w.title} desc={w.desc}>
                      <Switch checked={on} onChange={() => updateConfig({ [w.key]: !on })} accent={accent} label={w.title} />
                    </Row>
                  );
                })}
              </Section>
            )}

            {/* ─────────── Tips ─────────── */}
            {activeTab === 'howtouse' && (
              <Section>
                {[
                  { icon: MousePointer2, title: 'Open the notch', desc: 'Click the notch, or hover it, to see media, controls and widgets.' },
                  { icon: Keyboard, title: 'Volume and brightness', desc: 'Use your keyboard keys; the notch shows the level as you change it.' },
                  { icon: Pointer, title: 'Scroll to adjust', desc: 'Scroll over the volume or brightness popup to fine-tune it.' },
                  { icon: Pin, title: 'Keep it open', desc: 'Use the pin in the notch header while you work.' },
                  { icon: Move, title: 'Move it', desc: 'Drag the notch to the top, left or right edge of the screen.' },
                  { icon: SkipForward, title: 'Seek a song', desc: 'Click anywhere on the progress bar to jump to that point.' }
                ].map((tip) => (
                  <Row key={tip.title} icon={tip.icon} title={tip.title} desc={tip.desc} />
                ))}
              </Section>
            )}

            {/* ─────────── About ─────────── */}
            {activeTab === 'about' && (
              <>
                <div className="flex-shrink-0 rounded-[14px] bg-white/[0.045] px-6 py-7 flex flex-col items-center text-center gap-3">
                  <BrandMark size={64} />
                  <div>
                    <div className="text-[17px] font-semibold">Smart Notch</div>
                    <div className="text-[12px] text-white/45 mt-0.5">Version {version} · Dynamic Island for Windows</div>
                  </div>
                  <p className="text-[12.5px] text-white/60 max-w-[420px] leading-relaxed">
                    Media, system stats, Bluetooth and quick controls in a notch at the top of your screen.
                  </p>
                </div>
                <Section>
                  <Row title="Developer" desc="Avinash">
                    <span />
                  </Row>
                  <Row title="Support development" desc="If Smart Notch is useful to you, you can buy me a coffee.">
                    <button
                      type="button"
                      onClick={() => openExternal('https://buymeacoffee.com/dev_avinash')}
                      className="h-7 px-3 rounded-[7px] text-[12px] font-medium bg-white/[0.1] hover:bg-white/[0.16] transition-colors flex items-center gap-1.5"
                    >
                      <Coffee size={13} strokeWidth={1.8} /> Buy me a coffee
                    </button>
                  </Row>
                  <Row
                    title="Updates"
                    desc={
                      updates.checking ? 'Checking for updates…'
                        : updates.updateAvailable ? `Version ${updates.latestVersion} is available.`
                        : updates.checkError ? 'Couldn’t check for updates. Try again later.'
                        : `You’re up to date${updates.checkedAt ? ` · checked ${timeAgo(updates.checkedAt)}` : ''}.`
                    }
                  >
                    <div className="flex items-center gap-2">
                      {!updates.updateAvailable && (
                        <button
                          type="button"
                          disabled={updates.checking}
                          onClick={updates.checkNow}
                          className="h-7 px-3 rounded-[7px] text-[12px] font-medium bg-white/[0.1] hover:bg-white/[0.16] transition-colors disabled:opacity-50"
                        >
                          {updates.checking ? 'Checking…' : 'Check now'}
                        </button>
                      )}
                      {updates.updateAvailable && (
                        <button
                          type="button"
                          onClick={updates.openUpdate}
                          className="h-7 px-3 rounded-[7px] text-[12px] font-medium text-white flex items-center gap-1.5"
                          style={{ background: accent }}
                        >
                          Update <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  </Row>
                </Section>

                <Section title={`What’s new in ${version}`}>
                  <div className="px-4 py-3.5"><ChangeList items={updates.changelog} /></div>
                </Section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
