import React, { createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Rocket, X, Bell, Sparkles, ArrowDownToLine } from 'lucide-react';
import { BatteryRing } from '../ui/Glyphs';

// When the notch is docked to a side, banners stack vertically (like the
// volume and Bluetooth popups) instead of stretching sideways.
const VerticalContext = createContext(false);

const Banner = ({ motionKey, leading, title, subtitle, trailing, children }) => {
  const vertical = useContext(VerticalContext);
  if (vertical) {
    return (
      <motion.div
        key={motionKey}
        className="w-full h-full px-2.5 py-4 flex flex-col items-center justify-center text-center gap-2.5 z-10"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
      >
        <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0 text-white">
          {leading}
        </div>
        <div className="flex flex-col items-center min-w-0 w-full gap-1">
          <span className="text-[12.5px] font-semibold text-white leading-tight line-clamp-2 break-words w-full">{title}</span>
          {subtitle && <span className="text-[11px] text-white/55 leading-snug line-clamp-3 break-words w-full">{subtitle}</span>}
        </div>
        {trailing}
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div
      key={motionKey}
      className="w-full h-full px-3 py-2 flex flex-col justify-center gap-2 z-10"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0 text-white">
          {leading}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[13px] font-semibold text-white truncate leading-tight">{title}</span>
          {subtitle && <span className="text-[11.5px] text-white/55 truncate leading-tight mt-0.5">{subtitle}</span>}
        </div>
        {trailing}
      </div>
      {children}
    </motion.div>
  );
};

const DismissButton = ({ onClick, size = 7 }) => (
  <button
    type="button"
    aria-label="Dismiss"
    className={`${size === 6 ? 'w-6 h-6' : 'w-7 h-7'} rounded-full hover:bg-white/[0.1] flex items-center justify-center text-white/45 hover:text-white transition-colors flex-shrink-0`}
    onClick={(e) => { e.stopPropagation(); onClick?.(); }}
  >
    <X size={13} />
  </button>
);

const formatEta = (seconds, charging) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const mins = Math.round(seconds / 60);
  const text = mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`;
  return charging ? `Full in ${text}` : `${text} left`;
};

export const BatteryAlert = React.memo(({ batteryEvent }) => {
  const vertical = useContext(VerticalContext);
  if (!batteryEvent) return null;
  const { level, charging, low } = batteryEvent;
  const title = low ? 'Battery low' : (charging ? 'Charging' : 'On battery');
  const eta = formatEta(batteryEvent.seconds, charging);
  const subtitle = eta || (charging ? 'Connected to power' : (low ? 'Plug in soon' : 'Running on battery'));
  const color = charging ? '#34C759' : (low || level <= 20 ? '#FF453A' : '#ffffff');

  if (vertical) {
    return (
      <Banner
        motionKey="battery-state"
        leading={<BatteryRing level={level} charging={charging} size={22} />}
        title={`${title} · ${level}%`}
        subtitle={subtitle}
      />
    );
  }

  return (
    <motion.div
      key="battery-state"
      className="w-full h-full px-4 flex flex-col justify-center gap-2 z-10"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <BatteryRing level={level} charging={charging} size={30} stroke={3} />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[14px] font-semibold text-white leading-tight">{title}</span>
          <span className="text-[11.5px] text-white/55 leading-tight mt-0.5 truncate">{subtitle}</span>
        </div>
        <span className="font-display text-[24px] font-semibold leading-none" style={{ color: charging || low ? color : '#fff' }}>
          {level}<span className="text-[14px] text-white/55 ml-0.5">%</span>
        </span>
      </div>
      <div className="h-[3px] rounded-full bg-white/[0.08] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${level}%` }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>
    </motion.div>
  );
});

export const MeetingAlert = React.memo(({ meetingAlert, onClose }) => {
  if (!meetingAlert) return null;
  return (
    <Banner
      motionKey="meeting-state"
      leading={<Calendar size={16} strokeWidth={1.9} />}
      title={meetingAlert.title}
      subtitle={`Starting soon · ${meetingAlert.platform}`}
      trailing={
        <button
          type="button"
          className="bg-[#30D158] hover:brightness-110 text-black px-3.5 h-7 rounded-full text-[12px] font-semibold transition flex-shrink-0"
          onClick={onClose}
        >
          Join
        </button>
      }
    />
  );
});

