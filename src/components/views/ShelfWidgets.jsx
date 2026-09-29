import React, { useMemo, useState } from 'react';
import { Play, Pause, RotateCcw, Moon, BellOff, VolumeX, Volume2, Calculator, Scissors, Activity } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');
const ICON = { strokeWidth: 1.9 };

const RoundButton = ({ title, onClick, primary, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 flex-shrink-0 ${
      primary ? 'bg-white text-black' : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/80'
    }`}
  >
    {children}
  </button>
);

/** Focus timer + stopwatch card for the vertical bar. */
export const TimerCard = ({
  pomodoro = 0, isPomoRunning, pomoMode, togglePomo, resetPomo, switchPomoMode,
  stopwatch = 0, isSwRunning, toggleSw, resetSw
}) => {
  const [tab, setTab] = useState(isSwRunning && !isPomoRunning ? 'stopwatch' : 'focus');
  const isFocus = tab === 'focus';
  const running = isFocus ? isPomoRunning : isSwRunning;
  const dot = isFocus ? (pomoMode === 'work' ? '#FF9F0A' : '#30D158') : '#FFD60A';
  const value = isFocus
    ? `${pad(Math.floor(pomodoro / 60))}:${pad(pomodoro % 60)}`
    : `${stopwatch >= 3600 ? pad(Math.floor(stopwatch / 3600)) + ':' : ''}${pad(Math.floor((stopwatch % 3600) / 60))}:${pad(stopwatch % 60)}`;

  return (
    <div className="surface w-full p-2.5 flex flex-col gap-2.5">
      <div className="flex bg-white/[0.06] rounded-full p-0.5">
        {[['focus', 'Focus', isPomoRunning], ['stopwatch', 'Timer', isSwRunning]].map(([id, label, active]) => (
          <button
            key={id}
            type="button"
            className={`flex-1 h-6 rounded-full text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${tab === id ? 'bg-white/[0.16] text-white' : 'text-white/50 hover:text-white'}`}
            onClick={(e) => { e.stopPropagation(); setTab(id); }}
          >
            {active && <span className="w-1 h-1 rounded-full bg-current" />}
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-0.5">
        <span className="font-display text-[26px] font-semibold text-white leading-none">{value}</span>
        <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-white/50">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: running ? dot : 'rgba(255,255,255,0.25)' }} />
          {isFocus ? (running ? (pomoMode === 'work' ? 'Focusing' : 'On break') : 'Ready') : (running ? 'Running' : 'Stopped')}
        </span>
      </div>

      {isFocus && (
        <div className="flex bg-white/[0.06] rounded-full p-0.5">
          {[['work', 'Work'], ['break', 'Break']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`flex-1 h-5 rounded-full text-[10.5px] font-medium transition-colors ${pomoMode === id ? 'bg-white/[0.14] text-white' : 'text-white/45 hover:text-white'}`}
              onClick={(e) => { e.stopPropagation(); switchPomoMode?.(id); }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <RoundButton title="Reset" onClick={isFocus ? resetPomo : resetSw}><RotateCcw size={13} {...ICON} /></RoundButton>
        <RoundButton title={running ? 'Pause' : 'Start'} onClick={isFocus ? togglePomo : toggleSw} primary>
          {running ? <Pause size={13} fill="currentColor" strokeWidth={0} /> : <Play size={13} fill="currentColor" strokeWidth={0} className="translate-x-[1px]" />}
        </RoundButton>
      </div>
    </div>
  );
};

/**
 * Timer chip for the horizontal bar. Always available: when idle, click the
 * label to switch between Focus and Stopwatch and press play to start.
 */
export const TimerChip = ({
  pomodoro = 0, isPomoRunning, pomoMode, togglePomo, resetPomo,
  stopwatch = 0, isSwRunning, toggleSw, resetSw
}) => {
  const [pick, setPick] = useState('focus');
  const kind = isPomoRunning ? 'focus' : (isSwRunning ? 'stopwatch' : pick);
  const focus = kind === 'focus';
  const running = focus ? isPomoRunning : isSwRunning;
  const secs = focus ? pomodoro : stopwatch;
  const started = focus ? running || secs > 0 : running || secs > 0;
  const color = focus ? (pomoMode === 'work' ? '#FF9F0A' : '#30D158') : '#FFD60A';
  const label = focus ? (pomoMode === 'break' ? 'Break' : 'Focus') : 'Stopwatch';
  const canSwitch = !isPomoRunning && !isSwRunning;

  return (
    <div className="flex items-center gap-1.5 surface pl-2.5 pr-1 py-1 flex-shrink-0" style={{ borderRadius: 999 }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: running ? color : 'rgba(255,255,255,0.3)' }} />
      <button
        type="button"
        disabled={!canSwitch}
        title={canSwitch ? 'Switch between focus timer and stopwatch' : undefined}
        className={`text-[11.5px] font-medium text-white/55 ${canSwitch ? 'hover:text-white' : ''}`}
        onClick={(e) => { e.stopPropagation(); setPick(p => (p === 'focus' ? 'stopwatch' : 'focus')); }}
      >
        {label}
      </button>
      <span className="font-display text-[13px] font-semibold text-white">
        {secs >= 3600 ? `${pad(Math.floor(secs / 3600))}:` : ''}{pad(Math.floor((secs % 3600) / 60))}:{pad(secs % 60)}
      </span>
      {!running && started && !focus && secs > 0 && (
        <button
          type="button"
          title="Reset"
          className="w-6 h-6 rounded-full hover:bg-white/[0.1] text-white/60 hover:text-white flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); resetSw?.(); }}
        >
          <RotateCcw size={11} strokeWidth={2} />
        </button>
      )}
      {focus && !running && (
        <button
          type="button"
          title="Reset"
          className="w-6 h-6 rounded-full hover:bg-white/[0.1] text-white/60 hover:text-white flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); resetPomo?.(); }}
        >
          <RotateCcw size={11} strokeWidth={2} />
        </button>
      )}
      <button
        type="button"
        title={running ? 'Pause' : 'Start'}
        className={`w-6 h-6 rounded-full flex items-center justify-center ${running ? 'bg-white/[0.12] hover:bg-white/[0.18] text-white' : 'bg-white text-black'}`}
        onClick={(e) => { e.stopPropagation(); (focus ? togglePomo : toggleSw)?.(); }}
      >
        {running
          ? <Pause size={10} fill="currentColor" strokeWidth={0} />
          : <Play size={10} fill="currentColor" strokeWidth={0} className="translate-x-[0.5px]" />}
      </button>
    </div>
  );
};

/** Mute / Night light / Do not disturb as three round toggles. */
export const QuickToggles = ({ isMuted, onToggleMute, isNightLight, onToggleNightLight, isDnd, onToggleDnd }) => (
  <div className="surface w-full px-2 py-2.5 grid grid-cols-3 gap-1">
    {[
      { label: 'Mute', active: isMuted, onClick: onToggleMute, Icon: isMuted ? VolumeX : Volume2 },
      { label: 'Night', active: isNightLight, onClick: onToggleNightLight, Icon: Moon },
      { label: 'Focus', active: isDnd, onClick: onToggleDnd, Icon: BellOff }
    ].map(({ label, active, onClick, Icon }) => (
      <button
        key={label}
        type="button"
        title={label}
        className="flex flex-col items-center gap-1 group"
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      >
        <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-white text-black' : 'bg-white/[0.08] text-white/80 group-hover:bg-white/[0.14]'}`}>
          <Icon size={14} {...ICON} />
        </span>
        <span className="text-[10px] font-medium text-white/50">{label}</span>
      </button>
    ))}
  </div>
);

