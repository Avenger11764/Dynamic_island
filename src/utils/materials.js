/**
 * Surface colour for the expanded notch / bar per "Material" setting.
 * Electron can't blur the desktop behind a transparent window, so the glass
 * materials are translucent tints rather than true blur.
 */
export function getMaterialSurface(material = 'dark-glass', bgColor = '#000000', { opaque = false } = {}) {
  const tint = /^#([0-9a-f]{6})$/i.test(bgColor || '') ? bgColor : '#000000';
  if (material === 'solid') return tint;
  if (material === 'dark-glass') return opaque ? '#0a0a0c' : 'rgba(9, 9, 11, 0.9)';
  return opaque ? '#1c1c20' : 'rgba(28, 28, 32, 0.82)';
}

/** Card (widget box) backgrounds for Settings → Appearance → Cards. */
const CARD_STYLES = {
  light:  { bg: 'rgba(255, 255, 255, 0.055)', hover: 'rgba(255, 255, 255, 0.09)', ring: 'transparent' },
  dark:   { bg: 'rgba(0, 0, 0, 0.38)',        hover: 'rgba(0, 0, 0, 0.48)',       ring: 'rgba(255, 255, 255, 0.06)' },
  darker: { bg: 'rgba(0, 0, 0, 0.62)',        hover: 'rgba(0, 0, 0, 0.72)',       ring: 'rgba(255, 255, 255, 0.07)' }
};

export function applyCardStyle(style = 'dark', el = typeof document !== 'undefined' ? document.documentElement : null) {
  if (!el) return;
  const c = CARD_STYLES[style] || CARD_STYLES.light;
  el.style.setProperty('--card-bg', c.bg);
  el.style.setProperty('--card-bg-hover', c.hover);
  el.style.setProperty('--card-ring', c.ring);
}
