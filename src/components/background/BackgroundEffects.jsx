import React, { useMemo, useRef } from 'react';
import { useAudioReactive } from '../../utils/audioReactive';
import { stepped } from '../../utils/steppedEase';

/**
 * Background effects for the expanded notch and bar.
 *
 * Pure CSS/SVG: gradients, masks and static filters, animated only through
 * `transform`/`opacity` keyframes (compositor-friendly). Slow drifts move in
 * small steps (utils/steppedEase, `steps()`) so frames are only drawn when
 * something visibly moves. Effects marked `reactive` also follow the live music
 * level/beat (utils/audioReactive) and fall back to idle motion otherwise.
 * Animations honour `prefers-reduced-motion` via index.css.
 */

export const BACKGROUND_EFFECTS = [
  { id: 'off', label: 'None', desc: 'Clean black' },
  { id: 'visualizer', label: 'Visualizer', desc: 'Spectrum bars in album colours', reactive: true },
  { id: 'ambient', label: 'Ambient', desc: 'Album colours, pulsing', reactive: true },
  { id: 'waves', label: 'Waves', desc: 'Tides in album colours', reactive: true },
  { id: 'synthwave', label: 'Synthwave', desc: 'Retro sun and neon grid', reactive: true },
  { id: 'fireflies', label: 'Fireflies', desc: 'Drifting sparks of light', reactive: true },
  { id: 'holo', label: 'Holographic', desc: 'Iridescent foil sheen' },
  { id: 'topo', label: 'Topographic', desc: 'Slow contour lines' },
  { id: 'aurora', label: 'Aurora', desc: 'Northern lights' },
  { id: 'nightsky', label: 'Night sky', desc: 'Stars and meteors' }
];

// Older effect ids are mapped onto the closest current one.
const LEGACY = { liquid: 'holo', mesh: 'holo', silk: 'holo', cosmic: 'nightsky', hyperspace: 'synthwave', matrix: 'off', rain: 'off' };
export const normalizeBackgroundId = (id) => {
  if (!id) return 'off';
  if (LEGACY[id]) return LEGACY[id];
  return BACKGROUND_EFFECTS.some((e) => e.id === id) ? id : 'off';
};

const hexToRgb = (hex) => {
  const h = /^#([0-9a-f]{6})$/i.test(hex || '') ? hex : '#0a84ff';
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
};
const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

const shiftHue = (hex, deg) => {
  let [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  h = (h + deg + 360) % 360;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('');
};

// Album colours when artwork is available, otherwise the accent and two companions
const palette = (colors, accent) => {
  const c1 = colors?.[0] || accent;
  return [c1, colors?.[1] || shiftHue(c1, 40), colors?.[2] || shiftHue(c1, -30)];
};

// Deterministic pseudo-random so layouts stay stable between renders
const rand = (seed) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };

const Layer = ({ className = '', style }) => <div className={`absolute pointer-events-none ${className}`} style={{ willChange: 'transform, opacity', ...style }} />;

