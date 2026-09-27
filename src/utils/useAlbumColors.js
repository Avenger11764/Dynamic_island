import { useState, useEffect, useRef } from 'react';

/**
 * Extract 2-3 vibrant, saturated dominant colors from an album art image.
 * Uses a weighted hue-histogram clustering to find the richest accent colors
 * (e.g. bright emerald green, ruby red, vibrant amber) matching Apple Dynamic Island.
 */
export function useAlbumColors(imageUrl) {
  const [colors, setColors] = useState(['#10b981', '#06b6d4', '#6366f1']);
  const lastUrl = useRef('');

  useEffect(() => {
    if (!imageUrl || imageUrl === lastUrl.current) return;
    lastUrl.current = imageUrl;

    const img = new Image();
    // Do not set crossOrigin for data: or local file: URLs
    if (imageUrl.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 24; // 24x24 = 576 pixels for accurate color distribution
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Group into 12 hue buckets (30° each)
        const buckets = Array.from({ length: 12 }, () => ({
          r: 0, g: 0, b: 0, count: 0, score: 0
        }));

        let totalValid = 0;
        let avgR = 0, avgG = 0, avgB = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const d = max - min;
          const l = (max + min) / (2 * 255);
          const s = d === 0 ? 0 : d / (255 * (1 - Math.abs(2 * l - 1)));

          // Skip nearly black, nearly white, or pure grey
          if (l < 0.1 || l > 0.92 || s < 0.12) continue;

          let h;
          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) % 6;
          else if (max === g) h = (b - r) / d + 2;
          else h = (r - g) / d + 4;
          h *= 60;

          const bucketIdx = Math.floor(h / 30) % 12;
          // Score prioritizes vivid saturated colors in mid-lightness range
          const weight = s * s * (1 - Math.abs(l - 0.5) * 1.5);
          if (weight <= 0) continue;

          buckets[bucketIdx].r += r * weight;
          buckets[bucketIdx].g += g * weight;
          buckets[bucketIdx].b += b * weight;
          buckets[bucketIdx].count += weight;
          buckets[bucketIdx].score += weight;

          avgR += r;
          avgG += g;
          avgB += b;
          totalValid++;
        }

        const ranked = buckets
          .map((b, i) => ({
            idx: i,
            r: b.count > 0 ? Math.round(b.r / b.count) : 0,
            g: b.count > 0 ? Math.round(b.g / b.count) : 0,
            b: b.count > 0 ? Math.round(b.b / b.count) : 0,
            score: b.score
          }))
          .filter(b => b.score > 0)
          .sort((a, b) => b.score - a.score);

        if (ranked.length === 0) {
          // Fallback if no colorful pixels found (e.g. B&W album art)
          if (totalValid > 0) {
            const r = Math.round(avgR / totalValid);
            const g = Math.round(avgG / totalValid);
            const b = Math.round(avgB / totalValid);
            setColors([rgbToHex(r, g, b), '#22c55e', '#3b82f6']);
          }
          return;
        }

        // Primary color: the most vibrant / dominant bucket
        const primary = ranked[0];

        // Secondary color: pick another bucket with sufficient hue distance (>= 60°)
        let secondary = ranked.find(b => Math.abs(b.idx - primary.idx) >= 2 && Math.abs(b.idx - primary.idx) <= 10);
        if (!secondary && ranked.length > 1) {
          secondary = ranked[1];
        }

        // Tertiary color: third bucket or complement
        let tertiary = ranked.find(b => b !== primary && b !== secondary);

        const c1 = ensureVibrancy([primary.r, primary.g, primary.b]);
        const c2 = secondary ? ensureVibrancy([secondary.r, secondary.g, secondary.b]) : shiftHue(c1, 40);
        const c3 = tertiary ? ensureVibrancy([tertiary.r, tertiary.g, tertiary.b]) : shiftHue(c1, -40);

        setColors([
          rgbToHex(...c1),
          rgbToHex(...c2),
          rgbToHex(...c3),
        ]);
      } catch (e) {
        // Fallback silently if canvas is restricted
      }
    };

    img.onerror = () => {
      // If anonymous CORS failed, try once without crossOrigin
      if (img.crossOrigin) {
        const retry = new Image();
        retry.onload = img.onload;
        retry.src = imageUrl;
      }
    };

    img.src = imageUrl;
  }, [imageUrl]);

  return colors;
}

/**
 * Ensure the color is punchy and vivid for an ambient light source.
 */
function ensureVibrancy([r, g, b]) {
  const avg = (r + g + b) / 3;
  // Boost saturation
  const sat = 1.7;
  let nr = Math.min(255, Math.max(0, Math.round(avg + (r - avg) * sat)));
  let ng = Math.min(255, Math.max(0, Math.round(avg + (g - avg) * sat)));
  let nb = Math.min(255, Math.max(0, Math.round(avg + (b - avg) * sat)));

  // Ensure minimum luminance so it's not murky
  const lum = (nr * 0.299 + ng * 0.587 + nb * 0.114);
  if (lum < 60) {
    const boost = 60 / (lum || 1);
    nr = Math.min(255, Math.round(nr * boost));
    ng = Math.min(255, Math.round(ng * boost));
    nb = Math.min(255, Math.round(nb * boost));
  }
  return [nr, ng, nb];
}

function shiftHue([r, g, b], degrees) {
  // Simple hue rotate
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const nr = Math.min(255, Math.max(0, Math.round((0.213 + cos * 0.787 - sin * 0.213) * r + (0.715 - cos * 0.715 - sin * 0.715) * g + (0.072 - cos * 0.072 + sin * 0.928) * b)));
  const ng = Math.min(255, Math.max(0, Math.round((0.213 - cos * 0.213 + sin * 0.143) * r + (0.715 + cos * 0.285 + sin * 0.140) * g + (0.072 - cos * 0.072 - sin * 0.283) * b)));
  const nb = Math.min(255, Math.max(0, Math.round((0.213 - cos * 0.213 - sin * 0.787) * r + (0.715 - cos * 0.715 + sin * 0.715) * g + (0.072 + cos * 0.928 + sin * 0.072) * b)));
  return [nr, ng, nb];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}