/** Calculator / Snipping Tool / Task Manager shortcuts. */
export const QuickTools = ({ ipcRenderer }) => (
  <div className="grid grid-cols-3 gap-1.5 w-full">
    {[
      { title: 'Calculator', Icon: Calculator, ch: 'open-calc' },
      { title: 'Snipping Tool', Icon: Scissors, ch: 'open-snip' },
      { title: 'Task Manager', Icon: Activity, ch: 'open-taskmgr' }
    ].map(({ title, Icon, ch }) => (
      <button
        key={ch}
        type="button"
        title={title}
        onClick={(e) => { e.stopPropagation(); ipcRenderer?.send(ch); }}
        className="surface surface-hover h-9 flex items-center justify-center text-white/70 hover:text-white"
      >
        <Icon size={14} {...ICON} />
      </button>
    ))}
  </div>
);

/** Small month calendar with today highlighted. */
export const MiniCalendar = () => {
  const today = new Date();
  const { label, cells } = useMemo(() => {
    const y = today.getFullYear(), m = today.getMonth();
    const first = new Date(y, m, 1);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const days = new Date(y, m + 1, 0).getDate();
    const list = Array.from({ length: offset }, () => null).concat(Array.from({ length: days }, (_, i) => i + 1));
    return { label: first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), cells: list };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today.getFullYear(), today.getMonth()]);
  const d = today.getDate();

  return (
    <div className="surface w-full p-2.5 flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-white/85 px-0.5">{label}</span>
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, i) => (
          <span key={i} className="text-[9px] font-medium text-white/35 leading-4">{w}</span>
        ))}
        {cells.map((n, i) => (
          <span
            key={i}
            className={`tnum text-[9.5px] leading-[17px] mx-auto w-[17px] h-[17px] rounded-full ${
              n === d ? 'bg-white text-black font-semibold' : (n ? 'text-white/70' : '')
            }`}
          >
            {n || ''}
          </span>
        ))}
      </div>
    </div>
  );
};
