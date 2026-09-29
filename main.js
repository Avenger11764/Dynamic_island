const koffi = require('koffi');
const ntdll = koffi.load('ntdll.dll');
const NtQueryWnfStateData = ntdll.stdcall('NtQueryWnfStateData', 'int', ['uint64*', 'void*', 'void*', 'int*', 'void*', 'int*']);
const { app, BrowserWindow, screen, ipcMain, shell, clipboard, Menu, Notification, powerMonitor } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');

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

// Hardware acceleration & GPU rendering flags for smooth 60/120Hz transitions
// GPU features are left to Chromium: forcing them (ignore-gpu-blocklist, zero-copy)
// on drivers Chromium has blocklisted caused rendering stalls that only a restart fixed.

// Debug log in userData, capped at ~1 MB (one previous file is kept as .old.log)
const LOG_MAX_BYTES = 1024 * 1024;
let logPath = null;
let logWrites = 0;
function logg(msg) {
  try {
    if (!logPath) logPath = path.join(app.getPath('userData'), 'app-debug.log');
    if (logWrites++ % 200 === 0 && fs.existsSync(logPath) && fs.statSync(logPath).size > LOG_MAX_BYTES) {
      fs.renameSync(logPath, logPath.replace(/\.log$/, '.old.log'));
    }
    fs.appendFileSync(logPath, new Date().toISOString() + ': ' + msg + '\n');
  } catch (e) {}
}

process.on('uncaughtException', (err) => {
  logg('UNCAUGHT EXCEPTION: ' + err.message + '\n' + err.stack);
});
process.on('unhandledRejection', (reason) => {
  logg('UNHANDLED REJECTION: ' + (reason?.stack || reason));
});

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
let smtcLastMessage = 0;
let appQuitting = false;

function startSpotifyPolling() {
  const spawnWorker = () => {
    try {
      const workerPath = path.join(__dirname, 'smtc-worker.js');
      smtcWorker = fork(workerPath, [], {
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
        stdio: ['ignore', 'ignore', 'ignore', 'ipc']
      });

      let currentTrackThumbnail = '';
      let currentTrackThumbnailMime = 'image/png';
      smtcLastMessage = Date.now();
      let lastSentThumbnail = null;
      smtcWorker.on('message', (msg) => {
        smtcLastMessage = Date.now();
        if (!mainWindow || mainWindow.isDestroyed()) return;
        if (msg) {
          const trackId = msg.title + '-' + msg.artist;
          if (trackId !== currentTrackId) {
            currentTrackId = trackId;
            currentLyrics = [];
            currentTrackThumbnail = msg.thumbnail || '';
            currentTrackThumbnailMime = msg.thumbnailMime || 'image/png';
            fetchLyrics({ name: msg.title, artists: [{ name: msg.artist }] });
          } else if (msg.thumbnail !== undefined) {
            currentTrackThumbnail = msg.thumbnail || '';
            if (msg.thumbnailMime) currentTrackThumbnailMime = msg.thumbnailMime;
          }

          const fallbackArtist = msg.artist || (msg.is_spotify ? 'Spotify' : ((msg.appId && (msg.appId.includes('Zune') || msg.appId.includes('Media.Player'))) ? 'Media Player' : (msg.appId && msg.appId.toLowerCase().includes('brave') ? 'Brave' : (msg.appId && msg.appId.toLowerCase().includes('chrome') ? 'Chrome' : 'Playing'))));

          // Artwork is a large base64 string: only send it when it changes
          const artChanged = currentTrackThumbnail !== lastSentThumbnail;
          lastSentThumbnail = currentTrackThumbnail;
          const item = {
            id: trackId,
            name: msg.title,
            artists: [{ name: fallbackArtist }],
            album: artChanged ? { images: [{ url: currentTrackThumbnail ? `data:${currentTrackThumbnailMime};base64,` + currentTrackThumbnail : '' }] } : null,
            duration_ms: msg.duration_ms || 0,
            progress_ms: msg.progress_ms || 0
          };

          const body = {
            item: item,
            is_playing: msg.is_playing,
            progress_ms: msg.progress_ms,
            duration_ms: msg.duration_ms || 0,
            lyrics: currentLyrics,
            sourceAppId: msg.appId,
            isSpotify: msg.is_spotify,
            artUnchanged: !artChanged
          };

          mainWindow.webContents.send('spotify-state', body);
        } else {
          lastSentThumbnail = null;
          mainWindow.webContents.send('spotify-state', null);
        }
      });

      const proc = smtcWorker;
      smtcWorker.on('exit', () => {
        if (smtcWorker !== proc || appQuitting) return;
        smtcWorker = null;
        setTimeout(spawnWorker, 3000);
      });
    } catch(e) {
      logg('Worker spawn error: ' + e.message);
    }
  };
  
  spawnWorker();

  // The worker reports every ~0.8s; if the native media API hangs, restart it
  setInterval(() => {
    if (appQuitting || !smtcWorker) return;
    if (Date.now() - smtcLastMessage > 12000) {
      logg('Media worker stopped responding, restarting');
      const old = smtcWorker;
      smtcWorker = null;
      try { old.kill(); } catch (_) {}
      spawnWorker();
    }
  }, 5000);
}

let lastCopiedText = '';
let getClipboardSequence = null;
try {
  getClipboardSequence = koffi.load('user32.dll').func('uint32 __stdcall GetClipboardSequenceNumber()');
} catch (_) {}
let lastClipboardSeq = -1;

function startClipboardPolling() {
  setInterval(() => {
    try {
      // Reading the clipboard copies its whole content; skip it unless it changed
      if (getClipboardSequence) {
        const seq = getClipboardSequence();
        if (seq === lastClipboardSeq) return;
        lastClipboardSeq = seq;
      }
      const text = clipboard.readText();
      if (text && text !== lastCopiedText) {
        lastCopiedText = text;
        // Very basic URL regex
        if (/^https?:\/\//i.test(text)) {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('clipboard-url', text);
          }
        }
      }
    } catch(e) {}
  }, 1000);
}

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

const { spawn, exec, execFile, execSync } = require('child_process');

let vbsPath = '';
let seekPs1Path = '';
let combinedPs = null;

