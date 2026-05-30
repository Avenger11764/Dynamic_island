import React from 'react';
import { motion } from 'framer-motion';

export default function WeatherIcon({ desc, size = 16, className = "" }) {
  const normalizedDesc = (desc || '').toLowerCase();

  const isClear = normalizedDesc.includes('sunny') || normalizedDesc.includes('clear');
  const isStorm = normalizedDesc.includes('thunder') || normalizedDesc.includes('storm');
  const isRain = normalizedDesc.includes('rain') || normalizedDesc.includes('drizzle') || normalizedDesc.includes('shower') || normalizedDesc.includes('patchy rain');
  const isSnow = normalizedDesc.includes('snow') || normalizedDesc.includes('sleet') || normalizedDesc.includes('ice') || normalizedDesc.includes('blizzard');
  const isCloudy = normalizedDesc.includes('cloud') || normalizedDesc.includes('overcast') || normalizedDesc.includes('mist') || normalizedDesc.includes('fog') || normalizedDesc.includes('haze');

  // Sunny / Clear State (Rotating Sun)
  if (isClear) {
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-yellow-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </motion.svg>
      </div>
    );
  }

  // Stormy State (Lightning flash + Rain)
  if (isStorm) {
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="currentColor" fillOpacity="0.1" />
          {/* Lightning bolt with quick flashing scale/opacity animation */}
          <motion.path
            d="m13 18-3 4v-4H8l5-6v4h2l-2 2"
            className="text-yellow-400"
            fill="currentColor"
            animate={{ 
              opacity: [1, 0.2, 1, 1, 0.1, 1, 0.9, 1],
              scale: [1, 0.95, 1, 1, 0.9, 1, 1, 1] 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut",
              times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 1]
            }}
          />
        </svg>
      </div>
    );
  }

  // Rainy State (Cloud with falling drops)
  if (isRain) {
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="currentColor" fillOpacity="0.1" />
          {/* Rain drop 1 */}
          <motion.path
            d="M8 22v-3"
            className="text-cyan-300"
            animate={{ y: [0, 4, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0 }}
          />
          {/* Rain drop 2 */}
          <motion.path
            d="M12 22v-3"
            className="text-cyan-300"
            animate={{ y: [0, 4, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.4 }}
          />
          {/* Rain drop 3 */}
          <motion.path
            d="M16 22v-3"
            className="text-cyan-300"
            animate={{ y: [0, 4, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.8 }}
          />
        </svg>
      </div>
    );
  }

  // Snowy State (Cloud with drifting/rotating snowflakes)
  if (isSnow) {
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-200">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="currentColor" fillOpacity="0.1" />
          {/* Snowflake 1 */}
          <motion.path
            d="M8 20h.01M16 20h.01"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="text-white"
            animate={{ y: [0, 3, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Snowflake 2 */}
          <motion.path
            d="M12 21.5h.01"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="text-white"
            animate={{ y: [0, 3, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
          />
        </svg>
      </div>
    );
  }

  // Cloudy / Overcast / Partly Cloudy State (Soft cloud drifting)
  if (isCloudy) {
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-300"
          animate={{ x: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="currentColor" fillOpacity="0.15" />
        </motion.svg>
      </div>
    );
  }

  // Default Fallback (Rotating Sun behind a Cloud)
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Sun */}
      <motion.svg
        width={size * 0.75}
        height={size * 0.75}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-yellow-400 absolute top-[-2px] left-[-2px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </motion.svg>
      {/* Cloud */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        className="text-slate-300 absolute"
        animate={{ x: [-0.5, 0.5, -0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="currentColor" fillOpacity="0.15" />
      </motion.svg>
    </div>
  );
}
