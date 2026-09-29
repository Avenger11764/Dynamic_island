import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, RotateCcw, Play, Pause, X, Check } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');

const Stepper = ({ label, minutes, onDec, onInc, disabled }) => (
  <div className="flex items-center justify-between">
    <span className="text-[12px] font-medium text-white/60">{label}</span>
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        className="w-6 h-6 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-white/75 transition-colors disabled:opacity-30"
        onClick={onDec}
        disabled={disabled}
      >
        <Minus size={11} strokeWidth={2.2} />
      </button>
      <span className="tnum text-[12px] font-medium text-white w-11 text-center">{minutes} min</span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        className="w-6 h-6 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-white/75 transition-colors disabled:opacity-30"
        onClick={onInc}
        disabled={disabled}
      >
        <Plus size={11} strokeWidth={2.2} />
      </button>
    </div>
  </div>
);

export const PomodoroView = React.memo(({
  isSideNotch = false,
  pomoMode,
  switchPomoMode,
  pomoWorkTime,
  setPomoWorkTime,
  pomoBreakTime,
  setPomoBreakTime,
  pomodoro,
  setPomodoro,
  isPomoRunning,
  togglePomo,
  resetPomo,
  pomoTasks = [],
  handleToggleTask,
  handleDeleteTask,
  taskInput,
  setTaskInput,
  handleAddTask,
  handleInputBlur
}) => {
  const accent = pomoMode === 'work' ? '#FF9F0A' : '#30D158';

  const timer = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex bg-white/[0.08] rounded-full p-0.5">
          {[['work', 'Focus'], ['break', 'Break']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`px-3 h-6 text-[11.5px] font-medium rounded-full transition-colors ${pomoMode === id ? 'bg-white text-black' : 'text-white/55 hover:text-white'}`}
              onClick={() => switchPomoMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {isPomoRunning && <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} title="Running" />}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-display text-[34px] font-semibold text-white leading-none">
          {pad(Math.floor(pomodoro / 60))}:{pad(pomodoro % 60)}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center transition-colors text-white/80"
            onClick={resetPomo}
            title="Reset"
          >
            <RotateCcw size={14} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label={isPomoRunning ? 'Pause' : 'Start'}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform"
            onClick={togglePomo}
          >
            {isPomoRunning ? <Pause size={14} fill="currentColor" strokeWidth={0} /> : <Play size={14} fill="currentColor" strokeWidth={0} className="translate-x-[1px]" />}
          </button>
        </div>
      </div>

      <div className="surface flex flex-col gap-2 px-3 py-2.5">
        <Stepper
          label="Focus"
          minutes={Math.round(pomoWorkTime / 60)}
          disabled={isPomoRunning}
          onDec={() => { setPomoWorkTime(t => Math.max(300, t - 300)); if (pomoMode === 'work' && !isPomoRunning) setPomodoro(t => Math.max(300, t - 300)); }}
          onInc={() => { setPomoWorkTime(t => Math.min(7200, t + 300)); if (pomoMode === 'work' && !isPomoRunning) setPomodoro(t => Math.min(7200, t + 300)); }}
        />
        <Stepper
          label="Break"
          minutes={Math.round(pomoBreakTime / 60)}
          disabled={isPomoRunning}
          onDec={() => { setPomoBreakTime(t => Math.max(60, t - 300)); if (pomoMode === 'break' && !isPomoRunning) setPomodoro(t => Math.max(60, t - 300)); }}
          onInc={() => { setPomoBreakTime(t => Math.min(3600, t + 300)); if (pomoMode === 'break' && !isPomoRunning) setPomodoro(t => Math.min(3600, t + 300)); }}
        />
      </div>
    </div>
  );

  const tasks = (
    <div className="flex flex-col gap-2 min-h-0 flex-1">
      <span className="text-[12px] font-medium text-white/55 px-0.5">Tasks</span>
      <div className={`flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-0.5 select-none ${isSideNotch ? 'max-h-[88px]' : 'max-h-[170px]'}`}>
        <AnimatePresence initial={false}>
          {pomoTasks.map(task => (
            <motion.div
              key={task.id}
              className="group flex items-center justify-between px-2 py-1.5 rounded-[10px] hover:bg-white/[0.06] transition-colors"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <button type="button" className="flex items-center gap-2 min-w-0 flex-grow text-left" onClick={() => handleToggleTask(task.id)}>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${task.completed ? 'bg-white border-white text-black' : 'border-white/30'}`}>
                  {task.completed && <Check size={10} strokeWidth={3} />}
                </span>
                <span className={`text-[12px] truncate ${task.completed ? 'line-through text-white/35' : 'text-white/85'}`}>{task.text}</span>
              </button>
              <button
                type="button"
                aria-label="Delete task"
                className="text-white/0 group-hover:text-white/40 hover:!text-white p-0.5 transition-colors flex-shrink-0"
                onClick={() => handleDeleteTask(task.id)}
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {pomoTasks.length === 0 && (
          <span className="text-[11.5px] text-white/35 px-2 py-2">No tasks yet</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-auto">
        <input
          type="text"
          value={taskInput}
          onChange={e => setTaskInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
          onBlur={handleInputBlur}
          placeholder="Add a task"
          className="flex-grow min-w-0 bg-white/[0.07] rounded-full px-3 h-7 text-[12px] text-white placeholder-white/35 focus:outline-none focus:bg-white/[0.1] transition-colors"
        />
        <button
          type="button"
          aria-label="Add task"
          className="w-7 h-7 rounded-full bg-white/[0.1] hover:bg-white/[0.16] text-white flex items-center justify-center transition-colors flex-shrink-0"
          onClick={handleAddTask}
        >
          <Plus size={13} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      key="pomodoro"
      className="w-full h-full flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {isSideNotch ? (
        <div className="w-full h-full flex flex-col gap-3">
          {timer}
          {tasks}
        </div>
      ) : (
        <div className="w-full h-full flex gap-4">
          <div className="flex-[1.1] min-w-0">{timer}</div>
          <div className="w-px self-stretch bg-white/[0.08] flex-shrink-0" />
          <div className="flex-[0.9] min-w-0 flex flex-col">{tasks}</div>
        </div>
      )}
    </motion.div>
  );
});
