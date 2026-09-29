// Update checks for Smart Notch.
//
// Source of truth for "what's the latest version" is package.json on GitHub
// (version + changelog). For Microsoft Store installs we only report an update
// once the Store listing confirms it is live: the listing was updated after
// this build was made, or its "What's new" text names the newer version.
// That way pushing to GitHub before certification finishes never sends users
// to a Store page that has nothing new yet.
//
// (Asking the Store directly via StoreContext isn't possible from a helper
// process: child processes don't inherit the package identity.)

const { app, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const PRODUCT_ID = '9N1D46F5X565';
const MANIFEST_URL = 'https://raw.githubusercontent.com/Avenger11764/Dynamic_island/main/package.json';
const STORE_API = `https://storeedgefd.dsx.mp.microsoft.com/v9.0/products/${PRODUCT_ID}?market=US&locale=en-us&deviceFamily=Windows.Desktop`;
const STORE_APP_URI = `ms-windows-store://pdp/?productid=${PRODUCT_ID}`;
const STORE_WEB_URL = `https://apps.microsoft.com/detail/${PRODUCT_ID}`;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

function compareVersions(a, b) {
  const pa = String(a || '0').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '0').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'Cache-Control': 'no-cache' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function readBuiltAt() {
  try {
    const p = path.join(__dirname, 'build_dist', 'build-info.json');
    return JSON.parse(fs.readFileSync(p, 'utf8')).builtAt || null;
  } catch (_) {
    return null;
  }
}

function createUpdater({ log = () => {}, broadcast = () => {} } = {}) {
  let pkg = {};
  try { pkg = require('./package.json'); } catch (_) {}

  // SMART_NOTCH_SIMULATE_VERSION lets you test the update / what's-new flow in
  // development by pretending an older (or newer) version is installed.
  const currentVersion = process.env.SMART_NOTCH_SIMULATE_VERSION || app.getVersion();
  const isStore = !!process.windowsStore;
  const builtAt = readBuiltAt();

  const state = {
    currentVersion,
    isStore,
    changelog: Array.isArray(pkg.changelog) ? pkg.changelog : [],
    status: 'idle',            // idle | checking | up-to-date | available | error
    latestVersion: currentVersion,
    latestChangelog: [],
    pendingVersion: null,      // newer on GitHub but not live in the Store yet
    checkedAt: null,
    error: null
  };

  let checking = null;
  let timer = null;

  const publish = () => broadcast('update-status', { ...state });

  async function isLiveInStore(latest) {
    const data = await fetchJson(STORE_API);
    const payload = data && data.Payload ? data.Payload : {};
    const notes = Array.isArray(payload.Notes) ? payload.Notes.join('\n') : String(payload.Notes || '');
    const mentioned = (notes.match(/\b\d+\.\d+\.\d+(?:\.\d+)?\b/g) || []).some((v) => compareVersions(v, latest) >= 0);
    const updatedAt = payload.LastUpdateDateUtc ? Date.parse(payload.LastUpdateDateUtc) : NaN;
    const newerThanBuild = builtAt && !isNaN(updatedAt) ? updatedAt > Date.parse(builtAt) : false;
    return mentioned || newerThanBuild;
  }

  async function runCheck() {
    state.status = 'checking';
    state.error = null;
    publish();
    try {
      const manifest = await fetchJson(`${MANIFEST_URL}?t=${Date.now()}`);
      const latest = manifest && manifest.version;
      if (!latest) throw new Error('No version in update manifest');
      state.latestChangelog = Array.isArray(manifest.changelog) ? manifest.changelog : [];

      if (compareVersions(latest, currentVersion) <= 0) {
        state.status = 'up-to-date';
        state.latestVersion = currentVersion;
        state.pendingVersion = null;
      } else if (!isStore) {
        state.status = 'available';
        state.latestVersion = latest;
        state.pendingVersion = null;
      } else if (await isLiveInStore(latest)) {
        state.status = 'available';
        state.latestVersion = latest;
        state.pendingVersion = null;
      } else {
        // On GitHub, not in the Store yet: stay quiet and check again later
        state.status = 'up-to-date';
        state.latestVersion = currentVersion;
        state.pendingVersion = latest;
      }
      state.checkedAt = new Date().toISOString();
      log(`Update check: current=${currentVersion} latest=${latest} store=${isStore} -> ${state.status}${state.pendingVersion ? ` (pending ${state.pendingVersion})` : ''}`);
    } catch (err) {
      state.status = 'error';
      state.error = err.message;
      state.checkedAt = new Date().toISOString();
      log('Update check failed: ' + err.message);
    }
    publish();
    return { ...state };
  }

  function check() {
    if (!checking) checking = runCheck().finally(() => { checking = null; });
    return checking;
  }

  function start() {
    setTimeout(check, 15000);
    if (timer) clearInterval(timer);
    timer = setInterval(check, CHECK_INTERVAL_MS);
  }

  // Always update through the Microsoft Store app (falls back to the web listing)
  function openUpdate() {
    shell.openExternal(STORE_APP_URI).catch(() => shell.openExternal(STORE_WEB_URL));
  }

  return { start, check, openUpdate, getState: () => ({ ...state }) };
}

module.exports = { createUpdater, compareVersions };
