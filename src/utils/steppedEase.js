/**
 * Stepped easing for slow ambient motion.
 *
 * A running CSS animation makes Chromium draw a frame on every screen refresh,
 * even when the layer has moved a fraction of a pixel. `stepped(n)` follows the
 * usual ease-in-out curve but in `n` small jumps, so a frame is only drawn when
 * a jump happens. Pick `n` so the jumps stay around a pixel or less: the motion
 * looks the same and the GPU gets to idle in between.
 */
const cache = new Map();

// cubic-bezier(0.42, 0, 0.58, 1), i.e. CSS `ease-in-out`
const easeInOut = (t) => {
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) {
    const s = (lo + hi) / 2;
    const x = 3 * (1 - s) * (1 - s) * s * 0.42 + 3 * (1 - s) * s * s * 0.58 + s * s * s;
    if (x < t) lo = s; else hi = s;
  }
  const s = (lo + hi) / 2;
  return 3 * (1 - s) * s * s + s * s * s;
};

/** `animation-timing-function` value: ease-in-out taken in `n` steps. */
export function stepped(n) {
  let fn = cache.get(n);
  if (!fn) {
    const stops = [];
    for (let i = 0; i < n; i++) {
      const v = +easeInOut((i + 0.5) / n).toFixed(4);
      stops.push(`${v} ${+((i / n) * 100).toFixed(3)}%`, `${v} ${+(((i + 1) / n) * 100).toFixed(3)}%`);
    }
    fn = `linear(${stops.join(', ')})`;
    cache.set(n, fn);
  }
  return fn;
}
