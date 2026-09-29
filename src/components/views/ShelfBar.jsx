import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipForward, SkipBack, Music, X, Rocket,
  Settings as SettingsIcon, Power, ArrowDown, ArrowUp,
  Volume2, VolumeX, Volume1, Sun, Headphones, Bell, Sparkles, ArrowDownToLine
} from 'lucide-react';
import WeatherIcon from '../../WeatherIcon';
import AudioWaveform from '../../AudioWaveform';
import { BackgroundEffect } from '../background';
import { AmbientGlow } from '../ui/AmbientGlow';
import { useAlbumColors } from '../../utils/useAlbumColors';
import { TimerCard, TimerChip, QuickToggles, QuickTools, MiniCalendar } from './ShelfWidgets';
import { formatTime, formatSpeed } from '../../utils/formatters';
import { SourceAppIcon } from '../ui/SourceAppIcon';
import { BatteryRing } from '../ui/Glyphs';
import { getMaterialSurface } from '../../utils/materials';

const ICON = { strokeWidth: 1.9 };

/** Thin clickable/scrollable level bar used for volume & brightness. */
const LevelBar = ({ value, muted, onSet, onWheel, title }) => (
  <div
    className="w-full bg-white/[0.1] h-[6px] rounded-full overflow-hidden cursor-pointer"
    title={title}
    onClick={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      onSet(Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100))));
    }}
    onWheel={(e) => { e.stopPropagation(); onWheel(e.deltaY < 0 ? 1 : -1); }}
  >
    <div
      className="h-full rounded-full transition-[width] duration-100"
      style={{ width: `${muted ? 0 : value}%`, background: 'rgba(255,255,255,0.9)' }}
    />
  </div>
);

