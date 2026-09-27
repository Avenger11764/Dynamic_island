import React from 'react';

/**
 * Apple macOS / iOS SF-Symbols inspired premium hardware and connectivity icons.
 * Crafted with precise geometry, subtle gradients, and authentic detail to eliminate
 * the generic / AI-generated placeholder appearance.
 */

export const CpuChipIcon = ({ size = 12, className = "text-emerald-400" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer silicon carrier package */}
    <rect x="5" y="5" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
    {/* Inner silicon die */}
    <rect x="8.5" y="8.5" width="7" height="7" rx="1" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
    {/* Core silicon core mark */}
    <rect x="10.5" y="10.5" width="3" height="3" rx="0.5" fill="currentColor" />
    
    {/* Top Pins */}
    <line x1="8.5" y1="2" x2="8.5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="15.5" y1="2" x2="15.5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

    {/* Bottom Pins */}
    <line x1="8.5" y1="19" x2="8.5" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="15.5" y1="19" x2="15.5" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

    {/* Left Pins */}
    <line x1="2" y1="8.5" x2="5" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="2" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="2" y1="15.5" x2="5" y2="15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

    {/* Right Pins */}
    <line x1="19" y1="8.5" x2="22" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="19" y1="15.5" x2="22" y2="15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const RamStickIcon = ({ size = 12, className = "text-cyan-400" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* DIMM PCB Module Body */}
    <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
    
    {/* DRAM memory chips (BGA memory packages) */}
    <rect x="5" y="8.5" width="3" height="4.5" rx="0.75" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" />
    <rect x="10.5" y="8.5" width="3" height="4.5" rx="0.75" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" />
    <rect x="16" y="8.5" width="3" height="4.5" rx="0.75" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" />
    
    {/* Gold Finger Connector Contacts at bottom */}
    <line x1="4.5" y1="15.5" x2="4.5" y2="18" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    <line x1="7" y1="15.5" x2="7" y2="18" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    <line x1="9.5" y1="15.5" x2="9.5" y2="18" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    {/* Keying notch gap between pin 9.5 and 14 */}
    <line x1="14.5" y1="15.5" x2="14.5" y2="18" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    <line x1="17" y1="15.5" x2="17" y2="18" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    <line x1="19.5" y1="15.5" x2="19.5" y2="18" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);

export const PremiumHeadphonesIcon = ({ size = 12, className = "text-cyan-400" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Headband arch (smooth Apple AirPods Max style canopy) */}
    <path 
      d="M4.5 13.5V10.5C4.5 6.35786 7.85786 3 12 3C16.1421 3 19.5 6.35786 19.5 10.5V13.5" 
      stroke="currentColor" 
      strokeWidth="1.75" 
      strokeLinecap="round" 
    />
    
    {/* Left Earcup */}
    <rect x="2.5" y="12" width="4.5" height="8" rx="2.25" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.5" />
    
    {/* Right Earcup */}
    <rect x="17" y="12" width="4.5" height="8" rx="2.25" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.5" />

    {/* Acoustic damper interior lines */}
    <line x1="4.75" y1="14.5" x2="4.75" y2="17.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    <line x1="19.25" y1="14.5" x2="19.25" y2="17.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

export const PremiumWifiIcon = ({ size = 12, className = "text-purple-400" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Large outer Wi-Fi wave */}
    <path 
      d="M3 8.2C8.1 3.9 15.9 3.9 21 8.2" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
    />
    {/* Mid Wi-Fi wave */}
    <path 
      d="M6.5 12.3C9.7 9.6 14.3 9.6 17.5 12.3" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
    />
    {/* Inner Wi-Fi wave */}
    <path 
      d="M9.8 16.4C11.1 15.3 12.9 15.3 14.2 16.4" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
    />
    {/* Origin broadcast point */}
    <circle cx="12" cy="19.5" r="1.5" fill="currentColor" />
  </svg>
);

export const PremiumNetworkSpeedIcon = ({ size = 12, className = "text-purple-400" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* macOS duplex network streams */}
    <path d="M7 4V16M7 16L3.5 12.5M7 16L10.5 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 20V8M17 8L13.5 11.5M17 8L20.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PremiumBadge = ({ 
  children, 
  variant = 'blue', 
  size = 'md' 
}) => {
  const styles = {
    green: 'bg-gradient-to-b from-emerald-500/25 to-emerald-600/10 border-emerald-400/30 text-emerald-400 shadow-[0_2px_8px_-1px_rgba(16,185,129,0.25)]',
    blue: 'bg-gradient-to-b from-cyan-500/25 to-blue-600/10 border-cyan-400/30 text-cyan-400 shadow-[0_2px_8px_-1px_rgba(6,182,212,0.25)]',
    purple: 'bg-gradient-to-b from-purple-500/25 to-indigo-600/10 border-purple-400/30 text-purple-400 shadow-[0_2px_8px_-1px_rgba(168,85,247,0.25)]',
    amber: 'bg-gradient-to-b from-amber-500/25 to-orange-600/10 border-amber-400/30 text-amber-400 shadow-[0_2px_8px_-1px_rgba(245,158,11,0.25)]',
    white: 'bg-gradient-to-b from-white/15 to-white/5 border-white/20 text-white/90 shadow-[0_2px_8px_-1px_rgba(255,255,255,0.1)]'
  };

  const sizeClasses = {
    sm: 'w-5 h-5 rounded-[7px]',
    md: 'w-6 h-6 rounded-[8px]',
    lg: 'w-7 h-7 rounded-[10px]'
  };

  return (
    <div className={`${sizeClasses[size] || sizeClasses.md} ${styles[variant] || styles.blue} flex items-center justify-center border flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] transition-transform duration-150`}>
      {children}
    </div>
  );
};
