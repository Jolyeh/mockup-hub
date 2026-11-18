import { Injectable } from '@angular/core';
import {
  BACKGROUNDS,
  MockupConfig,
  STAGE_H,
  STAGE_W,
  Shots,
  computeFrames,
  paintBackground,
  prettyUrl,
} from './models';

export type ExportFormat = 'png' | 'webp' | 'svg';

/**
 * Rendu de la scène en haute résolution.
 * Le rendu canvas réutilise exactement `computeFrames()` — l'export est donc
 * fidèle au pixel près à ce qui est affiché dans le studio.
 */
@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly canvasCache = new Map<string, HTMLImageElement>();

  async renderCanvas(config: MockupConfig, shots: Shots, scale = 2, sourceUrl = ''): Promise<HTMLCanvasElement> {
    const W = STAGE_W;
    const H = STAGE_H;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponible dans ce navigateur.');
    ctx.scale(scale, scale);

    paintBackground(ctx, W, H, config.bg);
    const frames = computeFrames(config, W);
    const label = prettyUrl(sourceUrl);

    for (const f of frames) {
      const shot = shots[f.device];
      if (!shot) continue;

      let img: HTMLImageElement;
      try {
        img = await this.image(shot.url);
      } catch {
        continue;
      }

      const chromeH = f.chrome ? f.bezel * 3.4 : 0;
      ctx.save();
      ctx.translate(f.x + f.w / 2, f.y + f.h / 2 + chromeH / 2);
      ctx.rotate((f.rotate * Math.PI) / 180);
      ctx.translate(-f.w / 2, -f.h / 2 - chromeH / 2);

      // ombre portée
      ctx.save();
      ctx.shadowColor = `rgba(19,19,22,${0.24 + f.shadow * 0.32})`;
      ctx.shadowBlur = 52 * f.shadow;
      ctx.shadowOffsetY = 26 * f.shadow;
      ctx.fillStyle = '#191920';
      this.roundRect(ctx, 0, 0, f.w, f.h, f.radius * 0.9);
      ctx.fill();
      ctx.restore();

      // châssis
      const shell = ctx.createLinearGradient(0, 0, f.w, f.h);
      shell.addColorStop(0, '#43434b');
      shell.addColorStop(1, '#14141a');
      ctx.fillStyle = shell;
      this.roundRect(ctx, 0, 0, f.w, f.h, f.radius * 0.9);
      ctx.fill();

      // barre de navigateur
      if (f.chrome) {
        const cy = f.bezel + f.bezel * 0.6;
        ctx.fillStyle = 'rgba(255,255,255,0.26)';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(f.bezel + 4 + i * f.bezel * 1.6, cy, f.bezel * 0.62, 0, Math.PI * 2);
          ctx.fill();
        }
        const barX = f.bezel + 4 + 3 * f.bezel * 1.6 + f.bezel;
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        this.roundRect(ctx, barX, cy - f.bezel * 0.8, f.w - barX - f.bezel, f.bezel * 1.6, f.bezel);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `${Math.max(6, f.bezel * 1.15)}px ui-monospace, monospace`;
        ctx.textBaseline = 'middle';
        ctx.fillText(label, barX + f.bezel, cy + 0.5);
      }

      // écran
      const sx = f.bezel;
      const sy = f.bezel + chromeH;
      const sw = f.w - f.bezel * 2;
      const sh = f.h - f.bezel * 2 - chromeH;
      const screenRadius = Math.max(2, f.radius * 0.62);

      ctx.save();
      this.roundRect(ctx, sx, sy, sw, sh, screenRadius);
      ctx.clip();
      const sRatio = img.width / img.height;
      const dRatio = sw / sh;
      let dw = sw;
      let dh = sh;
      if (sRatio > dRatio) dw = sh * sRatio;
      else dh = sw / sRatio;
      ctx.drawImage(img, sx + (sw - dw) / 2, sy, dw, dh);
      ctx.restore();

      // reflet
      ctx.save();
      this.roundRect(ctx, sx, sy, sw, sh, screenRadius);
      ctx.clip();
      const gloss = ctx.createLinearGradient(sx, sy, sx + sw * 0.6, sy + sh);
      gloss.addColorStop(0, 'rgba(255,255,255,0.10)');
      gloss.addColorStop(0.45, 'rgba(255,255,255,0)');
      ctx.fillStyle = gloss;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.restore();

      // pied du moniteur / base du portable (scène Salon)
      if (f.kind === 'monitor') {
        ctx.fillStyle = '#26262c';
        ctx.fillRect(f.w / 2 - f.w * 0.035, f.h, f.w * 0.07, f.bezel * 3.2);
        ctx.beginPath();
        ctx.ellipse(f.w / 2, f.h + f.bezel * 3.6, f.w * 0.12, f.bezel * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (f.kind === 'laptop') {
        ctx.save();
        ctx.shadowColor = 'rgba(19,19,22,0.35)'; ctx.shadowBlur = 18 * f.shadow; ctx.shadowOffsetY = 8 * f.shadow;
        const base = ctx.createLinearGradient(0, f.h, 0, f.h + f.bezel * 2.6);
        base.addColorStop(0, '#4a4a52'); base.addColorStop(1, '#1b1b20');
        ctx.fillStyle = base;
        ctx.beginPath();
        ctx.moveTo(-f.w * 0.045, f.h); ctx.lineTo(f.w * 1.045, f.h);
        ctx.lineTo(f.w * 1.075, f.h + f.bezel * 2.4); ctx.lineTo(-f.w * 0.075, f.h + f.bezel * 2.4);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }

    return canvas;
  }

  async download(config: MockupConfig, shots: Shots, sourceUrl: string, format: ExportFormat, scale = 2): Promise<string> {
    const name = this.fileName(sourceUrl, config.layout, format, scale);
    if (format === 'svg') {
      await this.downloadSvg(config, shots, sourceUrl, name);
      return name;
    }
    const canvas = await this.renderCanvas(config, shots, scale, sourceUrl);
    const mime = format === 'webp' ? 'image/webp' : 'image/png';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), mime, format === 'webp' ? 0.95 : undefined),
    );
    if (!blob) throw new Error('Export impossible (canvas vide).');
    this.saveBlob(blob, name);
    return name;
  }

  /** SVG autonome : captures embarquées en data-URI. */
  private async downloadSvg(config: MockupConfig, shots: Shots, sourceUrl: string, name: string): Promise<void> {
    const W = STAGE_W;
    const H = STAGE_H;
    const frames = computeFrames(config, W);
    const bg = BACKGROUNDS.find((b) => b.key === config.bg) ?? BACKGROUNDS[0];

    let defs = `<linearGradient id="shell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#43434b"/><stop offset="1" stop-color="#14141a"/></linearGradient>
<filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${(14 * config.shadow).toFixed(2)}"/></filter>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg.stops[0]}"/><stop offset="1" stop-color="${bg.stops[1]}"/></linearGradient>`;
    let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    const label = prettyUrl(sourceUrl);

    for (const f of frames) {
      const shot = shots[f.device];
      if (!shot) continue;
      const data = await this.toDataUrl(shot.url);
      const chromeH = f.chrome ? f.bezel * 3.4 : 0;
      const sx = f.bezel;
      const sy = f.bezel + chromeH;
      const sw = f.w - f.bezel * 2;
      const sh = f.h - f.bezel * 2 - chromeH;
      const r = Math.max(2, f.radius * 0.62);
      const cx = f.x + f.w / 2;
      const cy = f.y + f.h / 2;

      const dots = f.chrome
        ? [0, 1, 2]
            .map(
              (i) =>
                `<circle cx="${(f.x + sx + 6 + i * f.bezel * 1.6).toFixed(1)}" cy="${(f.y + f.bezel * 1.1).toFixed(1)}" r="${(f.bezel * 0.6).toFixed(1)}" fill="rgba(255,255,255,0.3)"/>`,
            )
            .join('')
        : '';
      const urlbar = f.chrome
        ? `<rect x="${(sx + 6 + f.bezel * 5.4).toFixed(1)}" y="${(f.y + f.bezel * 0.5).toFixed(1)}" width="${Math.max(20, sw * 0.42).toFixed(1)}" height="${(f.bezel * 1.3).toFixed(1)}" rx="${f.bezel.toFixed(1)}" fill="rgba(255,255,255,0.10)"/>
           <text x="${(sx + 10 + f.bezel * 5.4).toFixed(1)}" y="${(f.y + f.bezel * 1.25).toFixed(1)}" fill="rgba(255,255,255,0.55)" font-family="ui-monospace, monospace" font-size="${Math.max(6, f.bezel * 1.1).toFixed(1)}">${this.escape(label)}</text>`
        : '';

      const stand = f.kind === 'monitor'
        ? `<rect x="${(f.x + f.w / 2 - f.w * 0.035).toFixed(1)}" y="${(f.y + f.h).toFixed(1)}" width="${(f.w * 0.07).toFixed(1)}" height="${(f.bezel * 3.2).toFixed(1)}" fill="#26262c"/><ellipse cx="${(f.x + f.w / 2).toFixed(1)}" cy="${(f.y + f.h + f.bezel * 3.6).toFixed(1)}" rx="${(f.w * 0.12).toFixed(1)}" ry="${(f.bezel * 0.9).toFixed(1)}" fill="#26262c"/>`
        : f.kind === 'laptop'
          ? `<polygon points="${(f.x - f.w * 0.045).toFixed(1)},${(f.y + f.h).toFixed(1)} ${(f.x + f.w * 1.045).toFixed(1)},${(f.y + f.h).toFixed(1)} ${(f.x + f.w * 1.075).toFixed(1)},${(f.y + f.h + f.bezel * 2.4).toFixed(1)} ${(f.x - f.w * 0.075).toFixed(1)},${(f.y + f.h + f.bezel * 2.4).toFixed(1)}" fill="#26262c"/>`
          : '';
      body += `<g transform="rotate(${f.rotate.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})">
  ${stand}
  <rect x="${f.x.toFixed(1)}" y="${(f.y + 18 * f.shadow).toFixed(1)}" width="${f.w.toFixed(1)}" height="${f.h.toFixed(1)}" rx="${(f.radius * 0.9).toFixed(1)}" fill="rgba(19,19,22,0.20)" filter="url(#blur)"/>
  <rect x="${f.x.toFixed(1)}" y="${f.y.toFixed(1)}" width="${f.w.toFixed(1)}" height="${f.h.toFixed(1)}" rx="${(f.radius * 0.9).toFixed(1)}" fill="url(#shell)"/>
  ${dots}${urlbar}
  <image href="${data}" x="${(f.x + sx).toFixed(1)}" y="${(f.y + sy).toFixed(1)}" width="${sw.toFixed(1)}" height="${sh.toFixed(1)}" preserveAspectRatio="xMidYMid slice" clip-path="inset(0 round ${r.toFixed(1)}px)"/>
</g>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${defs}</defs>
  ${body}
</svg>`;
    this.saveBlob(new Blob([svg], { type: 'image/svg+xml' }), name);
  }

  private async toDataUrl(src: string): Promise<string> {
    const res = await fetch(src, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Lecture de la capture impossible.'));
      reader.readAsDataURL(blob);
    });
  }

  private image(src: string): Promise<HTMLImageElement> {
    const cached = this.canvasCache.get(src);
    if (cached) return Promise.resolve(cached);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.canvasCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Image indisponible : ${src}`));
      img.src = src;
    });
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }


  private fileName(url: string, layout: string, format: string, scale: number): string {
    const slug = prettyUrl(url).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 32) || 'mockup';
    return `mockuphub-${slug}-${layout}-${scale}x.${format}`;
  }

  private saveBlob(blob: Blob, name: string): void {
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 5000);
  }

  private escape(value: string): string {
    return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
  }
}
