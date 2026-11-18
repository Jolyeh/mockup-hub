import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Reveal on scroll (GSAP + ScrollTrigger), with stagger support. */
@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnInit, OnDestroy {
  @Input() appReveal: number | '' = 0;
  @Input() revealY = 26;
  @Input() revealDelay = 0;

  private readonly host = inject(ElementRef<HTMLElement>);
  private tween?: gsap.core.Tween;

  ngOnInit(): void {
    if (prefersReducedMotion()) return;
    const el = this.host.nativeElement as HTMLElement;
    this.tween = gsap.from(el, {
      y: this.revealY,
      opacity: 0,
      duration: 0.95,
      delay: this.revealDelay,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  }

  ngOnDestroy(): void {
    this.tween?.scrollTrigger?.kill();
    this.tween?.kill();
  }
}

/** Magnetic hover for primary buttons. */
@Directive({ selector: '[appMagnetic]' })
export class MagneticDirective implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private move?: (e: PointerEvent) => void;
  private leave?: () => void;

  ngOnInit(): void {
    if (prefersReducedMotion() || window.matchMedia('(hover: none)').matches) return;
    const el = this.host.nativeElement as HTMLElement;
    this.move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: ((e.clientX - r.left) / r.width - 0.5) * 6,
        y: ((e.clientY - r.top) / r.height - 0.5) * 4,
        duration: 0.4,
        ease: 'power2.out',
      });
    };
    this.leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', this.move);
    el.addEventListener('pointerleave', this.leave);
  }

  ngOnDestroy(): void {
    const el = this.host.nativeElement as HTMLElement;
    if (this.move) el.removeEventListener('pointermove', this.move);
    if (this.leave) el.removeEventListener('pointerleave', this.leave);
  }
}
