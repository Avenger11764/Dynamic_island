const { SMTCMonitor } = require('@coooookies/windows-smtc-monitor');
let monitor;
try {
  monitor = new SMTCMonitor();
} catch(e) {
  process.exit(1);
}

setInterval(() => {
  try {
    const sessions = Array.from(monitor.sessions.values());
    let bestSession = sessions.find(s => s.sourceAppId && s.sourceAppId.toLowerCase().includes('spotify'));
    if (!bestSession) bestSession = sessions.find(s => s.playback && s.playback.playbackStatus === 4);
    if (!bestSession) bestSession = sessions[0];

    if (bestSession && bestSession.media) {
      const item = {
        title: bestSession.media.title || 'Unknown',
        artist: bestSession.media.artist || 'Unknown',
        is_playing: bestSession.playback && bestSession.playback.playbackStatus === 4,
        progress_ms: bestSession.timeline && bestSession.timeline.position ? bestSession.timeline.position * 1000 : 0
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