function startCombinedBackgroundMonitor() {
  const psScript = `
    $ErrorActionPreference = 'SilentlyContinue'
    
    # Load native Windows winsqlite3.dll via dynamically compiled C# type
    $csharpCode = @"
    using System;
    using System.Runtime.InteropServices;
    using System.Text;
    
    public class WinSQLite {
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_open", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern int sqlite3_open(string filename, out IntPtr db);
    
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_close", CallingConvention = CallingConvention.Cdecl)]
        public static extern int sqlite3_close(IntPtr db);
    
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_prepare_v2", CallingConvention = CallingConvention.Cdecl)]
        public static extern int sqlite3_prepare_v2(IntPtr db, string zSql, int nByte, out IntPtr ppStmt, out IntPtr pzTail);
    
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_step", CallingConvention = CallingConvention.Cdecl)]
        public static extern int sqlite3_step(IntPtr pStmt);
    
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_finalize", CallingConvention = CallingConvention.Cdecl)]
        public static extern int sqlite3_finalize(IntPtr pStmt);
    
        [DllImport("winsqlite3.dll", EntryPoint = "sqlite3_column_text", CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr sqlite3_column_text_internal(IntPtr pStmt, int iCol);
    
        public static string sqlite3_column_text(IntPtr pStmt, int iCol) {
            IntPtr ptr = sqlite3_column_text_internal(pStmt, iCol);
            if (ptr == IntPtr.Zero) return "";
            int len = 0;
            while (Marshal.ReadByte(ptr, len) != 0) {
                len++;
            }
            byte[] buffer = new byte[len];
            Marshal.Copy(ptr, buffer, 0, len);
            return Encoding.UTF8.GetString(buffer);
        }
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct DEVPROPKEY {
        public Guid fmtid;
        public uint pid;
    }

    public class CamHardwareCheck {
        [DllImport("cfgmgr32.dll", SetLastError = true, CharSet = CharSet.Unicode, EntryPoint = "CM_Locate_DevNodeW")]
        public static extern int CM_Locate_DevNode(out uint pdnDevInst, string pDeviceID, int ulFlags);

        [DllImport("cfgmgr32.dll", SetLastError = true, CharSet = CharSet.Unicode, EntryPoint = "CM_Get_DevNode_PropertyW")]
        public static extern int CM_Get_DevNode_Property(
            uint dnDevInst,
            ref DEVPROPKEY PropertyKey,
            out uint PropertyType,
            byte[] PropertyBuffer,
            ref uint PropertyBufferSize,
            int ulFlags
        );

        public static int GetPowerState(string deviceId) {
            try {
                uint devInst;
                int cr = CM_Locate_DevNode(out devInst, deviceId, 0);
                if (cr != 0) return -1;

                var key = new DEVPROPKEY {
                    fmtid = new Guid("A45C254E-DF1C-4EFD-8020-67D146A850E0"),
                    pid = 32
                };

                uint propType = 0;
                uint size = 64;
                byte[] buf = new byte[64];
                cr = CM_Get_DevNode_Property(devInst, ref key, out propType, buf, ref size, 0);
                if (cr != 0 || size < 5) return -2;

                return (int)buf[4];
            } catch {
                return -3;
            }
        }
    }

    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    public class MMDeviceEnumeratorComObject { }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator {
        [PreserveSig]
        int EnumAudioEndpoints(int dataFlow, int dwStateMask, out IntPtr ppDevices);
        [PreserveSig]
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppEndpoint);
    }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDevice {
        [PreserveSig]
        int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
    }

    [Guid("BFA971F1-4D5E-40BB-935E-967039BFBEE4"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionManager {
        [PreserveSig]
        int GetAudioSessionControl(ref Guid AudioSessionGuid, int StreamFlags, out IAudioSessionControl SessionControl);
        [PreserveSig]
        int GetSimpleAudioVolume(ref Guid AudioSessionGuid, int StreamFlags, out IntPtr AudioVolume);
    }

    [Guid("F4B1A599-7266-4319-A8CA-E70ACB11E8CD"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionControl {
        [PreserveSig]
        int GetState(out int pRetVal);
    }

    [Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioMeterInformation {
        [PreserveSig]
        int GetPeakValue(out float pfPeak);
    }

    public class MicCaptureHelper {
        private static IMMDeviceEnumerator enumerator;
        private static IMMDevice dev;
        private static IAudioSessionControl ctrl;
        private static IAudioMeterInformation meter;

        static MicCaptureHelper() {
            try {
                enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
                InitDevice();
            } catch {}
        }

        private static void InitDevice() {
            try {
                ctrl = null;
                meter = null;
                dev = null;
                if (enumerator == null) return;
                int hr = enumerator.GetDefaultAudioEndpoint(1, 0, out dev);
                if (hr != 0 || dev == null) return;

                var IID_IAudioSessionManager = new Guid("BFA971F1-4D5E-40BB-935E-967039BFBEE4");
                object mgrObj;
                hr = dev.Activate(ref IID_IAudioSessionManager, 23, IntPtr.Zero, out mgrObj);
                if (hr == 0 && mgrObj != null) {
                    var mgr = (IAudioSessionManager)mgrObj;
                    var empty = Guid.Empty;
                    mgr.GetAudioSessionControl(ref empty, 0, out ctrl);
                }

                var IID_IAudioMeterInformation = new Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064");
                object meterObj;
                hr = dev.Activate(ref IID_IAudioMeterInformation, 23, IntPtr.Zero, out meterObj);
                if (hr == 0 && meterObj != null) {
                    meter = (IAudioMeterInformation)meterObj;
                }
            } catch {}
        }

        public static bool IsMicInUse() {
            try {
                if (ctrl != null) {
                    int st;
                    int hr = ctrl.GetState(out st);
                    if (hr == 0 && st == 1) return true;
                    if (hr != 0) {
                        InitDevice();
                        if (ctrl != null && ctrl.GetState(out st) == 0 && st == 1) return true;
                    }
                } else {
                    InitDevice();
                    if (ctrl != null) {
                        int st;
                        if (ctrl.GetState(out st) == 0 && st == 1) return true;
                    }
                }

                if (meter != null) {
                    float peak;
                    int hr = meter.GetPeakValue(out peak);
                    if (hr == 0 && peak > 0.0001f) return true;
                }
            } catch {
                InitDevice();
            }
            return false;
        }
    }
"@
    Add-Type -TypeDefinition $csharpCode -ErrorAction SilentlyContinue

    $camDevIds = @()
    $usbEnum = Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\usbvideo\\Enum' -ErrorAction SilentlyContinue
    if ($usbEnum) {
        $cnt = $usbEnum.Count
        for ($i = 0; $i -lt $cnt; $i++) {
            $id = $usbEnum."$i"
            if ($id) { $camDevIds += $id }
        }
    }
    if ($camDevIds.Count -eq 0) {
        $pnp = Get-PnpDevice -Class Camera -ErrorAction SilentlyContinue
        if ($pnp) {
            foreach ($d in $pnp) { $camDevIds += $d.InstanceId }
        }
    }

    $dbPath = "$env:LOCALAPPDATA\Microsoft\Windows\Notifications\wpndatabase.db"
    $tempDb = "$env:TEMP\wpndatabase_temp.db"
    $lastOrder = 0

    # Initialize lastOrder to current max order to avoid showing historical notification spam on startup
    if (Test-Path $dbPath) {
        Copy-Item $dbPath $tempDb -Force
        $db = [IntPtr]::Zero
        $res = [WinSQLite]::sqlite3_open($tempDb, [ref]$db)
        if ($res -eq 0) {
            $stmt = [IntPtr]::Zero
            $pzTail = [IntPtr]::Zero
            $sql = "SELECT MAX([Order]) FROM Notification"
            $res = [WinSQLite]::sqlite3_prepare_v2($db, $sql, -1, [ref]$stmt, [ref]$pzTail)
            if ($res -eq 0) {
                if ([WinSQLite]::sqlite3_step($stmt) -eq 100) {
                    $val = [WinSQLite]::sqlite3_column_text($stmt, 0)
                    if ($val -ne "") {
                        $lastOrder = [int]$val
                    }
                }
                [WinSQLite]::sqlite3_finalize($stmt)
            }
            [WinSQLite]::sqlite3_close($db)
        }
    }

    function GetNewNotifications {
        $dbPath = "$env:LOCALAPPDATA\Microsoft\Windows\Notifications\wpndatabase.db"
        $tempDb = "$env:TEMP\wpndatabase_temp.db"
        if (-not (Test-Path $dbPath)) { return }
        
        Copy-Item $dbPath $tempDb -Force
        $db = [IntPtr]::Zero
        $res = [WinSQLite]::sqlite3_open($tempDb, [ref]$db)
        if ($res -eq 0) {
            $stmt = [IntPtr]::Zero
            $pzTail = [IntPtr]::Zero
            # Query new toast notifications
            $sql = "SELECT N.[Order], H.PrimaryId, N.Payload FROM Notification N JOIN NotificationHandler H ON N.HandlerId = H.RecordId WHERE N.Type = 'toast' AND N.[Order] > $lastOrder ORDER BY N.[Order] ASC"
            $res = [WinSQLite]::sqlite3_prepare_v2($db, $sql, -1, [ref]$stmt, [ref]$pzTail)
            if ($res -eq 0) {
                while ([WinSQLite]::sqlite3_step($stmt) -eq 100) {
                    $orderStr = [WinSQLite]::sqlite3_column_text($stmt, 0)
                    $order = [int]$orderStr
                    $appId = [WinSQLite]::sqlite3_column_text($stmt, 1)
                    $payload = [WinSQLite]::sqlite3_column_text($stmt, 2)
                    
                    if ($order -gt $global:lastOrder) {
                        $global:lastOrder = $order
                    }
                    
                    # Parse XML to extract title and body texts
                    $title = ""
                    $msg = ""
                    try {
                        [xml]$xml = $payload
                        $texts = $xml.SelectNodes("//text")
                        if ($null -ne $texts) {
                            if ($texts.Count -ge 1) { $title = $texts[0].InnerText }
                            if ($texts.Count -ge 2) { $msg = $texts[1].InnerText }
                        }
                    } catch {}
                    
                    # Clean AppId to a friendly display name
                    $cleanApp = $appId -replace '_[a-zA-Z0-9]+(![a-zA-Z0-9]+)?$', ''
                    $cleanApp = $cleanApp -replace '\.', ' '
                    $cleanApp = $cleanApp.Trim()
                    
                    # Escape pipes and newlines
                    $cleanTitle = $title -replace '\|', ' ' -replace '\r?\n', ' '
                    $cleanMsg = $msg -replace '\|', ' ' -replace '\r?\n', ' '
                    
                    Write-Output "NOTIFICATION|$order|$cleanApp|$cleanTitle|$cleanMsg"
                }
                [WinSQLite]::sqlite3_finalize($stmt)
            }
            [WinSQLite]::sqlite3_close($db)
        }
    }
    
    function CheckConsentRegistry ($type) {
      foreach ($root in @([Microsoft.Win32.Registry]::CurrentUser, [Microsoft.Win32.Registry]::LocalMachine)) {
        $path = "Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\$type"
        $key = $root.OpenSubKey($path)
        if ($null -ne $key) {
          foreach ($subName in $key.GetSubKeyNames()) {
            if ($subName -eq "NonPackaged") { continue }
            $sub = $key.OpenSubKey($subName)
            if ($null -ne $sub) {
              $stop = $sub.GetValue("LastUsedTimeStop")
              $start = $sub.GetValue("LastUsedTimeStart")
              if ($null -ne $start -and $start -gt 0) {
                if ($null -eq $stop -or $stop -eq 0 -or [int64]$start -gt [int64]$stop) {
                  $sub.Close(); $key.Close()
                  return $true
                }
              }
              $sub.Close()
            }
          }
          $np = $key.OpenSubKey("NonPackaged")
          if ($null -ne $np) {
            foreach ($subName in $np.GetSubKeyNames()) {
              $sub = $np.OpenSubKey($subName)
              if ($null -ne $sub) {
                $stop = $sub.GetValue("LastUsedTimeStop")
                $start = $sub.GetValue("LastUsedTimeStart")
                if ($null -ne $start -and $start -gt 0) {
                  if ($null -eq $stop -or $stop -eq 0 -or [int64]$start -gt [int64]$stop) {
                    $sub.Close(); $np.Close(); $key.Close()
                    return $true
                  }
                }
                $sub.Close()
              }
            }
            $np.Close()
          }
          $key.Close()
        }
      }
      return $false
    }

    function CheckCameraInUse {
      foreach ($camId in $camDevIds) {
        try {
          $pwr = [CamHardwareCheck]::GetPowerState($camId)
          if ($pwr -eq 1) { return $true }
        } catch {}
      }
      return CheckConsentRegistry "webcam"
    }

    function CheckMicrophoneInUse {
      try {
        if ([MicCaptureHelper]::IsMicInUse()) { return $true }
      } catch {}
      return CheckConsentRegistry "microphone"
    }

    function GetActiveCall {
      $appName = $null
      $winTitle = ""
      $winHandle = 0
      
      $micPath = "Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone"
      $webPath = "Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam"
      
      $activeApps = @()
      
      foreach ($p in @($micPath, $webPath)) {
        $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($p)
        if ($null -ne $key) {
          foreach ($s in $key.GetSubKeyNames()) {
            if ($s -ne "NonPackaged") {
              $sub = $key.OpenSubKey($s)
              if ($null -ne $sub) {
                $stop = $sub.GetValue("LastUsedTimeStop")
                if ($null -ne $stop -and $stop -eq 0) {
                  $activeApps += $s
                }
                $sub.Close()
              }
            }
          }
          $np = $key.OpenSubKey("NonPackaged")
          if ($null -ne $np) {
            foreach ($s in $np.GetSubKeyNames()) {
              $sub = $np.OpenSubKey($s)
              if ($null -ne $sub) {
                $stop = $sub.GetValue("LastUsedTimeStop")
                if ($null -ne $stop -and $stop -eq 0) {
                  $activeApps += $s
                }
                $sub.Close()
              }
            }
            $np.Close()
          }
          $key.Close()
        }
      }
      
      $activeApps = $activeApps | Select-Object -Unique
      
      if ($activeApps.Count -gt 0) {
        foreach ($app in $activeApps) {
          $shortName = ""
          if ($app -like "*chrome*") { $shortName = "chrome" }
          elseif ($app -like "*msedge*") { $shortName = "msedge" }
          elseif ($app -like "*brave*") { $shortName = "brave" }
          elseif ($app -like "*firefox*") { $shortName = "firefox" }
          elseif ($app -like "*Zoom*") { $shortName = "Zoom" }
          elseif ($app -like "*WhatsApp*") { $shortName = "WhatsApp" }
          elseif ($app -like "*Telegram*") { $shortName = "Telegram" }
          elseif ($app -like "*Discord*") { $shortName = "Discord" }
          elseif ($app -like "*Teams*" -or $app -like "*MSTeams*") { $shortName = "Teams" }
          elseif ($app -like "*skype*") { $shortName = "skype" }
          
          if ($shortName -ne "") {
            $procs = Get-Process -Name $shortName -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle }
            $callKeywords = @("Meet", "Zoom", "Teams", "Discord", "Call", "WhatsApp", "Telegram", "Video", "Audio", "Webex")
            $foundProc = $null
            foreach ($proc in $procs) {
              foreach ($kw in $callKeywords) {
                if ($proc.MainWindowTitle -like "*$kw*") {
                  $foundProc = $proc
                  break
                }
              }
              if ($null -ne $foundProc) { break }
            }
            
            if ($null -eq $foundProc -and $procs.Count -gt 0) {
              $foundProc = $procs[0]
            }
            
            if ($null -ne $foundProc) {
              $appName = $shortName
              $winTitle = $foundProc.MainWindowTitle
              $winHandle = $foundProc.MainWindowHandle
              break
            }
          }
        }
      }
      
      if ($null -ne $appName) {
        $sig = '[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();'
        Add-Type -MemberDefinition $sig -Name WinAPICall -Namespace Win32 -ErrorAction SilentlyContinue
        $fg = [Win32.WinAPICall]::GetForegroundWindow()
        $isForeground = ($fg -eq $winHandle)
        
        $cleanTitle = $winTitle -replace "\\|", " "
        return "$appName|$cleanTitle|$winHandle|$isForeground"
      }
      
      return "None"
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
      
      $cam = CheckCameraInUse
      $mic = CheckMicrophoneInUse
      
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
      
      $callInfo = GetActiveCall
      Write-Output "$cam,$mic,$diffRx,$diffTx|$callInfo"
      
      GetNewNotifications
      
      $prevRx = $currRx
      $prevTx = $currTx
      
      $gcCounter++
      if ($gcCounter -ge 60) {
        [System.GC]::Collect()
        $gcCounter = 0
      }
    }
  `;

  const ps = spawn('powershell.exe', ['-NoProfile', '-Command', psScript]);
  combinedPs = ps;
  
  let psStdoutBuffer = '';
  ps.stdout.on('data', (data) => {
    psStdoutBuffer += data.toString();
    const lines = psStdoutBuffer.split(/\r?\n/);
    psStdoutBuffer = lines.pop(); // Keep the last incomplete line in the buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      const pipes = trimmed.split('|');
      
      // If this line is a notification, forward to renderer and skip active call checks
      if (pipes[0] === 'NOTIFICATION') {
        if (pipes.length >= 5) {
          const appName = pipes[2];
          const title = pipes[3];
          const message = pipes[4];
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('system-notification', { appName, title, message });
          }
        }
        continue;
      }
      
      if (pipes.length >= 1) {
        const statsParts = pipes[0].split(',');
        if (statsParts.length === 4) {
          const cam = statsParts[0] === 'True';
          const mic = statsParts[1] === 'True';
          const rx = parseInt(statsParts[2]);
          const tx = parseInt(statsParts[3]);
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('privacy-dots', { cam, mic });
            mainWindow.webContents.send('network-stats', { rx, tx });
          }
        }
      }
      
      if (pipes.length === 5) {
        const activeCall = {
          isActive: true,
          appName: pipes[1],
          title: pipes[2],
          handle: parseInt(pipes[3]),
          isForeground: pipes[4] === 'True'
        };
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('active-call-status', activeCall);
        }
      } else {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('active-call-status', { isActive: false });
        }
      }
    }
  });

  ps.stderr.on('data', (data) => {
    logg('Combined background monitor stderr: ' + data.toString().trim());
  });

  ps.on('close', (code) => {
    logg('Combined background monitor exited with code ' + code);
    if (combinedPs !== ps || appQuitting) return;
    combinedPs = null;
    setTimeout(() => { if (!appQuitting && !combinedPs) startCombinedBackgroundMonitor(); }, 3000);
  });

  ps.on('error', (err) => {
    logg('Combined background monitor spawn/runtime error: ' + err.message);
  });
}

