import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, SkipBack, Play, Pause, SkipForward, Coffee, 
  Battery, Shield, Calculator, Scissors, Activity 
} from 'lucide-react';
import { 
  CpuChipIcon, RamStickIcon, PremiumHeadphonesIcon, PremiumWifiIcon, PremiumBadge 
} from '../ui/PremiumIcons';
import { SourceAppIcon } from '../ui/SourceAppIcon';
import { AmbientGlow } from '../ui/AmbientGlow';
import { formatTime, formatSpeed } from '../../utils/formatters';
import { useAlbumColors } from '../../utils/useAlbumColors';
import { sendIpc } from '../../utils/ipc';

const ipcRenderer = typeof window !== 'undefined' 
  ? (window.electronAPI || (window.require ? window.require('electron').ipcRenderer : null)) 
  : null;

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

  return (
    <motion.div
      key="dashboard"
      className={`w-full h-full flex items-center justify-between ${isSideNotch ? 'flex-col gap-2' : 'flex-row gap-3'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Left Column: Media Card */}
      {(config?.showMediaWidget !== false) && (
        <div
          className={`${isSideNotch ? 'w-full flex-row justify-between' : 'w-[235px] flex-col justify-center h-[210px]'} bg-white/[0.04] rounded-2xl flex items-center p-3 relative overflow-hidden group hover:bg-white/[0.08] active:scale-[0.99] transition-all border border-white/5 cursor-pointer flex-shrink-0`}
          title={spotifyState?.item ? `Click to open application: ${spotifyState.item.name}` : 'Click to open media player'}
          onClick={handleOpenMediaApp}
        >
        {/* Ambient artwork glow – confined by overflow-hidden on this card */}
        <AmbientGlow artUrl={albumArtUrl} colors={albumColors} isPlaying={!!spotifyState?.is_playing} />

        <div className={`flex items-center ${isSideNotch ? 'flex-1 min-w-0 mr-2 gap-3' : 'flex-col w-full'}`} style={{ position: 'relative', zIndex: 1 }}>
          <div
            className={`${isSideNotch ? 'w-11 h-11' : 'w-[68px] h-[68px] mb-2'} rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative flex-shrink-0 cursor-pointer`}
            onClick={handleOpenMediaApp}
          >
            {spotifyState?.item?.album?.images?.[0] ? (
              <img
                src={spotifyState.item.album.images[0].url}
                alt="Album art"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <Music size={isSideNotch ? 20 : 24} className="text-white/80 animate-pulse" />
            )}
            {spotifyState?.sourceAppId && (
              <div className="absolute bottom-0 right-0 bg-black/75 rounded-tl-md p-0.5 flex items-center justify-center border-t border-l border-white/10 z-10">
                <SourceAppIcon sourceAppId={spotifyState.sourceAppId} />
              </div>
            )}
          </div>

          <div 
            className={`flex flex-col ${isSideNotch ? 'items-start flex-1 min-w-0' : 'items-center text-center w-full'} cursor-pointer`}
            onClick={handleOpenMediaApp}
          >
            <span className={`font-extrabold ${isSideNotch ? 'text-xs' : 'text-[13px]'} text-white leading-tight truncate w-full`}>
              {spotifyState?.item?.name || 'No Media Playing'}
            </span>
            <span className="text-[10px] font-semibold text-white/50 truncate w-full mt-0.5">
              {spotifyState?.item?.artists?.[0]?.name || (spotifyState?.item ? 'Playing' : 'Spotify / Browser')}
            </span>

            {!isSideNotch && (
              <>
                {/* Playback Controls */}
                <div className="flex items-center gap-4 mt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    aria-label="Previous Track"
                    className="text-white/60 hover:text-white transition-colors"
                    onClick={() => ipcRenderer?.send('spotify-prev')}
                  >
                    <SkipBack size={14} fill="currentColor" />
                  </button>
                  <button
                    type="button"
                    aria-label={spotifyState?.is_playing ? "Pause" : "Play"}
                    className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                    onClick={() => {
                      const nextState = !spotifyState?.is_playing;
                      if (setSpotifyState) {
                        setSpotifyState(prev => prev ? { ...prev, is_playing: nextState } : prev);
                      }
                      if (ipcRenderer) ipcRenderer.send(nextState ? 'spotify-play' : 'spotify-pause');
                    }}
                  >
                    {spotifyState?.is_playing ? (
                      <Pause size={14} fill="currentColor" />
                    ) : (
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Next Track"
                    className="text-white/60 hover:text-white transition-colors"
                    onClick={() => ipcRenderer?.send('spotify-skip')}
                  >
                    <SkipForward size={14} fill="currentColor" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full mt-1.5 flex items-center gap-2 px-1 text-[9px] font-bold text-white/40 font-mono">
                  <span>{formatTime(currentProgress)}</span>
                  <div
                    className="flex-grow h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer hover:bg-white/20 transition-colors relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (handleProgressBarClick) handleProgressBarClick(e);
                    }}
                  >
                    <div
                      className="h-full bg-white rounded-full relative"
                      style={{
                        width: `${progressPercent}%`
                      }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    </div>
                  </div>
                  <span>{durationMs > 0 ? formatTime(durationMs) : '--:--'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {isSideNotch && (
          <button
            type="button"
            aria-label={spotifyState?.is_playing ? "Pause" : "Play"}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center flex-shrink-0 transition-colors ml-1 shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              const nextState = !spotifyState?.is_playing;
              if (setSpotifyState) {
                setSpotifyState(prev => prev ? { ...prev, is_playing: nextState } : prev);
              }
              if (ipcRenderer) ipcRenderer.send(nextState ? 'spotify-play' : 'spotify-pause');
            }}
          >
            {spotifyState?.is_playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
          </button>
        )}
      </div>
      )}

      {/* Right Column: Stacked Widgets */}
      <div className={`flex-grow flex flex-col justify-center ${privacy?.cam || privacy?.mic ? 'gap-1.5' : 'gap-2'} w-full`}>
        {/* Top Right Widget: Pomodoro Timer or Bluetooth */}
        {isPomoRunning ? (
          <div
            className="bg-white/[0.04] rounded-2xl flex items-center justify-between p-2.5 cursor-pointer hover:bg-white/[0.08] transition-colors border border-white/5"
            onClick={(e) => {
              e.stopPropagation();
              setViewMode('pomodoro');
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                  pomoMode === 'work'
                    ? 'bg-orange-500/20 border-orange-500/30'
                    : 'bg-green-500/20 border-green-500/30'
                }`}
              >
                <Coffee size={11} className={pomoMode === 'work' ? 'text-orange-400' : 'text-green-400'} />
              </div>
              <span className="text-[11px] font-bold text-white/80 truncate">
                {pomoMode === 'work' ? 'Focus Session' : 'Break Time'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-[12px] font-mono font-bold ${
                  pomoMode === 'work' ? 'text-orange-400' : 'text-green-400'
                }`}
              >
                {String(Math.floor(pomodoro / 60)).padStart(2, '0')}:
                {String(pomodoro % 60).padStart(2, '0')}
              </span>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            </div>
          </div>
        ) : activeBtDevice ? (
          <div className="bg-white/[0.04] rounded-2xl flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/[0.08] transition-colors border border-white/5">
            <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
              <PremiumBadge variant="blue" size="md">
                <PremiumHeadphonesIcon size={13} className="text-cyan-300" />
              </PremiumBadge>
              <div className="flex flex-col min-w-0">
                <span
                  className="text-[11px] font-bold text-white/90 truncate"
                  title={activeBtDevice.name}
                >
                  {activeBtDevice.name}
                </span>
                <span className="text-[9px] font-semibold text-emerald-400/90 uppercase tracking-wider">
                  Connected
                </span>
              </div>
            </div>
            {activeBtDevice.battery > 0 && (
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full flex-shrink-0">
                <Battery size={11} className="text-emerald-400" />
                <span className="text-[10px] font-mono font-bold text-emerald-300">
                  {activeBtDevice.battery}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            className="bg-white/[0.04] rounded-2xl flex items-center justify-between p-2.5 cursor-pointer hover:bg-white/[0.08] transition-colors border border-white/5"
            onClick={(e) => {
              e.stopPropagation();
              setViewMode('pomodoro');
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Coffee size={11} className="text-orange-400/50" />
              </div>
              <span className="text-[11px] font-bold text-white/50">Task Timer</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-mono font-bold text-white/30">
                {String(Math.floor(pomodoro / 60)).padStart(2, '0')}:
                {String(pomodoro % 60).padStart(2, '0')}
              </span>
              <Play size={10} className="text-white/20" fill="currentColor" />
            </div>
          </div>
        )}

        {/* CPU / RAM Mini Widget */}
        {(config?.showHardware !== false && config?.showHardwareWidget !== false) && (
          <div
            className="bg-white/[0.04] rounded-2xl flex flex-col px-3 py-2 gap-1.5 cursor-pointer hover:bg-white/[0.08] transition-colors border border-white/5"
            onClick={(e) => {
              e.stopPropagation();
              setViewMode('stats');
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-[52px] flex-shrink-0">
                <PremiumBadge variant="green" size="sm">
                  <CpuChipIcon size={11} className="text-emerald-300" />
                </PremiumBadge>
                <span className="text-[10px] font-bold text-white/75">CPU</span>
              </div>
              <div className="flex-grow bg-white/5 h-1.5 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                  style={{ width: `${hardware.cpu}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-white/90 w-8 text-right flex-shrink-0">
                {hardware.cpu}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-[52px] flex-shrink-0">
                <PremiumBadge variant="blue" size="sm">
                  <RamStickIcon size={11} className="text-cyan-300" />
                </PremiumBadge>
                <span className="text-[10px] font-bold text-white/75">RAM</span>
              </div>
              <div className="flex-grow bg-white/5 h-1.5 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                  style={{ width: `${hardware.ram}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-white/90 w-8 text-right flex-shrink-0">
                {hardware.ram}%
              </span>
            </div>
          </div>
        )}

        {/* Network Speed Mini Widget */}
        {(config?.showNetworkWidget !== false) && (
          <div
            className="bg-white/[0.04] rounded-2xl flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/[0.08] transition-colors border border-white/5"
            onClick={(e) => {
              e.stopPropagation();
              setViewMode('network');
            }}
          >
            <div className="flex items-center gap-2 flex-shrink-0">
              <PremiumBadge variant="purple" size="sm">
                <PremiumWifiIcon size={11} className="text-purple-300" />
              </PremiumBadge>
              <span className="text-[10px] font-bold text-white/80">Network</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span className="text-[9px] text-emerald-400 font-bold">↓</span>
                <span className="text-white/85 font-semibold">{formatSpeed(network.rx)}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span className="text-[9px] text-cyan-400 font-bold">↑</span>
                <span className="text-white/85 font-semibold">{formatSpeed(network.tx)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Utilities Bar */}
        {(config?.showQuickTools !== false) && (
          <div className="bg-white/[0.04] rounded-2xl flex items-center justify-between px-3 py-1.5 border border-white/5 shadow-sm">
            <span className="text-[10px] font-bold text-white/50 pl-0.5 uppercase tracking-wider">Quick Tools</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                title="Calculator"
                onClick={(e) => { e.stopPropagation(); ipcRenderer?.send('open-calc'); }}
                className="w-7 h-7 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 border border-white/5"
              >
                <Calculator size={13} />
              </button>
              <button
                type="button"
                title="Screen Snip & Sketch"
                onClick={(e) => { e.stopPropagation(); ipcRenderer?.send('open-snip'); }}
                className="w-7 h-7 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 border border-white/5"
              >
                <Scissors size={13} />
              </button>
              <button
                type="button"
                title="Task Manager"
                onClick={(e) => { e.stopPropagation(); ipcRenderer?.send('open-taskmgr'); }}
                className="w-7 h-7 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 border border-white/5"
              >
                <Activity size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Privacy Indicators Explanation (Visible only when Camera or Mic is active) */}
        <AnimatePresence>
          {(privacy?.cam || privacy?.mic) && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="bg-white/[0.04] rounded-2xl flex items-center justify-between px-3 py-2 border border-white/5 shadow-sm"
            >
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center border border-white/10">
                  <Shield size={10} className="text-white/80" />
                </div>
                <span className="text-[10px] font-bold text-white/80">Privacy</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {privacy?.cam && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
                    <span className="text-[9px] font-semibold text-emerald-300 tracking-wide">
                      Camera active
                    </span>
                  </div>
                )}
                {privacy?.mic && (
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse" />
                    <span className="text-[9px] font-semibold text-amber-300 tracking-wide">
                      Mic active
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
