import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import gsap from 'gsap';
import { CaptureService } from '../core/capture';
import { I18nService } from '../core/i18n';
import { ExportService, ExportFormat } from '../core/exporter';
import {
  BACKGROUNDS,
  BackgroundKey,
  DEFAULT_CONFIG,
  DEVICE_KEYS,
  DEVICES,
  DeviceKey,
  LayoutKey,
  MockupConfig,
  STAGE_ASPECT,
  ViewKey,
  computeFrames,
  prettyUrl,
} from '../core/models';
import { prefersReducedMotion } from '../shared/motion';

@Component({
  selector: 'app-studio',
  templateUrl: './studio.html',
  styleUrl: './studio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Studio implements OnInit, OnDestroy {
  private readonly captureSvc = inject(CaptureService);
  readonly i18n = inject(I18nService);
  private readonly exportSvc = inject(ExportService);

  readonly stageRef = viewChild<ElementRef<HTMLElement>>('stage');
  readonly devicesRef = viewChild<ElementRef<HTMLElement>>('devices');

  readonly DEVICES = DEVICES;
  readonly DEVICE_KEYS = DEVICE_KEYS;
  readonly BACKGROUNDS = BACKGROUNDS;
  readonly toast = signal<{ text: string; kind: 'ok' | 'err' | 'info' } | null>(null);

  readonly config = signal<MockupConfig>({ ...DEFAULT_CONFIG });
  readonly shots = signal<Partial<Record<DeviceKey, { url: string; width: number; height: number; origin: 'live' | 'demo' }>>>({});
  readonly sourceUrl = signal('');
  readonly devices = signal<DeviceKey[]>(['desktop', 'tablet', 'mobile']);
  readonly zoom = signal('1600 × 1000');
  readonly urlInput = signal('');
  readonly advancedOpen = signal(false);
  readonly exporting = signal(false);

  readonly captureState = this.captureSvc.state;

  /** URL demandée depuis la landing (déclenche une capture à l'ouverture du studio). */
  readonly request = input<string | null>(null);
  readonly requestHandled = output<void>();

  private stageWidth = signal(1200);
  private observer?: ResizeObserver;
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly frames = computed(() => {
    const cfg = this.config();
    const enabled = this.devices();
    const withShots = this.shots();
    const stageW = this.stageWidth();
    return computeFrames(cfg, stageW).filter(
      (f) => enabled.includes(f.device) && !!withShots[f.device],
    );
  });

  readonly hasShots = computed(() => Object.keys(this.shots()).length > 0);
  readonly layouts = [
    { key: 'trio' as LayoutKey },
    { key: 'duo' as LayoutKey },
    { key: 'solo' as LayoutKey },
    { key: 'salon' as LayoutKey },
  ];
  readonly isSalon = computed(() => this.config().layout === 'salon' && this.config().view === 'all');
  readonly shadowPct = computed(() => Math.round(this.config().shadow * 100));
  readonly hostLabel = computed(() => prettyUrl(this.sourceUrl()));
  // Salon inclus : l'arrière-plan est toujours le fond prédéfini choisi,
  // exactement comme pour Trio / Duo / Solo.
  readonly stageStyle = computed(() => ({
    background: BACKGROUNDS.find((b) => b.key === this.config().bg)?.css ?? '',
  }));
  readonly aspect = computed(() => `${STAGE_ASPECT} / 1`);

  constructor() {
    effect(() => {
      const url = this.request();
      if (!url) return;
      this.requestHandled.emit();
      setTimeout(() => {
        this.refreshStage();
        void this.generate(url);
      });
    });
  }

  /** Remesure la scène (appelé quand l'onglet devient visible). */
  refreshStage(): void {
    const el = this.stageRef()?.nativeElement;
    if (!el) return;
    this.stageWidth.set(el.clientWidth || 1200);
  }

  ngOnInit(): void {
    const el = this.stageRef()?.nativeElement;
    if (!el) return;
    this.stageWidth.set(el.clientWidth || 1200);
    this.observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 1200;
      if (width > 0) this.stageWidth.set(width);
    });
    this.observer.observe(el);
    this.advancedOpen.set(window.matchMedia('(min-width: 1081px)').matches);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    clearTimeout(this.toastTimer);
  }

  /* ─────────────────────────── capture ─────────────────────────── */

  onUrlInput(value: string): void {
    this.urlInput.set(value);
  }

  async generate(url?: string): Promise<void> {
    const target = (url ?? this.urlInput()).trim();
    if (!target) {
      this.notify(this.i18n.t('msg.needUrl'), 'err');
      return;
    }
    if (this.captureState().phase === 'running') return;

    try {
      const { url: finalUrl, shots } = await this.captureSvc.capture(target, this.devices());
      this.sourceUrl.set(finalUrl);
      this.shots.set(shots);
      this.urlInput.set(prettyUrl(finalUrl));
      this.entrance();
      this.notify(this.i18n.t('msg.done'), 'ok');
    } catch (err) {
      this.notify(err instanceof Error ? err.message : this.i18n.t('msg.captureFail'), 'err');
    }
  }

  useExample(url: string): void {
    this.urlInput.set(prettyUrl(url));
    void this.generate(url);
  }

  /* ─────────────────────────── controls ─────────────────────────── */

  toggleDevice(device: DeviceKey): void {
    const current = this.devices();
    const next = current.includes(device) ? current.filter((d) => d !== device) : [...current, device];
    if (!next.length) {
      this.notify(this.i18n.t('msg.keepDevice'), 'err');
      return;
    }
    // keep a stable device order
    this.devices.set(DEVICE_KEYS.filter((d) => next.includes(d)));
  }

  isDeviceOn(device: DeviceKey): boolean {
    return this.devices().includes(device);
  }

  setLayout(layout: LayoutKey): void {
    this.config.update((c) => ({ ...c, layout, view: 'all' }));
    this.zoom.set('1600 × 1000');
  }

  setView(view: ViewKey): void {
    this.config.update((c) => ({ ...c, view }));
    this.zoom.set(
      view === 'all'
        ? '1600 × 1000'
        : `${DEVICES[view].w} × ${DEVICES[view].h}`,
    );
  }

  setBackground(bg: BackgroundKey): void {
    this.config.update((c) => ({ ...c, bg }));
  }

  setShadow(value: string): void {
    this.config.update((c) => ({ ...c, shadow: Number(value) / 100 }));
  }

  setRadius(value: string): void {
    this.config.update((c) => ({ ...c, radius: Number(value) }));
  }

  setPadding(value: string): void {
    this.config.update((c) => ({ ...c, padding: Number(value) }));
  }

  setAngle(value: string): void {
    this.config.update((c) => ({ ...c, angle: Number(value) }));
  }

  toggleChrome(checked: boolean): void {
    this.config.update((c) => ({ ...c, chrome: checked }));
  }

  toggleAdvanced(): void {
    this.advancedOpen.update((v) => !v);
  }

  /* ─────────────────────────── export ─────────────────────────── */

  async exportAs(format: ExportFormat): Promise<void> {
    if (!this.hasShots()) {
      this.notify(this.i18n.t('msg.needMockup'), 'err');
      return;
    }
    if (this.exporting()) return;
    this.exporting.set(true);
    try {
      const name = await this.exportSvc.download(this.config(), this.shots(), this.sourceUrl(), format, 2);
      this.notify(`Export ${format.toUpperCase()} — ${name}`, 'ok');
    } catch (err) {
      this.notify(err instanceof Error ? err.message : this.i18n.t('msg.exportFail'), 'err');
    } finally {
      this.exporting.set(false);
    }
  }

  copyCss(): void {
    const cfg = this.config();
    const snippet = `/* MockupHub — scène ${prettyUrl(this.sourceUrl()) || this.i18n.t('css.untitled')} */
.mockup { background: ${BACKGROUNDS.find((b) => b.key === cfg.bg)?.stops[0]}; padding: ${cfg.padding}px; }
.mockup__frame { border-radius: ${cfg.radius}px; box-shadow: 0 ${Math.round(28 * cfg.shadow)}px ${Math.round(70 * cfg.shadow)}px -${Math.round(30 * (1 - cfg.shadow * 0.5))}px rgba(19,19,22,${(0.28 + cfg.shadow * 0.34).toFixed(2)}); transform: rotate(${cfg.angle}deg); }`;
    navigator.clipboard
      .writeText(snippet)
      .then(() => this.notify(this.i18n.t('msg.cssCopied'), 'ok'))
      .catch(() => this.notify(this.i18n.t('msg.copyFail'), 'err'));
  }

  /* ─────────────────────────── animation ─────────────────────────── */

  /** GSAP: apparition des cadres après une capture (les transforms géométriques
   *  restent pilotés par Angular, on anime donc l'enveloppe interne). */
  private entrance(): void {
    if (prefersReducedMotion()) return;
    requestAnimationFrame(() => {
      const shells = this.devicesRef()?.nativeElement?.querySelectorAll<HTMLElement>('.dev__shell');
      if (!shells?.length) return;
      gsap.fromTo(
        shells,
        { opacity: 0, scale: 0.94, y: 18 },
        { opacity: 1, scale: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', clearProps: 'transform' },
      );
    });
  }

  notify(text: string, kind: 'ok' | 'err' | 'info' = 'info'): void {
    this.toast.set({ text, kind });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 4200);
    if (!prefersReducedMotion()) {
      requestAnimationFrame(() => {
        const el = document.querySelector('.toast');
        if (el) gsap.fromTo(el, { y: 16, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' });
      });
    }
  }

  trackDevice = (_: number, f: { device: DeviceKey }) => f.device;

  readonly frameTransform = (f: { x: number; y: number; w: number; h: number; rotate: number }) =>
    `translate3d(${f.x}px, ${f.y}px, 0) rotate(${f.rotate}deg)`;

  readonly deviceShadow = (f: { shadow: number }) =>
    `0 ${28 * f.shadow}px ${70 * f.shadow}px -${30 * (1 - f.shadow * 0.5)}px rgba(19,19,22,${0.28 + f.shadow * 0.34})`;
}
