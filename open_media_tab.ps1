param(
    [string]$AppId = "",
    [string]$TrackTitle = "",
    [string]$Artist = ""
)

$ErrorActionPreference = 'SilentlyContinue'

$logFile = Join-Path $PSScriptRoot "open_media_debug.log"
function Log($msg) {
    try {
        $time = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss.fff")
        Add-Content -Path $logFile -Value "[$time] $msg" -ErrorAction SilentlyContinue
    } catch {}
}

Log "=================================================="
Log "open_media_tab invoked: AppId='$AppId', Title='$TrackTitle', Artist='$Artist'"

$ws = New-Object -ComObject WScript.Shell

# 1. Native Windows Win32 API Helper with Desktop Enumeration & Foreground Switching
Add-Type @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class WinFocus {
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)] public static extern IntPtr OpenWindowStation(string a, bool b, uint c);
    [DllImport("user32.dll", SetLastError = true)] public static extern bool SetProcessWindowStation(IntPtr h);
    [DllImport("user32.dll", SetLastError = true)] public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);
    [DllImport("user32.dll", SetLastError = true)] public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Auto)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
    [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);

    public class WindowEntry {
        public IntPtr Handle;
        public uint Pid;
        public string Title;
        public string ProcessName;
    }

    public static List<WindowEntry> GetVisibleWindows() {
        var list = new List<WindowEntry>();
        try {
            IntPtr hWinsta = OpenWindowStation("winsta0", false, 0x00000002);
            if (hWinsta != IntPtr.Zero) SetProcessWindowStation(hWinsta);
            IntPtr hDesk = OpenDesktop("default", 0, false, 0x0001 | 0x0040);
            if (hDesk != IntPtr.Zero) {
                EnumDesktopWindows(hDesk, (hWnd, lParam) => {
                    if (IsWindowVisible(hWnd)) {
                        int len = GetWindowTextLength(hWnd);
                        if (len > 0) {
                            var sb = new StringBuilder(len + 1);
                            GetWindowText(hWnd, sb, sb.Capacity);
                            uint pid = 0;
                            GetWindowThreadProcessId(hWnd, out pid);
                            string procName = "";
                            try {
                                var p = System.Diagnostics.Process.GetProcessById((int)pid);
                                procName = p.ProcessName;
                            } catch {}
                            list.Add(new WindowEntry {
                                Handle = hWnd,
                                Pid = pid,
                                Title = sb.ToString(),
                                ProcessName = procName
                            });
                        }
                    }
                    return true;
                }, IntPtr.Zero);
            }
        } catch {}
        return list;
    }

    public static bool ActivateWindow(IntPtr hWnd) {
        if (hWnd == IntPtr.Zero) return false;
        try {
            if (IsIconic(hWnd)) {
                ShowWindow(hWnd, 9); // SW_RESTORE
            } else {
                ShowWindow(hWnd, 5); // SW_SHOW
            }

            // Simulate Alt press to unlock foreground switching
            keybd_event(0x12, 0, 0, UIntPtr.Zero);
            keybd_event(0x12, 0, 2, UIntPtr.Zero);

            IntPtr hFore = GetForegroundWindow();
            uint dummy;
            uint foreThread = GetWindowThreadProcessId(hFore, out dummy);
            uint appThread = GetWindowThreadProcessId(hWnd, out dummy);
            if (foreThread != appThread && foreThread != 0 && appThread != 0) {
                AttachThreadInput(foreThread, appThread, true);
                BringWindowToTop(hWnd);
                SetForegroundWindow(hWnd);
                SwitchToThisWindow(hWnd, true);
                AttachThreadInput(foreThread, appThread, false);
            } else {
                BringWindowToTop(hWnd);
                SetForegroundWindow(hWnd);
                SwitchToThisWindow(hWnd, true);
            }
            return true;
        } catch {
            return false;
        }
    }
}
"@ -ErrorAction SilentlyContinue

$lower = ($AppId + "").ToLower()

# 2. Spotify protocol
if ($lower -like "*spotify*") {
    Log "Target is Spotify"
    Start-Process "spotify:" -ErrorAction SilentlyContinue
    $windows = [WinFocus]::GetVisibleWindows()
    foreach ($w in $windows) {
        if ($w.ProcessName -like "*spotify*" -or $w.Title -like "*Spotify*") {
            [WinFocus]::ActivateWindow($w.Handle)
            break
        }
    }
    exit 0
}

# 3. Clean keywords from TrackTitle
$cleanTitle = ($TrackTitle -replace '[^\w\s]', ' ').Trim()
$titleWords = $cleanTitle -split '\s+' | Where-Object { $_.Length -ge 3 }
$firstWord = if ($titleWords.Count -gt 0) { $titleWords[0] } else { "" }
$twoWords = if ($titleWords.Count -gt 1) { $titleWords[0] + " " + $titleWords[1] } else { $firstWord }

Log "Cleaned title words: first='$firstWord', two='$twoWords'"

# Retrieve all visible desktop windows
$windows = [WinFocus]::GetVisibleWindows()
Log "Total visible desktop windows found: $($windows.Count)"

$targetWindow = $null
$isBrowser = $false
$browserName = ""

