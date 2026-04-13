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
      
      if (currentTrackId !== lastTrackId) {
         lastTrackId = currentTrackId;
         lastPosition = currentPos;
         lastUpdateDate = Date.now();
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
      }

      const item = {
        title: bestSession.media.title || 'Unknown',
        artist: bestSession.media.artist || 'Unknown',
        is_playing: is_playing,
        progress_ms: progress_ms
      };
      if (bestSession.media.thumbnail) {
        item.thumbnail = bestSession.media.thumbnail.toString('base64');
      }
      process.send(item);
    } else {
      process.send(null);
    }
  } catch(e) {
    // Ignore native mapping errors
  }
}, 1000);
