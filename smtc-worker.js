const { SMTCMonitor } = require('@coooookies/windows-smtc-monitor');
let monitor;
try {
  monitor = new SMTCMonitor();
} catch(e) {
  process.exit(1);
}

function getThumbnailMime(buf) {
  if (!buf || !Buffer.isBuffer(buf) || buf.length < 4) return 'image/png';
  if (buf[0] === 0x42 && buf[1] === 0x4D) return 'image/bmp';
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'image/webp';
  return 'image/png';
}

let lastPosition = 0;
let lastUpdateDate = 0;
let lastTrackId = '';
let lastThumbnailBuffer = null;

function poll() {
  lastPoll = Date.now();
  try {
    // 1. Fetch fresh sessions directly from Windows OS in real-time
    let sessions = [];
    try {
      sessions = SMTCMonitor.getMediaSessions() || [];
    } catch(e) {}
    if (!sessions || sessions.length === 0) {
      try { sessions = Array.from(monitor.sessions.values()); } catch(e) {}
    }

    let currentSession = null;
    try {
      currentSession = SMTCMonitor.getCurrentMediaSession();
    } catch(e) {}

    // Sort by lastUpdatedTime descending (newest user activity first)
    if (sessions && sessions.length > 0) {
      sessions.sort((a, b) => (b.lastUpdatedTime || 0) - (a.lastUpdatedTime || 0));
    }

    let bestSession = null;

    // Priority A: If currentSession exists, has media, and is actively playing
    if (currentSession && currentSession.media && currentSession.playback && currentSession.playback.playbackStatus === 4) {
      bestSession = currentSession;
    }

    // Priority B: Any session actively playing, ordered by newest lastUpdatedTime
    if (!bestSession && sessions.length > 0) {
      bestSession = sessions.find(s => s.media && s.playback && s.playback.playbackStatus === 4);
    }

    // Priority C: Current session with media (even if paused / offline file)
    if (!bestSession && currentSession && currentSession.media) {
      bestSession = currentSession;
    }

    // Priority D: Most recently updated session with media
    if (!bestSession && sessions.length > 0) {
      bestSession = sessions.find(s => s.media);
    }

    // Priority E: Fallback to first session
    if (!bestSession && sessions.length > 0) {
      bestSession = sessions[0];
    }

    if (bestSession && bestSession.media) {
      const is_playing = bestSession.playback && bestSession.playback.playbackStatus === 4;
      const currentTrackId = (bestSession.media.title || '') + '-' + (bestSession.media.artist || '') + '-' + (bestSession.sourceAppId || '');
      let currentPos = bestSession.timeline && bestSession.timeline.position ? bestSession.timeline.position * 1000 : 0;
      let progress_ms = currentPos;
      
      let thumbnailToSend = undefined;
      let thumbnailMime = undefined;

      if (currentTrackId !== lastTrackId) {
         lastTrackId = currentTrackId;
         lastPosition = currentPos;
         lastUpdateDate = Date.now();
         lastThumbnailBuffer = bestSession.media.thumbnail;
         if (lastThumbnailBuffer && Buffer.isBuffer(lastThumbnailBuffer) && lastThumbnailBuffer.length > 0) {
           thumbnailToSend = lastThumbnailBuffer.toString('base64');
           thumbnailMime = getThumbnailMime(lastThumbnailBuffer);
         } else {
           thumbnailToSend = '';
           thumbnailMime = 'image/png';
         }
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
         if (currentThumb && Buffer.isBuffer(currentThumb) && currentThumb.length > 0) {
            const isLastBuf = Buffer.isBuffer(lastThumbnailBuffer);
            const hasChanged = !isLastBuf || (typeof currentThumb.equals === 'function' ? !currentThumb.equals(lastThumbnailBuffer) : currentThumb.length !== lastThumbnailBuffer.length);
            if (hasChanged) {
               lastThumbnailBuffer = currentThumb;
               thumbnailToSend = currentThumb.toString('base64');
               thumbnailMime = getThumbnailMime(currentThumb);
            }
         }
      }

      const item = {
        title: bestSession.media.title || 'Unknown Media',
        artist: bestSession.media.artist || '',
        is_playing: is_playing,
        progress_ms: progress_ms,
        duration_ms: bestSession.timeline ? (bestSession.timeline.duration || 0) * 1000 : 0,
        appId: bestSession.sourceAppId,
        is_spotify: !!(bestSession.sourceAppId && bestSession.sourceAppId.toLowerCase().includes('spotify'))
      };
      if (thumbnailToSend !== undefined) {
        item.thumbnail = thumbnailToSend;
        item.thumbnailMime = thumbnailMime;
      }
      process.send(item);
    } else {
      process.send(null);
    }
  } catch(e) {
    // Ignore native mapping errors
  }
}

// Windows raises an event when the track, play state or position changes, so the
// state is read right then instead of polling for it every 0.8s. Reading the
// sessions is the expensive part (it copies every session's artwork).
const FALLBACK_MS = 2500;   // safety net, and the heartbeat the main process watches for
const SETTLE_MS = 60;       // one track change raises several events: read once
const TIMELINE_MIN_MS = 1000; // some players report their position many times a second

let lastPoll = 0;
let pollTimer = null;
let pollDue = 0;

function pollSoon(minGap = 0) {
  const now = Date.now();
  const due = now + Math.max(SETTLE_MS, minGap - (now - lastPoll));
  if (pollTimer && pollDue <= due) return;   // an earlier read is already scheduled
  clearTimeout(pollTimer);
  pollDue = due;
  pollTimer = setTimeout(() => { pollTimer = null; poll(); }, due - now);
}

['session-added', 'session-removed', 'current-session-changed', 'session-media-changed', 'session-playback-changed']
  .forEach((name) => monitor.on(name, () => pollSoon()));
monitor.on('session-timeline-changed', () => pollSoon(TIMELINE_MIN_MS));

poll();
setInterval(() => {
  if (Date.now() - lastPoll >= FALLBACK_MS - 100) poll();
}, FALLBACK_MS);
