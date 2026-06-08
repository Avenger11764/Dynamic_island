const { SMTCMonitor } = require('@coooookies/windows-smtc-monitor');
let monitor;
try {
  monitor = new SMTCMonitor();
} catch(e) {
  process.exit(1);
}

let lastPosition = 0;
let lastUpdateDate = 0;
let lastTrackId = '';
let lastThumbnailBuffer = null;

setInterval(() => {
  try {
    const sessions = Array.from(monitor.sessions.values());
    let bestSession = sessions.find(s => s.sourceAppId && s.sourceAppId.toLowerCase().includes('spotify'));
    if (!bestSession) bestSession = sessions.find(s => s.playback && s.playback.playbackStatus === 4);
    if (!bestSession) bestSession = sessions[0];

    if (bestSession && bestSession.media) {
      const is_playing = bestSession.playback && bestSession.playback.playbackStatus === 4;
      const currentTrackId = bestSession.media.title + '-' + bestSession.media.artist;
      let currentPos = bestSession.timeline && bestSession.timeline.position ? bestSession.timeline.position * 1000 : 0;
      let progress_ms = currentPos;
      
      let thumbnailToSend = undefined;
      if (currentTrackId !== lastTrackId) {
         lastTrackId = currentTrackId;
         lastPosition = currentPos;
         lastUpdateDate = Date.now();
         lastThumbnailBuffer = bestSession.media.thumbnail;
         thumbnailToSend = lastThumbnailBuffer ? lastThumbnailBuffer.toString('base64') : '';
      } else {
         if (is_playing) {
            if (currentPos === lastPosition && lastUpdateDate !== 0) {
               progress_ms = lastPosition + (Date.now() - lastUpdateDate);
            } else if (currentPos !== lastPosition) {
               lastPosition = currentPos;
               lastUpdateDate = Date.now();
            }
         } else {
            lastPosition = currentPos;
            lastUpdateDate = Date.now();
         }

         // Same track: check if thumbnail loaded or changed
         const currentThumb = bestSession.media.thumbnail;
         if (currentThumb) {
            const isBuf = Buffer.isBuffer(currentThumb);
            const isLastBuf = Buffer.isBuffer(lastThumbnailBuffer);
            const hasChanged = !isLastBuf || (isBuf && (typeof currentThumb.equals === 'function' ? !currentThumb.equals(lastThumbnailBuffer) : currentThumb.toString('base64') !== lastThumbnailBuffer.toString('base64')));
            if (hasChanged) {
               lastThumbnailBuffer = currentThumb;
               thumbnailToSend = currentThumb.toString('base64');
            }
         }
      }

      const item = {
        title: bestSession.media.title || 'Unknown',
        artist: bestSession.media.artist || 'Unknown',
        is_playing: is_playing,
        progress_ms: progress_ms,
        duration_ms: bestSession.timeline ? (bestSession.timeline.duration || 0) * 1000 : 0,
        appId: bestSession.sourceAppId,
        is_spotify: !!(bestSession.sourceAppId && bestSession.sourceAppId.toLowerCase().includes('spotify'))
      };
      if (thumbnailToSend !== undefined) {
        item.thumbnail = thumbnailToSend;
      }
      process.send(item);
    } else {
      process.send(null);
    }
  } catch(e) {
    // Ignore native mapping errors
  }
}, 1000);
