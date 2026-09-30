import { useEffect } from 'react';

/**
 * Beat-reactive audio engine.
 *
 * The system worker streams output peak levels (left/right, ~30/s) while music
 * plays and a light is on screen. This module turns them into smooth, musical
 * values and applies them ~30 times a second to the elements that subscribe:
 *
 *   [data-audio-bar]   bars (waveform, visualizer): their scale is written
 *                      directly as an inline transform
 *   [data-audio-vars]  single elements that react through CSS: they get
 *                      --lvl (overall level 0..1) and --beat (1 on a beat,
 *                      decaying to 0)
 *
 * Subscribed roots also get the `audio-live` class while data is flowing so
 * CSS can switch from idle keyframe animation to reactive motion. Nothing runs
 * when there are no subscribers or no data: the tick stops and the main
 * process is told to stop metering.
 */

const ipc = typeof window !== 'undefined' ? window.electronAPI : null;
const subscribers = new Map(); // root element -> { bars, vars, at }

const TICK_MS = 33;        // ~30 fps: plenty for lights, half the frames of rAF
const LIVE_TIMEOUT = 700;  // no data for this long -> back to idle animation
const RESCAN_MS = 1000;    // how often a root's targets are looked up again

// How each kind of bar maps level/beat to scale, plus the per-bar shimmer range
const BAR_KINDS = {
  'aw-y': { axis: 'Y', min: 0.16, gain: 0.9, beat: 0.14, shimmer: 0.8 },
  'aw-x': { axis: 'X', min: 0.2, gain: 0.85, beat: 0.12, shimmer: 0.82 },
  viz: { axis: 'Y', min: 0.06, gain: 0.94, beat: 0.1, shimmer: 0.78 }
};

let listening = false;
let timer = null;
let lastData = 0;
let lastTick = 0;
let live = false;
let meterOn = false;
let meterOffTimer = null;

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
  // Constants below are per 25 ms sample; scale them to the real sample spacing
  const k = lastData ? Math.min(4, Math.max(0.2, (now - lastData) / 25)) : 1;

  // Auto-gain: follow loud passages quickly, relax slowly, never below a floor
  gain = Math.max(peak, gain * Math.pow(0.994, k), 0.06);
  const nl = shape(l / gain);
  const nr = shape(r / gain);
  const nm = Math.max(nl, nr);

  // Beat: a jump well above the recent average, with a refractory period
  if (nm > avg * 1.28 + 0.06 && nm > 0.32 && now - lastBeat > 170) {
    lastBeat = now;
    cur.beat = 1;
  }
  avg += (nm - avg) * (1 - Math.pow(0.88, k));

  target = { l: nl, r: nr, m: nm };
  lastData = now;
  if (!timer && subscribers.size > 0) {
    lastTick = now;
    timer = setInterval(tick, TICK_MS);
  }
}

function scan(root, state, now) {
  state.at = now;
  state.bars = Array.from(root.querySelectorAll('[data-audio-bar]'), (el) => {
    const kind = BAR_KINDS[el.dataset.audioBar] || BAR_KINDS.viz;
    return {
      el,
      kind,
      ch: el.dataset.ch === 'r' ? 'r' : 'l',
      w: parseFloat(el.dataset.w) || 1,
      dur: parseFloat(el.dataset.dur) || 0.7,
      delay: parseFloat(el.dataset.delay) || 0
    };
  });
  state.vars = Array.from(root.querySelectorAll('[data-audio-vars]'));
  if (root.matches('[data-audio-vars]')) state.vars.push(root);
}

function write(root, state, now) {
  // Targets can be re-created by React (e.g. new album colours): look them up again
  if (!state.bars || now - state.at > RESCAN_MS || (state.bars[0] && !state.bars[0].el.isConnected)) scan(root, state, now);
  const t = now / 1000;
  for (const b of state.bars) {
    const { kind } = b;
    // Shimmer: each bar breathes on its own period so bars don't move in lockstep
    const p = (((t - b.delay) / b.dur) % 2 + 2) % 2;
    const shimmer = kind.shimmer + (1 - kind.shimmer) * (0.5 - 0.5 * Math.cos(Math.PI * p));
    const v = Math.min(1, Math.max(kind.min, kind.min + cur[b.ch] * b.w * kind.gain + cur.beat * kind.beat)) * shimmer;
    b.el.style.transform = `scale${kind.axis}(${v.toFixed(3)})`;
  }
  if (state.vars.length) {
    const lvl = cur.m.toFixed(2);
    const beat = cur.beat.toFixed(2);
    if (lvl !== state.lvl || beat !== state.beat) {
      state.lvl = lvl;
      state.beat = beat;
      for (const el of state.vars) {
        el.style.setProperty('--lvl', lvl);
        el.style.setProperty('--beat', beat);
      }
    }
  }
}

function clear(root, state) {
  root.classList.remove('audio-live');
  (state.bars || []).forEach((b) => { b.el.style.transform = ''; });
  (state.vars || []).forEach((el) => { el.style.removeProperty('--lvl'); el.style.removeProperty('--beat'); });
  state.bars = null;
  state.vars = null;
  state.lvl = state.beat = undefined;
}

function setLive(on) {
  if (live === on) return;
  live = on;
  subscribers.forEach((state, root) => {
    if (on) root.classList.add('audio-live');
    else clear(root, state);
  });
}

function stop() {
  if (timer) { clearInterval(timer); timer = null; }
  setLive(false);
  cur = { l: 0, r: 0, m: 0, beat: 0 };
}

function tick() {
  const now = performance.now();
  if (now - lastData > LIVE_TIMEOUT || subscribers.size === 0) {
    stop();
    return;
  }
  setLive(true);
  // Fast attack, slower release; tuned per 60 fps frame, scaled to the real step
  const f = Math.min(6, Math.max(0.5, (now - lastTick) / (1000 / 60)));
  lastTick = now;
  const ease = (a, b) => a + (b - a) * (1 - Math.pow(1 - (b > a ? 0.55 : 0.14), f));
  cur.l = ease(cur.l, target.l);
  cur.r = ease(cur.r, target.r);
  cur.m = ease(cur.m, target.m);
  subscribers.forEach((state, root) => write(root, state, now));
  cur.beat *= Math.pow(0.86, f);
}

function ensureListening() {
  if (listening || !ipc?.on) return;
  listening = true;
  ipc.on('audio-level', onLevel);
}

// Ask the main process for levels only while a reactive element is on screen.
// Turning off is delayed so switching views doesn't restart the meter.
function syncMeter() {
  const want = subscribers.size > 0;
  if (meterOffTimer) { clearTimeout(meterOffTimer); meterOffTimer = null; }
  if (want === meterOn) return;
  if (want) {
    meterOn = true;
    ipc?.send?.('audio-meter', true);
  } else {
    meterOffTimer = setTimeout(() => {
      meterOffTimer = null;
      if (subscribers.size > 0) return;
      meterOn = false;
      ipc?.send?.('audio-meter', false);
    }, 400);
  }
}

/** Subscribe a DOM element (via ref) and its [data-audio-*] descendants to the live audio. */
export function useAudioReactive(ref, enabled = true) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;
    ensureListening();
    const state = { bars: null, vars: null, at: 0 };
    subscribers.set(el, state);
    syncMeter();
    if (live) { el.classList.add('audio-live'); write(el, state, performance.now()); }
    return () => {
      subscribers.delete(el);
      clear(el, state);
      syncMeter();
    };
  }, [ref, enabled]);
}