# 4. Check if AppId is a UWP package (e.g. Windows Media Player, Groove Music)
if ($AppId -like "*!*" -or $lower -like "*zune*" -or $lower -like "*media.player*") {
    Log "AppId indicates UWP media package: $AppId"
    foreach ($w in $windows) {
        if ($w.Title -like "*Media Player*" -or $w.Title -like "*Groove*" -or $w.Title -like "*Zune*" -or ($firstWord -and $w.Title -like "*$firstWord*")) {
            $targetWindow = $w
            break
        }
    }
    if (-not $targetWindow) {
        foreach ($w in $windows) {
            if ($w.ProcessName -match "ApplicationFrameHost|Microsoft\.Media\.Player") {
                $targetWindow = $w
                break
            }
        }
    }
    if ($targetWindow) {
        Log "Found UWP Media window: HWND=$($targetWindow.Handle) Title='$($targetWindow.Title)'"
        [WinFocus]::ActivateWindow($targetWindow.Handle)
        $ws.AppActivate($targetWindow.Pid) | Out-Null
    }
    Start-Process "shell:AppsFolder\$AppId" -ErrorAction SilentlyContinue
    exit 0
}

# 5. Direct window title matching: Check if ANY non-system window title matches the TrackTitle
if ($firstWord) {
    foreach ($w in $windows) {
        if ($w.ProcessName -notmatch "electron|antigravity|explorer|TextInputHost|SystemSettings") {
            if ($twoWords -and $w.Title -like "*$twoWords*") {
                $targetWindow = $w
                Log "Exact two-word title match: HWND=$($w.Handle) Proc=$($w.ProcessName) Title='$($w.Title)'"
                break
            }
            if ($w.Title -like "*$firstWord*") {
                $targetWindow = $w
                Log "First-word title match: HWND=$($w.Handle) Proc=$($w.ProcessName) Title='$($w.Title)'"
                break
            }
        }
    }
}

# 6. Browser matching (Brave, Chrome, Edge, Firefox, Opera, Vivaldi, Arc)
if (-not $targetWindow) {
    if ($lower -like "*brave*") { $browserName = "brave" }
    elseif ($lower -like "*chrome*") { $browserName = "chrome" }
    elseif ($lower -like "*edge*" -or $lower -like "*msedge*") { $browserName = "msedge" }
    elseif ($lower -like "*firefox*") { $browserName = "firefox" }
    elseif ($lower -like "*opera*") { $browserName = "opera" }
    elseif ($lower -like "*vivaldi*") { $browserName = "vivaldi" }
    elseif ($lower -like "*arc*") { $browserName = "Arc" }

    # If AppId was not explicit, check running browsers
    if (-not $browserName) {
        foreach ($b in @("brave", "chrome", "msedge", "firefox", "opera")) {
            $hasWin = $windows | Where-Object { $_.ProcessName -like "*$b*" }
            if ($hasWin) { $browserName = $b; break }
        }
    }

    if ($browserName) {
        $isBrowser = $true
        Log "Target browser detected: $browserName"
        # Prioritize window with YouTube or media words in title
        foreach ($w in $windows) {
            if ($w.ProcessName -like "*$browserName*") {
                if ($w.Title -like "*YouTube*" -or ($firstWord -and $w.Title -like "*$firstWord*")) {
                    $targetWindow = $w
                    Log "Browser window matched by media keyword: HWND=$($w.Handle) Title='$($w.Title)'"
                    break
                }
                if (-not $targetWindow) { $targetWindow = $w }
            }
        }
    }
}

# 7. Generic desktop player fallback (VLC, iTunes, foobar2000, etc.)
if (-not $targetWindow -and $AppId) {
    $genericProc = ($AppId -replace '\.exe$', '').Split('.')[0]
    if ($genericProc) {
        foreach ($w in $windows) {
            if ($w.ProcessName -like "*$genericProc*" -and $w.ProcessName -ne "electron") {
                $targetWindow = $w
                Log "Matched generic desktop player: HWND=$($w.Handle) Proc=$($w.ProcessName) Title='$($w.Title)'"
                break
            }
        }
    }
}

# 8. Activate the matched window
if ($targetWindow) {
    Log "Activating window HWND=$($targetWindow.Handle) (PID=$($targetWindow.Pid), Proc=$($targetWindow.ProcessName), Title='$($targetWindow.Title)')"
    [WinFocus]::ActivateWindow($targetWindow.Handle)
    $ws.AppActivate($targetWindow.Pid) | Out-Null

    # If it's a Chromium browser and the current tab isn't already the media tab, jump to it with Ctrl+Shift+A
    if ($isBrowser -or $targetWindow.ProcessName -match "brave|chrome|msedge|opera|vivaldi") {
        $titleAlreadyMatches = ($firstWord -and $targetWindow.Title -like "*$firstWord*") -or $targetWindow.Title -like "*YouTube*"
        if (-not $titleAlreadyMatches) {
            $searchQuery = if ($twoWords) { $twoWords } elseif ($firstWord) { $firstWord } else { "YouTube" }
            Log "Active tab does not match media title. Using Chromium tab search (Ctrl+Shift+A) for '$searchQuery'"
            Start-Sleep -Milliseconds 200
            $ws.SendKeys("^+a")
            Start-Sleep -Milliseconds 300
            $ws.SendKeys($searchQuery)
            Start-Sleep -Milliseconds 250
            $ws.SendKeys("{ENTER}")
            Log "Tab search completed."
        } else {
            Log "Active tab already matches track title; window brought to front successfully."
        }
    }
    Log "Finished open_media_tab execution with SUCCESS."
    exit 0
}

Log "No matching window found. Attempting generic process activation for '$AppId'..."
if ($AppId) {
    $procName = ($AppId -replace '\.exe$', '').Split('.')[0]
    $ws.AppActivate($procName) | Out-Null
}
Log "Finished open_media_tab execution (fallback complete)."
