const { app, BrowserWindow, screen, ipcMain, shell, clipboard, Menu, Notification } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const SpotifyWebApi = require('spotify-web-api-node');

// ── Single-instance lock ──────────────────────────────────────────────────────
// Must be the very first logic that runs so a duplicate process exits before
// any windows, IPC handlers, or polling timers are created.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  // Another instance is already running – quit immediately without doing anything.
  app.quit();
  process.exit(0);
}
// When a second launch attempt is detected, focus the existing window.
app.on('second-instance', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

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

const { spawn, exec } = require('child_process');

let vbsPath = '';

function startCombinedBackgroundMonitor() {
  const psScript = `
    $ErrorActionPreference = 'SilentlyContinue'
    
    function CheckPrivacy ($type) {
      $path = "Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\$type"
      $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($path)
      if ($null -eq $key) { return $false }
      foreach ($subKeyName in $key.GetSubKeyNames()) {
        $subKey = $key.OpenSubKey($subKeyName)
        if ($null -ne $subKey) {
          $stopTime = $subKey.GetValue("LastUsedTimeStop")
          if ($null -ne $stopTime -and $stopTime -eq 0) {
            $subKey.Close(); $key.Close()
            return $true
          }
          $subKey.Close()
        }
      }
      $npKey = $key.OpenSubKey("NonPackaged")
      if ($null -ne $npKey) {
        foreach ($subKeyName in $npKey.GetSubKeyNames()) {
          $subKey = $npKey.OpenSubKey($subKeyName)
          if ($null -ne $subKey) {
            $stopTime = $subKey.GetValue("LastUsedTimeStop")
            if ($null -ne $stopTime -and $stopTime -eq 0) {
              $subKey.Close(); $npKey.Close(); $key.Close()
              return $true
            }
            $subKey.Close()
          }
        }
        $npKey.Close()
      }
      $key.Close()
      return $false
    }
    
    $prevRx = [double]0
    $prevTx = [double]0
    $nets = Get-CimInstance Win32_PerfRawData_Tcpip_NetworkInterface
    foreach ($n in $nets) {
      $prevRx += $n.BytesReceivedPersec
      $prevTx += $n.BytesSentPersec
    }
    
    while ($true) {
      Start-Sleep -Seconds 1
      
      $cam = CheckPrivacy "webcam"
      $mic = CheckPrivacy "microphone"
      
      $nets = Get-CimInstance Win32_PerfRawData_Tcpip_NetworkInterface
      $currRx = [double]0
      $currTx = [double]0
      foreach ($n in $nets) {
        $currRx += $n.BytesReceivedPersec
        $currTx += $n.BytesSentPersec
      }
      
      $diffRx = $currRx - $prevRx
      $diffTx = $currTx - $prevTx
      if ($diffRx -lt 0) { $diffRx = 0 }
      if ($diffTx -lt 0) { $diffTx = 0 }
      
      Write-Output "$cam,$mic,$diffRx,$diffTx"
      
      $prevRx = $currRx
      $prevTx = $currTx
    }
  `;

  const ps = spawn('powershell.exe', ['-NoProfile', '-Command', psScript]);
  
  let psStdoutBuffer = '';
  ps.stdout.on('data', (data) => {
    psStdoutBuffer += data.toString();
    const lines = psStdoutBuffer.split(/\r?\n/);
    psStdoutBuffer = lines.pop(); // Keep the last incomplete line in the buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(',');
      if (parts.length === 4) {
        const cam = parts[0] === 'True';
        const mic = parts[1] === 'True';
        const rx = parseInt(parts[2]);
        const tx = parseInt(parts[3]);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('privacy-dots', { cam, mic });
          mainWindow.webContents.send('network-stats', { rx, tx });
        }
      }
    }
  });

  ps.stderr.on('data', (data) => {
    logg('Combined background monitor stderr: ' + data.toString().trim());
  });

  ps.on('close', (code) => {
    logg('Combined background monitor exited with code ' + code);
  });

  ps.on('error', (err) => {
    logg('Combined background monitor spawn/runtime error: ' + err.message);
  });
}

function pressMediaKey(key) {
  try {
    if (vbsPath) {
      exec(`wscript.exe "${vbsPath}" ${key}`);
    } else {
      exec(`powershell -c "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]${key})"`);
    }
  } catch(e) {
    try {
      exec(`powershell -c "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]${key})"`);
    } catch(err){}
  }
}

ipcMain.on('spotify-play', () => pressMediaKey(179));
ipcMain.on('spotify-pause', () => pressMediaKey(179));
ipcMain.on('spotify-skip', () => pressMediaKey(176));
ipcMain.on('spotify-prev', () => pressMediaKey(177));

