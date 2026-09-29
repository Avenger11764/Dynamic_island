// Renders the Smart Notch logo to every size the MSIX package and the Microsoft
// Store listing need, using Electron's Chromium for accurate gradients/filters.
//
//   node_modules\electron\dist\electron.exe scripts\brand\render-assets.js            -> all assets
//   node_modules\electron\dist\electron.exe scripts\brand\render-assets.js --preview  -> previews only
//
// Output:
//   store/appx/        MSIX visual assets (copied into the package by electron-builder)
//   store/listing/     images to upload in Partner Center (Store listing)
//   assets/            app icon (.ico/.png) used by the installer and window

const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { logoSvg, sceneSvg } = require('./logo');

const ROOT = path.resolve(__dirname, '..', '..');
const PREVIEW = process.argv.includes('--preview');
const previewDir = process.env.PREVIEW_DIR || path.join(ROOT, 'scripts', 'brand', 'preview');

const scales = [100, 125, 150, 200, 400];
const jobs = [];
const add = (file, svg, w, h = w) => jobs.push({ file, svg, w, h });

const tile = logoSvg({ tile: true });
const tileSimple = logoSvg({ tile: true, simple: true });
const bare = logoSvg({ tile: false });
const bareSimple = logoSvg({ tile: false, simple: true });
const bareLight = logoSvg({ tile: false, simple: true, theme: 'light' });

if (PREVIEW) {
  add(path.join(previewDir, 'logo-512.png'), tile, 512);
  add(path.join(previewDir, 'logo-64.png'), tile, 64);
  add(path.join(previewDir, 'logo-24-simple.png'), tileSimple, 24);
  add(path.join(previewDir, 'unplated-256.png'), bare, 256);
  add(path.join(previewDir, 'unplated-32.png'), bareSimple, 32);
  add(path.join(previewDir, 'wide.png'), sceneSvg({ width: 620, height: 300, logoSize: 150 }), 620, 300);
  add(path.join(previewDir, 'hero.png'), sceneSvg({ width: 1920, height: 1080, logoSize: 360, wordmark: true }), 1920, 1080);
} else {
  const A = path.join(ROOT, 'store', 'appx');
  const pick = (px) => (px <= 40 ? tileSimple : tile);

  // App list / taskbar icon (Square44x44), plated + unplated target sizes
  for (const s of scales) add(path.join(A, `Square44x44Logo.scale-${s}.png`), pick(Math.round(44 * s / 100)), Math.round(44 * s / 100));
  for (const t of [16, 20, 24, 30, 32, 36, 40, 48, 60, 64, 72, 80, 96, 256]) {
    add(path.join(A, `Square44x44Logo.targetsize-${t}.png`), t <= 40 ? tileSimple : tile, t);
    add(path.join(A, `Square44x44Logo.targetsize-${t}_altform-unplated.png`), t <= 40 ? bareSimple : bare, t);
    add(path.join(A, `Square44x44Logo.targetsize-${t}_altform-lightunplated.png`), t <= 40 ? bareLight : logoSvg({ tile: false, theme: 'light' }), t);
  }
  add(path.join(A, 'Square44x44Logo.png'), tileSimple, 44);

  // Tiles
  for (const s of scales) {
    add(path.join(A, `Square71x71Logo.scale-${s}.png`), tile, Math.round(71 * s / 100));
    add(path.join(A, `Square150x150Logo.scale-${s}.png`), tile, Math.round(150 * s / 100));
    add(path.join(A, `Square310x310Logo.scale-${s}.png`), tile, Math.round(310 * s / 100));
    add(path.join(A, `StoreLogo.scale-${s}.png`), tile, Math.round(50 * s / 100));
    const ww = Math.round(310 * s / 100), wh = Math.round(150 * s / 100);
    add(path.join(A, `Wide310x150Logo.scale-${s}.png`), sceneSvg({ width: ww, height: wh, logoSize: Math.round(wh * 0.62), glow: true }), ww, wh);
    const sw = Math.round(620 * s / 100), sh = Math.round(300 * s / 100);
    add(path.join(A, `SplashScreen.scale-${s}.png`), sceneSvg({ width: sw, height: sh, logoSize: Math.round(sh * 0.5), glow: false }), sw, sh);
  }
  add(path.join(A, 'Square71x71Logo.png'), tile, 71);
  add(path.join(A, 'Square150x150Logo.png'), tile, 150);
  add(path.join(A, 'Square310x310Logo.png'), tile, 310);
  add(path.join(A, 'StoreLogo.png'), tile, 50);
  add(path.join(A, 'Wide310x150Logo.png'), sceneSvg({ width: 310, height: 150, logoSize: 93 }), 310, 150);
  add(path.join(A, 'SplashScreen.png'), sceneSvg({ width: 620, height: 300, logoSize: 150, glow: false }), 620, 300);

  // Partner Center listing images
  const L = path.join(ROOT, 'store', 'listing');
  add(path.join(L, 'store-logo-300x300.png'), tile, 300);
  add(path.join(L, 'app-icon-1080x1080.png'), tile, 1080);
  add(path.join(L, 'box-art-1080x1080.png'), sceneSvg({ width: 1080, height: 1080, logoSize: 560 }), 1080, 1080);
  add(path.join(L, 'box-art-2160x2160.png'), sceneSvg({ width: 2160, height: 2160, logoSize: 1120 }), 2160, 2160);
  add(path.join(L, 'poster-art-720x1080.png'), sceneSvg({ width: 720, height: 1080, logoSize: 400 }), 720, 1080);
  add(path.join(L, 'poster-art-1440x2160.png'), sceneSvg({ width: 1440, height: 2160, logoSize: 800 }), 1440, 2160);
  add(path.join(L, 'hero-1920x1080.png'), sceneSvg({ width: 1920, height: 1080, logoSize: 360, wordmark: true }), 1920, 1080);
  add(path.join(L, 'hero-3840x2160.png'), sceneSvg({ width: 3840, height: 2160, logoSize: 720, wordmark: true }), 3840, 2160);

  // App icon sources for the .ico and the window/tray icon
  const I = path.join(ROOT, 'assets');
  for (const t of [16, 24, 32, 48, 64, 128, 256]) add(path.join(I, 'icon-src', `icon-${t}.png`), t <= 32 ? tileSimple : tile, t);
  add(path.join(I, 'icon.png'), tile, 512);
}

