/**
 * Models & scene maths — the single source of truth shared by the live stage
 * (DOM) and the high-resolution export (canvas / SVG).
 */

export type DeviceKey = 'desktop' | 'tablet' | 'mobile';
export type LayoutKey = 'trio' | 'duo' | 'solo' | 'salon';
export type FrameKind = 'monitor' | 'laptop' | 'tablet' | 'phone' | 'standard';
export type ViewKey = 'all' | DeviceKey;
export type BackgroundKey = 'mist' | 'ivory' | 'sand' | 'ink' | 'cocoa' | 'ember' | 'sage' | 'sky';

export interface DeviceSpec {
  w: number;
  h: number;
  label: string;
  short: string;
}

export const DEVICES: Record<DeviceKey, DeviceSpec> = {
  desktop: { w: 1440, h: 900, label: 'Ordinateur', short: 'PC' },
  tablet: { w: 768, h: 1024, label: 'Tablette', short: 'Tablette' },
  mobile: { w: 390, h: 844, label: 'Android', short: 'Android' },
};

export const DEVICE_KEYS: DeviceKey[] = ['desktop', 'tablet', 'mobile'];

/** Stage is always 16:10 — 1600 × 1000 logical pixels. */
export const STAGE_W = 1600;
export const STAGE_H = 1000;
export const STAGE_ASPECT = STAGE_W / STAGE_H;

export interface Shot {
  url: string;
  width: number;
  height: number;
  origin: 'live' | 'demo';
}

export type Shots = Partial<Record<DeviceKey, Shot>>;

export interface MockupConfig {
  layout: LayoutKey;
  view: ViewKey;
  bg: BackgroundKey;
  shadow: number;   // 0 → 1
  radius: number;   // px @1600
  padding: number;  // px @1600
  angle: number;    // degrees
  chrome: boolean;
}

export const DEFAULT_CONFIG: MockupConfig = {
  layout: 'trio',
  view: 'all',
  bg: 'mist',
  shadow: 0.7,
  radius: 10,
  padding: 100,
  angle: 0,
  chrome: false,
};

interface Placement {
  device: DeviceKey;
  kind?: FrameKind;
  cx: number;   // centre X (fraction of stage width)
  cy: number;   // centre Y (fraction of stage height)
  w: number;    // width (fraction of stage width)
  z: number;
}

export const LAYOUTS: Record<LayoutKey, Placement[]> = {
  trio: [
    { device: 'desktop', cx: 0.5, cy: 0.35, w: 0.68, z: 1 },
    { device: 'tablet', cx: 0.14, cy: 0.75, w: 0.185, z: 3 },
    { device: 'mobile', cx: 0.86, cy: 0.685, w: 0.125, z: 4 },
  ],
  duo: [
    { device: 'desktop', cx: 0.42, cy: 0.5, w: 0.68, z: 1 },
    { device: 'mobile', cx: 0.87, cy: 0.55, w: 0.17, z: 3 },
  ],
  solo: [{ device: 'desktop', cx: 0.5, cy: 0.5, w: 0.78, z: 1 }],
  // Composition « Salon » (d'après la photo de référence) : moniteur au centre
  // sur son pied, portable au premier plan à droite, tablette à gauche,
  // téléphone devant — posée sur le fond prédéfini choisi, comme le Trio.
  salon: [
    { device: 'desktop', kind: 'monitor', cx: 0.43, cy: 0.36, w: 0.58, z: 1 },
    { device: 'tablet', kind: 'tablet', cx: 0.15, cy: 0.73, w: 0.2, z: 3 },
    { device: 'desktop', kind: 'laptop', cx: 0.77, cy: 0.7, w: 0.4, z: 4 },
    { device: 'mobile', kind: 'phone', cx: 0.4, cy: 0.76, w: 0.09, z: 5 },
  ],
};

export const SINGLE: Record<DeviceKey, Placement[]> = {
  desktop: [{ device: 'desktop', cx: 0.5, cy: 0.5, w: 0.84, z: 1 }],
  tablet: [{ device: 'tablet', cx: 0.5, cy: 0.5, w: 0.32, z: 1 }],
  mobile: [{ device: 'mobile', cx: 0.5, cy: 0.5, w: 0.26, z: 1 }],
};

export function resolveLayout(config: MockupConfig): Placement[] {
  if (config.view !== 'all') return SINGLE[config.view];
  return LAYOUTS[config.layout] ?? LAYOUTS.trio;
}

export interface Frame {
  device: DeviceKey;
  kind: FrameKind;
  z: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: number;
  radius: number;
  bezel: number;
  shadow: number;
  chrome: boolean;
}

