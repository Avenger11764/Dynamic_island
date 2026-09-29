import { useEffect } from 'react';

/**
 * Beat-reactive audio engine.
 *
 * The system worker streams output peak levels (left/right, ~30/s) while music
 * plays. This module turns them into smooth, musical values and writes them as
 * CSS custom properties onto the elements that subscribe:
 *
 *   --lvl    overall level 0..1 (fast attack, slower release)
 *   --lvl-l  left channel level
 *   --lvl-r  right channel level
 *   --beat   1 on a detected beat, decaying to 0
 *
 * Subscribed elements also get the `audio-live` class while data is flowing so
 * CSS can switch from idle keyframe animation to reactive motion. Only
 * subscribed elements are touched (never :root), so each frame restyles just a
 * handful of nodes.
 */

const ipc = typeof window !== 'undefined' ? window.electronAPI : null;
const subscribers = new Set();

let listening = false;
let rafId = null;
let lastData = 0;
let live = false;

// signal state
let gain = 0.25;           // running max used for auto-gain
let avg = 0;               // slow average used for beat detection
let lastBeat = 0;
let target = { l: 0, r: 0, m: 0 };
let cur = { l: 0, r: 0, m: 0, beat: 0 };

const shape = (v) => Math.pow(Math.min(1, Math.max(0, v)), 1.35);

function onLevel(levels) {
  if (!Array.isArray(levels)) return;
  const [l = 0, r = 0] = levels;
  const peak = Math.max(l, r);
  const now = performance.now();

  // Auto-gain: follow loud passages quickly, relax slowly, never below a floor
  gain = Math.max(peak, gain * 0.994, 0.06);
  const nl = shape(l / gain);
  const nr = shape(r / gain);
  const nm = Math.max(nl, nr);

  // Beat: a jump well above the recent average, with a refractory period
  if (nm > avg * 1.28 + 0.06 && nm > 0.32 && now - lastBeat > 170) {
    lastBeat = now;
    cur.beat = 1;
  }
  avg = avg * 0.88 + nm * 0.12;

  target = { l: nl, r: nr, m: nm };
  lastData = now;
  if (!rafId) rafId = requestAnimationFrame(frame);
}

function write(el) {
  const s = el.style;
  s.setProperty('--lvl', cur.m.toFixed(3));
  s.setProperty('--lvl-l', cur.l.toFixed(3));
  s.setProperty('--lvl-r', cur.r.toFixed(3));
  s.setProperty('--beat', cur.beat.toFixed(3));
}

function setLive(on) {
  if (live === on) return;
  live = on;
  subscribers.forEach((el) => {
    el.classList.toggle('audio-live', on);
    if (!on) ['--lvl', '--lvl-l', '--lvl-r', '--beat'].forEach((p) => el.style.removeProperty(p));
  });
}

function frame() {
  rafId = null;
  const now = performance.now();
  if (now - lastData > 700 || subscribers.size === 0) {
    setLive(false);
    cur = { l: 0, r: 0, m: 0, beat: 0 };
    return;
  }
  setLive(true);
  const ease = (a, b) => a + (b - a) * (b > a ? 0.55 : 0.14);
  cur.l = ease(cur.l, target.l);
  cur.r = ease(cur.r, target.r);
  cur.m = ease(cur.m, target.m);
  cur.beat *= 0.86;
  subscribers.forEach(write);
  rafId = requestAnimationFrame(frame);
}

function ensureListening() {
  if (listening || !ipc?.on) return;
  listening = true;
  ipc.on('audio-level', onLevel);
}

/** Subscribe a DOM element (via ref) to the audio CSS variables. */
export function useAudioReactive(ref, enabled = true) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;
    ensureListening();
    subscribers.add(el);
    if (live) { el.classList.add('audio-live'); write(el); }
    return () => {
      subscribers.delete(el);
      el.classList.remove('audio-live');
    };
  }, [ref, enabled]);
}

/** Ask the main process to start/stop streaming levels. */
export function setAudioMeter(on) {
  ipc?.send?.('audio-meter', !!on);
}
