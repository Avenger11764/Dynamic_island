import React from 'react';
import { motion } from 'framer-motion';
import { Battery, BatteryCharging, Calendar, Rocket, X } from 'lucide-react';

export const BatteryAlert = React.memo(({ batteryEvent }) => {
  if (!batteryEvent) return null;
  return (
    <motion.div key="battery-state" className="w-full h-full p-4 flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full ${batteryEvent.low ? 'bg-red-500/20 text-red-500' : (batteryEvent.charging ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')} flex items-center justify-center flex-shrink-0 animate-pulse`}>
          {batteryEvent.charging ? <BatteryCharging size={24} /> : <Battery size={24} />}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg">{batteryEvent.low ? 'Battery Low' : (batteryEvent.charging ? 'Charging started' : 'Power Disconnected')}</span>
          <span className="text-sm text-white/50">{batteryEvent.level}% remaining</span>
        </div>
      </div>
    </motion.div>
  );
});

export const MeetingAlert = React.memo(({ meetingAlert, onClose }) => {
  if (!meetingAlert) return null;
  return (
    <motion.div key="meeting-state" className="w-full h-full p-2 flex flex-col justify-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-3 px-2 mb-2">
        <Calendar size={18} className="text-blue-400" />
        <span className="font-bold text-sm">Meeting Starting Soon</span>
      </div>
      <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between border border-white/5 w-full">
        <div className="flex flex-col max-w-[200px]">
          <span className="text-sm font-semibold truncate">{meetingAlert.title}</span>
          <span className="text-xs text-white/50">via {meetingAlert.platform}</span>
        </div>
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-lg" onClick={onClose}>
          Join
        </button>
      </div>
    </motion.div>
  );
});

export const BoostAlert = React.memo(({ isBoosting, boostAlert, boostProgress }) => {
  if (isBoosting) {
    return (
      <motion.div key="boosting-state" className="w-full h-full p-2 flex items-center justify-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
          <Rocket size={24} className="animate-ping" />
        </div>
        <div className="flex flex-col w-48">
          <span className="font-bold text-lg text-white">Boosting System...</span>
          <span className="text-sm text-cyan-300 truncate">
            {boostProgress ? `Killed ${boostProgress.name} (-${boostProgress.mb}MB, -${boostProgress.cpu}% CPU)` : 'Scanning memory...'}
          </span>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2 relative">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-cyan-400 w-1/3 rounded-full" 
              initial={{ x: "-100%" }} 
              animate={{ x: "300%" }} 
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }} 
            />
          </div>
        </div>
      </motion.div>
    );
  }

  if (boostAlert) {
    return (
      <motion.div key="boost-state" className="w-full h-full p-2 flex items-center justify-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
          <Rocket size={24} className="animate-bounce" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg text-white">System Boosted</span>
          <span className="text-sm text-cyan-300">Freed {boostAlert.freedMB} MB RAM & {boostAlert.freedCPU}% CPU</span>
        </div>
      </motion.div>
    );
  }

  return null;
});

export const SysNotificationAlert = React.memo(({ sysNotification, onClose }) => {
  if (!sysNotification) return null;
  return (
    <motion.div key="sys-notification" className="w-full h-full p-3 flex flex-col justify-center gap-1.5 z-10" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase tracking-wider">
          {sysNotification.appName ? sysNotification.appName.slice(0, 2) : 'NT'}
        </div>
        <div className="flex flex-col overflow-hidden text-left flex-grow">
          <div className="flex items-center gap-1.5 justify-between">
            <span className="font-bold text-[10px] text-green-400 uppercase tracking-widest truncate max-w-[180px]">{sysNotification.appName || 'Notification'}</span>
            <span className="text-[9px] text-white/40 flex-shrink-0">• Just Now</span>
          </div>
          <span className="font-bold text-xs text-white/90 truncate mt-0.5">{sysNotification.title || 'Alert'}</span>
        </div>
        <button className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors" onClick={onClose}>
          <X size={12} />
        </button>
      </div>
      <span className="text-[10px] text-white/60 line-clamp-2 pl-[38px] leading-relaxed text-left">{sysNotification.message}</span>
    </motion.div>
  );
});

export const NotificationBanners = React.memo(({
  batteryEvent,
  meetingAlert,
  setMeetingAlert,
  isBoosting,
  boostAlert,
  boostProgress,
  sysNotification,
  setSysNotification
}) => {
  if (batteryEvent) {
    return <BatteryAlert batteryEvent={batteryEvent} />;
  }
  if (meetingAlert) {
    return <MeetingAlert meetingAlert={meetingAlert} onClose={() => setMeetingAlert(null)} />;
  }
  if (isBoosting || boostAlert) {
    return <BoostAlert isBoosting={isBoosting} boostAlert={boostAlert} boostProgress={boostProgress} />;
  }
  if (sysNotification) {
    return <SysNotificationAlert sysNotification={sysNotification} onClose={() => setSysNotification(null)} />;
  }
  return null;
});

export default NotificationBanners;

