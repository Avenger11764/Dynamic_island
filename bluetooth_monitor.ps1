$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Setup Audio endpoint COM object
try {
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;

public class AudioHelper {
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

    public static string[] GetActiveEndpoints() {
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
'@
} catch {}

function Parse-BtName($epName) {
    if ($epName -match '\((.*?)\)') {
        $inner = $matches[1]
        if ($inner -notmatch '(?i)Realtek|Intel|High Definition|AMD|NVIDIA|USB') {
            # Strip " Hands-Free" if it exists
            return $inner -replace '(?i) Hands-Free', ''
        }
    }
    return $null
}

function Get-CurrentBtDevices {
    $eps = [AudioHelper]::GetActiveEndpoints()
    $dict = @{}
    foreach ($ep in $eps) {
        $btName = Parse-BtName $ep
        if ($btName) {
            $dict[$btName] = $true
        }
    }
    return $dict
}

$lastDevices = Get-CurrentBtDevices
foreach ($name in $lastDevices.Keys) {
    Write-Output "BT_PRESENT:$name|BATTERY:-1"
    [Console]::Out.Flush()
}

$lastAudioId = [AudioHelper]::GetDefaultAudioName()
$isBtAudio = $false
$btName = Parse-BtName $lastAudioId
if ($btName) { $isBtAudio = $true }
Write-Output "BT_AUDIO:$isBtAudio"
[Console]::Out.Flush()

while ($true) {
    Start-Sleep -Seconds 3
    
    $currentDevices = Get-CurrentBtDevices
    
    foreach ($name in $currentDevices.Keys) {
        if (-not $lastDevices.ContainsKey($name)) {
            Write-Output "BT_CONNECTED:$name|BATTERY:-1"
            [Console]::Out.Flush()
        }
    }
    
    foreach ($name in $lastDevices.Keys) {
        if (-not $currentDevices.ContainsKey($name)) {
            Write-Output "BT_DISCONNECTED:$name"
            [Console]::Out.Flush()
        }
    }
    
    $curAudioId = [AudioHelper]::GetDefaultAudioName()
    if ($curAudioId -ne $lastAudioId) {
        $lastAudioId = $curAudioId
        $btName = Parse-BtName $curAudioId
        $isBtAudio = $btName -ne $null
        Write-Output "BT_AUDIO:$isBtAudio"
        [Console]::Out.Flush()
    }
    
    $lastDevices = $currentDevices
}
