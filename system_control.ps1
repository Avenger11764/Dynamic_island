$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 1. Native Audio Endpoint COM Type with instant event callback
$audioCode = @"
using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;

namespace WinAudioSys {
    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioEndpointVolume {
        int RegisterControlChangeNotify(IAudioEndpointVolumeCallback pNotify);
        int UnregisterControlChangeNotify(IAudioEndpointVolumeCallback pNotify);
        int GetChannelCount(out uint pnChannelCount);
        int SetMasterVolumeLevel(float fLevelDB, ref Guid pguidEventContext);
        int SetMasterVolumeLevelScalar(float fLevel, ref Guid pguidEventContext);
        int GetMasterVolumeLevel(out float pfLevelDB);
        int GetMasterVolumeLevelScalar(out float pfLevel);
        int SetChannelVolumeLevel(uint nChannel, float fLevelDB, ref Guid pguidEventContext);
        int SetChannelVolumeLevelScalar(uint nChannel, float fLevel, ref Guid pguidEventContext);
        int GetChannelVolumeLevel(uint nChannel, out float pfLevelDB);
        int GetChannelVolumeLevelScalar(uint nChannel, out float pfLevel);
        int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid pguidEventContext);
        int GetMute(out bool pbMute);
        int GetVolumeStepInfo(out uint pnStep, out uint pnStepCount);
        int VolumeStepUp(ref Guid pguidEventContext);
        int VolumeStepDown(ref Guid pguidEventContext);
        int QueryHardwareSupport(out uint pdwHardwareSupportMask);
        int GetVolumeRange(out float pflVolumeMindB, out float pflVolumeMaxdB, out float pflVolumeIncrementdB);
    }

    [Guid("657804FA-D6AD-4496-8A60-352752AF4F89"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioEndpointVolumeCallback {
        [PreserveSig]
        int OnNotify(IntPtr pNotify);
    }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDevice {
        int Activate(ref Guid id, int clsCtx, IntPtr ap, [MarshalAs(UnmanagedType.IUnknown)] out object ip);
        int OpenPropertyStore(int access, out IPropertyStore ps);
        int GetId([MarshalAs(UnmanagedType.LPWStr)] out string id);
        int GetState(out int state);
    }

    [Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceCollection {
        int GetCount(out int count);
        int Item(int n, out IMMDevice dev);
    }

    [Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IPropertyStore {
        int GetCount(out int count);
        int GetAt(int iProperty, out PROPERTYKEY pkey);
        int GetValue(ref PROPERTYKEY key, out PROPVARIANT pv);
        int SetValue(ref PROPERTYKEY key, ref PROPVARIANT propvar);
        int Commit();
    }
    [StructLayout(LayoutKind.Sequential, Pack = 4)]
    public struct PROPERTYKEY {
        public Guid fmtid;
        public int pid;
    }
    [StructLayout(LayoutKind.Sequential)]
    public struct PROPVARIANT {
        public short vt;
        public short wReserved1;
        public short wReserved2;
        public short wReserved3;
        public IntPtr pwszVal;
    }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator {
        int EnumAudioEndpoints(int df, int sm, out IMMDeviceCollection devs);
        int GetDefaultAudioEndpoint(int df, int role, out IMMDevice ep);
    }

    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    public class MMDevEnum { }

    public class AudioCallback : IAudioEndpointVolumeCallback {
        public int OnNotify(IntPtr pNotify) {
            float v = Audio.GetMasterVolume();
            bool m = Audio.GetMute();
            Console.WriteLine("VOL:" + (int)Math.Round(v) + "|MUTE:" + m);
            return 0;
        }
    }

    public class Audio {
        private static IAudioEndpointVolume _cached;
        private static AudioCallback _callback;

        public static IAudioEndpointVolume GetVolume() {
            if (_cached == null) {
                IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)(new MMDevEnum());
                IMMDevice dev = null;
                enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
                Guid IID_IAudioEndpointVolume = typeof(IAudioEndpointVolume).GUID;
                object epv = null;
                dev.Activate(ref IID_IAudioEndpointVolume, 1, IntPtr.Zero, out epv);
                _cached = (IAudioEndpointVolume)epv;

                _callback = new AudioCallback();
                _cached.RegisterControlChangeNotify(_callback);
            }
            return _cached;
        }

        public static float GetMasterVolume() {
            float v = 0;
            GetVolume().GetMasterVolumeLevelScalar(out v);
            return v * 100f;
        }

        public static void SetMasterVolume(float level) {
            Guid g = Guid.Empty;
            GetVolume().SetMasterVolumeLevelScalar(level / 100f, ref g);
        }

        public static bool GetMute() {
            bool m = false;
            GetVolume().GetMute(out m);
            return m;
        }

        public static void SetMute(bool mute) {
            Guid g = Guid.Empty;
            GetVolume().SetMute(mute, ref g);
        }

        public static bool ToggleMute() {
            bool cur = GetMute();
            SetMute(!cur);
            return !cur;
        }

        public static string[] GetEndpoints() {
            try {
                var en = (IMMDeviceEnumerator)new MMDevEnum();
                IMMDeviceCollection coll;
                en.EnumAudioEndpoints(0, 1, out coll);
                int count;
                coll.GetCount(out count);
                var names = new List<string>();
                PROPERTYKEY pk = new PROPERTYKEY();
                pk.fmtid = new Guid("a45c254e-df1c-4efd-8020-67d146a850e0");
                pk.pid = 14;
                for(int i=0; i<count; i++) {
                    IMMDevice dev;
                    coll.Item(i, out dev);
                    IPropertyStore ps;
                    dev.OpenPropertyStore(0, out ps);
                    PROPVARIANT pv;
                    ps.GetValue(ref pk, out pv);
                    if (pv.pwszVal != IntPtr.Zero) {
                        names.Add(Marshal.PtrToStringUni(pv.pwszVal));
                    }
                }
                return names.ToArray();
            } catch {
                return new string[0];
            }
        }

        public static string GetDefaultAudioName() {
            try {
                var en = (IMMDeviceEnumerator)new MMDevEnum();
                IMMDevice dev;
                en.GetDefaultAudioEndpoint(0, 1, out dev);
                IPropertyStore ps;
                dev.OpenPropertyStore(0, out ps);
                PROPERTYKEY pk = new PROPERTYKEY();
                pk.fmtid = new Guid("a45c254e-df1c-4efd-8020-67d146a850e0");
                pk.pid = 14;
                PROPVARIANT pv;
                ps.GetValue(ref pk, out pv);
                return Marshal.PtrToStringUni(pv.pwszVal);
            } catch {
                return "";
            }
        }
    }

    public class BtHelper {
        [DllImport("cfgmgr32.dll", EntryPoint = "CM_Get_Device_ID_List_SizeW", CharSet = CharSet.Unicode)]
        public static extern int CM_Get_Device_ID_List_Size(out uint pulLen, string pszFilter, uint ulFlags);

        [DllImport("cfgmgr32.dll", EntryPoint = "CM_Get_Device_ID_ListW", CharSet = CharSet.Unicode)]
        public static extern int CM_Get_Device_ID_List(string pszFilter, [Out] char[] buffer, uint bufferLen, uint ulFlags);

        [DllImport("cfgmgr32.dll", EntryPoint = "CM_Locate_DevNodeW", CharSet = CharSet.Unicode)]
        public static extern int CM_Locate_DevNode(out uint devInst, string devId, int flags);

        [StructLayout(LayoutKind.Sequential)]
        public struct DEVPROPKEY {
            public Guid fmtid;
            public uint pid;
        }

        [DllImport("cfgmgr32.dll", EntryPoint = "CM_Get_DevNode_PropertyW", CharSet = CharSet.Unicode)]
        public static extern int CM_Get_DevNode_Property(uint devInst, ref DEVPROPKEY propertyKey, out uint propertyType, byte[] propertyBuffer, ref uint propertyBufferSize, uint flags);

        private static DEVPROPKEY pkDesc = new DEVPROPKEY { fmtid = new Guid("b725f130-47ef-101a-a5f1-02608c9eebac"), pid = 10 };
        private static DEVPROPKEY pkFriendly = new DEVPROPKEY { fmtid = new Guid("a45c254e-df1c-4efd-8020-67d146a850e0"), pid = 12 };
        private static DEVPROPKEY pkBatt = new DEVPROPKEY { fmtid = new Guid("104EA319-6EE2-4701-BD47-8DDBF425BBE5"), pid = 2 };

        private static string ReadStringProp(uint devInst, ref DEVPROPKEY pk) {
            uint ptype = 0;
            byte[] buf = new byte[512];
            uint size = 512;
            if (CM_Get_DevNode_Property(devInst, ref pk, out ptype, buf, ref size, 0) == 0 && size > 2) {
                return System.Text.Encoding.Unicode.GetString(buf, 0, (int)size).TrimEnd('\0', ' ');
            }
            return "";
        }

        public static Dictionary<string, int> GetAllBatteries() {
            var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            uint len = 0;
            if (CM_Get_Device_ID_List_Size(out len, "BTHENUM", 0) != 0 || len == 0) return map;
            char[] buf = new char[len];
            if (CM_Get_Device_ID_List("BTHENUM", buf, len, 0) != 0) return map;

            string all = new string(buf);
            string[] ids = all.Split(new char[] { '\0' }, StringSplitOptions.RemoveEmptyEntries);

            foreach (string id in ids) {
                uint devInst;
                if (CM_Locate_DevNode(out devInst, id, 0) != 0) continue;

                uint ptype = 0;
                uint bSize = 4;
                byte[] bBuf = new byte[4];
                if (CM_Get_DevNode_Property(devInst, ref pkBatt, out ptype, bBuf, ref bSize, 0) == 0 && bSize > 0) {
                    int batt = (int)bBuf[0];

                    string rawName = ReadStringProp(devInst, ref pkFriendly);
                    if (string.IsNullOrEmpty(rawName)) {
                        rawName = ReadStringProp(devInst, ref pkDesc);
                    }

                    if (!string.IsNullOrEmpty(rawName)) {
                        string clean = rawName
                            .Replace(" Hands-Free AG", "")
                            .Replace(" Hands-Free", "")
                            .Replace(" Avrcp Transport", "")
                            .Trim();
                        map[clean] = batt;
                    }
                }
            }
            return map;
        }

        public static int GetBatteryFor(string devName) {
            if (string.IsNullOrEmpty(devName)) return -1;
            var map = GetAllBatteries();
            if (map.ContainsKey(devName)) return map[devName];

            foreach (var kvp in map) {
                if (devName.IndexOf(kvp.Key, StringComparison.OrdinalIgnoreCase) >= 0 ||
                    kvp.Key.IndexOf(devName, StringComparison.OrdinalIgnoreCase) >= 0) {
                    return kvp.Value;
                }
            }
            return -1;
        }
    }
}
"@
Add-Type -TypeDefinition $audioCode -ErrorAction SilentlyContinue

# Initialize Volume COM & Callback
[WinAudioSys.Audio]::GetVolume() | Out-Null

# Initialize Brightness CIM
$brightMethods = $null
try {
    $brightMethods = Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightnessMethods -ErrorAction SilentlyContinue
} catch {}

function Get-CurrentBrightness {
    try {
        return (Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightness -ErrorAction SilentlyContinue).CurrentBrightness
    } catch {
        return $null
    }
}

function Set-CurrentBrightness([int]$val) {
    if (-not $global:brightMethods) {
        $global:brightMethods = Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightnessMethods -ErrorAction SilentlyContinue
    }
    if ($global:brightMethods) {
        Invoke-CimMethod -InputObject $global:brightMethods -MethodName WmiSetBrightness -Arguments @{ Timeout = 1; Brightness = [uint32]$val } | Out-Null
    }
}

function Parse-BtName($epName) {
    if ($epName -match '\((.*?)\)') {
        $inner = $matches[1]
        if ($inner -notmatch '(?i)Realtek|Intel|High Definition|AMD|NVIDIA|USB') {
            return $inner -replace '(?i) Hands-Free', ''
        }
    }
    return $null
}

function Get-BtDevices {
    $eps = [WinAudioSys.Audio]::GetEndpoints()
    $dict = @{}
    foreach ($ep in $eps) {
        $btName = Parse-BtName $ep
        if ($btName) {
            $dict[$btName] = [WinAudioSys.BtHelper]::GetBatteryFor($btName)
        }
    }
    return $dict
}

# Send Initial State
$initVol = [math]::Round([WinAudioSys.Audio]::GetMasterVolume())
$initMute = [WinAudioSys.Audio]::GetMute()
Write-Output "VOL:$initVol|MUTE:$initMute"

$initBright = Get-CurrentBrightness
if ($initBright -ne $null) {
    Write-Output "BRIGHTNESS:$initBright"
}

$lastDevices = Get-BtDevices
foreach ($name in $lastDevices.Keys) {
    $b = $lastDevices[$name]
    Write-Output "BT_PRESENT:$name|BATTERY:$b"
}

$lastAudioName = [WinAudioSys.Audio]::GetDefaultAudioName()
$isBtAudio = (Parse-BtName $lastAudioName) -ne $null
Write-Output "BT_AUDIO:$isBtAudio"
[Console]::Out.Flush()

Write-Output "READY"
[Console]::Out.Flush()

# Start background async thread for Brightness polling & BT monitoring
$runspace = [runspacefactory]::CreateRunspace()
$runspace.Open()
$powershell = [powershell]::Create()
$powershell.Runspace = $runspace

$powershell.AddScript({
    param($initBright, $lastAudioName, [hashtable]$initialDevs)
    $lastB = $initBright
    $lastAud = $lastAudioName
    $lastDevs = @{}
    if ($initialDevs) {
        foreach ($k in $initialDevs.Keys) { $lastDevs[$k] = $initialDevs[$k] }
    }
    
    $counter = 0
    while ($true) {
        Start-Sleep -Milliseconds 150
        $counter++
        
        # Check brightness every ~1500ms (10 iterations) to prevent WMI bottleneck
        if ($counter % 10 -eq 0) {
            try {
                $curB = (Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightness -ErrorAction SilentlyContinue).CurrentBrightness
                if ($curB -ne $null -and $curB -ne $lastB) {
                    $lastB = $curB
                    [Console]::WriteLine("BRIGHTNESS:$curB")
                }
            } catch {}
        }
        
        # Check Bluetooth every 1000ms (~7 iterations)
        if ($counter % 7 -eq 0) {
            try {
                $eps = [WinAudioSys.Audio]::GetEndpoints()
                $curDevs = @{}
                foreach ($ep in $eps) {
                    if ($ep -match '\((.*?)\)') {
                        $inner = $matches[1]
                        if ($inner -notmatch '(?i)Realtek|Intel|High Definition|AMD|NVIDIA|USB') {
                            $cleanName = $inner -replace '(?i) Hands-Free', ''
                            $curDevs[$cleanName] = [WinAudioSys.BtHelper]::GetBatteryFor($cleanName)
                        }
                    }
                }
                
                foreach ($d in $curDevs.Keys) {
                    $b = $curDevs[$d]
                    if (-not $lastDevs.ContainsKey($d)) {
                        [Console]::WriteLine("BT_CONNECTED:$d|BATTERY:$b")
                    } elseif ($lastDevs[$d] -ne $b) {
                        [Console]::WriteLine("BT_CONNECTED:$d|BATTERY:$b")
                    }
                }
                foreach ($d in $lastDevs.Keys) {
                    if (-not $curDevs.ContainsKey($d)) {
                        [Console]::WriteLine("BT_DISCONNECTED:$d")
                    }
                }
                $lastDevs = $curDevs
                
                $curAud = [WinAudioSys.Audio]::GetDefaultAudioName()
                if ($curAud -ne $lastAud) {
                    $lastAud = $curAud
                    $isBt = $false
                    if ($curAud -match '\((.*?)\)') {
                        $inner = $matches[1]
                        if ($inner -notmatch '(?i)Realtek|Intel|High Definition|AMD|NVIDIA|USB') {
                            $isBt = $true
                        }
                    }
                    [Console]::WriteLine("BT_AUDIO:$isBt")
                }
            } catch {}
        }
    }
}).AddArgument($initBright).AddArgument($lastAudioName).AddArgument($lastDevices) | Out-Null

$asyncResult = $powershell.BeginInvoke()

# Main Loop: read commands from stdin (zero-latency execution)
while ($true) {
    $line = [Console]::In.ReadLine()
    if ($line -eq $null) { break }
    $line = $line.Trim()
    if ($line -eq "") { continue }

    try {
        if ($line.StartsWith("v ")) {
            $val = [float]($line.Substring(2).Trim())
            [WinAudioSys.Audio]::SetMasterVolume($val)
        }
        elseif ($line.StartsWith("b ")) {
            $val = [int]($line.Substring(2).Trim())
            Set-CurrentBrightness $val
        }
        elseif ($line -eq "mute") {
            [WinAudioSys.Audio]::ToggleMute() | Out-Null
        }
        elseif ($line -eq "get") {
            $v = [math]::Round([WinAudioSys.Audio]::GetMasterVolume())
            $m = [WinAudioSys.Audio]::GetMute()
            $b = Get-CurrentBrightness
            Write-Output "VOL:$v|MUTE:$m"
            if ($b -ne $null) { Write-Output "BRIGHTNESS:$b" }
            [Console]::Out.Flush()
        }
    } catch {
        [Console]::WriteLine("ERR:$($_.Exception.Message)")
    }
}