// Build a PNG-compressed .ico (Vista+) from rendered PNG buffers
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  entries.forEach(({ size, buf }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(buf.length, o + 8); dir.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });
  return Buffer.concat([header, dir, ...entries.map((e) => e.buf)]);
}

app.whenReady().then(async () => {
  try { await renderAll(); } catch (e) { console.error('Render failed:', e && e.message); process.exitCode = 1; }
  app.quit();
});

async function renderAll() {
  const win = new BrowserWindow({ show: false, width: 400, height: 400, webPreferences: { offscreen: true } });
  await win.loadURL('data:text/html,<html><body></body></html>');
  const icoEntries = [];
  for (const job of jobs) {
    const dataUrl = await win.webContents.executeJavaScript(`(async () => {
      // (throws if the SVG is invalid, so a bad asset fails loudly instead of hanging)
      const svg = ${JSON.stringify(job.svg)};
      const img = new Image();
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
      await img.decode();
      const c = document.createElement('canvas');
      c.width = ${job.w}; c.height = ${job.h};
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, ${job.w}, ${job.h});
      return c.toDataURL('image/png');
    })()`);
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    fs.mkdirSync(path.dirname(job.file), { recursive: true });
    fs.writeFileSync(job.file, buf);
    const m = job.file.match(/icon-(\d+)\.png$/);
    if (m) icoEntries.push({ size: +m[1], buf });
  }
  if (icoEntries.length) {
    icoEntries.sort((a, b) => a.size - b.size);
    fs.writeFileSync(path.join(ROOT, 'assets', 'SmartNotch-icon.ico'), buildIco(icoEntries));
  }
  console.log(`Rendered ${jobs.length} images${icoEntries.length ? ' + SmartNotch-icon.ico' : ''}`);
}
