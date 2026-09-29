import React from 'react';
import { BACKGROUND_EFFECTS, normalizeBackgroundId } from '../background';
import { motion } from 'framer-motion';
import { Power } from 'lucide-react';

const ipcRenderer = typeof window !== 'undefined' 
  ? (window.electronAPI || (window.require ? window.require('electron').ipcRenderer : null)) 
  : null;

export const SettingsView = React.memo(({
  updateAvailable,
  latestVersion,
  showReleaseNotes,
  setShowReleaseNotes,
  changelog = [],
  whatsNewAvailable,
  setWhatsNewAvailable,
  CURRENT_VERSION,
  config,
  setConfig,
  isResolvingBgUrl
}) => {
  return (
    <motion.div
      key="settings"
      className="w-full flex flex-col gap-4 pb-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Update Available notification */}
      {updateAvailable && (
        <div
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col gap-1.5 text-left mb-1 cursor-pointer hover:bg-red-500/15 transition-colors select-none"
          onClick={() => setShowReleaseNotes(!showReleaseNotes)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
              <span className="text-xs font-bold text-red-300">
                Update Available! (v{latestVersion})
              </span>
            </div>
            <span className="text-[10px] text-white/50 underline">
              {showReleaseNotes ? 'Hide details' : 'View changelog'}
            </span>
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
                      <div key={index}>
                        • <b>{title}:</b>{desc}
                      </div>
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
              <span className="text-xs font-bold text-cyan-300">
                What's New in v{CURRENT_VERSION}!
              </span>
            </div>
            <button
              type="button"
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
            <div>• <b>Memory Fixes:</b> Added background GC polling to resolve system memory leaks.</div>
            <div>• <b>IPC Efficiency:</b> Media worker now caches track thumbnails, reducing data overhead.</div>
            <div>• <b>Stable Processes:</b> Substantially lowered CPU/RAM footprint of powershell & electron sub-processes.</div>
            <div>• <b>Resource Cleanup:</b> Eradicated redundant base64 serialization during active playback.</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase sticky top-0 bg-inherit z-10">
          Island Customization
        </span>
      </div>

      {/* Mode */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-white/70">Mode (Notch / Bar)</span>
        <div className="flex bg-white/10 rounded-lg p-1 w-full gap-1 text-[11px]" style={{ pointerEvents: 'auto' }}>
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
              config.mode === 'notch' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setConfig({ ...config, mode: 'notch' })}
          >
            Notch
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
              config.mode === 'bar' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setConfig({ ...config, mode: 'bar' })}
          >
            Bar
          </button>
        </div>
      </div>

      {/* Lock Position */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/70">Lock Position</span>
        <button
          type="button"
          aria-label="Toggle Lock Position"
          className={`w-10 h-6 rounded-full p-1 transition-colors ${config.lockDrag ? 'bg-green-500' : 'bg-white/20'}`}
          onClick={() => setConfig({ ...config, lockDrag: !config.lockDrag })}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              config.lockDrag ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* BG Animation */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-white/70">Background Animation</span>
        <div className="flex flex-wrap bg-white/10 rounded-lg p-1 w-full gap-1">
          {BACKGROUND_EFFECTS.map(e => e.id).map(anim => {
            const labels = Object.fromEntries(BACKGROUND_EFFECTS.map(e => [e.id, e.label]));
            const isSelected = normalizeBackgroundId(config.bgAnimation) === anim;
            return (
              <button
                type="button"
                key={anim}
                className={`flex-1 min-w-[30%] py-1.5 text-[10px] font-bold rounded-md transition-colors ${
                  isSelected
                    ? 'bg-white text-black'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setConfig({ ...config, bgAnimation: anim })}
              >
                {labels[anim]}
              </button>
            );
          })}
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
            onChange={(e) => setConfig({ ...config, customBgUrl: e.target.value })}
            disabled={isResolvingBgUrl}
            className="flex-grow bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/20 disabled:opacity-50"
            style={{ pointerEvents: 'auto' }}
          />
          {config.customBgUrl && (
            <button
              type="button"
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
              onClick={() => setConfig({ ...config, customBgUrl: '' })}
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
          {['#ff0000', '#ff6600', '#ffcc00', '#00cc44', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#ffffff'].map(color => (
            <button
              type="button"
              key={color}
              title={color}
              onClick={() => setConfig({ ...config, accentColor: color })}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                config.accentColor === color ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            type="button"
            title="RGB Mode"
            onClick={() => setConfig({ ...config, accentColor: 'rgb' })}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 rgb-bg ${
              config.accentColor === 'rgb' ? 'border-white scale-110' : 'border-transparent'
            }`}
          />
          <div
            className="w-6 h-6 rounded-full border-2 border-dashed border-white/40 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
            title="Custom accent color"
          >
            <input
              type="color"
              value={config.accentColor.startsWith('#') ? config.accentColor : '#06b6d4'}
              onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
              className="opacity-0 w-full h-full cursor-pointer"
              style={{ pointerEvents: 'auto' }}
            />
          </div>
        </div>
      </div>

      {/* Island Color */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-white/70">Island Color</span>
        <div className="flex items-center gap-2 flex-wrap bg-white/10 rounded-lg p-2 w-full">
          {['#000000', '#111111', '#1a1a2e', '#ff0000', '#ff6600', '#ffcc00', '#00cc44', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#ffffff'].map(color => (
            <button
              type="button"
              key={color}
              title={color}
              onClick={() => setConfig({ ...config, bgColor: color })}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                config.bgColor === color ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <div
            className="w-6 h-6 rounded-full border-2 border-dashed border-white/40 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
            title="Custom color"
          >
            <input
              type="color"
              value={config.bgColor}
              onChange={(e) => setConfig({ ...config, bgColor: e.target.value })}
              className="opacity-0 w-full h-full cursor-pointer"
              style={{ pointerEvents: 'auto' }}
            />
          </div>
        </div>
      </div>

      {/* Shrink / Idle Color */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-white/70">Shrink Mode Color</span>
        <div className="flex items-center gap-2 flex-wrap bg-white/10 rounded-lg p-2 w-full">
          {['#000000', '#111111', '#1a1a2e', '#ff0000', '#ff6600', '#ffcc00', '#00cc44', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#ffffff'].map(color => (
            <button
              type="button"
              key={color}
              title={color}
              onClick={() => setConfig({ ...config, idleColor: color })}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                (config.idleColor || '#000000') === color ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <div
            className="w-6 h-6 rounded-full border-2 border-dashed border-white/40 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
            title="Custom color"
          >
            <input
              type="color"
              value={config.idleColor || '#000000'}
              onChange={(e) => setConfig({ ...config, idleColor: e.target.value })}
              className="opacity-0 w-full h-full cursor-pointer"
              style={{ pointerEvents: 'auto' }}
            />
          </div>
        </div>
      </div>

      {/* Panel Style */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-white/70">Panel Material</span>
        <div className="flex bg-white/10 rounded-lg p-1 w-full gap-1">
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
              config.panelStyle === 'glass' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setConfig({ ...config, panelStyle: 'glass' })}
          >
            Frosted
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
              config.panelStyle === 'dark-glass' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setConfig({ ...config, panelStyle: 'dark-glass' })}
          >
            Dark Glass
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
              config.panelStyle === 'solid' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setConfig({ ...config, panelStyle: 'solid' })}
          >
            Solid
          </button>
        </div>
      </div>

      {/* Corner Shape */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-white/70">Corner Shape</span>
        <div className="flex bg-white/10 rounded-lg p-1 w-full gap-1">
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
              config.cornerShape === 'pill' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setConfig({ ...config, cornerShape: 'pill' })}
          >
            Pill (Smooth)
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
              config.cornerShape === 'rounded' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setConfig({ ...config, cornerShape: 'rounded' })}
          >
            Rectangle
          </button>
        </div>
      </div>

      {/* Glow Intensity */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-white/70">Neon Glow Intensity</span>
        <div className="flex bg-white/10 rounded-lg p-1 w-full gap-1">
          {['none', 'low', 'medium', 'high'].map(glow => {
            const labels = { none: 'Off', low: 'Low', medium: 'Med', high: 'High' };
            return (
              <button
                type="button"
                key={glow}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  config.glowIntensity === glow ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setConfig({ ...config, glowIntensity: glow })}
              >
                {labels[glow]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase sticky top-0 bg-inherit z-10">
          Behavior & Features
        </span>
      </div>

      {/* Show Weather */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/70">Show Weather Indicator</span>
        <button
          type="button"
          aria-label="Toggle Show Weather Indicator"
          className={`w-10 h-6 rounded-full p-1 transition-colors ${
            config.showWeather !== false ? 'bg-green-500' : 'bg-white/20'
          }`}
          onClick={() => setConfig({ ...config, showWeather: config.showWeather === false })}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              config.showWeather !== false ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Show Pomodoro */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/70">Show Pomodoro Timer</span>
        <button
          type="button"
          aria-label="Toggle Show Pomodoro Timer"
          className={`w-10 h-6 rounded-full p-1 transition-colors ${
            config.showPomodoro !== false ? 'bg-green-500' : 'bg-white/20'
          }`}
          onClick={() => setConfig({ ...config, showPomodoro: config.showPomodoro === false })}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              config.showPomodoro !== false ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Show Stopwatch */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/70">Show Stopwatch</span>
        <button
          type="button"
          aria-label="Toggle Show Stopwatch"
          className={`w-10 h-6 rounded-full p-1 transition-colors ${
            config.showStopwatch ? 'bg-green-500' : 'bg-white/20'
          }`}
          onClick={() => setConfig({ ...config, showStopwatch: !config.showStopwatch })}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              config.showStopwatch ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Show Hardware */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/70">Show Hardware & Network Stats</span>
        <button
          type="button"
          aria-label="Toggle Show Hardware and Network Stats"
          className={`w-10 h-6 rounded-full p-1 transition-colors ${
            config.showHardware !== false ? 'bg-green-500' : 'bg-white/20'
          }`}
          onClick={() => setConfig({ ...config, showHardware: config.showHardware === false })}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              config.showHardware !== false ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Clock Format */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-white/70">Clock Format</span>
        <div className="flex bg-white/10 rounded-lg p-1 w-full gap-1">
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
              config.clockFormat === '12h' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setConfig({ ...config, clockFormat: '12h' })}
          >
            12 Hour
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
              config.clockFormat === '24h' ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setConfig({ ...config, clockFormat: '24h' })}
          >
            24 Hour
          </button>
        </div>
      </div>

      {/* Application Controls */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/10 mt-1">
        <button
          type="button"
          onClick={() => {
            if (ipcRenderer) ipcRenderer.send('quit-app');
          }}
          className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer select-none"
        >
          <Power size={13} />
          Quit Smart Notch
        </button>
      </div>
    </motion.div>
  );
});
