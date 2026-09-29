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

    [StructLayout(LayoutKind.Sequential)]
    public struct AUDIO_VOLUME_NOTIFICATION_DATA {
        public Guid guidEventContext;
        public bool bMuted;
        public float fMasterVolume;
        public uint nChannels;
        public float afChannelVolumes;
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

    [Guid("7991EEC9-7E89-4D85-8390-6C703CEC60C0"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMNotificationClient {
        void OnDeviceStateChanged([MarshalAs(UnmanagedType.LPWStr)] string pwstrDeviceId, uint dwNewState);
        void OnDeviceAdded([MarshalAs(UnmanagedType.LPWStr)] string pwstrDeviceId);
        void OnDeviceRemoved([MarshalAs(UnmanagedType.LPWStr)] string pwstrDeviceId);
        void OnDefaultDeviceChanged(int dataFlow, int role, [MarshalAs(UnmanagedType.LPWStr)] string pwstrDefaultDeviceId);
        void OnPropertyValueChanged([MarshalAs(UnmanagedType.LPWStr)] string pwstrDeviceId, PROPERTYKEY key);
    }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator {
        int EnumAudioEndpoints(int df, int sm, out IMMDeviceCollection devs);
        int GetDefaultAudioEndpoint(int df, int role, out IMMDevice ep);
        int GetDevice([MarshalAs(UnmanagedType.LPWStr)] string pwstrId, out IMMDevice ep);
        int RegisterEndpointNotificationCallback(IMMNotificationClient pClient);
        int UnregisterEndpointNotificationCallback(IMMNotificationClient pClient);
    }

    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    public class MMDevEnum { }

    [Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioMeterInformation {
        [PreserveSig] int GetPeakValue(out float pfPeak);
        [PreserveSig] int GetMeteringChannelCount(out int pnChannelCount);
        [PreserveSig] int GetChannelsPeakValues(int u32ChannelCount, [Out, MarshalAs(UnmanagedType.LPArray, SizeParamIndex = 0)] float[] afPeakValues);
        [PreserveSig] int QueryHardwareSupport(out int pdwHardwareSupportMask);
    }

    public class DeviceNotifier : IMMNotificationClient {
        // Never call Register/Unregister or take the COM lock inside these callbacks:
        // doing so deadlocks the audio-service callback thread. Just flag a rehook.
        public void OnDeviceStateChanged(string pwstrDeviceId, uint dwNewState) { Audio.RequestRehook(); }
        public void OnDeviceAdded(string pwstrDeviceId) { Audio.RequestRehook(); }
        public void OnDeviceRemoved(string pwstrDeviceId) { Audio.RequestRehook(); }
        public void OnDefaultDeviceChanged(int dataFlow, int role, string pwstrDefaultDeviceId) {
            if (dataFlow == 0) Audio.RequestRehook();
        }
        public void OnPropertyValueChanged(string pwstrDeviceId, PROPERTYKEY key) {}
    }

    public class AudioCallback : IAudioEndpointVolumeCallback {
        public int OnNotify(IntPtr pNotify) {
            // Runs on an audio-service thread: only touch state, never COM objects.
            if (pNotify != IntPtr.Zero) {
                try {
                    var data = (AUDIO_VOLUME_NOTIFICATION_DATA)Marshal.PtrToStructure(pNotify, typeof(AUDIO_VOLUME_NOTIFICATION_DATA));
                    Audio.NotifyVolume(data.fMasterVolume * 100f, data.bMuted);
                } catch {}
            }
            return 0;
        }
    }

    public class Audio {
        // _comLock guards COM objects; _stateLock guards last-reported values.
        // They are never nested, so the volume callback can't deadlock with a rehook.
        private static readonly object _comLock = new object();
        private static readonly object _stateLock = new object();
        private static IAudioEndpointVolume _cached;
        private static string _cachedId = null;
        private static AudioCallback _callback = new AudioCallback();
        private static IMMDeviceEnumerator _enumerator;
        private static DeviceNotifier _notifier = new DeviceNotifier();
        private static int _lastReportedVol = -1;
        private static bool _lastReportedMute = false;
        private static volatile bool _rehookPending = false;
        private static IAudioMeterInformation _meter;
        private static volatile bool _meterOn = false;
        private static readonly System.Threading.ManualResetEvent _meterWake = new System.Threading.ManualResetEvent(false);
        private static System.Threading.Thread _meterThread;

        // Streams output peak levels ("PK:left,right" in 0..1000) ~40x/s while enabled.
        // Used by the notch to sync its music lights to the beat.
        public static void SetMeter(bool on) {
            _meterOn = on;
            if (on) {
                if (_meterThread == null) {
                    _meterThread = new System.Threading.Thread(MeterLoop);
                    _meterThread.IsBackground = true;
                    _meterThread.Start();
                }
                _meterWake.Set();
            } else {
                _meterWake.Reset();
            }
        }

        private static void MeterLoop() {
            float[] buf = new float[8];
            while (true) {
                if (!_meterOn) { _meterWake.WaitOne(); continue; }
                int l = -1, r = -1;
                lock (_comLock) {
                    if (_cached == null) RehookInternal();
                    if (_meter != null) {
                        try {
                            int n = 0;
                            if (_meter.GetMeteringChannelCount(out n) == 0 && n >= 2) {
                                if (n > buf.Length) n = buf.Length;
                                if (_meter.GetChannelsPeakValues(n, buf) == 0) {
                                    l = (int)(buf[0] * 1000f);
                                    r = (int)(buf[1] * 1000f);
                                }
                            }
                            if (l < 0) {
                                float pk = 0;
                                if (_meter.GetPeakValue(out pk) == 0) { l = r = (int)(pk * 1000f); }
                            }
                        } catch { _rehookPending = true; }
                    }
                }
                if (l >= 0) {
                    Console.WriteLine("PK:" + l + "," + r);
                    Console.Out.Flush();
                }
                System.Threading.Thread.Sleep(25);
            }
        }

        public static void RequestRehook() { _rehookPending = true; }

        public static void Init() {
            lock (_comLock) {
                EnsureEnumerator();
                RehookInternal();
            }
        }

        private static void EnsureEnumerator() {
            if (_enumerator == null) {
                try {
                    _enumerator = (IMMDeviceEnumerator)new MMDevEnum();
                    _enumerator.RegisterEndpointNotificationCallback(_notifier);
                } catch {}
            }
        }

        private static IMMDevice GetDefaultDevice() {
            IMMDevice dev = null;
            try { _enumerator.GetDefaultAudioEndpoint(0, 0, out dev); } catch { dev = null; }
            if (dev == null) {
                try { _enumerator.GetDefaultAudioEndpoint(0, 1, out dev); } catch { dev = null; }
            }
            return dev;
        }

        private static void ReleaseCached() {
            if (_meter != null) {
                try { Marshal.ReleaseComObject(_meter); } catch {}
                _meter = null;
            }
            if (_cached != null) {
                try { _cached.UnregisterControlChangeNotify(_callback); } catch {}
                try { Marshal.ReleaseComObject(_cached); } catch {}
                _cached = null;
            }
            _cachedId = null;
        }

        // Caller must hold _comLock. Returns true if the endpoint changed.
        private static bool RehookInternal() {
            try {
                EnsureEnumerator();
                if (_enumerator == null) return false;
                IMMDevice dev = GetDefaultDevice();
                if (dev == null) { ReleaseCached(); return false; }
                string id = null;
                try { dev.GetId(out id); } catch {}
                if (_cached != null && id != null && id == _cachedId) {
                    try { Marshal.ReleaseComObject(dev); } catch {}
                    return false;
                }
                ReleaseCached();
                Guid iid = typeof(IAudioEndpointVolume).GUID;
                object epv = null;
                dev.Activate(ref iid, 1, IntPtr.Zero, out epv);
                _cached = (IAudioEndpointVolume)epv;
                _cachedId = id;
                if (_cached != null) {
                    try { _cached.RegisterControlChangeNotify(_callback); } catch {}
                }
                try {
                    Guid iidMeter = typeof(IAudioMeterInformation).GUID;
                    object mo = null;
                    dev.Activate(ref iidMeter, 1, IntPtr.Zero, out mo);
                    _meter = mo as IAudioMeterInformation;
                } catch { _meter = null; }
                try { Marshal.ReleaseComObject(dev); } catch {}
                return true;
            } catch {
                ReleaseCached();
                return false;
            }
        }

        // Polling thread only. Applies deferred rehooks and emits VOL_SYNC when the
        // endpoint changes (e.g. Bluetooth headset connected/disconnected).
        public static void Tick() {
            bool changedEndpoint = false;
            float v = -1; bool m = false; bool ok = false;
            lock (_comLock) {
                bool pending = _rehookPending;
                _rehookPending = false;
                if (pending || _cached == null) changedEndpoint = RehookInternal();
                if (_cached != null) {
                    try {
                        _cached.GetMasterVolumeLevelScalar(out v);
                        _cached.GetMute(out m);
                        ok = true;
                    } catch {
                        // Endpoint invalidated (device unplugged) - rehook next tick
                        ReleaseCached();
                        _rehookPending = true;
                    }
                }
            }
            if (!ok) return;
            int iv = (int)Math.Round(v * 100f);
            lock (_stateLock) {
                if (changedEndpoint || _lastReportedVol == -1) {
                    _lastReportedVol = iv;
                    _lastReportedMute = m;
                    if (changedEndpoint) {
                        Console.WriteLine("VOL_SYNC:" + iv + "|MUTE:" + m);
                        Console.Out.Flush();
                    }
                } else if (iv != _lastReportedVol || m != _lastReportedMute) {
                    _lastReportedVol = iv;
                    _lastReportedMute = m;
                    Console.WriteLine("VOL:" + iv + "|MUTE:" + m);
                    Console.Out.Flush();
                }
            }
        }

        public static float GetMasterVolume() {
            lock (_comLock) {
                if (_cached == null) RehookInternal();
                try {
                    float v = 0;
                    if (_cached != null) _cached.GetMasterVolumeLevelScalar(out v);
                    return v * 100f;
                } catch { _rehookPending = true; return 0f; }
            }
        }

        public static void SetMasterVolume(float level) {
            level = Math.Max(0f, Math.Min(100f, level));
            lock (_comLock) {
                if (_cached == null) RehookInternal();
                try {
                    Guid g = Guid.Empty;
                    if (_cached != null) _cached.SetMasterVolumeLevelScalar(level / 100f, ref g);
                } catch { _rehookPending = true; return; }
            }
            lock (_stateLock) { _lastReportedVol = (int)Math.Round(level); }
        }

        public static bool GetMute() {
            lock (_comLock) {
                if (_cached == null) RehookInternal();
                try {
                    bool m = false;
                    if (_cached != null) _cached.GetMute(out m);
                    return m;
                } catch { _rehookPending = true; return false; }
            }
        }

        public static void SetMute(bool mute) {
            lock (_comLock) {
                if (_cached == null) RehookInternal();
                try {
                    Guid g = Guid.Empty;
                    if (_cached != null) _cached.SetMute(mute, ref g);
                } catch { _rehookPending = true; return; }
            }
            lock (_stateLock) { _lastReportedMute = mute; }
        }

        public static bool ToggleMute() {
            bool cur = GetMute();
            SetMute(!cur);
            return !cur;
        }

        public static void NotifyVolume(float v, bool m) {
            lock (_stateLock) {
                int iv = (int)Math.Round(v);
                if (_lastReportedVol != -1 && (iv != _lastReportedVol || m != _lastReportedMute)) {
                    _lastReportedVol = iv;
                    _lastReportedMute = m;
                    Console.WriteLine("VOL:" + iv + "|MUTE:" + m);
                    Console.Out.Flush();
                } else if (_lastReportedVol == -1) {
                    _lastReportedVol = iv;
                    _lastReportedMute = m;
                }
            }
        }

        public static string[] GetEndpoints() {
            try {
                var en = (IMMDeviceEnumerator)new MMDevEnum();
                IMMDeviceCollection coll;
                en.EnumAudioEndpoints(0, 1, out coll);
                if (coll == null) return new string[0];
                int count;
                coll.GetCount(out count);
                var names = new List<string>();
                PROPERTYKEY pk = new PROPERTYKEY();
                pk.fmtid = new Guid("a45c254e-df1c-4efd-8020-67d146a850e0");
                pk.pid = 14;
                for(int i = 0; i < count; i++) {
                    try {
                        IMMDevice dev;
                        coll.Item(i, out dev);
                        if (dev != null) {
                            IPropertyStore ps;
                            dev.OpenPropertyStore(0, out ps);
                            if (ps != null) {
                                PROPVARIANT pv;
                                ps.GetValue(ref pk, out pv);
                                if (pv.pwszVal != IntPtr.Zero) {
                                    names.Add(Marshal.PtrToStringUni(pv.pwszVal));
                                }
                            }
                            Marshal.ReleaseComObject(dev);
                        }
                    } catch {}
                }
                try { Marshal.ReleaseComObject(coll); } catch {}
                try { Marshal.ReleaseComObject(en); } catch {}
                return names.ToArray();
            } catch {
                return new string[0];
            }
        }

        public static string GetDefaultAudioName() {
            try {
                var en = (IMMDeviceEnumerator)new MMDevEnum();
                IMMDevice dev;
                int hr = en.GetDefaultAudioEndpoint(0, 0, out dev);
                if (hr != 0 || dev == null) {
                    en.GetDefaultAudioEndpoint(0, 1, out dev);
                }
                if (dev == null) return "";
                IPropertyStore ps;
                dev.OpenPropertyStore(0, out ps);
                PROPERTYKEY pk = new PROPERTYKEY();
                pk.fmtid = new Guid("a45c254e-df1c-4efd-8020-67d146a850e0");
                pk.pid = 14;
                PROPVARIANT pv;
                ps.GetValue(ref pk, out pv);
                string res = Marshal.PtrToStringUni(pv.pwszVal);
                Marshal.ReleaseComObject(dev);
                try { Marshal.ReleaseComObject(en); } catch {}
                return res ?? "";
            } catch {
                return "";
            }
        }
    }

    // Night light and Do not disturb have no public Windows API. These use the
    // same undocumented state Windows' own toggles use: the Night light
    // CloudStore blob and the shell's quiet-hours WNF state.
    public static class SysToggles {
        // char 36 is "$": a literal dollar sign here would be expanded by the PowerShell here-string
        static readonly string NightLightKey = @"Software\Microsoft\Windows\CurrentVersion\CloudStore\Store\DefaultAccount\Current\default" + (char)36 + @"windows.data.bluelightreduction.bluelightreductionstate\windows.data.bluelightreduction.bluelightreductionstate";
        const ulong WNF_QUIETHOURS_PROFILE = 0x0D83063EA3BF1C75;

        [DllImport("ntdll.dll")]
        static extern int NtQueryWnfStateData(ref ulong stateName, IntPtr typeId, IntPtr scope, out uint changeStamp, byte[] buffer, ref uint bufferSize);
        [DllImport("ntdll.dll")]
        static extern int NtUpdateWnfStateData(ref ulong stateName, byte[] buffer, uint length, IntPtr typeId, IntPtr scope, uint matchingChangeStamp, uint checkStamp);

        // 1 = on, 0 = off, -1 = unknown (never configured on this PC)
        public static int GetNightLight() {
            try {
                using (var k = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(NightLightKey)) {
                    if (k == null) return -1;
                    var d = k.GetValue("Data") as byte[];
                    if (d == null || d.Length < 25) return -1;
                    return d[18] == 0x15 ? 1 : 0;
                }
            } catch { return -1; }
        }

        public static bool SetNightLight(bool on) {
            try {
                using (var k = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(NightLightKey, true)) {
                    if (k == null) return false;
                    var d = k.GetValue("Data") as byte[];
                    if (d == null || d.Length < 25) return false;
                    bool cur = d[18] == 0x15;
                    if (cur == on) return true;
                    var list = new List<byte>(d);
                    if (on) {
                        list.InsertRange(23, new byte[] { 0x10, 0x00 });
                        list[18] = 0x15;
                    } else {
                        if (!(list[23] == 0x10 && list[24] == 0x00)) return false; // unexpected layout: don't guess
                        list.RemoveRange(23, 2);
                        list[18] = 0x13;
                    }
                    // Move the 5-byte varint timestamp at [10..14] forward so Windows applies the change
                    ulong ts = 0;
                    for (int i = 0; i < 5; i++) ts |= (ulong)(list[10 + i] & 0x7F) << (7 * i);
                    ulong now = (ulong)DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                    ts = Math.Max(ts + 1, now);
                    for (int i = 0; i < 5; i++) {
                        byte b = (byte)((ts >> (7 * i)) & 0x7F);
                        if (i < 4) b |= 0x80;
                        list[10 + i] = b;
                    }
                    k.SetValue("Data", list.ToArray(), Microsoft.Win32.RegistryValueKind.Binary);
                    return true;
                }
            } catch { return false; }
        }

        // 1 = on (priority only / alarms only), 0 = off, -1 = unknown
        public static int GetDnd() {
            try {
                ulong name = WNF_QUIETHOURS_PROFILE;
                uint stamp; uint size = 4; var buf = new byte[4];
                if (NtQueryWnfStateData(ref name, IntPtr.Zero, IntPtr.Zero, out stamp, buf, ref size) != 0) return -1;
                return BitConverter.ToInt32(buf, 0) != 0 ? 1 : 0;
            } catch { return -1; }
        }

        public static bool SetDnd(bool on) {
            try {
                ulong name = WNF_QUIETHOURS_PROFILE;
                var b = BitConverter.GetBytes(on ? 1 : 0);
                return NtUpdateWnfStateData(ref name, b, 4, IntPtr.Zero, IntPtr.Zero, 0, 0) == 0;
            } catch { return false; }
        }
    }

    // "Optimize memory": trims the working sets of the user's background apps
    // (EmptyWorkingSet), returning idle memory to Windows without closing
    // anything. Skips system processes, the foreground app and Smart Notch.
    public static class MemOptimizer {
        [DllImport("psapi.dll")] static extern bool EmptyWorkingSet(IntPtr hProcess);
        [DllImport("kernel32.dll")] static extern IntPtr OpenProcess(uint access, bool inherit, int pid);
        [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
        [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);

        [StructLayout(LayoutKind.Sequential)]
        struct MEMORYSTATUSEX {
            public uint dwLength; public uint dwMemoryLoad;
            public ulong ullTotalPhys; public ulong ullAvailPhys;
            public ulong ullTotalPageFile; public ulong ullAvailPageFile;
            public ulong ullTotalVirtual; public ulong ullAvailVirtual; public ulong ullAvailExtendedVirtual;
        }
        [DllImport("kernel32.dll")] static extern bool GlobalMemoryStatusEx(ref MEMORYSTATUSEX m);

        const uint PROCESS_SET_QUOTA = 0x0100;
        const uint PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
        static readonly HashSet<string> Skip = new HashSet<string>(StringComparer.OrdinalIgnoreCase) {
            "System", "Idle", "Registry", "MemCompression", "smss", "csrss", "wininit", "winlogon", "services",
            "lsass", "dwm", "fontdrvhost", "audiodg", "sihost", "ctfmon", "Smart Notch", "electron"
        };
        static volatile bool _running = false;

        static ulong UsedBytes() {
            var m = new MEMORYSTATUSEX(); m.dwLength = (uint)Marshal.SizeOf(typeof(MEMORYSTATUSEX));
            return GlobalMemoryStatusEx(ref m) ? m.ullTotalPhys - m.ullAvailPhys : 0;
        }

        public static void RunAsync() {
            if (_running) return;
            _running = true;
            var t = new System.Threading.Thread(Run);
            t.IsBackground = true;
            t.Start();
        }

        static void Run() {
            try {
                int self = System.Diagnostics.Process.GetCurrentProcess().Id;
                int session = System.Diagnostics.Process.GetCurrentProcess().SessionId;
                uint fg = 0;
                GetWindowThreadProcessId(GetForegroundWindow(), out fg);
                ulong usedBefore = UsedBytes();

                var procs = new List<System.Diagnostics.Process>(System.Diagnostics.Process.GetProcesses());
                procs.Sort((a, b) => { try { return b.WorkingSet64.CompareTo(a.WorkingSet64); } catch { return 0; } });

                int count = 0, steps = 0;
                foreach (var p in procs) {
                    try {
                        if (p.Id == self || p.Id == (int)fg || p.Id <= 4 || p.SessionId != session) continue;
                        if (Skip.Contains(p.ProcessName)) continue;
                        long before = p.WorkingSet64;
                        if (before < 8L * 1024 * 1024) continue;
                        IntPtr h = OpenProcess(PROCESS_SET_QUOTA | PROCESS_QUERY_LIMITED_INFORMATION, false, p.Id);
                        if (h == IntPtr.Zero) continue;
                        bool ok = EmptyWorkingSet(h);
                        CloseHandle(h);
                        if (!ok) continue;
                        count++;
                        p.Refresh();
                        long mb = (before - p.WorkingSet64) / (1024 * 1024);
                        if (mb >= 25 && steps < 10) {
                            steps++;
                            Console.WriteLine("BOOST_STEP:" + p.ProcessName + "|" + mb);
                            Console.Out.Flush();
                        }
                    } catch { }
                    finally { try { p.Dispose(); } catch { } }
                }

                System.Threading.Thread.Sleep(400); // let the memory manager settle
                ulong usedAfter = UsedBytes();
                long freedMb = usedBefore > usedAfter ? (long)((usedBefore - usedAfter) / (1024 * 1024)) : 0;
                Console.WriteLine("BOOST_DONE:" + freedMb + "|" + count);
                Console.Out.Flush();
            } catch (Exception e) {
                Console.WriteLine("BOOST_DONE:0|0|" + e.Message.Replace("\n", " "));
                Console.Out.Flush();
            } finally {
                _running = false;
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
            // Query present devices in BTHENUM and BTHLE (0x100 = CM_GETIDLIST_FILTER_PRESENT)
            foreach (string filter in new string[] { "BTHENUM", "BTHLE" }) {
                uint len = 0;
                if (CM_Get_Device_ID_List_Size(out len, filter, 0x100) != 0 || len == 0) continue;
                char[] buf = new char[len];
                if (CM_Get_Device_ID_List(filter, buf, len, 0x100) != 0) continue;

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
[WinAudioSys.Audio]::Init()

# Initialize WinRT Bluetooth
try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime -ErrorAction SilentlyContinue
    [Windows.Devices.Bluetooth.BluetoothDevice, Windows.Devices.Bluetooth, ContentType=WindowsRuntime] | Out-Null
    [Windows.Devices.Enumeration.DeviceInformation, Windows.Devices.Enumeration, ContentType=WindowsRuntime] | Out-Null
    [Windows.Devices.Bluetooth.BluetoothConnectionStatus, Windows.Devices.Bluetooth, ContentType=WindowsRuntime] | Out-Null

    $global:btSelector = [Windows.Devices.Bluetooth.BluetoothDevice]::GetDeviceSelectorFromConnectionStatus([Windows.Devices.Bluetooth.BluetoothConnectionStatus]::Connected)

    $global:asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.IsGenericMethod 
    } | Select-Object -First 1
} catch {}

# Initialize Brightness CIM
$brightMethods = $null
try {
    $brightMethods = Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightnessMethods -ErrorAction SilentlyContinue | Select-Object -First 1
} catch {}

function Get-CurrentBrightness {
    try {
        $inst = Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightness -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($inst) { return [int]$inst.CurrentBrightness }
    } catch {}
    return $null
}

function Set-CurrentBrightness([int]$val) {
    if (-not $global:brightMethods) {
        $global:brightMethods = Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightnessMethods -ErrorAction SilentlyContinue | Select-Object -First 1
    }
    if ($global:brightMethods) {
        try {
            Invoke-CimMethod -InputObject $global:brightMethods -MethodName WmiSetBrightness -Arguments @{ Timeout = 1; Brightness = [uint32]$val } -ErrorAction Stop | Out-Null
        } catch {
            # Stale CIM instance (e.g. after sleep/resume) - refresh once and retry
            $global:brightMethods = Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightnessMethods -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($global:brightMethods) {
                Invoke-CimMethod -InputObject $global:brightMethods -MethodName WmiSetBrightness -Arguments @{ Timeout = 1; Brightness = [uint32]$val } | Out-Null
            }
        }
    }
}

# Bluetooth detection helpers, shared with the BT runspace as source text.
$btFunctions = @'
function Normalize-BtName($n) {
    if (-not $n) { return $null }
    $n = $n.Trim()
    $n = $n -replace '(?i)\s+Hands-Free( AG)?( Audio)?$', '' -replace '(?i)\s+Stereo$', '' -replace '(?i)\s+Avrcp Transport$', ''
    $n = $n.Trim()
    if ($n) { return $n }
    return $null
}

function Parse-BtName($epName) {
    if (-not $epName) { return $null }
    if ($epName -match '\((.*)\)\s*$') {
        $inner = $matches[1]
        if ($inner -notmatch '(?i)Realtek|Intel|High Definition|AMD|NVIDIA|USB|Display Audio|Virtual|Steam|Voicemeeter|VB-Audio') {
            return Normalize-BtName $inner
        }
    } else {
        if ($epName -notmatch '(?i)Realtek|Intel|High Definition|AMD|NVIDIA|USB|Speaker|Microphone|Display Audio|Virtual') {
            return Normalize-BtName $epName
        }
    }
    return $null
}

function Find-Battery($name, $battMap) {
    if (-not $name -or -not $battMap) { return -1 }
    if ($battMap.ContainsKey($name)) { return [int]$battMap[$name] }
    foreach ($k in $battMap.Keys) {
        if ($name.IndexOf($k, [StringComparison]::OrdinalIgnoreCase) -ge 0 -or $k.IndexOf($name, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
            return [int]$battMap[$k]
        }
    }
    return -1
}

# Returns @{ Devices = hashtable name->battery; WinRtOk = bool; WinRtNames = string[] }
function Get-BtSnapshot($btSelector, $asTaskGeneric, $prevWinRtNames, $waitMs) {
    $names = New-Object System.Collections.Generic.List[string]
    $winRtOk = $false
    $winRtNames = @()

    if ($btSelector -and $asTaskGeneric) {
        try {
            $op = [Windows.Devices.Enumeration.DeviceInformation]::FindAllAsync($btSelector)
            $asTask = $asTaskGeneric.MakeGenericMethod([Windows.Devices.Enumeration.DeviceInformationCollection])
            $task = $asTask.Invoke($null, @($op))
            if ($task.Wait($waitMs)) {
                $winRtOk = $true
                $winRtNames = @($task.Result | ForEach-Object { Normalize-BtName $_.Name } | Where-Object { $_ })
            }
        } catch {}
    }
    # WinRT query timed out: keep last known WinRT set instead of reporting a false disconnect
    if (-not $winRtOk -and $prevWinRtNames) { $winRtNames = @($prevWinRtNames) }
    foreach ($n in $winRtNames) { if (-not $names.Contains($n)) { $names.Add($n) } }

    try {
        foreach ($ep in [WinAudioSys.Audio]::GetEndpoints()) {
            $b = Parse-BtName $ep
            if (-not $b) { continue }
            $dup = $false
            foreach ($n in $names) {
                if ($n.IndexOf($b, [StringComparison]::OrdinalIgnoreCase) -ge 0 -or $b.IndexOf($n, [StringComparison]::OrdinalIgnoreCase) -ge 0) { $dup = $true; break }
            }
            if (-not $dup) { $names.Add($b) }
        }
    } catch {}

    $battMap = $null
    try { $battMap = [WinAudioSys.BtHelper]::GetAllBatteries() } catch {}
    $dict = @{}
    foreach ($n in $names) { $dict[$n] = Find-Battery $n $battMap }

    return @{ Devices = $dict; WinRtOk = $winRtOk; WinRtNames = $winRtNames }
}

function Test-IsBtAudioName($name) {
    return ((Parse-BtName $name) -ne $null)
}
'@
. ([scriptblock]::Create($btFunctions))

# Send initial state
$initVol = [math]::Round([WinAudioSys.Audio]::GetMasterVolume())
$initMute = [WinAudioSys.Audio]::GetMute()
[Console]::WriteLine("VOL:$initVol|MUTE:$initMute")

$initBright = Get-CurrentBrightness
if ($initBright -ne $null) {
    [Console]::WriteLine("BRIGHTNESS:$initBright")
}

$initSnap = Get-BtSnapshot $global:btSelector $global:asTaskGeneric $null 2000
foreach ($name in $initSnap.Devices.Keys) {
    $b = $initSnap.Devices[$name]
    [Console]::WriteLine("BT_PRESENT:$name|BATTERY:$b")
}

$lastAudioName = [WinAudioSys.Audio]::GetDefaultAudioName()
$isBtAudio = Test-IsBtAudioName $lastAudioName
[Console]::WriteLine("BT_AUDIO:$isBtAudio")
[Console]::WriteLine("READY")
[Console]::Out.Flush()

function Start-Loop([scriptblock]$body, [object[]]$loopArgs) {
    $rs = [runspacefactory]::CreateRunspace()
    $rs.ApartmentState = 'MTA'
    $rs.Open()
    $ps = [powershell]::Create()
    $ps.Runspace = $rs
    $ps.AddScript($body) | Out-Null
    foreach ($a in $loopArgs) { $ps.AddArgument($a) | Out-Null }
    $ps.BeginInvoke() | Out-Null
    return $ps
}

# Loop 1: volume + brightness (fast, never blocked by Bluetooth queries)
$levelsLoop = Start-Loop {
    param($initBright)
    $lastB = $initBright
    $counter = 0
    $cim = $null
    $misses = 0
    while ($true) {
        Start-Sleep -Milliseconds 120
        $counter++

        # Volume changes arrive instantly via the endpoint callback; this is the fallback/rehook check
        if ($counter % 2 -eq 0) {
            try { [WinAudioSys.Audio]::Tick() } catch {}
        }

        # Brightness: ~0.5s over one reused WMI session; back off to ~5s when the
        # display has no WMI brightness (e.g. desktop monitors)
        $brightEvery = if ($misses -ge 5) { 40 } else { 4 }
        if ($counter % $brightEvery -eq 0) {
            try {
                if (-not $cim) { $cim = New-CimSession -ErrorAction Stop }
                $inst = Get-CimInstance -CimSession $cim -Namespace root/wmi -ClassName WmiMonitorBrightness -OperationTimeoutSec 2 -ErrorAction Stop | Select-Object -First 1
                if ($inst) {
                    $misses = 0
                    $curB = [int]$inst.CurrentBrightness
                    if ($curB -ne $lastB) {
                        $lastB = $curB
                        [Console]::WriteLine("BRIGHTNESS:$curB")
                        [Console]::Out.Flush()
                    }
                } else { $misses++ }
            } catch {
                $misses++
                if ($cim) { try { Remove-CimSession $cim } catch {}; $cim = $null }
            }
        }

        if ($counter % 16 -eq 0) {
            [Console]::WriteLine("HB:LEVELS")
            [Console]::Out.Flush()
        }
    }
} @($initBright)

# Loop 2: Bluetooth devices + default audio output tracking
$btLoop = Start-Loop {
    param($btFunctions, $initDevs, $initWinRt, $lastAudioName, $btSelector, $asTaskGeneric)
    . ([scriptblock]::Create($btFunctions))

    $known = @{}
    foreach ($k in $initDevs.Keys) { $known[$k] = $initDevs[$k] }
    $missing = @{}
    $prevWinRt = $initWinRt
    $lastAud = $lastAudioName
    $lastToggles = ''

    while ($true) {
        Start-Sleep -Milliseconds 1200
        try {
            $snap = Get-BtSnapshot $btSelector $asTaskGeneric $prevWinRt 1500
            if ($snap.WinRtOk) { $prevWinRt = $snap.WinRtNames }
            $cur = $snap.Devices

            foreach ($d in @($cur.Keys)) {
                $b = $cur[$d]
                $missing.Remove($d)
                if (-not $known.ContainsKey($d)) {
                    $known[$d] = $b
                    [Console]::WriteLine("BT_CONNECTED:$d|BATTERY:$b")
                    [Console]::Out.Flush()
                } elseif ($known[$d] -ne $b -and $b -ge 0) {
                    $known[$d] = $b
                    [Console]::WriteLine("BT_BATTERY:$d|BATTERY:$b")
                    [Console]::Out.Flush()
                }
            }

            # Require two consecutive misses before reporting a disconnect (avoids flapping)
            foreach ($d in @($known.Keys)) {
                if (-not $cur.ContainsKey($d)) {
                    $n = 1
                    if ($missing.ContainsKey($d)) { $n = $missing[$d] + 1 }
                    $missing[$d] = $n
                    if ($n -ge 2) {
                        $known.Remove($d)
                        $missing.Remove($d)
                        [Console]::WriteLine("BT_DISCONNECTED:$d")
                        [Console]::Out.Flush()
                    }
                }
            }

            $curAud = [WinAudioSys.Audio]::GetDefaultAudioName()
            if ($curAud -ne $lastAud) {
                $lastAud = $curAud
                [WinAudioSys.Audio]::RequestRehook()
                $isBt = Test-IsBtAudioName $curAud
                [Console]::WriteLine("BT_AUDIO:$isBt")
                [Console]::Out.Flush()
            }
        } catch {}

        try {
            $t = "TOGGLES:NL=$([WinAudioSys.SysToggles]::GetNightLight())|DND=$([WinAudioSys.SysToggles]::GetDnd())"
            if ($t -ne $lastToggles) {
                $lastToggles = $t
                [Console]::WriteLine($t)
                [Console]::Out.Flush()
            }
        } catch {}

        [Console]::WriteLine("HB:BT")
        [Console]::Out.Flush()
    }
} @($btFunctions, $initSnap.Devices, $initSnap.WinRtNames, $lastAudioName, $global:btSelector, $global:asTaskGeneric)

# Main loop: read commands from stdin
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
            [Console]::WriteLine("VOL:$v|MUTE:$m")
            if ($b -ne $null) { [Console]::WriteLine("BRIGHTNESS:$b") }
            [Console]::Out.Flush()
        }
        elseif ($line -eq "nightlight on" -or $line -eq "nightlight off") {
            $ok = [WinAudioSys.SysToggles]::SetNightLight($line -eq "nightlight on")
            [Console]::WriteLine("TOGGLES:NL=$([WinAudioSys.SysToggles]::GetNightLight())|DND=$([WinAudioSys.SysToggles]::GetDnd())|OK=$ok")
            [Console]::Out.Flush()
        }
        elseif ($line -eq "dnd on" -or $line -eq "dnd off") {
            $ok = [WinAudioSys.SysToggles]::SetDnd($line -eq "dnd on")
            [Console]::WriteLine("TOGGLES:NL=$([WinAudioSys.SysToggles]::GetNightLight())|DND=$([WinAudioSys.SysToggles]::GetDnd())|OK=$ok")
            [Console]::Out.Flush()
        }
        elseif ($line -eq "boost") {
            [WinAudioSys.MemOptimizer]::RunAsync()
        }
        elseif ($line -eq "meter on") {
            [WinAudioSys.Audio]::SetMeter($true)
        }
        elseif ($line -eq "meter off") {
            [WinAudioSys.Audio]::SetMeter($false)
        }
        elseif ($line -eq "ping") {
            [Console]::WriteLine("PONG")
            [Console]::Out.Flush()
        }
    } catch {
        [Console]::WriteLine("ERR:$($_.Exception.Message)")
        [Console]::Out.Flush()
    }
}
[Environment]::Exit(0)
