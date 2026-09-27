Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

namespace WinAudio {
    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioEndpointVolume {
        int RegisterControlChangeNotify(IntPtr pNotify);
        int UnregisterControlChangeNotify(IntPtr pNotify);
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

    [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDevice {
        int Activate(ref Guid id, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object interfacePointer);
    }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator {
        int EnumAudioEndpoints(int dataFlow, int role, out IntPtr devices);
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
    }

    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    public class MMDeviceEnumeratorComObject { }

    public class Audio {
        private static IAudioEndpointVolume _cached;
        public static IAudioEndpointVolume GetVolume() {
            if (_cached == null) {
                IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
                IMMDevice dev = null;
                enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
                Guid IID_IAudioEndpointVolume = typeof(IAudioEndpointVolume).GUID;
                object epv = null;
                dev.Activate(ref IID_IAudioEndpointVolume, 1, IntPtr.Zero, out epv);
                _cached = (IAudioEndpointVolume)epv;
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
    }
}
"@

# Persistent worker mode: read commands from stdin, respond to stdout
# This avoids re-launching powershell + re-compiling Add-Type every time
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Output "READY"

while ($true) {
    $line = [Console]::In.ReadLine()
    if ($line -eq $null) { break }
    $line = $line.Trim()
    if ($line -eq "") { continue }

    try {
        if ($line -eq "get") {
            $cur = [math]::Round([WinAudio.Audio]::GetMasterVolume())
            $mute = [WinAudio.Audio]::GetMute()
            Write-Output "VOL:$cur|MUTE:$mute"
        }
        elseif ($line -eq "mute") {
            $m = [WinAudio.Audio]::ToggleMute()
            $cur = [math]::Round([WinAudio.Audio]::GetMasterVolume())
            Write-Output "MUTED:$m|VOL:$cur"
        }
        elseif ($line -match '^\d+$') {
            $target = [float]$line
            [WinAudio.Audio]::SetMasterVolume($target)
            Write-Output "VOL:$target"
        }
        else {
            Write-Output "ERR:unknown command"
        }
    } catch {
        Write-Output "ERR:$($_.Exception.Message)"
    }
}
