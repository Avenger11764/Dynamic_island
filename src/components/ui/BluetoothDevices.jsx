import React from 'react';
import { Headphones, Settings as SettingsIcon } from 'lucide-react';
import { BatteryRing } from './Glyphs';
import { useBluetoothDevices } from '../../utils/useBluetoothDevices';

const Spinner = ({ size = 13 }) => (
  <span
    className="inline-block rounded-full border-[1.5px] border-white/25 border-t-white/90 animate-spin flex-shrink-0"
    style={{ width: size, height: size }}
  />
);

const statusOf = (d, pending, failedId) => {
  if (pending[d.id]) return pending[d.id] === 'connect' ? 'Connecting…' : 'Disconnecting…';
  if (failedId === d.id) return d.connected ? 'Couldn’t disconnect' : 'Couldn’t connect. Is it on and nearby?';
  return d.connected ? 'Connected' : 'Not connected';
};

/**
 * Quick connect list for paired Bluetooth audio devices: tap a device to
 * connect or disconnect it.
 *
 * `compact` is the narrow variant for the side bar; with no paired audio device
 * it renders `fallback` instead (nothing by default).
 */
export const BluetoothDevices = ({ compact = false, fallback = null, className = '' }) => {
  const { devices, pending, failedId, toggle, openSettings } = useBluetoothDevices();
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };

  if (compact) {
    if (!devices || devices.length === 0) return fallback;
    return (
      <div className={`surface w-full p-1.5 flex flex-col gap-0.5 ${className}`}>
        <div className="flex items-center justify-between pl-1.5 pr-0.5">
          <span className="text-[10.5px] font-medium text-white/45">Bluetooth</span>
          <button
            type="button"
            title="Bluetooth settings"
            aria-label="Bluetooth settings"
            className="w-5 h-5 rounded-full flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.08] transition-colors"
            onClick={stop(openSettings)}
          >
            <SettingsIcon size={11} strokeWidth={1.9} />
          </button>
        </div>
        {devices.map((d) => (
          <button
            key={d.id}
            type="button"
            disabled={!!pending[d.id]}
            title={`${d.name}: ${statusOf(d, pending, failedId)}. Click to ${d.connected ? 'disconnect' : 'connect'}.`}
            className="w-full h-8 px-1.5 rounded-[10px] flex items-center gap-1.5 text-left hover:bg-white/[0.08] transition-colors"
            onClick={stop(() => toggle(d))}
          >
            <Headphones size={13} strokeWidth={1.9} className={`flex-shrink-0 ${d.connected ? 'text-white' : 'text-white/40'}`} />
            <span className={`text-[11px] font-medium truncate flex-1 ${d.connected ? 'text-white/90' : (failedId === d.id ? 'text-[#FF9F0A]' : 'text-white/55')}`}>{d.name}</span>
            {pending[d.id] ? <Spinner size={11} />
              : d.connected && d.battery > 0 ? <span className="tnum text-[10.5px] font-medium text-white/55 flex-shrink-0">{d.battery}%</span>
              : <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${d.connected ? 'bg-[#30D158]' : 'bg-white/20'}`} />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {devices === null ? (
        <div className="flex items-center justify-center gap-2 py-5 text-[12px] text-white/45"><Spinner /> Looking for devices…</div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-1 py-4 px-3">
          <span className="text-[12.5px] font-medium text-white/80">No paired audio devices</span>
          <span className="text-[11.5px] text-white/45">Pair headphones or a speaker in Bluetooth settings and they’ll show up here.</span>
        </div>
      ) : (
        devices.map((d) => (
          <button
            key={d.id}
            type="button"
            disabled={!!pending[d.id]}
            title={`Click to ${d.connected ? 'disconnect' : 'connect'}`}
            className="surface surface-hover w-full flex items-center gap-2.5 px-3 py-2 text-left active:scale-[0.99] transition-transform"
            onClick={stop(() => toggle(d))}
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${d.connected ? 'bg-white text-black' : 'bg-white/[0.1] text-white/85'}`}>
              <Headphones size={14} strokeWidth={2} />
            </span>
            <span className="flex flex-col min-w-0 flex-1">
              <span className="text-[12px] font-medium text-white/90 truncate leading-tight">{d.name}</span>
              <span className={`text-[10.5px] truncate leading-tight mt-0.5 ${failedId === d.id ? 'text-[#FF9F0A]' : 'text-white/45'}`}>{statusOf(d, pending, failedId)}</span>
            </span>
            {pending[d.id] ? <Spinner />
              : d.connected && d.battery > 0 ? (
                <span className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="tnum text-[11.5px] font-medium text-white/70">{d.battery}%</span>
                  <BatteryRing level={d.battery} size={16} />
                </span>
              ) : (
                <span className="text-[11px] font-medium text-white/45 flex-shrink-0">{d.connected ? 'Disconnect' : 'Connect'}</span>
              )}
          </button>
        ))
      )}
      <button
        type="button"
        className="self-center mt-0.5 h-6 px-2.5 rounded-full text-[11px] font-medium text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center gap-1.5"
        onClick={stop(openSettings)}
      >
        <SettingsIcon size={11} strokeWidth={1.9} /> Bluetooth settings
      </button>
    </div>
  );
};

export default BluetoothDevices;