function pressMediaKey(key) {
  try {
    if (vbsPath) {
      execFile('wscript.exe', [vbsPath, key]);
    } else {
      execFile('powershell.exe', ['-NoProfile', '-Command', `$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]${key})`]);
    }
  } catch(e) {
    try {
      execFile('powershell.exe', ['-NoProfile', '-Command', `$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]${key})`]);
    } catch(err){}
  }
}

ipcMain.on('spotify-play', () => pressMediaKey(179));
ipcMain.on('spotify-pause', () => pressMediaKey(179));
ipcMain.on('spotify-skip', () => pressMediaKey(176));
ipcMain.on('spotify-prev', () => pressMediaKey(177));

ipcMain.on('spotify-seek', (event, progressMs) => {
  if (seekPs1Path) {
    const ticks = Math.round(progressMs * 10000);
    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', seekPs1Path, ticks]);
  }
});

// ── Unified Fast System Controller (Volume, Brightness, Bluetooth) ───────────
let sysWorker = null;
let sysWorkerReady = false;
let currentVolumeVal = 50;
let currentMuteVal = false;
let currentBrightnessVal = 80;
let currentIsBtAudio = false;
let lastSentVol = -1;
let lastSentMute = null;
let lastSentBright = -1;
let lastUserVolTime = 0;
let lastUserBrightTime = 0;
let currentBtDevice = null;
// name -> battery for every BT device the worker has reported, so restarts don't re-pop alerts
const knownBtDevices = new Map();
// Devices re-announced by a freshly (re)started worker before READY
let pendingBtPresent = null;
let sysWorkerQuitting = false;
let audioMeterWanted = false;
let systemToggles = null;
let sysWorkerRestartTimer = null;
let sysWorkerWatchdog = null;
let lastHbLevels = 0;
let lastHbBt = 0;

