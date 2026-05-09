const { app, BrowserWindow, screen, ipcMain, shell, clipboard, Menu, Notification } = require('electron');
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
     const trackName = item.name || '';
     const artistName = item.artists[0]?.name || '';
     const query = encodeURIComponent(trackName + ' ' + artistName);
     
     // First try exact get
     let res = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}`);
     let data = await res.json();
     
     // If not found, fallback to search which is much more lenient for SMTC tracks
     if (!data || !data.syncedLyrics) {
        res = await fetch(`https://lrclib.net/api/search?q=${query}`);
        const searchData = await res.json();
        if (Array.isArray(searchData) && searchData.length > 0) {
           data = searchData.find(d => d.syncedLyrics);
        }
     }

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
            lyrics: currentLyrics,
            sourceAppId: msg.appId,
            isSpotify: msg.is_spotify
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

function startNetworkPolling() {
  const psScript = `
    $ErrorActionPreference = 'SilentlyContinue'
    $prev = Get-NetAdapterStatistics
    while ($true) {
      Start-Sleep -Seconds 1
      $curr = Get-NetAdapterStatistics
      $rx = 0; $tx = 0
      foreach ($c in $curr) {
        $p = $prev | Where-Object { $_.InterfaceDescription -eq $c.InterfaceDescription }
        if ($p) {
          $diffRx = $c.ReceivedBytes - $p.ReceivedBytes
          $diffTx = $c.SentBytes - $p.SentBytes
          if ($diffRx -ge 0) { $rx += $diffRx }
          if ($diffTx -ge 0) { $tx += $diffTx }
        }
      }
      Write-Output "$rx,$tx"
      $prev = $curr
    }
  `;

  const ps = spawn('powershell.exe', ['-NoProfile', '-Command', psScript]);
  ps.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    const lastLine = lines[lines.length - 1].trim();
    const parts = lastLine.split(',');
    if (parts.length === 2) {
      const rx = parseInt(parts[0]);
      const tx = parseInt(parts[1]);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('network-stats', { rx, tx });
      }
    }
  });
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

ipcMain.on('adjust-volume', (e, delta) => {
  const key = delta > 0 ? 175 : 174;
  pressMediaKey(key);
});
ipcMain.on('adjust-brightness', (e, delta) => {
  const ps = `
    $monitors = Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods -ErrorAction SilentlyContinue
    $current = Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness -ErrorAction SilentlyContinue | Select-Object -ExpandProperty CurrentBrightness
    if ($monitors -and $current -ne $null) {
      $new = $current + (${delta})
      if ($new -gt 100) { $new = 100 }
      if ($new -lt 0) { $new = 0 }
      $monitors | Invoke-WmiMethod -Name WmiSetBrightness -ArgumentList 1, $new
    }
  `;
  exec(`powershell -NoProfile -Command "${ps}"`);
});
ipcMain.on('open-file', (e, filePath) => {
  shell.openPath(filePath);
});

ipcMain.on('open-url', (e, link) => shell.openExternal(link));
ipcMain.on('open-weather', () => shell.openExternal('bingweather:'));
ipcMain.on('open-media-app', (e, appId) => {
  if (!appId) return;
  let procName = appId.replace('.exe', '');
  if (procName.includes('Spotify')) procName = 'Spotify';
  else if (procName.includes('edge')) procName = 'msedge';
  else if (procName.includes('chrome')) procName = 'chrome';

  const ps = `
    $app = Get-Process -Name "${procName}" -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowHandle -ne 0} | Select-Object -First 1
    if (-not $app) {
      $app = Get-Process -Name "${procName}" -ErrorAction SilentlyContinue | Select-Object -First 1
    }
    if ($app) {
      try {
        $sig = '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd); [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);'
        Add-Type -MemberDefinition $sig -Name WindowAPI -Namespace Win32 -ErrorAction SilentlyContinue
        if ($app.MainWindowHandle -ne 0) {
          [Win32.WindowAPI]::ShowWindow($app.MainWindowHandle, 9)
          [Win32.WindowAPI]::SetForegroundWindow($app.MainWindowHandle)
        } else {
          $wshell = New-Object -ComObject wscript.shell
          $wshell.AppActivate($app.Id)
        }
      } catch {
        $wshell = New-Object -ComObject wscript.shell
        $wshell.AppActivate($app.Id)
      }
    }
  `;
  exec(`powershell -NoProfile -Command "${ps}"`);
});
ipcMain.on('quit-app', () => app.quit());

ipcMain.on('show-context-menu', (event) => {
  const template = [
    { label: 'Dynamic Island v1.0', enabled: false },
    { type: 'separator' },
    { label: 'Quit Dynamic Island', click: () => app.quit() }
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});

ipcMain.on('show-notification', (event, { title, body }) => {
  new Notification({ title, body }).show();
});

ipcMain.handle('get-tasks', async () => {
  return new Promise((resolve) => {
    const ps = `Get-Process | Where-Object {$_.MainWindowTitle} | Group-Object MainWindowTitle | ForEach-Object { $_.Group | Sort-Object WorkingSet64 -Descending | Select-Object -First 1 } | Select-Object Name, Id, MainWindowTitle, WorkingSet64, CPU | Sort-Object WorkingSet64 -Descending | ConvertTo-Json`;
    exec(`powershell -NoProfile -Command "${ps}"`, (err, stdout) => {
      try {
        if (!stdout || !stdout.trim()) { resolve([]); return; }
        const tasks = JSON.parse(stdout);
        // Exclude ourselves and empty strings if any.
        const filteredList = (Array.isArray(tasks) ? tasks : [tasks]).filter(t => t.Name !== 'electron' && t.Name !== 'Dynamic Island' && t.MainWindowTitle);
        resolve(filteredList);
      } catch (e) {
        resolve([]);
      }
    });
  });
});

ipcMain.on('kill-task', (e, id) => {
  exec(`taskkill /F /PID ${id}`);
});

ipcMain.on('start-drag', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.startWindowDrag();
  }
});

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.bounds;
  const windowWidth = 600; 
  const windowHeight = 350; 
  const x = Math.floor((width - windowWidth) / 2);
  const y = 0;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false, // Don't steal focus from taskbar/apps
    hasShadow: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.setIgnoreMouseEvents(ignore, options);
  });
  
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    logg('Failed to load UI: ' + desc + ' (' + code + ')');
  });
  mainWindow.webContents.on('crashed', (e) => {
    logg('Renderer Crashed!');
  });
  
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
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
    // Create a Scheduled Task to run with highest privileges on logon
    // This is required because the app has requestedExecutionLevel: requireAdministrator
    const exePath = app.getPath('exe');
    const taskName = "DynamicIslandAutoStart";
    // We use cmd.exe /c to execute schtasks properly
    const command = `schtasks /create /f /tn "${taskName}" /tr "\\"${exePath}\\" --hidden" /sc onlogon /rl highest`;
    
    exec(command, (error) => {
      if (error) {
        console.log('Failed to create scheduled task for auto-start:', error.message);
      }
    });
  }
  createWindow();
  authenticateSpotify();
  startClipboardPolling();
  startHardwarePolling();
  startNetworkPolling();
  startPrivacyDotMonitor();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  if (smtcWorker) {
    try { smtcWorker.kill(); } catch(e){}
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