const ActionButton = ({ title, onClick, disabled, danger, children, badge }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
      danger ? 'text-white/50 hover:text-[#FF453A] hover:bg-white/[0.08]' : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
    }`}
  >
    {children}
    {badge && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: badge }} />}
  </button>
);

const PrivacyDots = ({ privacy }) => (privacy?.mic || privacy?.cam) ? (
  <div className="flex items-center gap-1">
    {privacy.cam && <span className="w-[6px] h-[6px] rounded-full bg-[#30D158]" title="Camera in use" />}
    {privacy.mic && <span className="w-[6px] h-[6px] rounded-full bg-[#FF9F0A]" title="Microphone in use" />}
  </div>
) : null;

export const ShelfBar = React.memo(({
  isVisible, time, formatDate, weather, spotifyState, localProgress,
  hardware, network, battery, privacy, config, onTogglePlay, onPrev, onSkip,
  onOpenMediaApp, onOpenWeather, onQuit, onShowSettings,
  onBoost, isBoosting,
  onPointerDown, onPointerMove, onPointerUp, onPointerCancel,
  batteryEvent, boostAlert, boostProgress, greeting, sysNotification, setSysNotification,
  appNotice, onAppNoticeAction, onAppNoticeClose,
  updateAvailable, whatsNewAvailable, onSeek,
  volumeLevel = 65, setVolumeLevel,
  brightnessLevel = 80, setBrightnessLevel,
  isMuted = false, setIsMuted,
  isBtAudio = false, activeBtDevice,
  pomodoro = 0, isPomoRunning, pomoMode, togglePomo, resetPomo, switchPomoMode,
  stopwatch = 0, isSwRunning, toggleSw, resetSw,
  isDnd = false, setIsDnd, isNightLight = false, setIsNightLight,
  ipcRenderer
}) => {
  const isRgb = config.accentColor === 'rgb';
  const isSide = config.screenPosition === 'left' || config.screenPosition === 'right';
  const isLeft = config.screenPosition === 'left';

  const barShadow = isSide
    ? (isLeft ? '8px 0 32px -12px rgba(0,0,0,0.8), 1px 0 0 rgba(255,255,255,0.06)' : '-8px 0 32px -12px rgba(0,0,0,0.8), -1px 0 0 rgba(255,255,255,0.06)')
    : '0 12px 32px -12px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.06)';

  const isPlaying = spotifyState?.is_playing;
  const barBg = getMaterialSurface(config.panelStyle, config.bgColor);
  const barBgOpaque = getMaterialSurface(config.panelStyle, config.bgColor, { opaque: true });
  const art = spotifyState?.item?.album?.images?.[0]?.url;
  const albumColors = useAlbumColors(art || '');
  const accentHex = !isRgb && config.accentColor?.startsWith('#') ? config.accentColor : '#0a84ff';
  const timerProps = { pomodoro, isPomoRunning, pomoMode, togglePomo, resetPomo, switchPomoMode, stopwatch, isSwRunning, toggleSw, resetSw };
  const initialX = isSide ? (isLeft ? -160 : 160) : 0;
  const initialY = isSide ? 0 : -64;

  const mediaDuration = spotifyState?.duration_ms || spotifyState?.item?.duration_ms || 0;
  const mediaProgressPercent = mediaDuration > 0 ? Math.min(100, Math.max(0, (localProgress / mediaDuration) * 100)) : 0;
  const openMedia = () => onOpenMediaApp && onOpenMediaApp(spotifyState?.sourceAppId, spotifyState?.item?.name, spotifyState?.item?.artists?.[0]?.name);
  const badge = updateAvailable ? '#FF453A' : (whatsNewAvailable ? '#0A84FF' : null);
  const hasMedia = spotifyState?.item && config.showMediaWidget !== false;
  const showHw = config.showHardware !== false && config.showHardwareWidget !== false;
  const showWeather = config.showWeather !== false && config.showWeatherWidget !== false;
  const clock = time.replace(/\s*[aApP]\.?[mM]\.?/, '');
  const meridiem = (time.match(/[aApP]\.?[mM]\.?/) || [''])[0];

  const setVolume = (v) => { setVolumeLevel?.(v); ipcRenderer?.send('set-volume', v); };
  const setBrightness = (v) => { setBrightnessLevel?.(v); ipcRenderer?.send('set-brightness', v); };
  const toggleMute = () => { setIsMuted?.(prev => !prev); ipcRenderer?.send('toggle-mute'); };
  const VolIcon = volumeLevel === 0 || isMuted ? VolumeX : (isBtAudio ? Headphones : (volumeLevel < 50 ? Volume1 : Volume2));

  const artwork = (cls, iconSize) => (
    <div className={`${cls} rounded-[8px] overflow-hidden bg-white/[0.08] flex items-center justify-center flex-shrink-0 relative`}>
      {art ? <img src={art} alt="" className="w-full h-full object-cover" /> : <Music size={iconSize} {...ICON} className="text-white/40" />}
      {spotifyState?.sourceAppId && (
        <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded-[4px] p-[1.5px] flex items-center justify-center">
          <SourceAppIcon appId={spotifyState.sourceAppId} />
        </div>
      )}
    </div>
  );

  const playButton = (size) => (
    <button
      type="button"
      className="rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
      style={{ width: size, height: size }}
      onClick={onTogglePlay}
      title={isPlaying ? 'Pause' : 'Play'}
    >
      {isPlaying ? <Pause size={size * 0.42} fill="currentColor" strokeWidth={0} /> : <Play size={size * 0.42} fill="currentColor" strokeWidth={0} className="translate-x-[1px]" />}
    </button>
  );

  const skipButton = (dir) => (
    <button
      type="button"
      className="w-7 h-7 rounded-full hover:bg-white/[0.08] flex items-center justify-center text-white/70 hover:text-white transition-colors"
      onClick={dir === 'prev' ? onPrev : onSkip}
      title={dir === 'prev' ? 'Previous' : 'Next'}
    >
      {dir === 'prev' ? <SkipBack size={13} fill="currentColor" strokeWidth={0} /> : <SkipForward size={13} fill="currentColor" strokeWidth={0} />}
    </button>
  );

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
        ${isSide ? 'custom-scrollbar top-0 bottom-0 flex flex-col overflow-y-auto overflow-x-hidden' : 'top-0 left-0 right-0 flex items-center px-5'}
        ${isSide ? (isLeft ? 'left-0 rounded-r-[22px]' : 'right-0 rounded-l-[22px]') : 'rounded-b-[18px]'}
        ${isRgb ? 'rgb-border' : ''}`}
      style={{
        backgroundColor: barBg,
        ...(isSide ? { width: '160px', height: '100vh' } : { height: '56px' }),
        backdropFilter: 'blur(36px) saturate(160%)',
        WebkitBackdropFilter: 'blur(36px) saturate(160%)',
        pointerEvents: isVisible ? 'auto' : 'none',
        boxShadow: barShadow
      }}
    >
      {config.customBgUrl && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" style={{ opacity: 0.4, mixBlendMode: 'screen', borderRadius: 'inherit' }}>
          {config.customBgUrl.includes('.mp4') ? (
            <video src={config.customBgUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ backgroundImage: `url(${config.customBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          )}
        </div>
      )}

      <BackgroundEffect className="opacity-60" id={config.bgAnimation} accent={accentHex} colors={art ? albumColors : null} isPlaying={!!isPlaying} />

      {isSide ? (
        /* ─────────────── Vertical side bar ─────────────── */
        <div className="w-full min-h-full flex flex-col gap-2.5 px-2.5 py-4 relative z-10 [&>*]:flex-shrink-0">
          {/* Actions: pinned to the top so they stay reachable while the bar scrolls */}
          <div className="sticky top-0 z-20 -mx-2.5 -mt-4 px-2 pt-2.5 pb-1.5 flex items-center justify-between" style={{ backgroundColor: barBgOpaque }}>
            <div className="pl-1"><PrivacyDots privacy={privacy} /></div>
            <div className="flex items-center">
              <ActionButton title="Optimize memory (nothing is closed)" onClick={onBoost} disabled={isBoosting}><Rocket size={14} {...ICON} /></ActionButton>
              <ActionButton title="Settings" onClick={onShowSettings} badge={badge}><SettingsIcon size={15} {...ICON} /></ActionButton>
              <ActionButton title="Quit Smart Notch" onClick={onQuit} danger><Power size={14} {...ICON} /></ActionButton>
            </div>
          </div>

          {/* Clock */}
          <div className="flex flex-col items-center py-1">
            {greeting ? (
              <span className="text-[14px] font-semibold text-white text-center leading-snug px-1">{greeting}</span>
            ) : (
              <>
                <span className={`font-display text-[30px] font-semibold leading-none ${isRgb ? 'rgb-text' : 'text-white'}`}>{clock}</span>
                <span className="text-[11px] font-medium text-white/50 mt-1.5">{formatDate()}{meridiem ? ` · ${meridiem.toUpperCase()}` : ''}</span>
              </>
            )}
          </div>

          {showWeather && (
            <button type="button" className="surface surface-hover w-full px-2.5 py-2 flex items-center gap-2 text-left" onClick={onOpenWeather} title={weather.desc}>
              <WeatherIcon desc={weather.desc} size={18} />
              <div className="flex flex-col min-w-0">
                <span className="tnum text-[13px] font-semibold text-white leading-tight">{weather.temp}</span>
                <span className="text-[10.5px] text-white/50 capitalize truncate">{weather.desc}</span>
              </div>
            </button>
          )}

          {/* Media */}
          {hasMedia ? (
            <div className="surface relative overflow-hidden w-full p-2.5 flex flex-col items-center gap-2">
              <AmbientGlow artUrl={art} colors={albumColors} isPlaying={!!isPlaying} />
              <button type="button" className="relative w-full flex flex-col items-center gap-2" onClick={openMedia} title="Open player">
                {artwork('w-[72px] h-[72px]', 22)}
                <div className="flex flex-col items-center w-full text-center min-w-0">
                  <span className="text-[12px] font-semibold text-white truncate w-full">{spotifyState.item.name}</span>
                  <span className="text-[10.5px] text-white/55 truncate w-full mt-0.5">{spotifyState.item.artists?.map(a => a.name).join(', ')}</span>
                </div>
              </button>
              <div className="relative w-full flex flex-col gap-1">
                <div className="w-full bg-white/[0.14] rounded-full h-[3px] overflow-hidden cursor-pointer" onClick={onSeek}>
                  <div className="bg-white rounded-full h-full" style={{ width: `${mediaProgressPercent}%` }} />
                </div>
                <div className="flex justify-between tnum text-[9.5px] font-medium text-white/45">
                  <span>{formatTime(localProgress)}</span>
                  <span>{mediaDuration > 0 ? formatTime(mediaDuration) : '--:--'}</span>
                </div>
              </div>
              <div className="relative flex items-center justify-center gap-2">
                {skipButton('prev')}
                {playButton(32)}
                {skipButton('next')}
              </div>
            </div>
          ) : null}

          {activeBtDevice?.name && (
            <div className="surface w-full px-2.5 py-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 min-w-0">
                <Headphones size={13} {...ICON} className="text-white/60 flex-shrink-0" />
                <span className="text-[11px] font-medium text-white/85 truncate">{activeBtDevice.name}</span>
              </span>
              {activeBtDevice.battery > 0 && (
                <span className="flex items-center gap-1 flex-shrink-0">
                  <span className="tnum text-[11px] font-medium text-white/60">{activeBtDevice.battery}%</span>
                  <BatteryRing level={activeBtDevice.battery} size={13} />
                </span>
              )}
            </div>
          )}

          {config.showPomodoro !== false && <TimerCard {...timerProps} />}

          {/* Levels */}
          <div className="surface w-full p-2.5 flex flex-col gap-2.5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <button type="button" className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors min-w-0" onClick={toggleMute} title="Mute">
                  <VolIcon size={13} {...ICON} className="flex-shrink-0" />
                  <span className="text-[11px] font-medium truncate">{isBtAudio ? (activeBtDevice?.name || 'Headphones') : 'Volume'}</span>
                </button>
                <span className="tnum text-[11px] font-medium text-white/80">{isMuted ? 'Muted' : volumeLevel}</span>
              </div>
              <LevelBar value={volumeLevel} muted={isMuted} title="Volume" onSet={setVolume} onWheel={(d) => setVolume(Math.max(0, Math.min(100, volumeLevel + d * 3)))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-white/60">
                <span className="flex items-center gap-1.5"><Sun size={13} {...ICON} /><span className="text-[11px] font-medium">Brightness</span></span>
                <span className="tnum text-[11px] font-medium text-white/80">{brightnessLevel}</span>
              </div>
              <LevelBar value={brightnessLevel} title="Brightness" onSet={setBrightness} onWheel={(d) => setBrightness(Math.max(0, Math.min(100, brightnessLevel + d * 5)))} />
            </div>
          </div>

          <QuickToggles
            isMuted={isMuted}
            onToggleMute={toggleMute}
            isNightLight={isNightLight}
            onToggleNightLight={() => { const next = !isNightLight; setIsNightLight?.(next); ipcRenderer?.send('set-night-light', next); }}
            isDnd={isDnd}
            onToggleDnd={() => { const next = !isDnd; setIsDnd?.(next); ipcRenderer?.send('set-dnd', next); }}
          />

          {/* System */}
          <div className="surface w-full p-2.5 flex flex-col gap-2">
            {showHw && (
              <>
                {[['CPU', hardware.cpu], ['Memory', hardware.ram]].map(([label, v]) => (
                  <div key={label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <span className="text-white/55">{label}</span>
                      <span className="tnum text-white/85">{v}%</span>
                    </div>
                    <div className="w-full bg-white/[0.1] h-[4px] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.min(100, v)}%`, background: v >= 85 ? '#FF9F0A' : 'rgba(255,255,255,0.85)' }} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span className="text-white/55">Network</span>
                  <span className="tnum text-white/85 flex items-center gap-0.5"><ArrowDown size={10} className="text-white/45" />{formatSpeed(network.rx)}</span>
                </div>
              </>
            )}
            <div className={`flex items-center justify-between text-[11px] font-medium ${showHw ? 'pt-2 border-t border-white/[0.06]' : ''}`}>
              <span className="text-white/55">Battery</span>
              <span className="flex items-center gap-1.5 text-white/85"><span className="tnum">{battery.level}%</span><BatteryRing level={battery.level} charging={battery.charging} size={15} /></span>
            </div>
          </div>

          <div className={hasMedia ? 'shelf-calendar-optional' : ''}><MiniCalendar /></div>

          {config.showQuickTools !== false && <QuickTools ipcRenderer={ipcRenderer} />}
        </div>
      ) : (
        /* ─────────────── Horizontal top bar ─────────────── */
        <div className="w-full h-full flex items-center justify-between gap-4 relative z-10">
          {/* Left: clock + weather */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {greeting ? (
              <span className="text-[14px] font-semibold text-white truncate">{greeting}</span>
            ) : (
              <div className="flex items-baseline gap-2 min-w-0">
                <span className={`font-display text-[18px] font-semibold leading-none ${isRgb ? 'rgb-text' : 'text-white'}`}>{time}</span>
                <span className="hidden xl:inline text-[12px] font-medium text-white/50 truncate">{formatDate()}</span>
              </div>
            )}
            {showWeather && (
              <button type="button" className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors flex-shrink-0" onClick={onOpenWeather} title={weather.desc}>
                <span className="w-px h-4 bg-white/[0.12] mr-1.5" />
                <WeatherIcon desc={weather.desc} size={16} />
                <span className="tnum text-[12.5px] font-medium">{weather.temp}</span>
              </button>
            )}
            {config.showPomodoro !== false && <TimerChip {...timerProps} />}
          </div>

          {/* Center: media */}
          <div className="relative overflow-hidden flex items-center gap-3 surface px-2 py-1.5 w-[380px] max-w-[36vw] min-w-[220px] flex-shrink">
            {hasMedia && <AmbientGlow artUrl={art} colors={albumColors} isPlaying={!!isPlaying} intensity={0.55} />}
            {hasMedia ? (
              <>
                <button type="button" className="relative" onClick={openMedia} title="Open player">{artwork('w-8 h-8', 15)}</button>
                <div className="relative flex flex-col min-w-0 flex-grow gap-1">
                  <button type="button" className="flex items-center gap-1.5 min-w-0 text-left" onClick={openMedia} title="Open player">
                    <span className="text-[12px] font-semibold text-white truncate">{spotifyState.item.name || 'Unknown track'}</span>
                    <span className="text-[11px] text-white/50 truncate">{spotifyState.item.artists?.map(a => a.name).join(', ') || ''}</span>
                    {config.showAudioWaveform !== false && isPlaying && (
                      <span className="flex-shrink-0 ml-auto pl-1"><AudioWaveform isPlaying colors={albumColors} width={16} height={10} /></span>
                    )}
                  </button>
                  <div className="w-full bg-white/[0.14] rounded-full h-[3px] overflow-hidden cursor-pointer" onClick={onSeek}>
                    <div className="bg-white rounded-full h-full" style={{ width: `${mediaProgressPercent}%` }} />
                  </div>
                </div>
                <div className="relative flex items-center gap-0.5 flex-shrink-0">
                  {skipButton('prev')}
                  {playButton(28)}
                  {skipButton('next')}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-white/40 px-1 py-1.5">
                <Music size={14} {...ICON} />
                <span className="text-[12px] font-medium">Nothing playing</span>
              </div>
            )}
          </div>

          {/* Right: status + actions */}
          <div className="flex items-center justify-end gap-3.5 min-w-0 flex-1">
            {showHw && (
              <div className="hidden lg:flex items-center gap-3 tnum text-[12px] font-medium text-white/70 flex-shrink-0">
                <span title="Processor"><span className="text-white/40 mr-1">CPU</span>{hardware.cpu}%</span>
                <span title="Memory"><span className="text-white/40 mr-1">RAM</span>{hardware.ram}%</span>
                <span className="hidden xl:flex items-center gap-0.5" title="Download"><ArrowDown size={11} className="text-white/40" />{formatSpeed(network.rx)}</span>
              </div>
            )}
            <PrivacyDots privacy={privacy} />
            <span className="flex items-center gap-1.5 text-white/75 flex-shrink-0" title={`Battery ${battery.level}%${battery.charging ? ', charging' : ''}`}>
              <span className="tnum text-[12px] font-medium">{battery.level}%</span>
              <BatteryRing level={battery.level} charging={battery.charging} size={17} />
            </span>
            <div className="flex items-center flex-shrink-0">
              {config.showQuickTools !== false && (
                <ActionButton title="Optimize memory (nothing is closed)" onClick={onBoost} disabled={isBoosting}><Rocket size={14} {...ICON} /></ActionButton>
              )}
              <ActionButton title="Settings" onClick={onShowSettings} badge={badge}><SettingsIcon size={15} {...ICON} /></ActionButton>
              <ActionButton title="Quit Smart Notch" onClick={onQuit} danger><Power size={14} {...ICON} /></ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Notification overlay */}
      <AnimatePresence>
        {(batteryEvent || boostAlert || isBoosting || sysNotification || appNotice) && (
          <motion.div
            initial={{ opacity: 0, y: isSide ? -12 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isSide ? -12 : -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`absolute inset-0 z-[35] bg-[#0c0c0ef2] backdrop-blur-xl flex items-center justify-center ${isSide ? 'flex-col px-3 py-6 text-center gap-3' : 'px-8 gap-4'}`}
          >
            {(() => {
              let leading, title, subtitle, extra = null, closable = false;
              if (batteryEvent) {
                leading = <BatteryRing level={batteryEvent.level} charging={batteryEvent.charging} size={16} />;
                title = batteryEvent.low ? 'Battery low' : (batteryEvent.charging ? 'Charging' : 'On battery');
                subtitle = `${batteryEvent.level}%`;
              } else if (isBoosting) {
                leading = <Rocket size={16} {...ICON} />;
                title = 'Optimizing memory…';
                subtitle = boostProgress ? `${boostProgress.name} · ${boostProgress.mb} MB` : 'Scanning apps';
                extra = (
                  <div className="w-full max-w-[200px] h-[3px] bg-white/[0.1] rounded-full overflow-hidden relative mt-1.5">
                    <motion.div className="absolute top-0 left-0 h-full bg-white/80 w-1/3 rounded-full" initial={{ x: '-100%' }} animate={{ x: '300%' }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} />
                  </div>
                );
              } else if (boostAlert) {
                leading = <Rocket size={16} {...ICON} />;
                title = 'Memory optimized';
                subtitle = boostAlert.freedMB >= 50 ? `${boostAlert.freedMB.toLocaleString()} MB freed from ${boostAlert.apps} apps` : 'Already running lean';
              } else if (!sysNotification && appNotice) {
                const isUpdate = appNotice.kind === 'update';
                leading = isUpdate ? <ArrowDownToLine size={16} {...ICON} /> : <Sparkles size={16} {...ICON} />;
                title = isUpdate ? `Smart Notch ${appNotice.version} is available` : `Updated to ${appNotice.version}`;
                subtitle = appNotice.detail;
                extra = (
                  <div className={`flex items-center gap-1 mt-2 ${isSide ? 'justify-center' : ''}`}>
                    <button type="button" className="h-7 px-3 rounded-full bg-white text-black text-[12px] font-semibold" onClick={() => onAppNoticeAction?.(appNotice)}>
                      {isUpdate ? 'Update' : 'What’s new'}
                    </button>
                    <button type="button" className="h-7 px-3 rounded-full text-[12px] text-white/60 hover:text-white hover:bg-white/[0.08]" onClick={() => onAppNoticeClose?.(appNotice.kind)}>
                      Later
                    </button>
                  </div>
                );
              } else {
                leading = sysNotification.appName
                  ? <span className="text-[12px] font-semibold">{sysNotification.appName.slice(0, 1).toUpperCase()}</span>
                  : <Bell size={15} {...ICON} />;
                title = sysNotification.title || sysNotification.appName || 'Notification';
                subtitle = sysNotification.message;
                closable = true;
              }
              return (
                <div className={`flex ${isSide ? 'flex-col items-center' : 'items-center'} gap-3 min-w-0`} style={{ pointerEvents: 'auto' }}>
                  <div className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0 text-white">{leading}</div>
                  <div className={`flex flex-col min-w-0 max-w-[280px] ${isSide ? 'items-center text-center' : 'text-left'}`}>
                    <span className="text-[13px] font-semibold text-white truncate max-w-full">{title}</span>
                    {subtitle && <span className="text-[11.5px] text-white/55 line-clamp-2">{subtitle}</span>}
                    {extra}
                  </div>
                  {closable && (
                    <button type="button" aria-label="Dismiss" className="w-6 h-6 rounded-full hover:bg-white/[0.1] flex items-center justify-center text-white/40 hover:text-white transition-colors flex-shrink-0" onClick={() => setSysNotification(null)}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default ShelfBar;
