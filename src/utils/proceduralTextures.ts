import * as THREE from 'three';
import { getCachedTextureDataUrl, setCachedTextureDataUrl } from './textureCacheDB';

// In-memory texture instances cache
const textureMemoryCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates procedural natural grass texture (#7CB342 with +/- 5% organic variation)
 */
export function createProceduralGrassTexture(): THREE.CanvasTexture {
  if (textureMemoryCache.has('grass')) {
    return textureMemoryCache.get('grass')!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Base natural green #7CB342
    ctx.fillStyle = '#7CB342';
    ctx.fillRect(0, 0, 256, 256);

    // Add organic subtle blade variations (+/- 5% shade shifts)
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const variation = (Math.random() - 0.5) * 28; // ~5%
      
      const r = Math.min(255, Math.max(0, Math.round(124 + variation)));
      const g = Math.min(255, Math.max(0, Math.round(179 + variation)));
      const b = Math.min(255, Math.max(0, Math.round(66 + variation * 0.5)));
      
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 2, 3);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;

  // Persist to IndexedDB asynchronously
  try {
    const dataUrl = canvas.toDataURL('image/webp', 0.85);
    setCachedTextureDataUrl('grass', dataUrl);
  } catch {
    // Ignore error
  }

  textureMemoryCache.set('grass', texture);
  return texture;
}

/**
 * Creates normal/bump map for grass (small natural surface undulations)
 */
export function createProceduralGrassBumpMap(): THREE.CanvasTexture {
  if (textureMemoryCache.has('grassBump')) {
    return textureMemoryCache.get('grassBump')!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 128, 128);

    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const shade = Math.floor(Math.random() * 50 + 105);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(x, y, 1.5, 2.5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);

  try {
    const dataUrl = canvas.toDataURL('image/webp', 0.85);
    setCachedTextureDataUrl('grassBump', dataUrl);
  } catch {
    // Ignore error
  }

  textureMemoryCache.set('grassBump', texture);
  return texture;
}

/**
 * Creates asphalt road texture (#5A5A5A medium-dark matte asphalt)
 */
export function createProceduralAsphaltTexture(): THREE.CanvasTexture {
  if (textureMemoryCache.has('asphalt')) {
    return textureMemoryCache.get('asphalt')!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Base asphalt #5A5A5A
    ctx.fillStyle = '#5A5A5A';
    ctx.fillRect(0, 0, 128, 128);

    // Subtle grain texture
    for (let i = 0; i < 1200; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const noise = (Math.random() - 0.5) * 20;
      const tone = Math.min(255, Math.max(0, Math.round(90 + noise)));
      ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.needsUpdate = true;

  try {
    const dataUrl = canvas.toDataURL('image/webp', 0.85);
    setCachedTextureDataUrl('asphalt', dataUrl);
  } catch {
    // Ignore error
  }

  textureMemoryCache.set('asphalt', texture);
  return texture;
}

/**
 * Creates atmospheric sky gradient texture based on time of day
 */
export function createSkyGradientTexture(timeOfDay: 'morning' | 'noon' | 'afternoon' | 'sunset' = 'noon'): THREE.CanvasTexture {
  const cacheKey = `sky_${timeOfDay}`;
  if (textureMemoryCache.has(cacheKey)) {
    return textureMemoryCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);

    if (timeOfDay === 'morning') {
      gradient.addColorStop(0, '#60A5FA');   // Morning soft blue
      gradient.addColorStop(0.4, '#BAE6FD'); // Light morning sky
      gradient.addColorStop(0.75, '#FED7AA'); // Soft golden horizon
      gradient.addColorStop(1, '#FFF7ED');   // Warm horizon
    } else if (timeOfDay === 'afternoon') {
      gradient.addColorStop(0, '#0284C7');   // Deep afternoon cyan
      gradient.addColorStop(0.4, '#7DD3FC');
      gradient.addColorStop(0.8, '#E0F2FE');
      gradient.addColorStop(1, '#F8FAFC');
    } else if (timeOfDay === 'sunset') {
      gradient.addColorStop(0, '#4338CA');   // Indigo twilight
      gradient.addColorStop(0.35, '#BE185D'); // Crimson
      gradient.addColorStop(0.7, '#F97316');  // Amber sunset
      gradient.addColorStop(1, '#FEF08A');   // Warm yellow horizon
    } else {
      // Default: Noon (Specified by user: #87CEEB -> #ADD8E6 -> #F0F8FF)
      gradient.addColorStop(0, '#87CEEB');    // Sky blue
      gradient.addColorStop(0.45, '#ADD8E6'); // Light sky blue
      gradient.addColorStop(0.85, '#F0F8FF'); // Pale horizon
      gradient.addColorStop(1, '#FFFFFF');    // Pure light horizon
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  textureMemoryCache.set(cacheKey, texture);
  return texture;
}

// Safe rounded rect helper for older mobile browsers where ctx.roundRect is unsupported
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

// In-memory cache for lot badge textures
const lotBadgeTextureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates individual lot division canvas texture showing cadastral boundaries,
 * lot number badge, dimensions, and realistic turf or theme color.
 */
export function createLotDivisionCanvasTexture(
  lote: { numero: number; manzana: string; area_m2: number; estado?: string; status?: string },
  mode: 'natural' | 'manzanas' | 'estado',
  baseColorHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    if (mode === 'natural') {
      // Natural grass background
      ctx.fillStyle = baseColorHex;
      ctx.fillRect(0, 0, 256, 128);

      // Micro grass variation
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 128;
        const v = (Math.random() - 0.5) * 20;
        ctx.fillStyle = `rgba(${Math.round(110 + v)}, ${Math.round(170 + v)}, ${Math.round(55 + v * 0.5)}, 0.4)`;
        ctx.fillRect(x, y, 2.5, 2.5);
      }
    } else {
      // Manzana or status color fill with subtle bevel gradient
      ctx.fillStyle = baseColorHex;
      ctx.fillRect(0, 0, 256, 128);

      const grad = ctx.createLinearGradient(0, 0, 256, 128);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.16)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);
    }

    // Outer cadastral division boundary line (clean white/crisp border)
    ctx.strokeStyle = mode === 'natural' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, 250, 122);

    // Front boundary marker (thicker line on front edge indicating street access)
    ctx.fillStyle = mode === 'natural' ? '#FBBF24' : '#FFFFFF';
    ctx.fillRect(3, 3, 8, 122);

    // Corner survey stakes (mojones) at 4 corners
    const stakeRadius = 4;
    const corners = [
      [7, 7],
      [249, 7],
      [7, 121],
      [249, 121]
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx, cy, stakeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#DC2626'; // red surveyor pin tip
      ctx.beginPath();
      ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Center Lot Identification Badge
    const centerX = 128;
    const centerY = 64;

    // Dark pill background for maximum legibility from any camera distance
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    drawRoundedRect(ctx, centerX - 46, centerY - 32, 92, 64, 10);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Manzana tag
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`MZA ${lote.manzana}`, centerX, centerY - 17);

    // Big Lot Number
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${lote.numero}`, centerX, centerY + 2);

    // Dimensions: 10 x 30m / 300m²
    ctx.fillStyle = '#FDE047'; // yellow accent
    ctx.font = '9px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${lote.area_m2 || 300} m²`, centerX, centerY + 20);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Dynamic canvas texture for the top face of each lot polygon,
 * displaying commercial status background, subtle inner border,
 * large crisp lot number, and area or "VENDIDO" text.
 */
export function createLotBadgeTexture(
  numero: number,
  estado: 'disponible' | 'vendido' | 'reservado',
  areaM2: number = 300
): THREE.CanvasTexture {
  const cacheKey = `${numero}_${estado}_${areaM2}`;
  if (lotBadgeTextureCache.has(cacheKey)) {
    return lotBadgeTextureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Solid matte commercial status colors
    const baseColor = estado === 'vendido' ? '#EF4444' : estado === 'reservado' ? '#F59E0B' : '#10B981';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle crisp white inner border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 10;
    ctx.strokeRect(6, 6, 244, 244);

    // Big crisp lot number
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 76px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${numero}`, 128, 105);

    // Status / Area text
    ctx.font = '700 30px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    if (estado === 'vendido') {
      ctx.fillText('VENDIDO', 128, 168);
    } else if (estado === 'reservado') {
      ctx.fillText('RESERVADO', 128, 168);
    } else {
      ctx.fillText(`${areaM2} m²`, 128, 168);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  lotBadgeTextureCache.set(cacheKey, texture);
  return texture;
}

