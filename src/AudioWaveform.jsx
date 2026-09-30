import React, { useRef } from 'react';
import { useAudioReactive } from './utils/audioReactive';

/**
 * Four "music light" bars coloured from the album art.
 *
 * With live audio levels, each bar follows the real output level (bars 1–2 the
 * left channel, 3–4 the right) plus a small per-bar shimmer so the bars don't
 * move in lockstep; utils/audioReactive drives that from the data-* attributes.
 * Without levels it falls back to a looping CSS animation.
 */
const BARS = [
  { w: 0.8, ch: 'l', dur: 0.82, delay: -0.1 },
  { w: 1.0, ch: 'l', dur: 0.64, delay: -0.35 },
  { w: 0.92, ch: 'r', dur: 0.96, delay: -0.2 },
  { w: 0.72, ch: 'r', dur: 0.72, delay: -0.5 }
];

export default function AudioWaveform({ isPlaying, color, colors, height = 12, width = 24, isSideNotch = false }) {
  const ref = useRef(null);
  useAudioReactive(ref, !!isPlaying);

  const c1 = (colors && colors[0]) || color || '#38bdf8';
  const c2 = (colors && colors[1]) || c1;
  const gradient = isSideNotch
    ? `linear-gradient(to right, ${c1}, ${c2} 55%, #ffffff)`
    : `linear-gradient(to top, ${c1}, ${c2} 55%, #ffffff)`;

  return (
    <div
      ref={ref}
      className={`aw no-drag flex items-center justify-center ${isSideNotch ? 'aw-x flex-col gap-[3px]' : 'aw-y gap-[3px]'} ${isPlaying ? 'aw-playing' : ''}`}
      style={{ width, height, '--aw-glow': `${c1}aa` }}
      title={isPlaying ? 'Media playing' : 'Media paused'}
    >
      {BARS.map((b, i) => (
        <span
          key={i}
          className="aw-outer flex-shrink-0 flex items-center justify-center"
          data-audio-bar={isSideNotch ? 'aw-x' : 'aw-y'}
          data-ch={b.ch}
          data-w={b.w}
          data-dur={b.dur}
          data-delay={b.delay}
          style={{
            width: isSideNotch ? '100%' : 2.5,
            height: isSideNotch ? 2.5 : '100%'
          }}
        >
          <span
            className="aw-inner rounded-full w-full h-full"
            style={{
              background: gradient,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.delay}s`
            }}
          />
        </span>
      ))}
    </div>
  );
}