ipcMain.on('adjust-volume', (e, delta) => {
  const key = delta > 0 ? 175 : 174;
  pressMediaKey(key);
});

let nextBrightnessDelta = 0;
let isBrightnessRunning = false;

ipcMain.on('adjust-brightness', (e, delta) => {
  nextBrightnessDelta += delta;
  if (isBrightnessRunning) return;
  
  isBrightnessRunning = true;
  const run = () => {
    const d = nextBrightnessDelta;
    nextBrightnessDelta = 0;
    
    const ps = `
      $monitors = Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods -ErrorAction SilentlyContinue
      $current = Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness -ErrorAction SilentlyContinue | Select-Object -ExpandProperty CurrentBrightness
      if ($monitors -and $current -ne $null) {
        $new = $current + (${d})
        if ($new -gt 100) { $new = 100 }
        if ($new -lt 0) { $new = 0 }
        $monitors | Invoke-WmiMethod -Name WmiSetBrightness -ArgumentList 1, $new
      }
    `;
    
    exec(`powershell -NoProfile -Command "${ps}"`, () => {
      if (nextBrightnessDelta !== 0) {
        run();
      } else {
        isBrightnessRunning = false;
      }
    });
  };
  
  run();
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

let currentWindowMode = 'notch';
let currentScreenPosition = 'top';

ipcMain.on('set-window-mode', (event, mode, position) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  currentWindowMode = mode;
  if (position) currentScreenPosition = position;
  const pos = currentScreenPosition;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds;

  if (mode === 'shelf') {
    if (pos === 'left' || pos === 'right') {
      // Vertical sidebar
      const sideWidth = 160;
      const x = pos === 'left' ? 0 : screenWidth - sideWidth;
      mainWindow.setBounds({ x, y: 0, width: sideWidth, height: screenHeight });
    } else {
      // Horizontal top bar (default for all top positions)
      mainWindow.setBounds({ x: 0, y: 0, width: screenWidth, height: 64 });
    }
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    // Notch mode — position-aware
    const windowWidth = 600;
    const windowHeight = 450;
    let x, y;
    if (pos === 'top-left') {
      x = 20; y = 0;
    } else if (pos === 'top-right') {
      x = screenWidth - windowWidth - 20; y = 0;
    } else if (pos === 'left') {
      x = 0; y = Math.floor((screenHeight - windowHeight) / 2);
    } else if (pos === 'right') {
      x = screenWidth - windowWidth; y = Math.floor((screenHeight - windowHeight) / 2);
    } else {
      // 'top' (default center)
      x = Math.floor((screenWidth - windowWidth) / 2); y = 0;
    }
    mainWindow.setBounds({ x, y, width: windowWidth, height: windowHeight });
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  }
});

ipcMain.on('set-screen-position', (event, position, options = {}) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  currentScreenPosition = position;
  // Re-apply current mode with new position
  mainWindow.webContents.executeJavaScript('true'); // no-op, just trigger re-render via IPC below
  if (options.ignoreBounds) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds;

  if (currentWindowMode === 'notch') {
    const windowWidth = 600;
    const windowHeight = 450;
    let x, y;
    if (position === 'top-left') {
      x = 20; y = 0;
    } else if (position === 'top-right') {
      x = screenWidth - windowWidth - 20; y = 0;
    } else if (position === 'left') {
      x = 0; y = Math.floor((screenHeight - windowHeight) / 2);
    } else if (position === 'right') {
      x = screenWidth - windowWidth; y = Math.floor((screenHeight - windowHeight) / 2);
    } else {
      x = Math.floor((screenWidth - windowWidth) / 2); y = 0;
    }
    mainWindow.setBounds({ x, y, width: windowWidth, height: windowHeight });
  } else if (currentWindowMode === 'shelf') {
    if (position === 'left' || position === 'right') {
      const sideWidth = 160;
      const x = position === 'left' ? 0 : screenWidth - sideWidth;
      mainWindow.setBounds({ x, y: 0, width: sideWidth, height: screenHeight });
    } else {
      mainWindow.setBounds({ x: 0, y: 0, width: screenWidth, height: 64 });
    }
  }
});

let isWindowBeingDragged = false;
let isWindowAnimating = false;
let boundsAnimationInterval = null;