/* ───────────── Visualizer: slim spectrum along the bottom ───────────── */
const Visualizer = ({ accent, colors, isPlaying }) => {
  const bars = useMemo(() => {
    const n = 32;
    return Array.from({ length: n }, (_, i) => {
      const x = i / (n - 1);
      // Spectrum-ish envelope: strong lows/mids, tapering highs, plus variation
      const env = 0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, x * 1.1 + 0.06));
      return {
        w: +(env * (0.65 + rand(i) * 0.4)).toFixed(3),
        ch: i < n / 2 ? 'l' : 'r',
        dur: +(0.4 + rand(i + 40) * 0.5).toFixed(2),
        delay: -+(rand(i + 80) * 1.2).toFixed(2)
      };
    });
  }, []);
  const [c1, c2] = palette(colors, accent);
  const grad = `linear-gradient(to top, ${rgba(c1, 0.9)}, ${rgba(c2, 0.75)} 60%, ${rgba(c2, 0)} 100%)`;
  return (
    <div key={`${c1}${c2}`} className={`bg-fade-in absolute inset-0 ${isPlaying ? '' : 'viz-paused'}`}>
      <div className="absolute inset-x-0 bottom-0 h-[55%]" style={{ background: `radial-gradient(80% 90% at 50% 100%, ${rgba(c1, 0.22)}, transparent 70%)` }} />
      <div className="viz absolute left-[5%] right-[5%] bottom-[6%] h-[40%] flex items-end justify-between">
        {bars.map((b, i) => (
          <div key={i} className="viz-outer h-full" data-audio-bar="viz" data-ch={b.ch} data-w={b.w} data-dur={b.dur} data-delay={b.delay} style={{ width: 'calc((100% - 31 * 4px) / 32)' }}>
            <div className="viz-inner w-full h-full rounded-full" style={{ background: grad, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }} />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ───────────── Waves: layered tides ───────────── */
const waveSvg = (fill) => `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'><path d='M0 60 Q150 0 300 60 T600 60 T900 60 T1200 60 V120 H0Z' fill='${fill}'/></svg>`
)}")`;
const Waves = ({ accent, colors }) => {
  const [a, b, c] = palette(colors, accent);
  const layers = [
    { c: rgba(c, 0.35), h: '62%', dur: 19 },
    { c: rgba(a, 0.45), h: '48%', dur: 13 },
    { c: rgba(b, 0.55), h: '34%', dur: 8 }
  ];
  // 30 steps a second on every layer: they share one clock, so the three tides cost one frame
  return (
    <div key={`${a}${b}${c}`} className="bg-fade-in absolute inset-0">
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 30%, ${rgba(a, 0.12)})` }} />
      <div className="wave-react absolute inset-0" data-audio-vars="">
        {layers.map((l, i) => (
          <Layer
            key={i}
            style={{
              left: 0, bottom: 0, width: '200%', height: l.h,
              backgroundImage: waveSvg(l.c), backgroundSize: '50% 100%', backgroundRepeat: 'repeat-x',
              animation: `bg-wave-x ${l.dur}s steps(${l.dur * 30}) infinite`, animationDirection: i === 1 ? 'reverse' : 'normal'
            }}
          />
        ))}
      </div>
    </div>
  );
};

/* ───────────── Synthwave: sun + perspective grid ───────────── */
const Synthwave = () => (
  <>
    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0b0620 0%, #2a0b3d 38%, #5b1250 54%, #0b0620 56%)' }} />
    <div className="absolute left-0 right-0" style={{ top: '46%', height: '12%', background: 'radial-gradient(60% 100% at 50% 100%, rgba(255,64,180,0.55), transparent 70%)' }} />
    <div className="synth-sun absolute left-1/2" data-audio-vars="" style={{ bottom: '44%', width: 'min(34%, 150px)', aspectRatio: '1 / 1' }}>
      <div
        className="w-full h-full rounded-full"
        style={{
          background: 'linear-gradient(to bottom, #ffe45e 0%, #ff8a3d 45%, #ff2d95 100%)',
          boxShadow: '0 0 40px rgba(255,90,150,0.55)',
          maskImage: 'linear-gradient(to bottom, #000 50%, transparent 50% 55%, #000 55% 64%, transparent 64% 69%, #000 69% 77%, transparent 77% 83%, #000 83% 89%, transparent 89% 96%, #000 96%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 50%, transparent 50% 55%, #000 55% 64%, transparent 64% 69%, #000 69% 77%, transparent 77% 83%, #000 83% 89%, transparent 89% 96%, #000 96%)'
        }}
      />
    </div>
    <div
      className="absolute left-0 right-0 bottom-0 overflow-hidden"
      style={{ height: '45%', perspective: '180px', maskImage: 'linear-gradient(to bottom, transparent, #000 35%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 35%)' }}
    >
      <div
        className="synth-grid absolute"
        style={{
          left: '-100%', width: '300%', top: 0, height: '220%', transformOrigin: '50% 0',
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,60,200,0.75) 0 1.5px, transparent 1.5px 36px), repeating-linear-gradient(0deg, rgba(80,220,255,0.7) 0 1.5px, transparent 1.5px 36px)'
        }}
      />
    </div>
  </>
);

/* ───────────── Holographic foil ───────────── */
const Holo = () => (
  <>
    <Layer style={{ width: '200%', aspectRatio: '1 / 1', left: '-50%', top: '50%', marginTop: '-100%', filter: 'blur(22px)', opacity: 0.55,
      background: 'conic-gradient(from 0deg, #ff9ad5, #9be7ff, #b8ffb0, #fff3a1, #c8a6ff, #ff9ad5)',
      animation: 'bg-spin 36s steps(360) infinite' }} />
    <Layer style={{ inset: 0, opacity: 0.6, mixBlendMode: 'overlay',
      background: 'repeating-linear-gradient(125deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 7px)' }} />
    <Layer style={{ top: 0, bottom: 0, left: '-60%', width: '60%',
      background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.28) 45%, rgba(255,255,255,0.05) 55%, transparent 100%)',
      animation: 'bg-sheen 7s ease-in-out infinite' }} />
    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.55))' }} />
  </>
);

/* ───────────── Topographic contour lines ───────────── */
const Topo = ({ accent }) => {
  const line = rgba(accent, 0.55);
  const faint = rgba(shiftHue(accent, 50), 0.35);
  return (
    <>
      <svg width="0" height="0" className="absolute">
        <filter id="topo-warp" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="38" />
        </filter>
      </svg>
      <Layer style={{ inset: '-20%', filter: 'url(#topo-warp)',
        background: `repeating-radial-gradient(circle at 32% 42%, transparent 0 11px, ${line} 11px 12px)`,
        animation: 'bg-topo-a 40s steps(240) infinite alternate' }} />
      <Layer style={{ inset: '-20%', filter: 'url(#topo-warp)', opacity: 0.7,
        background: `repeating-radial-gradient(circle at 76% 70%, transparent 0 15px, ${faint} 15px 16px)`,
        animation: 'bg-topo-b 55s steps(330) infinite alternate' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(90% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)' }} />
    </>
  );
};

/* ───────────── Fireflies ───────────── */
const Fireflies = () => {
  const flies = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    left: `${(rand(i) * 100).toFixed(1)}%`,
    top: `${(rand(i + 7) * 100).toFixed(1)}%`,
    size: 2.5 + rand(i + 13) * 3,
    dx: `${((rand(i + 21) - 0.5) * 90).toFixed(0)}px`,
    dy: `${((rand(i + 29) - 0.5) * 60).toFixed(0)}px`,
    // Durations and delays are multiples of 0.1 s and each animation takes 10 steps a
    // second, so all sparks move on one shared clock instead of 44 separate ones
    dur: (7 + rand(i + 37) * 9).toFixed(1),
    tw: (1.6 + rand(i + 43) * 2.6).toFixed(1),
    delay: (-rand(i + 51) * 10).toFixed(1),
    hue: rand(i + 3) > 0.5 ? '#e7ff8a' : '#ffd66b'
  })), []);
  return (
    <>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 110%, rgba(40,70,30,0.45), transparent 70%)' }} />
      <div className="ff-react absolute inset-0" data-audio-vars="">
        {flies.map((f, i) => (
          <div key={i} className="absolute" style={{ left: f.left, top: f.top, '--dx': f.dx, '--dy': f.dy, animation: `bg-ff-drift ${f.dur}s steps(${Math.round(f.dur * 10)}) ${f.delay}s infinite alternate`, willChange: 'transform' }}>
            <div
              className="rounded-full"
              style={{
                width: f.size, height: f.size, background: f.hue,
                boxShadow: `0 0 ${f.size * 3}px ${f.size}px ${f.hue}88`,
                animation: `bg-twinkle ${f.tw}s steps(${Math.round(f.tw * 10)}) ${f.delay}s infinite alternate`
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
};

/* ───────────── Aurora ───────────── */
const Aurora = () => (
  <div className="aurora-react absolute inset-0" data-audio-vars="">
    <Layer style={{ left: '-30%', right: '-30%', top: '-35%', height: '75%', filter: 'blur(28px)',
      background: 'linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.7) 22%, rgba(45,212,191,0.65) 42%, rgba(56,189,248,0.6) 62%, rgba(167,139,250,0.65) 80%, transparent 100%)',
      animation: `bg-aurora-a 16s ${stepped(128)} infinite alternate` }} />
    <Layer style={{ left: '-30%', right: '-30%', top: '10%', height: '55%', filter: 'blur(34px)', opacity: 0.7,
      background: 'linear-gradient(90deg, transparent 0%, rgba(129,140,248,0.45) 25%, rgba(236,72,153,0.3) 50%, rgba(52,211,153,0.4) 75%, transparent 100%)',
      animation: `bg-aurora-b 21s ${stepped(126)} infinite alternate` }} />
  </div>
);

/* ───────────── Night sky with meteors ───────────── */
const NightSky = () => {
  const [near, far] = useMemo(() => {
    const make = (n, alpha, off) => Array.from({ length: n }, (_, i) => {
      const x = Math.round(rand(i + off) * 700), y = Math.round(rand(i + off + 500) * 700);
      return `${x}px ${y}px 0 0 rgba(255,255,255,${(alpha * (0.5 + rand(i + off + 900) * 0.5)).toFixed(2)})`;
    }).join(',');
    return [make(45, 0.95, 1), make(80, 0.55, 2000)];
  }, []);
  return (
    <>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(80% 70% at 70% 20%, rgba(99,102,241,0.2), transparent 70%), radial-gradient(60% 60% at 15% 90%, rgba(56,189,248,0.12), transparent 70%)' }} />
      <Layer style={{ top: 0, left: 0, width: 1, height: 1, borderRadius: '50%', boxShadow: far, animation: 'bg-stars 90s steps(540) infinite' }} />
      <Layer style={{ top: 0, left: 0, width: 1.5, height: 1.5, borderRadius: '50%', boxShadow: near, animation: `bg-stars 60s steps(360) infinite, bg-twinkle 4s ${stepped(24)} infinite alternate` }} />
      {[0, 1].map((i) => (
        <Layer key={i} style={{ top: i ? '12%' : '4%', left: i ? '55%' : '20%', width: 90, height: 1.5, borderRadius: 2,
          background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.9))',
          transform: 'rotate(-28deg)', opacity: 0,
          animation: `bg-meteor 9s ease-in ${i ? 4.5 : 0}s infinite` }} />
      ))}
    </>
  );
};

/* ───────────── Ambient: album colours, beat pulse ───────────── */
const Ambient = ({ colors, isPlaying, accent }) => {
  const c1 = colors?.[0] || accent;
  const c2 = colors?.[1] || shiftHue(c1, 40);
  const c3 = colors?.[2] || shiftHue(c1, -40);
  const state = isPlaying === false ? 'paused' : 'running';
  return (
    <div className="ambient-react absolute inset-0" data-audio-vars="">
      {/* animationPlayState comes after `animation`: the shorthand would reset it to running */}
      <Layer style={{ width: '90%', height: '170%', left: '-20%', top: '-60%', borderRadius: '50%',
        background: `radial-gradient(circle, ${rgba(c1, 0.6)} 0%, transparent 65%)`, animation: `bg-mesh-a 12s ${stepped(84)} infinite alternate`, animationPlayState: state }} />
      <Layer style={{ width: '85%', height: '160%', right: '-20%', top: '-10%', borderRadius: '50%',
        background: `radial-gradient(circle, ${rgba(c2, 0.5)} 0%, transparent 65%)`, animation: `bg-mesh-b 15s ${stepped(105)} infinite alternate`, animationPlayState: state }} />
      <Layer style={{ width: '70%', height: '130%', left: '25%', bottom: '-75%', borderRadius: '50%',
        background: `radial-gradient(circle, ${rgba(c3, 0.45)} 0%, transparent 65%)`, animation: `bg-mesh-c 18s ${stepped(108)} infinite alternate`, animationPlayState: state }} />
    </div>
  );
};

/**
 * Renders the selected effect.
 * @param id        effect id (legacy ids are mapped)
 * @param accent    user accent colour (hex) for accent-aware effects
 * @param colors    album colours for Ambient
 * @param isPlaying enables beat reactivity and Ambient motion
 */
export const BackgroundEffect = React.memo(({ id, accent, colors, isPlaying, className = '' }) => {
  const ref = useRef(null);
  const effect = normalizeBackgroundId(id);
  const reactive = !!BACKGROUND_EFFECTS.find((e) => e.id === effect)?.reactive;
  useAudioReactive(ref, reactive && !!isPlaying);
  if (effect === 'off') return null;
  const acc = /^#([0-9a-f]{6})$/i.test(accent || '') && accent.toLowerCase() !== '#ffffff' ? accent : '#0a84ff';
  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden pointer-events-none bg-effect ${className}`} aria-hidden="true">
      {effect === 'visualizer' && <Visualizer accent={acc} colors={colors} isPlaying={isPlaying !== false} />}
      {effect === 'ambient' && <Ambient colors={colors} isPlaying={isPlaying} accent={acc} />}
      {effect === 'waves' && <Waves accent={acc} colors={colors} />}
      {effect === 'synthwave' && <Synthwave />}
      {effect === 'fireflies' && <Fireflies />}
      {effect === 'holo' && <Holo />}
      {effect === 'topo' && <Topo accent={acc} />}
      {effect === 'aurora' && <Aurora />}
      {effect === 'nightsky' && <NightSky />}
    </div>
  );
});