/** Fractional placements → absolute pixels for a stage of `width` logical px. */
export function computeFrames(config: MockupConfig, width: number): Frame[] {
  const height = width / STAGE_ASPECT;
  const pad = Math.min(config.padding * (width / STAGE_W), width * 0.09);
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

  const salon = config.layout === 'salon' && config.view === 'all';
  return resolveLayout(config).map((p) => {
    const dev = DEVICES[p.device];
    const w = p.w * width;
    const h = w * (dev.h / dev.w);
    return {
      device: p.device,
      kind: p.kind ?? (p.device === 'desktop' ? 'monitor' : p.device === 'tablet' ? 'tablet' : 'phone'),
      z: p.z,
      x: clamp(p.cx * width - w / 2, pad, width - pad - w),
      y: clamp(p.cy * height - h / 2, pad, height - pad - h),
      w,
      h,
      rotate: salon ? 0 : config.angle * (p.device === 'desktop' ? 1 : p.device === 'tablet' ? 1.5 : 2.1),
      radius: config.radius * (w / (width * 0.66)),
      // bord fin façon Android sur le mobile, légèrement réduit sur tablette
      bezel: Math.max(p.device === 'mobile' ? 2 : 2.5, w * (p.device === 'desktop' ? 0.009 : p.device === 'tablet' ? 0.012 : 0.008)),
      shadow: config.shadow,
      chrome: config.chrome && p.device === 'desktop' && (p.kind === undefined || p.kind === 'monitor'),
    };
  });
}

export interface BackgroundSpec {
  key: BackgroundKey;
  label: string;
  css: string;
  stops: [string, string];
}

export const BACKGROUNDS: BackgroundSpec[] = [
  { key: 'mist', label: 'Brume', stops: ['#f7f1e8', '#dccbb9'], css: 'radial-gradient(70% 80% at 20% 10%, #fffaf3, transparent 70%), linear-gradient(150deg, #f7f1e8, #e9dfd2 55%, #dccbb9)' },
  { key: 'ivory', label: 'Ivoire', stops: ['#f8f5ef', '#f1ece3'], css: 'linear-gradient(160deg, #f8f5ef, #f1ece3)' },
  { key: 'sand', label: 'Sable', stops: ['#efe6da', '#dfd0bd'], css: 'linear-gradient(160deg, #efe6da, #dfd0bd)' },
  { key: 'ember', label: 'Braise', stops: ['#e2542b', '#b73a17'], css: 'radial-gradient(60% 70% at 70% 20%, #ffb08a, transparent 70%), linear-gradient(150deg, #e2542b, #b73a17)' },
  { key: 'ink', label: 'Encre', stops: ['#1c1c21', '#0d0d10'], css: 'linear-gradient(160deg, #1c1c21, #0d0d10)' },
  { key: 'cocoa', label: 'Cacao', stops: ['#4a3a33', '#2a201c'], css: 'linear-gradient(160deg, #4a3a33, #2a201c)' },
  { key: 'sage', label: 'Sauge', stops: ['#e4e9e0', '#cfd8ca'], css: 'linear-gradient(160deg, #e4e9e0, #cfd8ca)' },
  { key: 'sky', label: 'Ciel', stops: ['#e6eef5', '#d3e0ea'], css: 'linear-gradient(160deg, #e6eef5, #d3e0ea)' },
];

export function background(key: BackgroundKey): BackgroundSpec {
  return BACKGROUNDS.find((b) => b.key === key) ?? BACKGROUNDS[0];
}

/** Paints a background onto a 2D context (used by the canvas exporter). */
export function paintBackground(ctx: CanvasRenderingContext2D, w: number, h: number, key: BackgroundKey): void {
  const spec = background(key);
  if (key === 'mist' || key === 'ember') {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, spec.stops[0]);
    g.addColorStop(1, spec.stops[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(
      key === 'mist' ? w * 0.2 : w * 0.7,
      key === 'mist' ? h * 0.1 : h * 0.2,
      0,
      key === 'mist' ? w * 0.2 : w * 0.7,
      key === 'mist' ? h * 0.1 : h * 0.2,
      w * 0.7,
    );
    glow.addColorStop(0, key === 'mist' ? 'rgba(255,250,243,0.92)' : 'rgba(255,176,138,0.85)');
    glow.addColorStop(1, 'rgba(255,250,243,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, spec.stops[0]);
  g.addColorStop(1, spec.stops[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Normalises user input into a valid http(s) URL string. */
export function normalizeUrl(input: string): string {
  let raw = (input || '').trim();
  if (!raw) throw new Error('Collez l’URL d’un site pour commencer.');
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  const url = new URL(raw);
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname)) {
    throw new Error('Ce nom de domaine ne semble pas valide.');
  }
  return url.toString();
}

export function prettyUrl(url: string): string {
  return String(url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
}