function animateWindowBounds(target, duration = 250) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (boundsAnimationInterval) clearInterval(boundsAnimationInterval);
  
  isWindowAnimating = true;
  const start = mainWindow.getBounds();
  const startTime = Date.now();

  boundsAnimationInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      clearInterval(boundsAnimationInterval);
      boundsAnimationInterval = null;
      isWindowAnimating = false;
      return;
    }
    const elapsed = Date.now() - startTime;
    const progress = Math.min(1, elapsed / duration);
    const ease = 1 - Math.pow(1 - progress, 3);

    const currentX = Math.round(start.x + (target.x - start.x) * ease);
    const currentY = Math.round(start.y + (target.y - start.y) * ease);

    // Keep width and height constant at target values to prevent texture rebuilding lag
    mainWindow.setBounds({ x: currentX, y: currentY, width: target.width, height: target.height });

    if (progress >= 1) {
      clearInterval(boundsAnimationInterval);
      boundsAnimationInterval = null;
      isWindowAnimating = false;
    }
  }, 10);
}

let dragStartMousePos = null;
let dragStartWindowPos = null;

ipcMain.on('custom-drag-start', (event) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  isWindowBeingDragged = true;
  
  const cursor = screen.getCursorScreenPoint();
  const w = 140;
  const h = 64;
  const x = cursor.x - Math.floor(w / 2);
  const y = cursor.y - Math.floor(h / 2);
  
  // Set bounds instantly to matches the small drag pill size (stops click blocking)
  mainWindow.setBounds({ x, y, width: w, height: h });
  
  dragStartMousePos = { x: cursor.x, y: cursor.y };
  dragStartWindowPos = { x, y, width: w, height: h };
});

ipcMain.on('custom-drag-move', (event) => {
  if (!mainWindow || mainWindow.isDestroyed() || !isWindowBeingDragged || !dragStartMousePos || !dragStartWindowPos) return;
  
  const cursor = screen.getCursorScreenPoint();
  const dX = cursor.x - dragStartMousePos.x;
  const dY = cursor.y - dragStartMousePos.y;
  
  const newX = dragStartWindowPos.x + dX;
  const newY = dragStartWindowPos.y + dY;
  
  mainWindow.setBounds({
    x: Math.round(newX),
    y: Math.round(newY),
    width: dragStartWindowPos.width,
    height: dragStartWindowPos.height
  });

  const display = screen.getPrimaryDisplay();
  const { width: sw, height: sh } = display.bounds;
  const dx0 = display.bounds.x;
  const dy0 = display.bounds.y;

  const curX = cursor.x - dx0;
  const curY = cursor.y - dy0;

  const sideEdge = 100;
  const topEdge  = 200;

  let direction = 'top';
  if (curX < sideEdge && curY > topEdge) {
    direction = 'left';
  } else if (curX > sw - sideEdge && curY > topEdge) {
    direction = 'right';
  } else {
    direction = 'top';
  }

  mainWindow.webContents.send('drag-snap-preview', direction);
});

ipcMain.on('custom-drag-end', (event) => {
  if (!mainWindow || mainWindow.isDestroyed() || !isWindowBeingDragged) return;
  isWindowBeingDragged = false;
  
  const startPos = dragStartWindowPos;
  dragStartMousePos = null;
  dragStartWindowPos = null;
  
  if (boundsAnimationInterval) {
    clearInterval(boundsAnimationInterval);
    boundsAnimationInterval = null;
  }
  isWindowAnimating = false;

  const display = screen.getPrimaryDisplay();
  const { width: sw, height: sh } = display.bounds;
  const dx0 = display.bounds.x;
  const dy0 = display.bounds.y;

  const cursor = screen.getCursorScreenPoint();
  const curX = cursor.x - dx0;
  const curY = cursor.y - dy0;

  logg(`SNAP: cursor=(${curX}, ${curY}) screen=(${sw}x${sh})`);

  const sideEdge = 100;
  const topEdge  = 200;
  
  // Calculate final target window size
  let ww = 600;
  let wh = 450;
  let newPos = 'top';

  if (curX < sideEdge && curY > topEdge) {
    newPos = 'left';
  } else if (curX > sw - sideEdge && curY > topEdge) {
    newPos = 'right';
  } else {
    newPos = 'top';
  }

  if (currentWindowMode === 'shelf') {
    if (newPos === 'left' || newPos === 'right') {
      ww = 160;
      wh = sh;
    } else {
      ww = sw;
      wh = 64;
    }
  }

  let finalX, finalY;
  if (newPos === 'left') {
    finalX = dx0;
    finalY = dy0 + Math.floor((sh - wh) / 2);
  } else if (newPos === 'right') {
    finalX = dx0 + sw - ww;
    finalY = dy0 + Math.floor((sh - wh) / 2);
  } else {
    finalX = dx0 + curX - Math.floor(ww / 2);
    finalY = dy0;
    if (finalX < dx0) finalX = dx0;
    if (finalX + ww > dx0 + sw) finalX = dx0 + sw - ww;
  }

  logg(`SNAP: decided newPos=${newPos} -> x=${finalX} y=${finalY}`);

  const bounds = mainWindow.getBounds();
  const hasMoved = startPos && (Math.abs(bounds.x - startPos.x) > 5 || Math.abs(bounds.y - startPos.y) > 5);

  if (!hasMoved) {
    // If not moved, restore size instantly
    mainWindow.setBounds({
      x: Math.round(finalX),
      y: Math.round(finalY),
      width: ww,
      height: wh
    });
    mainWindow.webContents.send('drag-snap-end', currentScreenPosition);
    return;
  }

  // Instantly resize the window to target size before animating position (eliminates texture resizing stutter)
  const startX = Math.round(bounds.x - (ww - bounds.width) / 2);
  const startY = Math.round(bounds.y - (wh - bounds.height) / 2);
  
  mainWindow.setBounds({
    x: startX,
    y: startY,
    width: ww,
    height: wh
  });

  animateWindowBounds({ x: Math.round(finalX), y: Math.round(finalY), width: ww, height: wh });
  mainWindow.webContents.send('window-dragged-to', newPos);
  mainWindow.webContents.send('drag-snap-end', newPos);
});