function getExecutableScriptPath(scriptName) {
  // 1. In development, use direct file in project root
  if (!app.isPackaged) {
    const directPath = path.join(__dirname, scriptName);
    if (fs.existsSync(directPath)) return directPath;
  }

  // 2. In packaged app, electron-builder unpacks *.ps1 to app.asar.unpacked
  if (process.resourcesPath) {
    const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', scriptName);
    if (fs.existsSync(unpackedPath)) return unpackedPath;
  }

  const asarUnpackedDir = __dirname.replace(/app\.asar[/\\]?$/i, 'app.asar.unpacked');
  const asarUnpackedPath = path.join(asarUnpackedDir, scriptName);
  if (fs.existsSync(asarUnpackedPath)) return asarUnpackedPath;

  if (app.getAppPath) {
    const appUnpacked = path.join(app.getAppPath().replace(/app\.asar[/\\]?$/i, 'app.asar.unpacked'), scriptName);
    if (fs.existsSync(appUnpacked)) return appUnpacked;
  }

  // 3. Fallback: extract to temp directory (safe across all AppX sandboxes)
  try {
    const tempDir = path.join(os.tmpdir(), 'smart-notch-scripts');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const targetPath = path.join(tempDir, scriptName);

    const candidates = [
      path.join(__dirname, scriptName),
      path.join(process.cwd(), scriptName)
    ];
    let sourceContent = null;
    for (const cand of candidates) {
      try {
        if (fs.existsSync(cand)) {
          sourceContent = fs.readFileSync(cand);
          if (sourceContent && sourceContent.length > 0) break;
        }
      } catch (_) {}
    }
    if (sourceContent && sourceContent.length > 0) {
      let needsWrite = true;
      if (fs.existsSync(targetPath)) {
        try {
          const cur = fs.readFileSync(targetPath);
          if (sourceContent.equals(cur)) needsWrite = false;
        } catch (_) {}
      }
      if (needsWrite) fs.writeFileSync(targetPath, sourceContent);
      return targetPath;
    }
  } catch (err) {
    logg(`getExecutableScriptPath fallback error for ${scriptName}: ${err.message}`);
  }

  return path.join(__dirname, scriptName);
}

function startSystemControlWorker() {
  const scriptPath = getExecutableScriptPath('system_control.ps1');
  if (!fs.existsSync(scriptPath)) { logg('system_control.ps1 not found at: ' + scriptPath); return; }
  logg('Starting system control worker with script: ' + scriptPath);

  if (sysWorkerRestartTimer) { clearTimeout(sysWorkerRestartTimer); sysWorkerRestartTimer = null; }
  sysWorkerReady = false;
  // Treat the first levels from a new worker as initial state (no OSD popup)
  lastSentVol = -1;
  lastSentBright = -1;
  pendingBtPresent = new Set();
  lastHbLevels = lastHbBt = Date.now();

  const proc = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true
  });
  sysWorker = proc;

  let buffer = '';
  proc.stdout.on('data', (data) => {
    if (sysWorker !== proc) return;
    buffer += data.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      if (t === 'READY') {
        sysWorkerReady = true;
        logg('sysWorker reported READY');
        if (audioMeterWanted) sysWorkerSend('meter on');
        // Anything we thought was connected but the new worker didn't report is gone
        if (pendingBtPresent) {
          for (const name of [...knownBtDevices.keys()]) {
            if (!pendingBtPresent.has(name)) btDeviceDisconnected(name);
          }
          pendingBtPresent = null;
        }
        continue;
      }
      if (t.startsWith('PK:')) {
        // Output peak levels for beat-synced lights; drop them if nothing is listening
        if (audioMeterWanted && mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
          const [l, r] = t.substring(3).split(',').map(Number);
          mainWindow.webContents.send('audio-level', [l / 1000, r / 1000]);
        }
        continue;
      }
      if (t.startsWith('BOOST_STEP:')) {
        const [name, mb] = t.substring(11).split('|');
        if (boostWaiter && !boostWaiter.sender.isDestroyed()) boostWaiter.sender.send('boost-progress', { name, mb: parseFloat(mb) || 0 });
        continue;
      }
      if (t.startsWith('BOOST_DONE:')) {
        const [mb, apps] = t.substring(11).split('|');
        finishBoost({ success: true, freedMB: parseFloat(mb) || 0, apps: parseInt(apps, 10) || 0 });
        continue;
      }
      if (t.startsWith('TOGGLES:')) {
        // Night light / Do not disturb state (1 on, 0 off, -1 unknown)
        const kv = Object.fromEntries(t.substring(8).split('|').map((p) => p.split('=')));
        systemToggles = { nightLight: kv.NL === '1', dnd: kv.DND === '1', nightLightKnown: kv.NL !== '-1', dndKnown: kv.DND !== '-1' };
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('system-toggles', systemToggles);
        if (kv.OK === 'False') logg('Toggle change was not applied: ' + t);
        continue;
      }
      if (t === 'HB:LEVELS') { lastHbLevels = Date.now(); continue; }
      if (t === 'HB:BT') { lastHbBt = Date.now(); continue; }
      if (t.startsWith('VOL:')) {
        const parts = t.split('|');
        const v = Math.round(parseFloat(parts[0].substring(4)));
        let m = currentMuteVal;
        if (parts.length > 1 && parts[1].startsWith('MUTE:')) {
          m = parts[1].substring(5).trim() === 'True';
        }
        currentVolumeVal = v;
        currentMuteVal = m;
        const isInitial = (lastSentVol === -1);
        const changed = (v !== lastSentVol || m !== lastSentMute);
        lastSentVol = v;
        lastSentMute = m;
        if (!isInitial) {
          if (changed && Date.now() - lastUserVolTime >= 500) {
            logg(`VOL changed via external/keyboard: ${v}, muted: ${m}`);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('osd-level', { type: 'volume', value: v, isMuted: m });
            }
          }
        } else {
          logg(`Initial VOL received: ${v}, muted: ${m}`);
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('init-levels', { volume: v, isMuted: m, isBtAudio: currentIsBtAudio });
          }
        }
      } else if (t.startsWith('VOL_SYNC:')) {
        const parts = t.split('|');
        const v = Math.round(parseFloat(parts[0].substring(9)));
        let m = currentMuteVal;
        if (parts.length > 1 && parts[1].startsWith('MUTE:')) {
          m = parts[1].substring(5).trim() === 'True';
        }
        currentVolumeVal = v;
        currentMuteVal = m;
        lastSentVol = v;
        lastSentMute = m;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('init-levels', { volume: v, isMuted: m, isBtAudio: currentIsBtAudio });
        }
      } else if (t.startsWith('BRIGHTNESS:')) {
        const b = parseInt(t.substring(11));
        if (!isNaN(b)) {
          const isInitial = (lastSentBright === -1);
          const changed = (b !== currentBrightnessVal);
          currentBrightnessVal = b;
          lastSentBright = b;
          if (!isInitial) {
            if (changed && Date.now() - lastUserBrightTime >= 600) {
              logg(`BRIGHTNESS changed via external/keyboard: ${b}`);
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('osd-level', { type: 'brightness', value: b });
              }
            }
          } else {
            logg(`Initial BRIGHTNESS received: ${b}`);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('init-levels', { brightness: b });
            }
          }
        }
      } else if (t.startsWith('BT_CONNECTED:')) {
        const { name, battery } = parseBtLine(t.substring(13));
        logg(`BT_CONNECTED event: name=${name}, battery=${battery}`);
        btDeviceConnected(name, battery, true);
      } else if (t.startsWith('BT_PRESENT:')) {
        const { name, battery } = parseBtLine(t.substring(11));
        logg(`BT_PRESENT event: name=${name}, battery=${battery}`);
        if (pendingBtPresent) pendingBtPresent.add(name);
        // Only alert if this device is new to us (e.g. connected while worker was down)
        btDeviceConnected(name, battery, !knownBtDevices.has(name));
      } else if (t.startsWith('BT_BATTERY:')) {
        const { name, battery } = parseBtLine(t.substring(11));
        btDeviceConnected(name, battery, false);
      } else if (t.startsWith('BT_DISCONNECTED:')) {
        const name = t.substring(16);
        logg(`BT_DISCONNECTED event: name=${name}`);
        btDeviceDisconnected(name);
      } else if (t.startsWith('BT_AUDIO:')) {
        const isBt = t.substring(9).trim() === 'True';
        currentIsBtAudio = isBt;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('bt-audio-status', isBt);
        }
      }
    }
  });

  proc.stderr.on('data', (d) => logg('sysWorker stderr: ' + d.toString().trim()));
  proc.on('close', (code) => {
    if (sysWorker !== proc) return; // replaced by a restart
    sysWorkerReady = false;
    sysWorker = null;
    if (sysWorkerQuitting) return;
    logg(`sysWorker exited (code ${code}), restarting`);
    sysWorkerRestartTimer = setTimeout(startSystemControlWorker, 2000);
  });
  proc.on('error', (e) => logg('sysWorker error: ' + e.message));

  if (!sysWorkerWatchdog) {
    // The worker emits heartbeats from its volume/brightness and Bluetooth loops.
    // If either loop stalls (COM/WMI hang, sleep/resume), restart it instead of
    // leaving the OSD and Bluetooth alerts dead until the app is relaunched.
    sysWorkerWatchdog = setInterval(() => {
      if (!sysWorker || !sysWorkerReady || sysWorkerQuitting) return;
      const now = Date.now();
      if (now - lastHbLevels > 10000 || now - lastHbBt > 15000) {
        logg(`sysWorker heartbeat stale (levels ${now - lastHbLevels}ms, bt ${now - lastHbBt}ms), restarting`);
        restartSystemControlWorker();
      }
    }, 3000);
  }
}

function restartSystemControlWorker() {
  const old = sysWorker;
  sysWorker = null;
  sysWorkerReady = false;
  if (old) { try { old.kill(); } catch (_) {} }
  startSystemControlWorker();
}

function parseBtLine(rest) {
  const parts = rest.split('|BATTERY:');
  const battery = parts.length > 1 ? parseInt(parts[1]) : -1;
  return { name: parts[0], battery: isNaN(battery) ? -1 : battery };
}

