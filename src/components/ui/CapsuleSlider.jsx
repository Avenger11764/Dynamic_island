import React, { useRef, useState, useEffect, useCallback } from 'react';

export const CapsuleSlider = React.memo(({ 
  icon: Icon, 
  label, 
  value, 
  onChange, 
  onWheel, 
  min = 0, 
  max = 100, 
  accentGrad = "from-white to-white/95"
}) => {
  const trackRef = useRef(null);
  const [internalVal, setInternalVal] = useState(value);
  const isDraggingRef = useRef(false);
  const rectRef = useRef(null);
  const pendingRafRef = useRef(null);
  const lastDispatchedRef = useRef(value);

  // Sync internal state when parent updates value and user is not dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setInternalVal(value);
      lastDispatchedRef.current = value;
    }
  }, [value]);

  const calcValFromClientX = useCallback((clientX) => {
    const rect = rectRef.current || (trackRef.current ? trackRef.current.getBoundingClientRect() : null);
    if (!rect || rect.width <= 0) return internalVal;
    const clampedX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = clampedX / rect.width;
    const percentage = Math.round(ratio * (max - min) + min);
    return Math.max(min, Math.min(max, percentage));
  }, [min, max, internalVal]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (e.button !== 0 && e.buttons !== 1) return; // Left mouse button only
    
    isDraggingRef.current = true;
    
    // Cache bounding rect for 0-latency tracking without forced reflows
    if (trackRef.current) {
      rectRef.current = trackRef.current.getBoundingClientRect();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    const newVal = calcValFromClientX(e.clientX);
    setInternalVal(newVal);
    lastDispatchedRef.current = newVal;
    onChange(newVal);

    const onPointerMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      moveEvent.stopPropagation();
      
      const updated = calcValFromClientX(moveEvent.clientX);
      setInternalVal(updated);

      if (updated !== lastDispatchedRef.current) {
        lastDispatchedRef.current = updated;
        if (!pendingRafRef.current) {
          pendingRafRef.current = requestAnimationFrame(() => {
            onChange(lastDispatchedRef.current);
            pendingRafRef.current = null;
          });
        }
      }
    };

    const onPointerUp = (upEvent) => {
      isDraggingRef.current = false;
      rectRef.current = null;
      if (pendingRafRef.current) {
        cancelAnimationFrame(pendingRafRef.current);
        pendingRafRef.current = null;
      }
      try {
        if (upEvent.target && upEvent.target.releasePointerCapture) {
          upEvent.target.releasePointerCapture(upEvent.pointerId);
        }
      } catch (_) {}

      // Ensure the final value is dispatched immediately
      const finalVal = calcValFromClientX(upEvent.clientX);
      setInternalVal(finalVal);
      onChange(finalVal);

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const displayVal = isDraggingRef.current ? internalVal : value;
  const pct = Math.max(0, Math.min(100, ((displayVal - min) / (max - min)) * 100));

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onWheel={(e) => {
        e.stopPropagation();
        if (onWheel) onWheel(e);
      }}
      className="relative w-full h-11 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] cursor-pointer select-none overflow-hidden flex items-center justify-between px-3 border border-white/[0.09] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] no-drag"
      style={{ touchAction: 'none', WebkitAppRegion: 'no-drag' }}
    >
      {/* Liquid Fill Pill - zero transition during drag for 0ms visual tracking */}
      <div
        className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${accentGrad} ${
          isDraggingRef.current ? 'transition-none' : 'transition-[width] duration-100 ease-out'
        } shadow-[0_0_12px_rgba(255,255,255,0.15)] pointer-events-none`}
        style={{ width: `${pct}%`, opacity: pct > 0 ? 1 : 0 }}
      />

      {/* Leading Icon & Label */}
      <div className="relative z-10 flex items-center gap-2.5 pointer-events-none select-none">
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors duration-150 ${pct > 18 ? 'text-black/80' : 'text-white/80'}`}>
          <Icon size={16} strokeWidth={2.2} />
        </div>
        <span className={`text-xs font-semibold tracking-wide transition-colors duration-150 ${pct > 38 ? 'text-black/90 font-bold' : 'text-white/90'}`}>
          {label}
        </span>
      </div>

      {/* Percentage Indicator */}
      <span className={`relative z-10 text-xs font-mono font-bold tracking-tight transition-colors duration-150 pointer-events-none select-none ${pct > 86 ? 'text-black/90' : 'text-white/70'}`}>
        {displayVal}%
      </span>
    </div>
  );
});

export default CapsuleSlider;