let checkCursorInterval = null;
let checkCursorTimeout = null;

function startCursorChecking() {
  if (checkCursorInterval) clearInterval(checkCursorInterval);
  if (checkCursorTimeout) clearTimeout(checkCursorTimeout);
  
  // Wait 400ms for OS resize transition to finish before checking
  checkCursorTimeout = setTimeout(() => {
    checkCursorInterval = setInterval(() => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        clearInterval(checkCursorInterval);
        checkCursorInterval = null;
        return;
      }
      const bounds = mainWindow.getBounds();
      const point = screen.getCursorScreenPoint();
      
      // We allow a 15px buffer for extremely smooth hover transitions
      const buffer = 15;
      const isInside = (
        point.x >= bounds.x - buffer &&
        point.x <= bounds.x + bounds.width + buffer &&
        point.y >= bounds.y - buffer &&
        point.y <= bounds.y + bounds.height + buffer
      );
      
      if (!isInside) {
        mainWindow.webContents.send('force-collapse-shelf');
        clearInterval(checkCursorInterval);
        checkCursorInterval = null;
      }
    }, 120);
  }, 400);
}

function stopCursorChecking() {
  if (checkCursorTimeout) {
    clearTimeout(checkCursorTimeout);
    checkCursorTimeout = null;
  }
  if (checkCursorInterval) {
    clearInterval(checkCursorInterval);
    checkCursorInterval = null;
  }
}