function btDeviceConnected(name, battery, alert) {
  const prev = knownBtDevices.get(name);
  knownBtDevices.set(name, battery);
  currentBtDevice = { name, battery };
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (alert) {
    mainWindow.webContents.send('bt-device-event', { type: 'connected', name, battery });
  } else if (prev !== battery) {
    mainWindow.webContents.send('bt-device-event', { type: 'battery', name, battery });
  }
}

function btDeviceDisconnected(name) {
  if (!knownBtDevices.has(name)) return;
  knownBtDevices.delete(name);
  if (currentBtDevice && currentBtDevice.name === name) {
    const rest = [...knownBtDevices.entries()].pop();
    currentBtDevice = rest ? { name: rest[0], battery: rest[1] } : null;
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('bt-device-event', { type: 'disconnected', name });
  }
}

function sysWorkerSend(cmd) {
  if (sysWorker && sysWorker.stdin && sysWorker.stdin.writable) {
    try { 
      sysWorker.stdin.write(cmd + '\n'); 
    } catch(e) {
      logg('sysWorkerSend error: ' + e.message);
    }
  } else {
    logg('sysWorkerSend skipped: ' + cmd);
  }
}

let volDebounce = null;
ipcMain.on('set-volume', (e, val) => {
  const clamped = Math.max(0, Math.min(100, Math.round(val)));
  currentVolumeVal = clamped;
  lastSentVol = clamped;
  lastUserVolTime = Date.now();
  if (volDebounce) clearTimeout(volDebounce);
  volDebounce = setTimeout(() => {
    sysWorkerSend(`v ${clamped}`);
  }, 10);
});

ipcMain.on('adjust-volume', (e, delta) => {
  const newVol = Math.max(0, Math.min(100, currentVolumeVal + delta));
  currentVolumeVal = newVol;
  lastSentVol = newVol;
  lastUserVolTime = Date.now();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('osd-level', { type: 'volume', value: newVol, isMuted: currentMuteVal });
  }
  sysWorkerSend(`v ${newVol}`);
});

// The renderer asks for peak levels only while music is playing and lights are on screen
ipcMain.on('audio-meter', (e, on) => {
  const want = !!on;
  if (want === audioMeterWanted) return;
  audioMeterWanted = want;
  sysWorkerSend(want ? 'meter on' : 'meter off');
});

ipcMain.on('toggle-mute', () => {
  lastUserVolTime = Date.now();
  sysWorkerSend('mute');
});

ipcMain.handle('get-volume', async () => {
  return { volume: currentVolumeVal, isMuted: currentMuteVal, isBtAudio: currentIsBtAudio };
});

ipcMain.handle('get-bt-audio-status', async () => {
  return currentIsBtAudio;
});

let brightDebounce = null;
ipcMain.on('set-brightness', (e, val) => {
  const clamped = Math.max(0, Math.min(100, Math.round(val)));
  currentBrightnessVal = clamped;
  lastSentBright = clamped;
  lastUserBrightTime = Date.now();
  if (brightDebounce) clearTimeout(brightDebounce);
  brightDebounce = setTimeout(() => {
    sysWorkerSend(`b ${clamped}`);
  }, 15);
});

ipcMain.on('adjust-brightness', (e, delta) => {
  const clamped = Math.max(0, Math.min(100, Math.round(currentBrightnessVal + delta)));
  currentBrightnessVal = clamped;
  lastSentBright = clamped;
  lastUserBrightTime = Date.now();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('osd-level', { type: 'brightness', value: clamped });
  }
  sysWorkerSend(`b ${clamped}`);
});

ipcMain.handle('get-brightness', async () => {
  return currentBrightnessVal;
});
ipcMain.on('open-file', (e, filePath) => {
  shell.openPath(filePath);
});

