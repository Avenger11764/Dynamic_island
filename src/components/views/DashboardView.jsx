import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, SkipBack, Play, Pause, SkipForward, Coffee, Headphones,
  Calculator, Scissors, Activity, ArrowDown, ArrowUp, ChevronRight
} from 'lucide-react';
import { SourceAppIcon } from '../ui/SourceAppIcon';
import { AmbientGlow } from '../ui/AmbientGlow';
import { BatteryRing } from '../ui/Glyphs';
import { formatTime, formatSpeed } from '../../utils/formatters';
import { useAlbumColors } from '../../utils/useAlbumColors';
import { sendIpc } from '../../utils/ipc';

const ipcRenderer = typeof window !== 'undefined'
  ? (window.electronAPI || (window.require ? window.require('electron').ipcRenderer : null))
  : null;

const pad = (n) => String(n).padStart(2, '0');

const Row = ({ onClick, children, className = '' }) => (
  <div
    className={`surface ${onClick ? 'surface-hover cursor-pointer' : ''} flex items-center justify-between px-3 py-2.5 ${className}`}
    onClick={onClick ? (e) => { e.stopPropagation(); onClick(e); } : undefined}
  >
    {children}
  </div>
);

const Meter = ({ label, value }) => (
  <div className="flex items-center gap-3">
    <span className="text-[11px] font-medium text-white/55 w-8 flex-shrink-0">{label}</span>
    <div className="flex-grow h-[5px] bg-white/[0.1] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, value || 0))}%`, background: value >= 85 ? '#FF9F0A' : 'rgba(255,255,255,0.85)', transition: 'width 400ms ease' }}
      />
    </div>
    <span className="tnum text-[11px] font-medium text-white/80 w-8 text-right flex-shrink-0">{value}%</span>
  </div>
);

