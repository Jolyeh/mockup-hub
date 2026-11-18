import { Injectable, inject, signal } from '@angular/core';
import { I18nService } from './i18n';
import { DEVICES, DeviceKey, Shots, normalizeUrl } from './models';

export interface CaptureState {
  phase: 'idle' | 'running' | 'done' | 'error';
  progress: number;
  message: string;
}

/**
 * Capture 100 % côté navigateur.
 *
 * Aucun serveur, aucune base, aucune sauvegarde : on demande simplement à un
 * service public de rendu d'exécuter la page et de renvoyer une image
 * (thum.io, puis microlink en secours). Les deux exposent
 * `Access-Control-Allow-Origin: *`, ce qui permet d'exporter le canvas.
 *
 * Les sites mis en avant dans la démo utilisent des captures embarquées
 * (`public/demo/*`) pour rester instantanés et fonctionner hors-ligne.
 */
@Injectable({ providedIn: 'root' })
export class CaptureService {
  private readonly i18n = inject(I18nService);
  readonly state = signal<CaptureState>({ phase: 'idle', progress: 0, message: 'Prêt' });

  private readonly demoHosts: Record<string, string> = {
    'stripe.com': 'stripe',
    'linear.app': 'linear',
    'framer.com': 'framer',
    'vercel.com': 'vercel',
    'github.com': 'github',
  };

  private runId = 0;

  async capture(input: string, devices: DeviceKey[]): Promise<{ url: string; shots: Shots }> {
    const url = normalizeUrl(input);
    const host = new URL(url).hostname.replace(/^www\./, '');
    const list = devices.length ? devices : (Object.keys(DEVICES) as DeviceKey[]);
    const run = ++this.runId;
    this.state.set({ phase: 'running', progress: 0, message: this.i18n.t('msg.preparing') });

    const shots: Shots = {};
    try {
      for (let i = 0; i < list.length; i++) {
        const device = list[i];
        this.state.set({
          phase: 'running',
          progress: i / list.length,
          message: this.i18n.t('capture.count', { device: this.i18n.t('device.' + device).toLowerCase(), i: i + 1, n: list.length }),
        });
        const shot = await this.captureOne(url, host, device);
        if (run !== this.runId) throw new Error(this.i18n.t('msg.cancelled'));
        shots[device] = shot;
      }
      this.state.set({ phase: 'done', progress: 1, message: this.i18n.t('msg.generated') });
      return { url, shots };
    } catch (err) {
      const message = err instanceof Error ? err.message : this.i18n.t('msg.captureFail');
      this.state.set({ phase: 'error', progress: 1, message });
      throw err;
    }
  }

  /**
   * Chaîne de repli, du plus fidèle au plus disponible :
   *  1. capture embarquée (sites de démonstration) — instantanée, hors-ligne
   *  2. Microlink — viewport réel desktop / tablette / mobile en DPR 2
   *  3. thum.io — rendu large fiable ; pour tablette et mobile on recadre une
   *     tranche verticale du rendu large (faute de viewport responsive).
   */
  private async captureOne(url: string, host: string, device: DeviceKey) {
    const spec = DEVICES[device];
    const encoded = encodeURIComponent(url);
    const live = `https://api.microlink.io/?url=${encoded}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=${spec.w}&viewport.height=${spec.h}&waitUntil=networkidle0`;
    const wide = Math.min(spec.w, 1200);
    const wideH = Math.round(wide / (spec.w / spec.h));
    const thumb = `https://image.thum.io/get/width/${wide}/crop/${wideH}/${url}`;

    const demo = this.demoHosts[host];
    if (demo) {
      try {
        await this.preload(`demo/${demo}-${device}.jpg`);
        return { url: `demo/${demo}-${device}.jpg`, width: spec.w, height: spec.h, origin: 'demo' as const };
      } catch {
        /* on continue sur la capture live */
      }
    }

    try {
      await this.preload(live);
      return { url: live, width: spec.w, height: spec.h, origin: 'live' as const };
    } catch {
      /* Microlink indisponible (quota) → repli */
    }

    try {
      if (device === 'desktop') {
        await this.preload(thumb);
        return { url: thumb, width: wide, height: wideH, origin: 'live' as const };
      }
      const desktopSource = `https://image.thum.io/get/width/1200/crop/750/${url}`;
      const sliced = await this.sliceViewport(desktopSource, spec.w, spec.h);
      return { url: sliced, width: spec.w, height: spec.h, origin: 'live' as const };
    } catch (err) {
      console.warn('capture failed', url, err);
      throw new Error(this.i18n.t('capture.failed', { host }));
    }
  }

  /** Recadre une tranche verticale d'un rendu desktop aux dimensions d'un mobile / tablette. */
  private async sliceViewport(src: string, w: number, h: number): Promise<string> {
    const img = await this.preload(src);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponible.');
    const sliceW = Math.min(img.naturalWidth, Math.round(img.naturalHeight * (w / h)));
    const sx = Math.round((img.naturalWidth - sliceW) * 0.08);
    ctx.drawImage(img, sx, 0, sliceW, img.naturalHeight, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) throw new Error('Recadrage impossible.');
    return URL.createObjectURL(blob);
  }

  /** Charge l'image en mode CORS (indispensable pour l'export canvas). */
  private preload(src: string, timeout = 32000): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timer = setTimeout(() => {
        img.src = '';
        reject(new Error('délai dépassé'));
      }, timeout);
      img.onload = () => {
        clearTimeout(timer);
        if (img.naturalWidth < 40 || img.naturalHeight < 40) {
          reject(new Error('image vide'));
          return;
        }
        resolve(img);
      };
      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error('image indisponible'));
      };
      img.src = src;
    });
  }

  reset(): void {
    this.runId++;
    this.state.set({ phase: 'idle', progress: 0, message: this.i18n.t('msg.ready') });
  }
}
