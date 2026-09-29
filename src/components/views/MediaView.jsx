import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, SkipBack, Play, Pause, SkipForward } from 'lucide-react';
import { SourceAppIcon } from '../ui/SourceAppIcon';
import { AmbientGlow } from '../ui/AmbientGlow';
import { formatTime } from '../../utils/formatters';
import { useAlbumColors } from '../../utils/useAlbumColors';
import { sendIpc } from '../../utils/ipc';

const ipcRenderer = typeof window !== 'undefined' 
  ? (window.electronAPI || (window.require ? window.require('electron').ipcRenderer : null)) 
  : null;

export const MediaView = React.memo(({
  isSideNotch = false,
  spotifyState,
  setSpotifyState,
  localProgress = 0,
  handleProgressBarClick,
  lyric = null
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
      key="media"
      className={`w-full h-full flex relative overflow-hidden rounded-2xl ${
        isSideNotch
          ? 'flex-col gap-2 justify-center text-center items-center'
          : 'flex-col justify-between'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Ambient artwork glow – confined by overflow-hidden */}
      <AmbientGlow artUrl={albumArtUrl} colors={albumColors} isPlaying={!!spotifyState?.is_playing} />
      {isSideNotch ? (
        <div className="flex flex-col items-center gap-2.5 w-full p-2.5" style={{ position: 'relative', zIndex: 1 }}>
          <div
            className="w-16 h-16 rounded-[14px] overflow-hidden bg-white/[0.08] flex items-center justify-center relative group cursor-pointer active:scale-95 transition-transform"
            title="Click to open player"
            onClick={handleOpenMediaApp}
          >
            {spotifyState?.item?.album?.images?.[0] ? (
              <img
                src={spotifyState.item.album.images[0].url}
                alt="Album art"
                className="w-full h-full object-cover "
              />
            ) : (
              <Music size={24} strokeWidth={1.8} className="text-white/40" />
            )}
            {spotifyState?.sourceAppId && (
              <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded-[5px] p-[2px] flex items-center justify-center z-10">
                <SourceAppIcon sourceAppId={spotifyState.sourceAppId} />
              </div>
            )}
          </div>
          <div
            className="flex flex-col items-center text-center cursor-pointer hover:opacity-80 transition-opacity w-full px-2"
            title="Click to open player"
            onClick={handleOpenMediaApp}
          >
            <span className="font-semibold text-[13px] text-white leading-tight truncate w-full">
              {spotifyState?.item?.name || 'Not playing'}
            </span>
            <span className="text-[11px] text-white/55 truncate w-full mt-0.5">
              {spotifyState?.item?.artists?.map(a => a.name).join(', ') || 'Play something to see it here'}
            </span>
          </div>

          {lyric !== null && (
            <div className="w-full px-3 min-h-[38px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={lyric || 'empty'}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="text-[12.5px] font-semibold text-white/90 text-center leading-snug line-clamp-2"
                  style={{ textShadow: '0 1px 10px rgba(0,0,0,0.6)' }}
                >
                  {lyric || '♪'}
                </motion.span>
              </AnimatePresence>
            </div>
          )}

          {spotifyState?.item && (
            <div className="w-full flex flex-col gap-1 px-3">
              <div
                className="w-full bg-white/[0.16] rounded-full h-[4px] relative overflow-hidden cursor-pointer"
                onClick={handleProgressBarClick}
              >
                <div
                  className="bg-white rounded-full h-full transition-[width] duration-300"
                  style={{
                    width: `${progressPercent}%`
                  }}
                />
              </div>
              <div className="flex justify-between tnum text-[10px] font-medium text-white/45 w-full">
                <span>{formatTime(currentProgress)}</span>
                <span>
                  {durationMs > 0 ? formatTime(durationMs) : '--:--'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-1 justify-center">
            <button
              type="button"
              aria-label="Previous Track"
              className="w-8 h-8 rounded-full hover:bg-white/15 active:scale-95 flex items-center justify-center transition-all duration-150 text-white/70 hover:text-white"
              onClick={() => ipcRenderer?.send('spotify-prev')}
            >
              <SkipBack size={15} fill="currentColor" strokeWidth={0} />
            </button>
            <button
              type="button"
              aria-label={spotifyState?.is_playing ? "Pause" : "Play"}
              className="w-9 h-9 rounded-full bg-white text-black hover:bg-white/90 active:scale-95 flex items-center justify-center transition-all duration-150"
              onClick={() => {
                const nextState = !spotifyState?.is_playing;
                if (setSpotifyState) {
                  setSpotifyState(prev => prev ? { ...prev, is_playing: nextState } : prev);
                }
                if (ipcRenderer) ipcRenderer.send(nextState ? 'spotify-play' : 'spotify-pause');
              }}
            >
              {spotifyState?.is_playing ? <Pause size={15} fill="currentColor" strokeWidth={0} /> : <Play size={15} fill="currentColor" strokeWidth={0} className="translate-x-[1px]" />}
            </button>
            <button
              type="button"
              aria-label="Next Track"
              className="w-8 h-8 rounded-full hover:bg-white/15 active:scale-95 flex items-center justify-center transition-all duration-150 text-white/70 hover:text-white"
              onClick={() => ipcRenderer?.send('spotify-skip')}
            >
              <SkipForward size={15} fill="currentColor" strokeWidth={0} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'space-between', gap: '4px', padding: '12px 14px' }}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5 w-full">
              <div 
                className="w-12 h-12 rounded-[10px] overflow-hidden bg-white/[0.08] flex items-center justify-center relative flex-shrink-0 cursor-pointer group active:scale-95 transition-transform"
                title="Click to open player"
                onClick={handleOpenMediaApp}
              >
                {spotifyState?.item?.album?.images?.[0] ? (
                  <img
                    src={spotifyState.item.album.images[0].url}
                    alt="Album art"
                    className="w-full h-full object-cover "
                  />
                ) : (
                  <Music size={20} strokeWidth={1.8} className="text-white/40" />
                )}
                {spotifyState?.sourceAppId && (
                  <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded-[5px] p-[2px] flex items-center justify-center z-10">
                    <SourceAppIcon sourceAppId={spotifyState.sourceAppId} />
                  </div>
                )}
              </div>
              <div
                className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity min-w-0 flex-1"
                title="Click to open player"
                onClick={handleOpenMediaApp}
              >
                <span className="font-semibold text-[13.5px] leading-tight truncate">
                  {spotifyState?.item?.name || 'Not playing'}
                </span>
                <span className="text-[11.5px] text-white/55 truncate mt-0.5">
                  {spotifyState?.item?.artists?.map(a => a.name).join(', ') || 'Play something to see it here'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous Track"
                className="w-8 h-8 rounded-full hover:bg-white/15 active:scale-95 flex items-center justify-center transition-all duration-150 text-white/70 hover:text-white"
                onClick={() => ipcRenderer?.send('spotify-prev')}
              >
                <SkipBack size={15} fill="currentColor" strokeWidth={0} />
              </button>
              <button
                type="button"
                aria-label={spotifyState?.is_playing ? "Pause" : "Play"}
                className="w-9 h-9 rounded-full bg-white text-black hover:bg-white/90 active:scale-95 flex items-center justify-center transition-all duration-150"
                onClick={() => {
                  const nextState = !spotifyState?.is_playing;
                  if (setSpotifyState) {
                    setSpotifyState(prev => prev ? { ...prev, is_playing: nextState } : prev);
                  }
                  if (ipcRenderer) ipcRenderer.send(nextState ? 'spotify-play' : 'spotify-pause');
                }}
              >
                {spotifyState?.is_playing ? <Pause size={16} fill="currentColor" strokeWidth={0} /> : <Play size={16} fill="currentColor" strokeWidth={0} className="translate-x-[1px]" />}
              </button>
              <button
                type="button"
                aria-label="Next Track"
                className="w-8 h-8 rounded-full hover:bg-white/15 active:scale-95 flex items-center justify-center transition-all duration-150 text-white/70 hover:text-white"
                onClick={() => ipcRenderer?.send('spotify-skip')}
              >
                <SkipForward size={15} fill="currentColor" strokeWidth={0} />
              </button>
            </div>
          </div>
          {spotifyState?.item && (
            <div className="w-full flex flex-col gap-1 mt-1 px-0.5">
              <div
                className="w-full bg-white/[0.16] rounded-full h-[4px] relative overflow-hidden cursor-pointer"
                onClick={handleProgressBarClick}
              >
                <div
                  className="bg-white rounded-full h-full transition-[width] duration-300"
                  style={{
                    width: `${progressPercent}%`
                  }}
                />
              </div>
              <div className="flex justify-between tnum text-[10px] font-medium text-white/45 w-full">
                <span>{formatTime(currentProgress)}</span>
                <span>
                  {durationMs > 0 ? formatTime(durationMs) : '--:--'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});