export const DashboardView = React.memo(({
  isSideNotch = false,
  spotifyState,
  setSpotifyState,
  localProgress = 0,
  handleProgressBarClick,
  isPomoRunning,
  pomoMode,
  pomodoro,
  activeBtDevice,
  hardware,
  network,
  privacy = { cam: false, mic: false },
  setViewMode,
  config = {}
}) => {
  const currentProgress = localProgress || spotifyState?.progress_ms || 0;
  const durationMs = spotifyState?.duration_ms || spotifyState?.item?.duration_ms || 0;
  const progressPercent = durationMs > 0 ? Math.min(100, Math.max(0, (currentProgress / durationMs) * 100)) : 0;

  const albumArtUrl = spotifyState?.item?.album?.images?.[0]?.url || '';
  const albumColors = useAlbumColors(albumArtUrl);
  const isPlaying = !!spotifyState?.is_playing;

  const handleOpenMediaApp = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const targetApp = spotifyState?.sourceAppId || '';
    const targetTitle = spotifyState?.item?.name || '';
    const targetArtist = spotifyState?.item?.artists?.[0]?.name || '';
    if (ipcRenderer && typeof ipcRenderer.send === 'function') {
      ipcRenderer.send('open-media-app', targetApp, targetTitle, targetArtist);
    } else {
      sendIpc('open-media-app', targetApp, targetTitle, targetArtist);
    }
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    const nextState = !isPlaying;
    if (setSpotifyState) setSpotifyState((prev) => (prev ? { ...prev, is_playing: nextState } : prev));
    ipcRenderer?.send(nextState ? 'spotify-play' : 'spotify-pause');
  };

  const artwork = (sizeClass, iconSize) => (
    <div className={`${sizeClass} rounded-[10px] overflow-hidden bg-white/[0.08] flex items-center justify-center relative flex-shrink-0`}>
      {albumArtUrl ? (
        <img src={albumArtUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <Music size={iconSize} strokeWidth={1.8} className="text-white/40" />
      )}
      {spotifyState?.sourceAppId && (
        <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded-[5px] p-[2px] flex items-center justify-center z-10">
          <SourceAppIcon sourceAppId={spotifyState.sourceAppId} />
        </div>
      )}
    </div>
  );

  const title = spotifyState?.item?.name || 'Not playing';
  const subtitle = spotifyState?.item?.artists?.[0]?.name || (spotifyState?.item ? 'Now playing' : 'Play something to see it here');

  return (
    <motion.div
      key="dashboard"
      className={`w-full h-full flex ${isSideNotch ? 'flex-col gap-2' : 'flex-row gap-2.5'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Media */}
      {config?.showMediaWidget !== false && (
        <div
          className={`surface surface-hover relative overflow-hidden cursor-pointer flex-shrink-0 ${isSideNotch ? 'w-full flex items-center gap-3 p-2.5' : 'w-[228px] flex flex-col justify-between p-3.5'}`}
          title={spotifyState?.item ? `Open ${spotifyState.item.name}` : 'Open media player'}
          onClick={handleOpenMediaApp}
        >
          <AmbientGlow artUrl={albumArtUrl} colors={albumColors} isPlaying={isPlaying} />

          {isSideNotch ? (
            <>
              <div className="relative z-[1]">{artwork('w-11 h-11', 18)}</div>
              <div className="relative z-[1] flex flex-col min-w-0 flex-1">
                <span className="text-[12.5px] font-semibold text-white truncate leading-tight">{title}</span>
                <span className="text-[11px] text-white/55 truncate mt-0.5">{subtitle}</span>
              </div>
              <button
                type="button"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="relative z-[1] w-8 h-8 rounded-full bg-white/[0.12] hover:bg-white/[0.2] text-white flex items-center justify-center flex-shrink-0 transition-colors"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={13} fill="currentColor" strokeWidth={0} /> : <Play size={13} fill="currentColor" strokeWidth={0} className="ml-0.5" />}
              </button>
            </>
          ) : (
            <>
              <div className="relative z-[1] flex items-center gap-3">
                {artwork('w-[52px] h-[52px]', 20)}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[13px] font-semibold text-white truncate leading-tight">{title}</span>
                  <span className="text-[11.5px] text-white/55 truncate mt-0.5">{subtitle}</span>
                </div>
              </div>

              <div className="relative z-[1] flex flex-col gap-1.5">
                <div
                  className="w-full h-[4px] bg-white/[0.16] rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); handleProgressBarClick?.(e); }}
                >
                  <div className="h-full bg-white rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="flex justify-between tnum text-[10px] font-medium text-white/45">
                  <span>{formatTime(currentProgress)}</span>
                  <span>{durationMs > 0 ? formatTime(durationMs) : '--:--'}</span>
                </div>
              </div>

              <div className="relative z-[1] flex items-center justify-center gap-6" onClick={(e) => e.stopPropagation()}>
                <button type="button" aria-label="Previous track" className="text-white/70 hover:text-white transition-colors" onClick={() => ipcRenderer?.send('spotify-prev')}>
                  <SkipBack size={16} fill="currentColor" strokeWidth={0} />
                </button>
                <button
                  type="button"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause size={15} fill="currentColor" strokeWidth={0} /> : <Play size={15} fill="currentColor" strokeWidth={0} className="ml-0.5" />}
                </button>
                <button type="button" aria-label="Next track" className="text-white/70 hover:text-white transition-colors" onClick={() => ipcRenderer?.send('spotify-skip')}>
                  <SkipForward size={16} fill="currentColor" strokeWidth={0} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Widgets */}
      <div className={`min-w-0 flex flex-col gap-2 ${isSideNotch ? '' : 'flex-grow justify-center'}`}>
        {isPomoRunning ? (
          <Row onClick={() => setViewMode('pomodoro')}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: pomoMode === 'work' ? '#FF9F0A' : '#30D158' }} />
              <span className="text-[12px] font-medium text-white/85 truncate">{pomoMode === 'work' ? 'Focus' : 'Break'}</span>
            </div>
            <span className="font-display text-[14px] font-semibold text-white">{pad(Math.floor(pomodoro / 60))}:{pad(pomodoro % 60)}</span>
          </Row>
        ) : activeBtDevice ? (
          <Row>
            <div className="flex items-center gap-2.5 min-w-0">
              <Headphones size={15} strokeWidth={1.9} className="text-white/70 flex-shrink-0" />
              <span className="text-[12px] font-medium text-white/85 truncate" title={activeBtDevice.name}>{activeBtDevice.name}</span>
            </div>
            {activeBtDevice.battery > 0 && (
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                <span className="tnum text-[11.5px] font-medium text-white/70">{activeBtDevice.battery}%</span>
                <BatteryRing level={activeBtDevice.battery} size={16} />
              </div>
            )}
          </Row>
        ) : (
          <Row onClick={() => setViewMode('pomodoro')}>
            <div className="flex items-center gap-2.5">
              <Coffee size={15} strokeWidth={1.9} className="text-white/55" />
              <span className="text-[12px] font-medium text-white/70">Focus timer</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/45">
              <span className="font-display text-[13px] font-medium">{pad(Math.floor(pomodoro / 60))}:{pad(pomodoro % 60)}</span>
              <ChevronRight size={13} />
            </div>
          </Row>
        )}

        {config?.showHardware !== false && config?.showHardwareWidget !== false && (
          <div className="surface surface-hover cursor-pointer flex flex-col gap-2 px-3 py-2.5" onClick={(e) => { e.stopPropagation(); setViewMode('stats'); }}>
            <Meter label="CPU" value={hardware.cpu} />
            <Meter label="RAM" value={hardware.ram} />
          </div>
        )}

        {config?.showNetworkWidget !== false && (
          <Row onClick={() => setViewMode('network')}>
            <span className="text-[12px] font-medium text-white/70">Network</span>
            <div className="flex items-center gap-3 tnum text-[11.5px] font-medium text-white/80">
              <span className="flex items-center gap-1"><ArrowDown size={11} className="text-white/45" />{formatSpeed(network.rx)}</span>
              <span className="flex items-center gap-1"><ArrowUp size={11} className="text-white/45" />{formatSpeed(network.tx)}</span>
            </div>
          </Row>
        )}

        {config?.showQuickTools !== false && (
          <div className="flex items-center gap-2">
            {[
              { title: 'Calculator', Icon: Calculator, ch: 'open-calc' },
              { title: 'Snipping Tool', Icon: Scissors, ch: 'open-snip' },
              { title: 'Task Manager', Icon: Activity, ch: 'open-taskmgr' }
            ].map(({ title: t, Icon, ch }) => (
              <button
                key={ch}
                type="button"
                title={t}
                onClick={(e) => { e.stopPropagation(); ipcRenderer?.send(ch); }}
                className="surface surface-hover flex-1 h-9 flex items-center justify-center text-white/75 hover:text-white active:scale-[0.97] transition-transform"
              >
                <Icon size={15} strokeWidth={1.9} />
              </button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {(privacy?.cam || privacy?.mic) && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
              <Row>
                <span className="text-[12px] font-medium text-white/70">In use</span>
                <div className="flex items-center gap-3 text-[11.5px] font-medium text-white/80">
                  {privacy?.cam && <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />Camera</span>}
                  {privacy?.mic && <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#FF9F0A]" />Microphone</span>}
                </div>
              </Row>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