export const BoostAlert = React.memo(({ isBoosting, boostAlert, boostProgress }) => {
  if (isBoosting) {
    return (
      <Banner
        motionKey="boosting-state"
        leading={<Rocket size={16} strokeWidth={1.9} />}
        title="Optimizing memory…"
        subtitle={boostProgress ? `${boostProgress.name} · ${boostProgress.mb} MB` : 'Scanning apps'}
      >
        <div className="w-full h-[3px] bg-white/[0.1] rounded-full overflow-hidden relative">
          <motion.div
            className="absolute top-0 left-0 h-full bg-white/80 w-1/3 rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: '300%' }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </Banner>
    );
  }

  if (boostAlert) {
    return (
      <Banner
        motionKey="boost-state"
        leading={<Rocket size={16} strokeWidth={1.9} />}
        title="Memory optimized"
        subtitle={boostAlert.freedMB >= 50 ? `${boostAlert.freedMB.toLocaleString()} MB freed from ${boostAlert.apps} apps` : 'Already running lean'}
      />
    );
  }

  return null;
});

export const SysNotificationAlert = React.memo(({ sysNotification, onClose }) => {
  const vertical = useContext(VerticalContext);
  if (!sysNotification) return null;
  const app = sysNotification.appName || 'Notification';
  const icon = sysNotification.appName
    ? <span className="text-[12px] font-semibold">{sysNotification.appName.slice(0, 1).toUpperCase()}</span>
    : <Bell size={15} strokeWidth={1.9} />;

  if (vertical) {
    return (
      <Banner
        motionKey="sys-notification"
        leading={icon}
        title={sysNotification.title || 'Alert'}
        subtitle={[app, sysNotification.message].filter(Boolean).join(' · ')}
        trailing={<DismissButton onClick={onClose} />}
      />
    );
  }

  return (
    <motion.div
      key="sys-notification"
      className="w-full h-full px-3 py-2.5 flex items-start gap-3 z-10"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
    >
      <div className="w-9 h-9 rounded-[10px] bg-white/[0.08] flex items-center justify-center flex-shrink-0 text-white/80">{icon}</div>
      <div className="flex flex-col min-w-0 flex-grow text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-white/50 truncate">{app}</span>
          <span className="text-[11px] text-white/30 flex-shrink-0">now</span>
        </div>
        <span className="text-[12.5px] font-semibold text-white truncate leading-tight mt-0.5">{sysNotification.title || 'Alert'}</span>
        {sysNotification.message && (
          <span className="text-[11.5px] text-white/60 line-clamp-2 leading-snug mt-0.5">{sysNotification.message}</span>
        )}
      </div>
      <DismissButton onClick={onClose} size={6} />
    </motion.div>
  );
});

/** One-time "Update available" / "What's new" notice. */
export const AppNoticeBanner = React.memo(({ notice, onAction, onClose }) => {
  const vertical = useContext(VerticalContext);
  if (!notice) return null;
  const isUpdate = notice.kind === 'update';
  const actions = (
    <div className={`flex items-center gap-1 ${vertical ? 'justify-center' : 'flex-shrink-0'}`}>
      <button
        type="button"
        className="h-7 px-3 rounded-full bg-white text-black text-[12px] font-semibold hover:bg-white/90 transition-colors"
        onClick={(e) => { e.stopPropagation(); onAction?.(notice); }}
      >
        {isUpdate ? 'Update' : 'What’s new'}
      </button>
      <DismissButton onClick={() => onClose?.(notice.kind)} />
    </div>
  );
  return (
    <Banner
      motionKey={`app-notice-${notice.kind}`}
      leading={isUpdate ? <ArrowDownToLine size={16} strokeWidth={1.9} /> : <Sparkles size={16} strokeWidth={1.9} />}
      title={isUpdate ? `Smart Notch ${notice.version} is available` : `Updated to ${notice.version}`}
      subtitle={notice.detail}
      trailing={actions}
    />
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
  setSysNotification,
  appNotice,
  onAppNoticeAction,
  onAppNoticeClose,
  vertical = false
}) => {
  let content = null;
  if (batteryEvent) content = <BatteryAlert batteryEvent={batteryEvent} />;
  else if (meetingAlert) content = <MeetingAlert meetingAlert={meetingAlert} onClose={() => setMeetingAlert(null)} />;
  else if (isBoosting || boostAlert) content = <BoostAlert isBoosting={isBoosting} boostAlert={boostAlert} boostProgress={boostProgress} />;
  else if (sysNotification) content = <SysNotificationAlert sysNotification={sysNotification} onClose={() => setSysNotification(null)} />;
  else if (appNotice) content = <AppNoticeBanner notice={appNotice} onAction={onAppNoticeAction} onClose={onAppNoticeClose} />;
  return <VerticalContext.Provider value={vertical}>{content}</VerticalContext.Provider>;
});

export default NotificationBanners;
