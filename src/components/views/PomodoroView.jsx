import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, RotateCcw, Play, Pause, Trash2 } from 'lucide-react';

export const PomodoroView = React.memo(({
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
  return (
    <motion.div
      key="pomodoro"
      className="w-full flex flex-col justify-start h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full flex gap-4 h-full items-start justify-between">
        {/* Left Side: Pomodoro Timer & Customization */}
        <div className="flex flex-col flex-[1.1] gap-2.5 text-left">
          <div className="flex items-center justify-between">
            <div className="flex bg-white/10 rounded-full p-0.5">
              <button
                type="button"
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                  pomoMode === 'work' ? 'bg-red-500 text-white' : 'text-white/50'
                }`}
                onClick={() => switchPomoMode('work')}
              >
                Work
              </button>
              <button
                type="button"
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                  pomoMode === 'break' ? 'bg-green-500 text-white' : 'text-white/50'
                }`}
                onClick={() => switchPomoMode('break')}
              >
                Break
              </button>
            </div>
            <span className="text-[9px] text-white/40 uppercase tracking-wider font-mono">
              Sessions
            </span>
          </div>

          <div className="flex flex-col gap-1.5 bg-white/5 p-2 rounded-xl border border-white/5">
            <div className="flex items-center justify-between text-[10px] font-bold text-white/50">
              <span>Work Duration</span>
              <span>{Math.round(pomoWorkTime / 60)}m</span>
            </div>
            <div className="flex items-center justify-between gap-1 w-full mt-0.5">
              <button
                type="button"
                aria-label="Decrease Work Duration"
                className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors disabled:opacity-20"
                onClick={() => {
                  setPomoWorkTime(t => Math.max(300, t - 300));
                  if (pomoMode === 'work' && !isPomoRunning) {
                    setPomodoro(t => Math.max(300, t - 300));
                  }
                }}
                disabled={isPomoRunning}
              >
                <Minus size={10} />
              </button>
              <div className="h-1 bg-white/10 rounded-full flex-grow mx-1.5 overflow-hidden">
                <div
                  className="h-full bg-red-400"
                  style={{ width: `${Math.min(100, (pomoWorkTime / 3600) * 100)}%` }}
                />
              </div>
              <button
                type="button"
                aria-label="Increase Work Duration"
                className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors disabled:opacity-20"
                onClick={() => {
                  setPomoWorkTime(t => Math.min(7200, t + 300));
                  if (pomoMode === 'work' && !isPomoRunning) {
                    setPomodoro(t => Math.min(7200, t + 300));
                  }
                }}
                disabled={isPomoRunning}
              >
                <Plus size={10} />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold text-white/50 mt-1">
              <span>Break Duration</span>
              <span>{Math.round(pomoBreakTime / 60)}m</span>
            </div>
            <div className="flex items-center justify-between gap-1 w-full mt-0.5">
              <button
                type="button"
                aria-label="Decrease Break Duration"
                className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors disabled:opacity-20"
                onClick={() => {
                  setPomoBreakTime(t => Math.max(60, t - 300));
                  if (pomoMode === 'break' && !isPomoRunning) {
                    setPomodoro(t => Math.max(60, t - 300));
                  }
                }}
                disabled={isPomoRunning}
              >
                <Minus size={10} />
              </button>
              <div className="h-1 bg-white/10 rounded-full flex-grow mx-1.5 overflow-hidden">
                <div
                  className="h-full bg-green-400"
                  style={{ width: `${Math.min(100, (pomoBreakTime / 1800) * 100)}%` }}
                />
              </div>
              <button
                type="button"
                aria-label="Increase Break Duration"
                className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors disabled:opacity-20"
                onClick={() => {
                  setPomoBreakTime(t => Math.min(3600, t + 300));
                  if (pomoMode === 'break' && !isPomoRunning) {
                    setPomodoro(t => Math.min(3600, t + 300));
                  }
                }}
                disabled={isPomoRunning}
              >
                <Plus size={10} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between w-full mt-1 bg-white/5 p-1.5 rounded-xl border border-white/5">
            <div className="flex flex-col text-left pl-1">
              <span className="text-[11px] font-bold text-white/50 leading-tight">
                Session Time
              </span>
              <span className="text-[20px] font-mono font-black tracking-wide text-white leading-none mt-1">
                {String(Math.floor(pomodoro / 60)).padStart(2, '0')}:
                {String(pomodoro % 60).padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/70"
                onClick={resetPomo}
                title="Reset Timer"
              >
                <RotateCcw size={12} />
              </button>
              <button
                type="button"
                aria-label={isPomoRunning ? "Pause Pomodoro" : "Start Pomodoro"}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors text-white shadow ${
                  pomoMode === 'work'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                onClick={togglePomo}
              >
                {isPomoRunning ? (
                  <Pause size={14} />
                ) : (
                  <Play size={14} className="translate-x-[0.5px]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="w-px self-stretch bg-white/10 flex-shrink-0" />

        {/* Right Side: Mini Task Checklist */}
        <div className="flex flex-col flex-[0.9] h-full gap-2 text-left overflow-hidden">
          <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase font-bold pl-1">
            Checklist
          </span>

          {/* Task List Container */}
          <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-1.5 max-h-[190px] pr-1 select-none">
            <AnimatePresence initial={false}>
              {pomoTasks.map(task => (
                <motion.div
                  key={task.id}
                  className="flex items-center justify-between bg-white/5 p-1.5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div
                    className="flex items-center gap-2 overflow-hidden flex-grow cursor-pointer"
                    onClick={() => handleToggleTask(task.id)}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        task.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-white/30 bg-transparent'
                      }`}
                    >
                      {task.completed && <span className="text-[8px] font-black">✓</span>}
                    </div>
                    <span
                      className={`text-[10px] truncate leading-none ${
                        task.completed ? 'line-through text-white/30' : 'text-white/80'
                      }`}
                    >
                      {task.text}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete Task"
                    className="text-white/30 hover:text-red-400 p-0.5 transition-colors flex-shrink-0"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 size={10} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {pomoTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-white/20 py-8">
                <span className="text-[10px] font-bold">No tasks yet</span>
              </div>
            )}
          </div>

          {/* Input box */}
          <div className="flex items-center gap-1.5 mt-auto pt-1 bg-inherit">
            <input
              type="text"
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddTask();
              }}
              onBlur={handleInputBlur}
              placeholder="New task..."
              className="flex-grow bg-white/5 border border-white/5 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
            />
            <button
              type="button"
              aria-label="Add Task"
              className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              onClick={handleAddTask}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
