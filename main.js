const { app, BrowserWindow, screen, ipcMain, shell, clipboard } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const SpotifyWebApi = require('spotify-web-api-node');

function logg(msg) {
  try { fs.appendFileSync(path.join(app.getPath('userData'), 'app-debug.log'), new Date().toISOString() + ': ' + msg + '\n'); } catch(e){}
}

let mainWindow;

let monitor = null;
try {
  // const { SMTCMonitor } = require('@coooookies/windows-smtc-monitor');
  // monitor = new SMTCMonitor();
  // logg('SMTCMonitor initialized successfully');
} catch(e) {
  logg('Failed to init SMTCMonitor: ' + e.message + '\n' + e.stack);
}

async function authenticateSpotify() {
  logg('authenticateSpotify is obsolete. Removed auth flow.');
  startSpotifyPolling();
}

let lastGoodState = null;
let currentTrackId = null;
let currentLyrics = [];

async function fetchLyrics(item) {
   try {
     const trackName = item.name;
     const artistName = item.artists[0]?.name || '';
     const albumName = item.album?.name || '';
     const res = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}&album_name=${encodeURIComponent(albumName)}`);
     const data = await res.json();
     if (data && data.syncedLyrics) {
       const lines = data.syncedLyrics.split('\n');
       const parsed = [];
       for (const line of lines) {
         const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
         if (match) {
           const mins = parseInt(match[1]);
           const secs = parseInt(match[2]);
           const ms = parseInt(match[3].length === 2 ? match[3] + '0' : match[3]);
           const timeMs = (mins * 60 * 1000) + (secs * 1000) + ms;
           parsed.push({ timeMs, text: match[4].trim() });
         }
       }
       currentLyrics = parsed;
     } else {
       currentLyrics = [];
     }
   } catch(e) {
     currentLyrics = [];
   }
}

const { fork } = require('child_process');
let smtcWorker = null;

function startSpotifyPolling() {
  const spawnWorker = () => {
    try {
      const workerPath = path.join(__dirname, 'smtc-worker.js');
      smtcWorker = fork(workerPath, [], {
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
        stdio: ['ignore', 'ignore', 'ignore', 'ipc']
      });

      smtcWorker.on('message', (msg) => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        if (msg) {
          const item = {
            id: msg.title + '-' + msg.artist,
            name: msg.title,
            artists: [{ name: msg.artist }],
            album: { images: [{ url: msg.thumbnail ? 'data:image/png;base64,' + msg.thumbnail : '' }] }
          };

          const body = {
            item: item,
            is_playing: msg.is_playing,
            progress_ms: msg.progress_ms,
            lyrics: currentLyrics
          };

          if (item.id !== currentTrackId) {
            currentTrackId = item.id;
            currentLyrics = [];
            fetchLyrics(item);
          }
          
          mainWindow.webContents.send('spotify-state', body);
        } else {
          mainWindow.webContents.send('spotify-state', null);
        }
      });

      smtcWorker.on('exit', () => setTimeout(spawnWorker, 5000));
    } catch(e) {
      logg('Worker spawn error: ' + e.message);
    }
  };
  
  spawnWorker();
}

let lastCopiedText = '';
function startClipboardPolling() {
  setInterval(() => {
    const text = clipboard.readText();
    if (text !== lastCopiedText) {
      lastCopiedText = text;
      // Very basic URL regex
      if (/^https?:\/\//i.test(text)) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('clipboard-url', text);
        }
      }
    }
  }, 800);
}

const os = require('os');
function getCpuUsage() {
  let idle = 0, total = 0;
  const cpus = os.cpus();
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type];
      if (type === 'idle') idle += cpu.times[type];
    }
  }
  return { idle, total };
}

let lastCpuInfo = getCpuUsage();
function startHardwarePolling() {
  setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    
    // RAM
    const memTotal = os.totalmem();
    const memFree = os.freemem();
    const ram = Math.round(((memTotal - memFree) / memTotal) * 100);
    
    // CPU
    const cpuNow = getCpuUsage();
    const idleDiff = cpuNow.idle - lastCpuInfo.idle;
    const totalDiff = cpuNow.total - lastCpuInfo.total;
    const cpu = totalDiff === 0 ? 0 : Math.round(100 - (100 * idleDiff / totalDiff));
    lastCpuInfo = cpuNow;

    mainWindow.webContents.send('hardware-stats', { cpu, ram });
  }, 2000);
}

const { spawn } = require('child_process');

function startPrivacyDotMonitor() {
  const psScript = `
    $ErrorActionPreference = 'SilentlyContinue'
    function Check ($type) {
      $path = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\$type"
      $inUse = $false
      Get-ChildItem -Path $path | ForEach-Object {
        $v = Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop"
        if ($null -ne $v -and $v.LastUsedTimeStop -eq 0) { $inUse = $true }
      }
      Get-ChildItem -Path "$path\\NonPackaged" | ForEach-Object {
        $v = Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop"
        if ($null -ne $v -and $v.LastUsedTimeStop -eq 0) { $inUse = $true }
      }
      return $inUse
    }
    while ($true) {
      $cam = Check "webcam"
      $mic = Check "microphone"
      Write-Output "$cam,$mic"
      Start-Sleep -Seconds 1
    }
  `;

  const ps = spawn('powershell.exe', ['-NoProfile', '-Command', psScript]);
  
  ps.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\\n');
    const output = lines[lines.length - 1].trim().split(',');
    if (output.length === 2) {
      const cam = output[0] === 'True';
      const mic = output[1] === 'True';
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('privacy-dots', { cam, mic });
      }
    }
  });
}

const { exec } = require('child_process');
function pressMediaKey(key) {
  try {
    exec(`powershell -c "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]${key})"`);
  } catch(e) {}
}

ipcMain.on('spotify-play', () => pressMediaKey(179));
ipcMain.on('spotify-pause', () => pressMediaKey(179));
ipcMain.on('spotify-skip', () => pressMediaKey(176));
ipcMain.on('spotify-prev', () => pressMediaKey(177));
ipcMain.on('open-url', (e, link) => shell.openExternal(link));
ipcMain.on('quit-app', () => app.quit());

ipcMain.on('start-drag', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.startWindowDrag();
  }
});

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const windowWidth = width;
  const windowHeight = height;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.setIgnoreMouseEvents(ignore, options);
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    const loadVite = () => {
      mainWindow.loadURL('http://localhost:5173').catch(() => {
        setTimeout(loadVite, 1000);
      });
    };
    loadVite();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'build_dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    // Standard approach
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe')
    });
    
    // Aggressive approach: explicit shortcut in Startup folder
    try {
      const startupDir = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
      if (!fs.existsSync(startupDir)) {
        fs.mkdirSync(startupDir, { recursive: true });
      }
      const shortcutPath = path.join(startupDir, 'DynamicIsland.lnk');
      
      shell.writeShortcutLink(shortcutPath, 'create', {
        target: app.getPath('exe'),
        cwd: path.dirname(app.getPath('exe')),
        description: 'Dynamic Island Auto-Start'
      });
    } catch (err) {
      console.log('Could not create startup shortcut:', err);
    }
  }
  createWindow();
  authenticateSpotify();
  startClipboardPolling();
  startHardwarePolling();
  startPrivacyDotMonitor();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