ipcMain.on('open-url', (e, link) => shell.openExternal(link));
ipcMain.on('open-weather', () => shell.openExternal('bingweather:'));
ipcMain.on('open-nightlight', () => shell.openExternal('ms-settings:nightlight'));
// Night light / Do not disturb are switched directly by the system worker
ipcMain.on('set-night-light', (e, on) => sysWorkerSend(on ? 'nightlight on' : 'nightlight off'));
ipcMain.on('set-dnd', (e, on) => sysWorkerSend(on ? 'dnd on' : 'dnd off'));
ipcMain.handle('get-system-toggles', () => systemToggles);
ipcMain.on('open-focus', () => shell.openExternal('ms-settings:quiethours'));
ipcMain.on('open-taskmgr', () => exec('taskmgr'));
ipcMain.on('open-snip', () => shell.openExternal('ms-screenclip:'));
ipcMain.on('open-calc', () => exec('calc'));
ipcMain.on('open-media-app', (e, appId, trackTitle, artist) => {
  logg(`[IPC] open-media-app received: appId='${appId}', trackTitle='${trackTitle}', artist='${artist}'`);
  try {
    const rawId = (appId || '').trim();
    const lower = rawId.toLowerCase();

    // 1. Instant Spotify protocol ONLY if appId explicitly contains spotify
    if (lower && lower.includes('spotify')) {
      shell.openExternal('spotify:').catch(() => {
        exec('start spotify:');
      });
      return;
    }

    // 2. Run open_media_tab.ps1 asynchronously via exec
    const scriptPath = getExecutableScriptPath('open_media_tab.ps1');
    const safeApp = (appId || '').replace(/"/g, '`"');
    const safeTitle = (trackTitle || '').replace(/"/g, '`"');
    const safeArt = (artist || '').replace(/"/g, '`"');
    
    let psCmd = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
    if (safeApp) psCmd += ` -AppId "${safeApp}"`;
    if (safeTitle) psCmd += ` -TrackTitle "${safeTitle}"`;
    if (safeArt) psCmd += ` -Artist "${safeArt}"`;

    logg('[IPC] Executing media focus command: ' + psCmd);
    exec(psCmd, (err, stdout, stderr) => {
      if (err) logg('[IPC] Media focus error: ' + err.message);
      if (stdout && stdout.trim()) logg('[IPC] Media focus stdout: ' + stdout.trim());
      if (stderr && stderr.trim()) logg('[IPC] Media focus stderr: ' + stderr.trim());
    });
  } catch (err) {
    logg('Error in open-media-app: ' + err.message);
  }
});
ipcMain.on('focus-call-window', (event, handle) => {
  if (!handle) return;
  const psFocus = `
    $sig = '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd); [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);'
    Add-Type -MemberDefinition $sig -Name WinAPIFocus -Namespace Win32 -ErrorAction SilentlyContinue
    [Win32.WinAPIFocus]::ShowWindow(${handle}, 9)
    [Win32.WinAPIFocus]::SetForegroundWindow(${handle})
  `;
  exec(`powershell -NoProfile -Command "${psFocus.trim()}"`);
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

function applyWindowMode(mode, position) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  currentWindowMode = (mode === 'bar' || mode === 'shelf') ? 'shelf' : 'notch';
  if (position) currentScreenPosition = position;
  const pos = currentScreenPosition;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds;

  if (currentWindowMode === 'shelf') {
    if (pos === 'left' || pos === 'right') {
      const sideWidth = 160;
      const x = pos === 'left' ? 0 : screenWidth - sideWidth;
      mainWindow.setBounds({ x, y: 0, width: sideWidth, height: screenHeight });
    } else {
      mainWindow.setBounds({ x: 0, y: 0, width: screenWidth, height: 64 });
    }
    stopCursorChecking();
    stopEdgeChecking();
    mainWindow.setIgnoreMouseEvents(false);
  } else {
    const windowWidth = 760;
    const windowHeight = 520;
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
      x = Math.floor((screenWidth - windowWidth) / 2); y = 0;
    }
    mainWindow.setBounds({ x, y, width: windowWidth, height: windowHeight });
    stopCursorChecking();
    stopEdgeChecking();
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  }
}

ipcMain.on('set-window-mode', (event, mode, position) => {
  applyWindowMode(mode, position);
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
let dragFollowTimer = null;
let dragLastDirection = null;
let dragLastDisplayId = null;
let dragOverlay = null;

function getSnapDirection(cursor, previous) {
  const display = screen.getDisplayNearestPoint(cursor) || screen.getPrimaryDisplay();
  const { width: sw, height: sh } = display.bounds;
  const dx0 = display.bounds.x;
  const dy0 = display.bounds.y;

  const curX = cursor.x - dx0;
  const curY = cursor.y - dy0;

  // Side zones cover the outer ~22% of the screen (min 220px). A 40px band of
  // hysteresis stops the target flickering when hovering on a boundary.
  const base = Math.max(220, Math.floor(sw * 0.22));
  const pad = 40;
  const leftEdge = previous === 'left' ? base + pad : base;
  const rightEdge = previous === 'right' ? sw - base - pad : sw - base;
  const topBand = previous === 'top' ? 120 : 80;

  let direction = 'top';
  if (curX < leftEdge && !(curY < topBand && curX > 140)) direction = 'left';
  else if (curX > rightEdge && !(curY < topBand && curX < sw - 140)) direction = 'right';
  return { direction, display, curX, curY, sw, sh, dx0, dy0 };
}

// ── Drop-zone overlay: a transparent click-through window under the notch ──
const DRAG_OVERLAY_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100%;background:transparent;overflow:hidden;font-family:"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif}
  .dim{position:fixed;inset:0;background:rgba(0,0,0,.14);opacity:0;transition:opacity .2s}
  body.on .dim{opacity:1}
  .z{position:fixed;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22);
     transition:background .18s,box-shadow .18s,transform .22s cubic-bezier(.2,.8,.2,1),opacity .18s;opacity:.75;
     backdrop-filter:blur(6px)}
  .z.active{background:rgba(255,255,255,.2);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.85),0 10px 40px rgba(0,0,0,.35);opacity:1}
  .z span{position:absolute;font-size:12px;font-weight:600;color:#fff;opacity:0;transition:opacity .18s;white-space:nowrap;
          text-shadow:0 1px 6px rgba(0,0,0,.6)}
  .z.active span{opacity:.95}
  /* notch ghosts */
  .notch #top{left:50%;top:0;width:360px;height:44px;margin-left:-180px;border-radius:0 0 22px 22px}
  .notch #top span{left:50%;top:56px;transform:translateX(-50%)}
  .notch #left{left:0;top:50%;width:46px;height:220px;margin-top:-110px;border-radius:0 23px 23px 0}
  .notch #left span{left:58px;top:50%;transform:translateY(-50%)}
  .notch #right{right:0;top:50%;width:46px;height:220px;margin-top:-110px;border-radius:23px 0 0 23px}
  .notch #right span{right:58px;top:50%;transform:translateY(-50%)}
  .notch .z.active#top{transform:scale(1.04)}
  .notch .z.active#left,.notch .z.active#right{transform:scale(1.05)}
  /* bar ghosts */
  .bar #top{left:0;right:0;top:0;height:56px;border-radius:0 0 18px 18px}
  .bar #top span{left:50%;top:68px;transform:translateX(-50%)}
  .bar #left{left:0;top:0;bottom:0;width:160px;border-radius:0 22px 22px 0}
  .bar #left span{left:172px;top:50%;transform:translateY(-50%)}
  .bar #right{right:0;top:0;bottom:0;width:160px;border-radius:22px 0 0 22px}
  .bar #right span{right:172px;top:50%;transform:translateY(-50%)}
</style></head><body class="notch">
  <div class="dim"></div>
  <div class="z" id="top"><span>Top</span></div>
  <div class="z" id="left"><span>Left edge</span></div>
  <div class="z" id="right"><span>Right edge</span></div>
  <script>
    window.setZone = function (zone, mode) {
      document.body.className = (mode === 'shelf' ? 'bar' : 'notch') + ' on';
      ['top','left','right'].forEach(function (id) {
        document.getElementById(id).classList.toggle('active', id === zone);
      });
    };
    window.clearZones = function () { document.body.classList.remove('on'); };
  </script>
</body></html>`;

function ensureDragOverlay() {
  if (dragOverlay && !dragOverlay.isDestroyed()) return dragOverlay;
  dragOverlay = new BrowserWindow({
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  dragOverlay.setIgnoreMouseEvents(true);
  dragOverlay.setAlwaysOnTop(true, 'pop-up-menu');
  dragOverlay.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(DRAG_OVERLAY_HTML));
  dragOverlay.on('closed', () => { dragOverlay = null; });
  return dragOverlay;
}

function updateDragOverlay(display, direction) {
  try {
    const overlay = ensureDragOverlay();
    if (dragLastDisplayId !== display.id) {
      dragLastDisplayId = display.id;
      overlay.setBounds(display.bounds);
    }
    if (!overlay.isVisible()) overlay.showInactive();
    const run = () => overlay.webContents.executeJavaScript(`window.setZone && setZone(${JSON.stringify(direction)}, ${JSON.stringify(currentWindowMode)})`).catch(() => {});
    if (overlay.webContents.isLoading()) overlay.webContents.once('did-finish-load', run);
    else run();
    // Keep the dragged notch above the overlay
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.moveTop();
  } catch (e) {
    logg('drag overlay error: ' + e.message);
  }
}

function hideDragOverlay() {
  dragLastDisplayId = null;
  if (!dragOverlay || dragOverlay.isDestroyed()) return;
  dragOverlay.webContents.executeJavaScript('window.clearZones && clearZones()').catch(() => {});
  // Let the fade-out play before hiding
  setTimeout(() => { if (dragOverlay && !dragOverlay.isDestroyed() && !isWindowBeingDragged) dragOverlay.hide(); }, 180);
}

function stopDragFollow() {
  if (dragFollowTimer) {
    clearInterval(dragFollowTimer);
    dragFollowTimer = null;
  }
}

ipcMain.on('custom-drag-start', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  isWindowBeingDragged = true;
  mainWindow.setIgnoreMouseEvents(false);
  if (boundsAnimationInterval) {
    clearInterval(boundsAnimationInterval);
    boundsAnimationInterval = null;
    isWindowAnimating = false;
  }

  const cursor = screen.getCursorScreenPoint();
  const w = 150;
  const h = 64;
  const x = cursor.x - Math.floor(w / 2);
  const y = cursor.y - Math.floor(h / 2);
  mainWindow.setBounds({ x, y, width: w, height: h });

  dragStartMousePos = { x: cursor.x, y: cursor.y };
  dragStartWindowPos = { x, y, width: w, height: h };
  dragLastDirection = null;

  // Follow the cursor from the main process (~120 fps). This keeps up with fast
  // flicks even when the pointer leaves the small drag window, which renderer
  // pointermove events alone could not.
  stopDragFollow();
  let lastX = null, lastY = null;
  dragFollowTimer = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed() || !isWindowBeingDragged || !dragStartMousePos) {
      stopDragFollow();
      return;
    }
    const c = screen.getCursorScreenPoint();
    if (c.x !== lastX || c.y !== lastY) {
      lastX = c.x; lastY = c.y;
      // Follow the cursor, but keep the drag card fully on the current display
      const db = (screen.getDisplayNearestPoint(c) || screen.getPrimaryDisplay()).bounds;
      const w = dragStartWindowPos.width, h = dragStartWindowPos.height;
      const nx = dragStartWindowPos.x + (c.x - dragStartMousePos.x);
      const ny = dragStartWindowPos.y + (c.y - dragStartMousePos.y);
      mainWindow.setBounds({
        x: Math.round(Math.max(db.x, Math.min(db.x + db.width - w, nx))),
        y: Math.round(Math.max(db.y, Math.min(db.y + db.height - h, ny))),
        width: w,
        height: h
      });
    }
    const snap = getSnapDirection(c, dragLastDirection);
    if (snap.direction !== dragLastDirection || snap.display.id !== dragLastDisplayId) {
      dragLastDirection = snap.direction;
      mainWindow.webContents.send('drag-snap-preview', snap.direction);
      updateDragOverlay(snap.display, snap.direction);
    }
  }, 8);
});

// Kept for compatibility with older renderers; movement is driven by the main process.
ipcMain.on('custom-drag-move', () => {});

ipcMain.on('custom-drag-end', () => {
  if (!mainWindow || mainWindow.isDestroyed() || !isWindowBeingDragged) return;
  isWindowBeingDragged = false;
  stopDragFollow();
  hideDragOverlay();

  const startPos = dragStartWindowPos;
  dragStartMousePos = null;
  dragStartWindowPos = null;

  if (boundsAnimationInterval) {
    clearInterval(boundsAnimationInterval);
    boundsAnimationInterval = null;
  }
  isWindowAnimating = false;

  const cursor = screen.getCursorScreenPoint();
  const { direction: newPos, curX, curY, sw, sh, dx0, dy0 } = getSnapDirection(cursor, dragLastDirection);
  dragLastDirection = null;

  logg(`SNAP: cursor=(${curX}, ${curY}) screen=(${sw}x${sh}) decided newPos=${newPos}`);

  let ww = 600;
  let wh = 450;
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
    finalX = dx0 + Math.floor((sw - ww) / 2);
    finalY = dy0;
  }

  const bounds = mainWindow.getBounds();
  const hasMoved = startPos && (Math.abs(bounds.x - startPos.x) > 5 || Math.abs(bounds.y - startPos.y) > 5);

  if (!hasMoved) {
    mainWindow.setBounds({ x: Math.round(finalX), y: Math.round(finalY), width: ww, height: wh });
    mainWindow.webContents.send('drag-snap-end', currentScreenPosition);
    return;
  }

  // Resize around the current centre, then glide into place
  const startX = Math.round(bounds.x - (ww - bounds.width) / 2);
  const startY = Math.round(bounds.y - (wh - bounds.height) / 2);
  mainWindow.setBounds({ x: startX, y: startY, width: ww, height: wh });

  currentScreenPosition = newPos;
  animateWindowBounds({ x: Math.round(finalX), y: Math.round(finalY), width: ww, height: wh }, 320);
  mainWindow.webContents.send('window-dragged-to', newPos);
  mainWindow.webContents.send('drag-snap-end', newPos);
});

let checkCursorInterval = null;
let checkCursorTimeout = null;

let checkEdgeInterval = null;
function startEdgeChecking() {
  if (checkEdgeInterval) clearInterval(checkEdgeInterval);
  checkEdgeInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed() || currentWindowMode !== 'shelf') {
      clearInterval(checkEdgeInterval);
      checkEdgeInterval = null;
      return;
    }
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds;
    const point = screen.getCursorScreenPoint();
    const pos = currentScreenPosition;
    const atEdge = (pos === 'left') ? (point.x <= 12) : ((pos === 'right') ? (point.x >= screenWidth - 12) : (point.y <= 12));
    if (atEdge) {
      clearInterval(checkEdgeInterval);
      checkEdgeInterval = null;
      const targetWidth = (pos === 'left' || pos === 'right') ? 160 : screenWidth;
      const targetHeight = (pos === 'left' || pos === 'right') ? screenHeight : 64;
      const x = pos === 'right' ? screenWidth - 160 : 0;
      mainWindow.setBounds({ x, y: 0, width: targetWidth, height: targetHeight });
      mainWindow.setIgnoreMouseEvents(false);
      mainWindow.webContents.send('expand-shelf');
      startCursorChecking();
    }
  }, 50);
}

function stopEdgeChecking() {
  if (checkEdgeInterval) {
    clearInterval(checkEdgeInterval);
    checkEdgeInterval = null;
  }
}

let outsideCounter = 0;
function startCursorChecking() {
  if (checkCursorInterval) clearInterval(checkCursorInterval);
  if (checkCursorTimeout) clearTimeout(checkCursorTimeout);
  outsideCounter = 0;

  // Wait 300ms before checking to allow cursor to travel onto the expanded bar
  checkCursorTimeout = setTimeout(() => {
    checkCursorInterval = setInterval(() => {
      if (!mainWindow || mainWindow.isDestroyed() || currentWindowMode !== 'shelf') {
        clearInterval(checkCursorInterval);
        checkCursorInterval = null;
        return;
      }
      const bounds = mainWindow.getBounds();
      const point = screen.getCursorScreenPoint();

      const buffer = 15;
      const isInside = (
        point.x >= bounds.x - buffer &&
        point.x <= bounds.x + bounds.width + buffer &&
        point.y >= bounds.y - buffer &&
        point.y <= bounds.y + bounds.height + buffer
      );

      if (!isInside) {
        outsideCounter++;
        // 2 consecutive checks outside (~160ms) before signaling collapse
        if (outsideCounter >= 2) {
          mainWindow.webContents.send('force-collapse-shelf');
          clearInterval(checkCursorInterval);
          checkCursorInterval = null;
        }
      } else {
        outsideCounter = 0;
      }
    }, 80);
  }, 300);
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
  outsideCounter = 0;
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
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
    stopCursorChecking();
    startEdgeChecking();
  } else {
    mainWindow.setIgnoreMouseEvents(false);
    stopEdgeChecking();
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

ipcMain.handle('resolve-pinterest-url', async (event, url) => {
  try {
    const cleanUrl = url.trim();
    
    // Giphy direct ID resolution (standard web view link)
    if (cleanUrl.includes('giphy.com/gifs/') || cleanUrl.includes('giphy.com/clips/') || cleanUrl.includes('giphy.com/embed/')) {
      const giphyMatch = cleanUrl.match(/giphy\.com\/(?:gifs|clips|embed)\/(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9]+)/i);
      if (giphyMatch && giphyMatch[1]) {
        return `https://media.giphy.com/media/${giphyMatch[1]}/giphy.gif`;
      }
    }
    
    const response = await fetch(cleanUrl, { 
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    const finalUrl = response.url;
    const html = await response.text();
    
    // If it's a Giphy link after following redirects
    if (finalUrl.includes('giphy.com')) {
      const giphyMatch = finalUrl.match(/giphy\.com\/(?:gifs|clips|embed)\/(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9]+)/i);
      if (giphyMatch && giphyMatch[1]) {
        return `https://media.giphy.com/media/${giphyMatch[1]}/giphy.gif`;
      }
    }
    
    // 1. Try JSON/Script video search first (extracting direct .mp4 if available)
    const mp4Matches = html.match(/"(https:\/\/v1\.pinimg\.com\/videos\/mc\/[^"]+\.mp4)"/i) || 
                       html.match(/"(https:\/\/v1\.pinimg\.com\/[^"]+\.mp4)"/i);
    if (mp4Matches && mp4Matches[1]) {
      return mp4Matches[1].replace(/\\u002F/g, '/');
    }
    
    // 2. Try preloaded image tags for GIF
    const gifMatch = html.match(/<link[^>]+as="image"[^>]+href="([^"]+\.gif)"/i);
    if (gifMatch && gifMatch[1]) {
      return gifMatch[1];
    }
    
    // 3. Try og:image / twitter:image meta tags (order-independent)
    const metaTags = html.match(/<meta[^>]+>/gi) || [];
    for (const tag of metaTags) {
      if (tag.includes('property="og:image"') || tag.includes('name="og:image"') || tag.includes('name="twitter:image:src"')) {
        const contentMatch = tag.match(/content="([^"]+)"/i);
        if (contentMatch && contentMatch[1]) {
          let imageUrl = contentMatch[1];
          if (html.toLowerCase().includes('.gif')) {
            imageUrl = imageUrl.replace('/736x/', '/originals/').replace(/\.(jpg|jpeg|png|webp)$/i, '.gif');
          } else {
            imageUrl = imageUrl.replace(/\/(736x|474x|236x)\//, '/originals/');
          }
          return imageUrl;
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
});

ipcMain.on('kill-task', (e, id) => {
  exec(`taskkill /F /PID ${id}`);
});

// "Optimize memory": the system worker trims background apps' working sets
// (nothing is closed) and reports progress as BOOST_STEP / BOOST_DONE lines.
let boostWaiter = null;
ipcMain.handle('boost-system', async (event) => {
  if (boostWaiter) return boostWaiter.promise;
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  const timer = setTimeout(() => finishBoost({ success: false, freedMB: 0, apps: 0 }), 20000);
  boostWaiter = { promise, resolve, timer, sender: event.sender };
  sysWorkerSend('boost');
  return promise;
});

function finishBoost(result) {
  if (!boostWaiter) return;
  clearTimeout(boostWaiter.timer);
  const { resolve } = boostWaiter;
  boostWaiter = null;
  logg(`Optimize memory: freed ${result.freedMB} MB across ${result.apps} apps`);
  resolve({ freedCPU: 0, killed: 'none', ...result });
}

let settingsWindow = null;

let pendingSettingsTab = null;
function openSettingsWindow(tab) {
  pendingSettingsTab = tab || null;
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (tab) settingsWindow.webContents.send('settings-open-tab', tab);
    settingsWindow.setAlwaysOnTop(true, 'screen-saver');
    settingsWindow.show();
    settingsWindow.focus();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
      mainWindow.webContents.send('settings-window-opened');
    }
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workArea;
  const winWidth = Math.min(880, Math.floor(width * 0.9));
  const winHeight = Math.min(620, Math.floor(height * 0.9));

  settingsWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    center: true,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: true,
    minWidth: 740,
    minHeight: 500,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    }
  });

  settingsWindow.setAlwaysOnTop(true, 'screen-saver');

  const distIndex = path.join(__dirname, 'build_dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    settingsWindow.loadFile(distIndex, { hash: pendingSettingsTab ? `settings/${pendingSettingsTab}` : 'settings' });
  } else {
    settingsWindow.loadURL(`http://127.0.0.1:5173/#settings${pendingSettingsTab ? '/' + pendingSettingsTab : ''}`);
  }

  settingsWindow.once('ready-to-show', () => {
    settingsWindow.setAlwaysOnTop(true, 'screen-saver');
    settingsWindow.show();
    settingsWindow.focus();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
      mainWindow.webContents.send('settings-window-opened');
    }
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('settings-window-closed');
    }
  });
}

