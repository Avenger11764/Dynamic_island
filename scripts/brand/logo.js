// Smart Notch logo, as SVG strings. Used by render-assets.js to produce every
// Microsoft Store / MSIX size, and mirrored by <BrandMark> in the app.

// Superellipse |x|^n + |y|^n = 1 (n = 5): the smooth "squircle" used by modern app icons
function squircle(cx, cy, r, n = 5, steps = 160) {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    const x = cx + r * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
    const y = cy + r * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}
const SQUIRCLE = squircle(128, 128, 122);
const SQUIRCLE_EDGE = squircle(128, 128, 121);

// Iridescent rim + equaliser colours (echoes the app's music lights)
const IRIS = ['#5EE7FF', '#7C8CFF', '#C77DFF', '#FF6FB5'];

/**
 * @param {object} o
 * @param {boolean} o.tile     draw the dark squircle tile behind the island
 * @param {boolean} o.simple   drop fine detail for tiny sizes (16–32 px)
 * @param {string}  o.theme    'dark' | 'light' (unplated icon on light taskbars)
 */
function logoSvg({ tile = true, simple = false, theme = 'dark' } = {}) {
  const pillFill = theme === 'light' ? '#0B0B0F' : '#050507';
  const rimW = simple ? 5 : 3.2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="tileGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#26262D"/>
      <stop offset="0.55" stop-color="#141418"/>
      <stop offset="1" stop-color="#0A0A0D"/>
    </linearGradient>
    <radialGradient id="tileGlow" cx="0.5" cy="0.58" r="0.55">
      <stop offset="0" stop-color="#7C8CFF" stop-opacity="0.28"/>
      <stop offset="0.6" stop-color="#C77DFF" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="tileEdge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/>
      <stop offset="0.35" stop-color="#FFFFFF" stop-opacity="0.04"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.02"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${IRIS[0]}"/>
      <stop offset="0.38" stop-color="${IRIS[1]}"/>
      <stop offset="0.7" stop-color="${IRIS[2]}"/>
      <stop offset="1" stop-color="${IRIS[3]}"/>
    </linearGradient>
    <linearGradient id="bars" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${IRIS[1]}"/>
      <stop offset="0.6" stop-color="${IRIS[2]}"/>
      <stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient>
    <linearGradient id="pillSheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.16"/>
      <stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="lens" cx="0.38" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#5EE7FF" stop-opacity="0.9"/>
      <stop offset="0.35" stop-color="#1E2A55"/>
      <stop offset="1" stop-color="#07070B"/>
    </radialGradient>
    <filter id="glow" x="-40%" y="-80%" width="180%" height="260%">
      <feGaussianBlur stdDeviation="${simple ? 6 : 9}"/>
    </filter>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.55"/>
    </filter>
  </defs>

  ${tile ? `
  <!-- squircle tile -->
  <path d="${SQUIRCLE}" fill="url(#tileGrad)"/>
  <path d="${SQUIRCLE}" fill="url(#tileGlow)"/>
  <path d="${SQUIRCLE_EDGE}" fill="none" stroke="url(#tileEdge)" stroke-width="2"/>
  ` : ''}

  <!-- light spill under the island -->
  <rect x="${simple ? 30 : 44}" y="${simple ? 102 : 108}" width="${simple ? 196 : 168}" height="${simple ? 52 : 42}" rx="26" fill="url(#rim)" opacity="${tile ? 0.55 : 0.45}" filter="url(#glow)"/>

  <!-- the island -->
  <g filter="url(#shadow)">
    <rect x="${simple ? 24 : 38}" y="${simple ? 96 : 100}" width="${simple ? 208 : 180}" height="${simple ? 64 : 56}" rx="${simple ? 32 : 28}" fill="${pillFill}"/>
  </g>
  <rect x="${simple ? 24 : 38}" y="${simple ? 96 : 100}" width="${simple ? 208 : 180}" height="${simple ? 64 : 56}" rx="${simple ? 32 : 28}" fill="none" stroke="url(#rim)" stroke-width="${rimW}"/>
  ${simple ? '' : `<rect x="40" y="102" width="176" height="26" rx="13" fill="url(#pillSheen)"/>`}

  ${simple ? `
  <!-- simplified: lens + two bars -->
  <circle cx="68" cy="128" r="13" fill="url(#lens)"/>
  <rect x="170" y="113" width="10" height="30" rx="5" fill="url(#bars)"/>
  <rect x="190" y="119" width="10" height="18" rx="5" fill="url(#bars)"/>
  ` : `
  <!-- camera lens -->
  <circle cx="72" cy="128" r="12" fill="url(#lens)"/>
  <circle cx="72" cy="128" r="12" fill="none" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1.5"/>
  <circle cx="68" cy="124" r="3" fill="#FFFFFF" opacity="0.55"/>
  <!-- equaliser -->
  <rect x="158" y="119" width="7" height="18" rx="3.5" fill="url(#bars)"/>
  <rect x="170" y="111" width="7" height="34" rx="3.5" fill="url(#bars)"/>
  <rect x="182" y="116" width="7" height="24" rx="3.5" fill="url(#bars)"/>
  <rect x="194" y="121" width="7" height="14" rx="3.5" fill="url(#bars)"/>
  `}
</svg>`;
}

/** Wide / splash / listing canvases: logo centred on the brand background, optional wordmark. */
function sceneSvg({ width, height, logoSize, wordmark = false, glow = true }) {
  const lx = wordmark ? width / 2 - logoSize * 1.35 : (width - logoSize) / 2;
  const ly = (height - logoSize) / 2;
  const inner = logoSvg({ tile: true })
    .replace(' width="256" height="256"', '')
    .replace('<svg ', `<svg x="${lx}" y="${ly}" width="${logoSize}" height="${logoSize}" `);
  const textX = lx + logoSize * 1.18;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <radialGradient id="bgGlow" cx="0.5" cy="0.55" r="0.65">
      <stop offset="0" stop-color="#2A2350"/>
      <stop offset="0.55" stop-color="#0E0E14"/>
      <stop offset="1" stop-color="#050507"/>
    </radialGradient>
    <linearGradient id="wm" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#D9D6FF"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="${glow ? 'url(#bgGlow)' : '#000000'}"/>
  ${inner}
  ${wordmark ? `
  <text x="${textX}" y="${height / 2 + logoSize * 0.13}" font-family="Segoe UI Variable Display, Segoe UI, sans-serif" font-weight="600" font-size="${logoSize * 0.36}" letter-spacing="-${logoSize * 0.006}" fill="url(#wm)">Smart Notch</text>
  <text x="${textX + 2}" y="${height / 2 + logoSize * 0.34}" font-family="Segoe UI Variable Text, Segoe UI, sans-serif" font-weight="400" font-size="${logoSize * 0.12}" fill="#FFFFFF" fill-opacity="0.55">Dynamic Island for Windows</text>
  ` : ''}
</svg>`;
}

module.exports = { logoSvg, sceneSvg };
