import React from 'react';
import { Music } from 'lucide-react';

export const SourceAppIcon = ({ appId, size = 14, className = "" }) => {
  const name = String(appId || '').toLowerCase();
  if (name.includes('spotify')) {
    return (
      <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 text-[#1DB954] fill-current ${className}`}>
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.668-.135-.744-.47-.077-.337.135-.668.47-.745 3.856-.88 7.15-.502 9.82 1.13.295.18.387.563.207.86zm1.224-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.077-1.182-.413.125-.847-.107-.972-.52-.125-.413.108-.847.52-.972 3.67-1.114 8.243-.574 11.343 1.332.368.228.488.708.26 1.074zm.11-2.828C14.317 8.71 8.354 8.512 4.9 9.56c-.53.16-1.09-.14-1.25-.67-.16-.53.14-1.09.67-1.25 3.96-1.202 10.53-.98 14.656 1.474.48.284.636.9.35 1.38-.284.48-.9.637-1.38.35z"/>
      </svg>
    );
  }
  if (name.includes('youtube') || name.includes('chrome') || name.includes('edge') || name.includes('msedge') || name.includes('brave') || name.includes('firefox')) {
    return (
      <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 text-red-500 fill-current ${className}`}>
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.513 3.545 12 3.545 12 3.545s-7.512 0-9.387.51A3.004 3.004 0 0 0 .503 6.163C0 8.046 0 12 0 12s0 3.954.503 5.837a3.003 3.003 0 0 0 2.11 2.107c1.875.51 9.387.51 9.387.51s7.513 0 9.388-.51a3.003 3.003 0 0 0 2.11-2.107C24 15.954 24 12 24 12s0-3.954-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }
  return <Music size={size} className={`text-white/70 ${className}`} />;
};

export default SourceAppIcon;
