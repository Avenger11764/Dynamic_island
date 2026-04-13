const { app, BrowserWindow, screen, ipcMain, shell, clipboard } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const SpotifyWebApi = require('spotify-web-api-node');

let mainWindow;

const credsPath = path.join(app.getPath('userData'), 'spotify-credentials.json');
let spotifyClientId = '';
let spotifyClientSecret = '';
if (fs.existsSync(credsPath)) {
  const c = JSON.parse(fs.readFileSync(credsPath));
  spotifyClientId = c.clientId;
  spotifyClientSecret = c.clientSecret;
}

const spotifyApi = new SpotifyWebApi({
  clientId: spotifyClientId,
  clientSecret: spotifyClientSecret,
  redirectUri: 'http://127.0.0.1:8888/callback'
});

const scopes = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
];

const tokenPath = path.join(app.getPath('userData'), 'spotify-tokens.json');

function saveTokens(access, refresh) {
  fs.writeFileSync(tokenPath, JSON.stringify({ access, refresh }));
}

function loadTokens() {
  if (fs.existsSync(tokenPath)) {
    return JSON.parse(fs.readFileSync(tokenPath));
  }
  return null;
}

async function authenticateSpotify() {
  const saved = loadTokens();
  if (saved && saved.refresh) {
    spotifyApi.setRefreshToken(saved.refresh);
    try {
      const data = await spotifyApi.refreshAccessToken();
      spotifyApi.setAccessToken(data.body['access_token']);
      if (data.body['refresh_token']) {
         saveTokens(data.body['access_token'], data.body['refresh_token']);
      } else {
         saveTokens(data.body['access_token'], saved.refresh);
      }
      startSpotifyPolling();
      return; 
    } catch (e) {
      console.log('Failed to refresh saved token, falling back to auth');
    }
  }

  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state');
  shell.openExternal(authorizeURL);

  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/callback')) {
      const url = new URL(req.url, 'http://127.0.0.1:8888');
      const code = url.searchParams.get('code');
      if (code) {
        spotifyApi.authorizationCodeGrant(code).then(
          function(data) {
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
            saveTokens(data.body['access_token'], data.body['refresh_token']);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Spotify successfully authenticated! You can safely close this browser tab.</h1>');
            server.close();
            startSpotifyPolling();
          },
          function(err) {
            res.end('Authentication failed.');
          }
        );
      }
    }
  }).listen(8888, '127.0.0.1').on('error', (e) => console.log('Port blocked'));
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

function startSpotifyPolling() {
  setInterval(async () => {
    try {
      const data = await spotifyApi.getMyCurrentPlaybackState();
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (data.body && data.body.item) {
           lastGoodState = data.body;
           if (data.body.item.id !== currentTrackId) {
             currentTrackId = data.body.item.id;
             currentLyrics = [];
             // Fetch in background
             fetchLyrics(data.body.item);
           }
           data.body.lyrics = currentLyrics;
           mainWindow.webContents.send('spotify-state', data.body);
        } else if (lastGoodState) {
           // Provide fallback UI state
           lastGoodState.lyrics = currentLyrics;
           mainWindow.webContents.send('spotify-state', { ...lastGoodState, is_playing: false });
        } else {
           mainWindow.webContents.send('spotify-state', null);
        }
      }
    } catch (e) {
      if (e.statusCode === 401) {
         try {
           const data = await spotifyApi.refreshAccessToken();
           spotifyApi.setAccessToken(data.body['access_token']);
           const saved = loadTokens();
           if (saved) saveTokens(data.body['access_token'], saved.refresh);
         } catch(err) {}
      }
    }
  }, 2000);
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

ipcMain.on('spotify-play', () => spotifyApi.play().catch(()=>{}));
ipcMain.on('spotify-pause', () => spotifyApi.pause().catch(()=>{}));
ipcMain.on('spotify-skip', () => spotifyApi.skipToNext().catch(()=>{}));
ipcMain.on('spotify-prev', () => spotifyApi.skipToPrevious().catch(()=>{}));
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