ipcMain.on('open-settings-window', (e, tab) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings-window-opened');
  }
  openSettingsWindow(typeof tab === 'string' ? tab : null);
});

ipcMain.on('close-settings-window', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
});

// ── Updates ──────────────────────────────────────────────────────────────────
const { createUpdater } = require('./updater');
const updater = createUpdater({
  log: logg,
  broadcast: (channel, payload) => {
    [mainWindow, settingsWindow].forEach((w) => {
      if (w && !w.isDestroyed()) w.webContents.send(channel, payload);
    });
  }
});
ipcMain.handle('get-app-info', () => updater.getState());
ipcMain.handle('check-for-updates', () => updater.check());
ipcMain.on('open-update', () => updater.openUpdate());

ipcMain.on('dismiss-whats-new', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('whats-new-dismissed');
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('whats-new-dismissed');
  }
});

ipcMain.on('sync-config', (event, newConfig) => {
  if (newConfig && newConfig.mode) {
    applyWindowMode(newConfig.mode, newConfig.screenPosition);
  }
  if (mainWindow && !mainWindow.isDestroyed() && event.sender !== mainWindow.webContents) {
    mainWindow.webContents.send('config-updated', newConfig);
  }
  if (settingsWindow && !settingsWindow.isDestroyed() && event.sender !== settingsWindow.webContents) {
    settingsWindow.webContents.send('config-updated', newConfig);
  }
});

let hideBehindMaximized = false;
ipcMain.on('set-hide-behind-maximized', (event, val) => {
  hideBehindMaximized = !!val;
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (hideBehindMaximized) {
      mainWindow.setAlwaysOnTop(false);
    } else {
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
    }
  }
});

ipcMain.handle('get-monitors', () => {
  try {
    const displays = screen.getAllDisplays();
    const primaryId = screen.getPrimaryDisplay().id;
    return displays.map((d, index) => ({
      id: d.id,
      label: d.id === primaryId ? `Primary Display (${d.bounds.width}x${d.bounds.height})` : `Display ${index + 1} (${d.bounds.width}x${d.bounds.height})`,
      isPrimary: d.id === primaryId,
      width: d.bounds.width,
      height: d.bounds.height
    }));
  } catch(e) {
    return [{ id: 0, label: 'Primary Display', isPrimary: true }];
  }
});

