import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import gsap from 'gsap';
import { inject } from '@angular/core';
import { I18nService } from '../core/i18n';
import { MagneticDirective, RevealDirective, prefersReducedMotion } from '../shared/motion';

type TeaserView = 'trio' | 'desktop' | 'tablet' | 'mobile';

@Component({
  selector: 'app-landing',
  imports: [RevealDirective, MagneticDirective],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing implements OnInit, AfterViewInit, OnDestroy {
  readonly i18n = inject(I18nService);
  readonly generate = output<string>();
  readonly openStudio = output<void>();

  readonly heroRef = viewChild<ElementRef<HTMLElement>>('hero');
  readonly showcaseRef = viewChild<ElementRef<HTMLElement>>('showcase');
  readonly teaserRef = viewChild<ElementRef<HTMLElement>>('teaser');

  readonly url = signal('');
  readonly teaserView = signal<TeaserView>('trio');
  readonly examples = ['stripe.com', 'linear.app', 'framer.com'];
  readonly backgrounds = ['#f6f2ec', 'linear-gradient(160deg,#efe6da,#dfd0bd)', 'radial-gradient(60% 70% at 70% 20%, #ffb08a, transparent 70%), linear-gradient(150deg, #e2542b, #b73a17)', '#1c1c21', '#4a3a33', 'linear-gradient(160deg,#e4e9e0,#cfd8ca)', 'linear-gradient(160deg,#e6eef5,#d3e0ea)'];

  private timeline?: gsap.core.Timeline;
  private floats: gsap.core.Tween[] = [];
  private pointerMove?: (e: PointerEvent) => void;
  private pointerLeave?: () => void;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (prefersReducedMotion()) return;
    this.intro();
    this.showcaseMotion();
    this.applyTeaser('trio', false);
  }

  ngOnDestroy(): void {
    this.timeline?.kill();
    this.floats.forEach((f) => f.kill());
    const stage = this.showcaseRef()?.nativeElement;
    if (stage) {
      if (this.pointerMove) stage.removeEventListener('pointermove', this.pointerMove);
      if (this.pointerLeave) stage.removeEventListener('pointerleave', this.pointerLeave);
    }
  }

  /* ───────────── entrée du hero ───────────── */
  private intro(): void {
    const hero = this.heroRef()?.nativeElement;
    if (!hero || prefersReducedMotion()) return;
    this.timeline = gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .from(hero.querySelectorAll('.line > span'), { yPercent: 116, duration: 1.15, stagger: 0.09 })
      .from(hero.querySelector('.lede'), { y: 18, opacity: 0, duration: 0.8 }, '-=0.72')
      .from(hero.querySelector('app-landing .hero-form'), { y: 22, opacity: 0, duration: 0.85 }, '-=0.62')
      .from(hero.querySelectorAll('.hero__demos > *'), { y: 12, opacity: 0, duration: 0.5, stagger: 0.05 }, '-=0.55');

    const showcase = this.showcaseRef()?.nativeElement;
    if (showcase) {
      this.timeline
        .from(showcase, { y: 60, opacity: 0, duration: 1.05 }, '-=0.6')
        .from(showcase.querySelectorAll('.frame'), { y: 34, opacity: 0, scale: 0.97, duration: 1, stagger: 0.12 }, '-=0.8')
        .from(showcase.querySelectorAll('.showcase__meta > div'), { y: 12, opacity: 0, duration: 0.55, stagger: 0.06 }, '-=0.6');
    }
  }

  /* ───────────── parallaxe + flottement ───────────── */
  private showcaseMotion(): void {
    const stage = this.showcaseRef()?.nativeElement;
    if (!stage || prefersReducedMotion()) return;

    const frames = Array.from(stage.querySelectorAll<HTMLElement>('.frame'));
    frames.forEach((el, i) => {
      const amp = Number(el.dataset['depth'] ?? 1) * 3.4;
      this.floats.push(
        gsap.to(el, {
          y: `+=${amp + 4}`,
          duration: 3.4 + i * 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }),
      );
    });

    this.pointerMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      frames.forEach((el) => {
        const d = Number(el.dataset['depth'] ?? 1);
        gsap.to(el, { x: nx * 16 * d, rotation: nx * 1.4, duration: 1.1, ease: 'power2.out', overwrite: 'auto' });
      });
      gsap.to(stage.querySelector('.showcase__bg'), { x: nx * -14, y: ny * -10, scale: 1.04, duration: 1.2, ease: 'power2.out' });
    };
    this.pointerLeave = () => {
      frames.forEach((el) => gsap.to(el, { x: 0, rotation: 0, duration: 1, ease: 'power3.out', overwrite: 'auto' }));
      gsap.to(stage.querySelector('.showcase__bg'), { x: 0, y: 0, scale: 1, duration: 1.2, ease: 'power3.out' });
    };
    stage.addEventListener('pointermove', this.pointerMove);
    stage.addEventListener('pointerleave', this.pointerLeave);
  }

  /* ───────────── teaser : bascule PC / tablette / mobile ───────────── */
  setTeaser(view: TeaserView): void {
    if (this.teaserView() === view) return;
    this.teaserView.set(view);
    this.applyTeaser(view, true);
  }

  private applyTeaser(view: TeaserView, animate: boolean): void {
    const root = this.teaserRef()?.nativeElement;
    if (!root) return;
    const frames: Record<string, HTMLElement | null> = {
      desktop: root.querySelector('.t-frame--desktop'),
      tablet: root.querySelector('.t-frame--tablet'),
      mobile: root.querySelector('.t-frame--phone'),
    };
    const targets: Record<TeaserView, Record<string, { w: string; left: number; top: number; rotate: number; opacity: number }>> = {
      trio: {
        desktop: { w: '54%', left: 45, top: 42, rotate: -1.6, opacity: 1 },
        tablet: { w: '19%', left: 14, top: 62, rotate: 1.8, opacity: 1 },
        mobile: { w: '11%', left: 80, top: 60, rotate: 2.6, opacity: 1 },
      },
      desktop: {
        desktop: { w: '76%', left: 50, top: 50, rotate: 0, opacity: 1 },
        tablet: { w: '19%', left: 14, top: 62, rotate: 0, opacity: 0 },
        mobile: { w: '11%', left: 80, top: 60, rotate: 0, opacity: 0 },
      },
      tablet: {
        desktop: { w: '54%', left: 45, top: 42, rotate: 0, opacity: 0 },
        tablet: { w: '28%', left: 50, top: 50, rotate: 0, opacity: 1 },
        mobile: { w: '11%', left: 80, top: 60, rotate: 0, opacity: 0 },
      },
      mobile: {
        desktop: { w: '54%', left: 45, top: 42, rotate: 0, opacity: 0 },
        tablet: { w: '19%', left: 14, top: 62, rotate: 0, opacity: 0 },
        mobile: { w: '20%', left: 50, top: 50, rotate: 0, opacity: 1 },
      },
    };

    const conf = targets[view];
    Object.entries(frames).forEach(([key, el]) => {
      const c = conf[key];
      if (!el || !c) return;
      if (!animate || prefersReducedMotion()) {
        el.style.width = c.w;
        el.style.left = `${c.left}%`;
        el.style.top = `${c.top}%`;
        el.style.opacity = String(c.opacity);
        el.style.transform = `translate(-50%, -50%) rotate(${c.rotate}deg)`;
        return;
      }
      gsap.to(el, {
        width: c.w,
        left: `${c.left}%`,
        top: `${c.top}%`,
        xPercent: -50,
        yPercent: -50,
        rotation: c.rotate,
        opacity: c.opacity,
        duration: 0.9,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
    });
  }

  /* ───────────── formulaire ───────────── */
  onInput(value: string): void {
    this.url.set(value);
  }

  submit(event: Event): void {
    event.preventDefault();
    const value = this.url().trim();
    if (!value) {
      const input = document.getElementById('hero-url') as HTMLInputElement | null;
      input?.focus();
      return;
    }
    this.generate.emit(value);
  }

  useExample(host: string): void {
    this.url.set(host);
    this.generate.emit(`https://${host}`);
  }
}