ipcMain.on('set-shelf-height', (event, height) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (currentWindowMode !== 'shelf') return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds;
  const pos = currentScreenPosition;

  if (pos === 'left' || pos === 'right') {
    // For side positions, "height" means width
    const sideWidth = Math.max(6, Math.min(height, 600));
    const x = pos === 'left' ? 0 : screenWidth - sideWidth;
    mainWindow.setBounds({ x, y: 0, width: sideWidth, height: screenHeight });
  } else {
    const newHeight = Math.max(6, Math.min(height, 600));
    mainWindow.setBounds({ x: 0, y: 0, width: screenWidth, height: newHeight });
  }

  if (height <= 6) {
    stopCursorChecking();
  } else {
    startCursorChecking();
  }
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

ipcMain.handle('boost-system', async (event) => {
  return new Promise((resolve) => {
    const ps = `
      $targets = @('chrome', 'msedge', 'brave', 'firefox', 'opera', 'spotify', 'discord', 'steamwebhelper', 'epicgameslauncher', 'Battle.net', 'LeagueClientUx', 'RiotClientServices', 'slack', 'Teams', 'Zoom', 'WhatsApp', 'WhatsApp.Root', 'Telegram', 'EADesktop', 'EAConnect_Service', 'GalaxyClient', 'upc', 'Dropbox', 'GoogleDrive', 'OneDrive', 'vlc', 'qbittorrent', 'uTorrent')
      $cores = (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors
      $procs = Get-Process | Where-Object { $targets -contains $_.Name }
      if ($procs) {
          $cpu1 = @{}
          $procs | ForEach-Object { $cpu1[$_.Id] = $_.CPU }
          $t1 = Get-Date
          Start-Sleep -Milliseconds 200
          $t2 = Get-Date
          $cpu2 = @{}
          $procs | ForEach-Object {
              $p2 = Get-Process -Id $_.Id -ErrorAction SilentlyContinue
              if ($p2) { $cpu2[$_.Id] = $p2.CPU }
          }
          $elapsed = ($t2 - $t1).TotalSeconds
          
          $freed = 0
          $totalCpu = 0
          $killed = @()
          
          $procs | ForEach-Object {
              $id = $_.Id
              $name = $_.Name
              $mb = [math]::Round($_.WorkingSet64 / 1MB, 1)
              $freed += $_.WorkingSet64
              
              $cpuPercent = 0
              if ($cpu1.ContainsKey($id) -and $cpu2.ContainsKey($id) -and ($null -ne $cpu1[$id]) -and ($null -ne $cpu2[$id])) {
                  if ($elapsed -gt 0) {
                      $cpuPercent = [math]::Round((($cpu2[$id] - $cpu1[$id]) / $elapsed) * 100 / $cores, 1)
                      if ($cpuPercent -lt 0) { $cpuPercent = 0 }
                  }
              }
              $totalCpu += $cpuPercent

              if ($killed -notcontains $name) {
                  $killed += $name
                  Write-Output "KILL:$name|$mb|$cpuPercent"
                  Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
                  Start-Sleep -Milliseconds 300
              } else {
                  Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
              }
          }
          $totalMb = [math]::Round($freed / 1MB, 1)
          $names = $killed -join ", "
          $roundedCpu = [math]::Round($totalCpu, 1)
          Write-Output "DONE:$names|$totalMb|$roundedCpu"
      } else {
          Write-Output "DONE:none|0|0"
      }
    `.trim();
    const psProc = spawn('powershell.exe', ['-NoProfile', '-Command', ps]);
    
    let totalFreed = 0;
    let totalCpu = 0;
    let finalKilled = "none";
    
    psProc.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        const t = line.trim();
        if (t.startsWith('KILL:')) {
          const parts = t.substring(5).split('|');
          event.sender.send('boost-progress', { 
            name: parts[0], 
            mb: parseFloat(parts[1] || 0),
            cpu: parseFloat(parts[2] || 0)
          });
        } else if (t.startsWith('DONE:')) {
          const parts = t.substring(5).split('|');
          finalKilled = parts[0];
          totalFreed = parseFloat(parts[1] || 0);
          totalCpu = parseFloat(parts[2] || 0);
        }
      }
    });

    psProc.on('close', () => {
      resolve({ success: true, killed: finalKilled, freedMB: totalFreed, freedCPU: totalCpu });
    });
  });
});



function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.bounds;
  const windowWidth = 600; 
  const windowHeight = 450; 
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
    hasShadow: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // ── Stay-on-top guard ────────────────────────────────────────────────────
  // Some apps (full-screen games, UAC dialogs, etc.) can push Electron windows
  // below them. This listener detects when we lose the top position and
  // immediately re-asserts it.
  mainWindow.on('always-on-top-changed', (_event, isAlwaysOnTop) => {
    if (!isAlwaysOnTop && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
    }
  });

  // Belt-and-suspenders: periodically re-assert always-on-top so that even
  // apps that don't trigger the event (e.g. some D3D11 overlays) are handled.
  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
    }
  }, 3000);

  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Forward window blur to renderer so the notch can collapse when user clicks elsewhere
  mainWindow.on('blur', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-blur');
    }
  });

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
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    logg(`RENDERER CONSOLE: [level ${level}] ${message} (at ${sourceId}:${line})`);
  });
  
  const isDev = !app.isPackaged;
  if (isDev) {
    // Toggle DevTools on F12 or Ctrl+Shift+I instead of auto-opening on startup
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        if (mainWindow.webContents.isDevToolsOpened()) {
          mainWindow.webContents.closeDevTools();
        } else {
          mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
        event.preventDefault();
      }
    });

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

// (Single-instance lock is now at the top of the file)

app.whenReady().then(() => {
  vbsPath = path.join(app.getPath('userData'), 'sendkeys.vbs');
  try {
    fs.writeFileSync(vbsPath, 'Set w = CreateObject("WScript.Shell")\nw.SendKeys Chr(WScript.Arguments(0))');
  } catch(e) {
    logg('Failed to write VBScript: ' + e.message);
  }

  createWindow();
  authenticateSpotify();
  startClipboardPolling();
  startHardwarePolling();
  startCombinedBackgroundMonitor();

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