ipcMain.handle('get-autostart-status', () => {
  try {
    return app.getLoginItemSettings().openAtLogin;
  } catch (_) {
    return true;
  }
});

ipcMain.on('set-autostart', (event, enable) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: !!enable,
      path: process.execPath,
      args: []
    });
    const startupDir = path.join(process.env.APPDATA || app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const shortcutPath = path.join(startupDir, 'Smart Notch.lnk');
    if (!enable) {
      if (fs.existsSync(shortcutPath)) {
        try { fs.unlinkSync(shortcutPath); } catch (_) {}
      }
    } else {
      ensureAutoStart();
    }
  } catch (e) {
    logg('set-autostart error: ' + e.message);
  }
});

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  logg('PRIMARY DISPLAY: ' + JSON.stringify(primaryDisplay));
  const { width } = primaryDisplay.bounds;
  const windowWidth = 760; 
  const windowHeight = 520; 
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
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // ── Stay-on-top guard ────────────────────────────────────────────────────
  // Some apps (full-screen games, UAC dialogs, etc.) can push Electron windows
  // below them. This listener detects when we lose the top position and
  // immediately re-asserts it.
  mainWindow.on('always-on-top-changed', (_event, isAlwaysOnTop) => {
    if (hideBehindMaximized) return;
    if (!isAlwaysOnTop && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
    }
  });

  // Belt-and-suspenders: periodically re-assert always-on-top so that even
  // apps that don't trigger the event (e.g. some D3D11 overlays) are handled.
  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!hideBehindMaximized) {
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
      }
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
    if (isWindowBeingDragged) return;
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.setIgnoreMouseEvents(ignore, options);
  });
  
  mainWindow.on('close', (e) => {
    logg('mainWindow close event triggered');
  });
  mainWindow.on('closed', () => {
    logg('mainWindow closed event triggered');
  });
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    logg('Failed to load UI: ' + desc + ' (' + code + ')');
  });
  mainWindow.webContents.on('render-process-gone', (e, details) => {
    logg('Renderer process gone: ' + JSON.stringify(details));
    if (appQuitting || details.reason === 'clean-exit') return;
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        logg('Reloading notch after renderer exit');
        mainWindow.webContents.reload();
      }
    }, 1000);
  });
  let unresponsiveTimer = null;
  mainWindow.on('unresponsive', () => {
    logg('Notch window unresponsive');
    if (unresponsiveTimer) return;
    unresponsiveTimer = setTimeout(() => {
      unresponsiveTimer = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        logg('Notch still unresponsive, restarting its renderer');
        try { mainWindow.webContents.forcefullyCrashRenderer(); } catch (_) {}
        mainWindow.webContents.reload();
      }
    }, 8000);
  });
  mainWindow.on('responsive', () => {
    if (unresponsiveTimer) { clearTimeout(unresponsiveTimer); unresponsiveTimer = null; }
  });
  mainWindow.webContents.on('crashed', (e) => {
    logg('Renderer Crashed!');
  });
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    logg(`RENDERER CONSOLE: [level ${level}] ${message} (at ${sourceId}:${line})`);
  });
  mainWindow.webContents.on('did-finish-load', () => {
    logg('webContents did-finish-load fired');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('init-levels', {
        volume: currentVolumeVal,
        isMuted: currentMuteVal,
        brightness: currentBrightnessVal,
        isBtAudio: currentIsBtAudio
      });
      if (currentBtDevice) {
        mainWindow.webContents.send('bt-device-event', {
          type: 'battery',
          name: currentBtDevice.name,
          battery: currentBtDevice.battery
        });
      }
    }
    setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.show();
      logg('WINDOW BOUNDS: ' + JSON.stringify(mainWindow.getBounds()) + ' isVisible=' + mainWindow.isVisible() + ' isAlwaysOnTop=' + mainWindow.isAlwaysOnTop());
    }, 1500);
  });
  
  const distIndex = path.join(__dirname, 'build_dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    mainWindow.loadFile(distIndex);
  } else {
    mainWindow.loadURL('http://127.0.0.1:5173');
  }
}

// (Single-instance lock is now at the top of the file)

function ensureAutoStart() {
  try {
    // 1. Electron official login item settings (Windows Registry Run key)
    if (app.isPackaged) {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: process.execPath,
        args: []
      });
    }

    // 2. Windows Startup Folder Shortcut (Universal fallback executed on every logon)
    const startupDir = path.join(process.env.APPDATA || app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    if (fs.existsSync(startupDir) && app.isPackaged) {
      const shortcutPath = path.join(startupDir, 'Smart Notch.lnk');
      const vbsCreateShortcut = [
        'Set ws = CreateObject("WScript.Shell")',
        `Set sc = ws.CreateShortcut("${shortcutPath.replace(/\\/g, '\\\\')}")`,
        `sc.TargetPath = "${process.execPath.replace(/\\/g, '\\\\')}"`,
        `sc.WorkingDirectory = "${path.dirname(process.execPath).replace(/\\/g, '\\\\')}"`,
        'sc.Description = "Smart Notch Auto Start"',
        'sc.Save'
      ].join('\r\n');
      const tempVbs = path.join(app.getPath('userData'), 'create_startup_shortcut.vbs');
      fs.writeFileSync(tempVbs, vbsCreateShortcut);
      exec(`cscript //nologo "${tempVbs}"`, () => {
        try { fs.unlinkSync(tempVbs); } catch (_) {}
      });
    }

    // 3. For Microsoft Store / AppX packages: Ensure AppModel StartupTask is enabled in registry
    const pkgFamily = 'Devavinash.DynamicIslandWindows_mv0cm4vwdc0m6';
    const appModelReg = `HKCU:\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\CurrentVersion\\AppModel\\SystemAppData\\${pkgFamily}\\SmartNotchStartup`;
    const psCmd = `if (Test-Path '${appModelReg}') { Set-ItemProperty -Path '${appModelReg}' -Name 'State' -Value 0 -ErrorAction SilentlyContinue; Set-ItemProperty -Path '${appModelReg}' -Name 'UserEnabledStartupOnce' -Value 1 -ErrorAction SilentlyContinue }`;
    exec(`powershell.exe -NoProfile -Command "${psCmd}"`, (err) => {
      if (err) logg('StartupTask registry check error: ' + err.message);
    });
  } catch (err) {
    logg('ensureAutoStart error: ' + err.message);
  }
}

app.whenReady().then(() => {
  vbsPath = path.join(app.getPath('userData'), 'sendkeys.vbs');
  try {
    fs.writeFileSync(vbsPath, 'Set w = CreateObject("WScript.Shell")\nw.SendKeys Chr(WScript.Arguments(0))');
  } catch(e) {
    logg('Failed to write VBScript: ' + e.message);
  }

  seekPs1Path = path.join(app.getPath('userData'), 'seek.ps1');
  try {
    const seekScript = `
      [void][System.Reflection.Assembly]::LoadWithPartialName("System.Runtime.WindowsRuntime")
      [void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control.Playlists, ContentType=WindowsRuntime]

      $asyncOp = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()

      $asTaskMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters()[0].ParameterType.Name -like '*IAsyncOperation*' } | Select-Object -First 1
      $genericAsTask = $asTaskMethod.MakeGenericMethod([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
      $task = $genericAsTask.Invoke($null, @($asyncOp))
      $task.Wait()
      $manager = $task.Result

      if ($manager) {
          $session = $manager.GetCurrentSession()
          if ($session) {
              $ticks = [int64]$args[0]
              $seekOp = $session.TryChangePlaybackPositionAsync($ticks)
              $seekAsTask = $asTaskMethod.MakeGenericMethod([bool])
              $seekTask = $seekAsTask.Invoke($null, @($seekOp))
              $seekTask.Wait()
          }
      }
    `.trim();
    fs.writeFileSync(seekPs1Path, seekScript);
  } catch(e) {
    logg('Failed to write seek.ps1: ' + e.message);
  }

  ensureAutoStart();
  createWindow();
  authenticateSpotify();
  // startClipboardPolling();
  startHardwarePolling();
  startCombinedBackgroundMonitor();
  startSystemControlWorker();
  updater.start();

  // COM audio endpoints, WMI and WinRT handles often go stale across sleep/hibernate
  powerMonitor.on('resume', () => {
    logg('System resumed, restarting background workers');
    setTimeout(() => {
      if (appQuitting) return;
      restartSystemControlWorker();
      if (smtcWorker) { try { smtcWorker.kill(); } catch (_) {} }   // respawns via its exit handler
      if (combinedPs) { try { combinedPs.kill(); } catch (_) {} }   // restarts via its close handler
    }, 2000);
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  if (smtcWorker) {
    try { smtcWorker.kill(); } catch(e){}
  }
  if (combinedPs) {
    try { combinedPs.kill(); } catch(e){}
  }
  sysWorkerQuitting = true;
  appQuitting = true;
  if (dragOverlay && !dragOverlay.isDestroyed()) { try { dragOverlay.destroy(); } catch (e) {} }
  if (sysWorkerWatchdog) clearInterval(sysWorkerWatchdog);
  if (sysWorker) {
    try { sysWorker.kill(); } catch(e){}
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
