import React from 'react';

/**
 * Animated weather glyphs.
 *
 * Motion is plain CSS (`wx-*` in index.css): transform/opacity only and in
 * small steps, so frames are only drawn when something moves. Each moving part
 * is its own layer, and the animation sits on the HTML wrapper rather than the
 * <svg>: Chromium only runs those on the compositor for HTML elements.
 */
const Svg = ({ size, className = '', strokeWidth = 2, style, children, ...rest }) => (
  <span className={`flex ${className}`} style={style}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  </span>
);

const CLOUD = 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z';
const SUN_RAYS = 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41';

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
        <Svg size={size} strokeWidth={2.5} className="text-yellow-400 wx-spin">
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
          <path d={SUN_RAYS} />
        </Svg>
      </div>
    );
  }

  // Stormy State (Lightning flash + Rain)
  if (isStorm) {
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <Svg size={size} className="text-slate-400">
          <path d={CLOUD} fill="currentColor" fillOpacity="0.1" />
        </Svg>
        {/* Lightning bolt with quick flashing scale/opacity animation */}
        <Svg size={size} className="absolute inset-0 text-yellow-400 wx-bolt">
          <path d="m13 18-3 4v-4H8l5-6v4h2l-2 2" fill="currentColor" />
        </Svg>
      </div>
    );
  }

  // Rainy State (Cloud with falling drops)
  if (isRain) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={{ width: size, height: size }}>
        <Svg size={size} className="text-blue-400">
          <path d={CLOUD} fill="currentColor" fillOpacity="0.1" />
        </Svg>
        {['M8 22v-3', 'M12 22v-3', 'M16 22v-3'].map((d, i) => (
          <Svg key={d} size={size} className="absolute inset-0 text-cyan-300 wx-drop" style={{ animationDelay: `${-1.2 + i * 0.4}s` }}>
            <path d={d} />
          </Svg>
        ))}
      </div>
    );
  }

  // Snowy State (Cloud with drifting snowflakes)
  if (isSnow) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={{ width: size, height: size }}>
        <Svg size={size} className="text-blue-200">
          <path d={CLOUD} fill="currentColor" fillOpacity="0.1" />
        </Svg>
        <Svg size={size} strokeWidth={3.5} className="absolute inset-0 text-white wx-flake">
          <path d="M8 20h.01M16 20h.01" />
        </Svg>
        <Svg size={size} strokeWidth={3.5} className="absolute inset-0 text-white wx-flake-dim" style={{ animationDelay: '-1.1s' }}>
          <path d="M12 21.5h.01" />
        </Svg>
      </div>
    );
  }

  // Cloudy / Overcast / Partly Cloudy State (Soft cloud drifting)
  if (isCloudy) {
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <Svg size={size} strokeWidth={2.2} className="text-slate-300 wx-sway">
          <path d={CLOUD} fill="currentColor" fillOpacity="0.15" />
        </Svg>
      </div>
    );
  }

  // Default Fallback (Rotating Sun behind a Cloud)
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Sun */}
      <Svg size={size * 0.75} strokeWidth={2.5} strokeLinecap={undefined} strokeLinejoin={undefined} className="text-yellow-400 absolute top-[-2px] left-[-2px] wx-spin-slow">
        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
        <path d={SUN_RAYS} />
      </Svg>
      {/* Cloud */}
      <Svg size={size} strokeWidth={2.2} strokeLinecap={undefined} strokeLinejoin={undefined} className="text-slate-300 absolute wx-sway-sm">
        <path d={CLOUD} fill="currentColor" fillOpacity="0.15" />
      </Svg>
    </div>
  );
}
