export const formatTime = (ms) => {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export const formatSpeed = (bytes) => {
  if (!bytes || isNaN(bytes)) return '0 B/s';
  if (bytes < 1024) return `${bytes} B/s`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
};

export const getContrastColor = (hex) => {
  try {
    if (!hex || hex[0] !== '#') return 'white';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'black' : 'white';
  } catch (_) {
    return 'white';
  }
};
