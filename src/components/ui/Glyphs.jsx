import React from 'react';

// Superellipse (n = 5) squircle path, matching the app icon
const squircle = (() => {
  const pts = [];
  for (let i = 0; i < 96; i++) {
    const t = (i / 96) * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    pts.push(`${(128 + 122 * Math.sign(c) * Math.abs(c) ** 0.4).toFixed(1)} ${(128 + 122 * Math.sign(s) * Math.abs(s) ** 0.4).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
})();

/**
 * Smart Notch brand mark (same design as the Store icon): a dark glass
 * squircle holding the island with an iridescent rim, lens and equaliser.
 * `tile={false}` draws just the island.
 */
export const BrandMark = ({ size = 18, className = '', tile = true }) => {
  const id = React.useId().replace(/:/g, '');
  const simple = size <= 24;
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className} aria-label="Smart Notch">
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#26262D" /><stop offset="0.55" stopColor="#141418" /><stop offset="1" stopColor="#0A0A0D" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5EE7FF" /><stop offset="0.38" stopColor="#7C8CFF" /><stop offset="0.7" stopColor="#C77DFF" /><stop offset="1" stopColor="#FF6FB5" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#7C8CFF" /><stop offset="0.6" stopColor="#C77DFF" /><stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      {tile && <path d={squircle} fill={`url(#${id}t)`} stroke="rgba(255,255,255,0.1)" strokeWidth="2" />}
      <rect x={simple ? 24 : 38} y={simple ? 96 : 100} width={simple ? 208 : 180} height={simple ? 64 : 56} rx={simple ? 32 : 28}
        fill="#050507" stroke={`url(#${id}r)`} strokeWidth={simple ? 6 : 3.5} />
      <circle cx={simple ? 68 : 72} cy="128" r={simple ? 13 : 12} fill="#1E2A55" />
      <circle cx={simple ? 64 : 68} cy="124" r="3" fill="#5EE7FF" opacity="0.8" />
      {simple ? (
        <>
          <rect x="170" y="113" width="10" height="30" rx="5" fill={`url(#${id}b)`} />
          <rect x="190" y="119" width="10" height="18" rx="5" fill={`url(#${id}b)`} />
        </>
      ) : (
        <>
          <rect x="158" y="119" width="7" height="18" rx="3.5" fill={`url(#${id}b)`} />
          <rect x="170" y="111" width="7" height="34" rx="3.5" fill={`url(#${id}b)`} />
          <rect x="182" y="116" width="7" height="24" rx="3.5" fill={`url(#${id}b)`} />
          <rect x="194" y="121" width="7" height="14" rx="3.5" fill={`url(#${id}b)`} />
        </>
      )}
    </svg>
  );
};

/**
 * Battery ring: a thin circular gauge with rounded caps. Green while charging
 * (with a small bolt), red at <= 20%, otherwise the foreground tone.
 */
export const BatteryRing = ({ level = 100, charging = false, size = 16, className = '', tone = 'light', stroke }) => {
  const pct = Math.max(0, Math.min(100, Number(level) || 0));
  const sw = stroke || Math.max(1.8, size * 0.14);
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const track = tone === 'dark' ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.16)';
  const fill = charging ? '#34C759' : pct <= 20 ? '#FF453A' : (tone === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.92)');
  const b = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" className={className} style={{ flexShrink: 0 }}>
      <circle cx={b} cy={b} r={r} stroke={track} strokeWidth={sw} />
      <circle
        cx={b} cy={b} r={r}
        stroke={fill}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform={`rotate(-90 ${b} ${b})`}
        style={{ transition: 'stroke-dasharray 400ms ease' }}
      />
      {charging && (
        <path
          d={`M${b + size * 0.04} ${b - size * 0.24} L${b - size * 0.13} ${b + size * 0.03} H${b - size * 0.01} L${b - size * 0.05} ${b + size * 0.24} L${b + size * 0.13} ${b - size * 0.03} H${b + size * 0.01} Z`}
          fill="#34C759"
        />
      )}
    </svg>
  );
};

/** Thin continuous level track used by the volume/brightness HUD. */
export const LevelTrack = ({ value = 0, vertical = false, color = '#fff', className = '' }) => {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-white/[0.14] ${vertical ? 'w-[6px] h-full' : 'h-[6px] w-full'} ${className}`}
    >
      <div
        className="absolute rounded-full"
        style={{
          background: color,
          transition: 'width 120ms ease-out, height 120ms ease-out',
          ...(vertical
            ? { left: 0, right: 0, bottom: 0, height: `${pct}%` }
            : { top: 0, bottom: 0, left: 0, width: `${pct}%` })
        }}
      />
    </div>
  );
};

export default BrandMark;
