import {
  ChangeDetectionStrategy,
  effect,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { I18nService } from './core/i18n';
import { SeoService } from './core/seo';
import { Landing } from './landing/landing';
import { Studio } from './studio/studio';

type View = 'landing' | 'studio';

@Component({
  selector: 'app-root',
  imports: [Landing, Studio],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnDestroy {
  readonly i18n = inject(I18nService);
  private readonly seo = inject(SeoService);

  readonly view = signal<View>('landing');
  readonly request = signal<string | null>(null);
  readonly menuOpen = signal(false);

  private readonly studio = viewChild(Studio);
  private readonly navRef = viewChild<ElementRef<HTMLElement>>('nav');
  private readonly onScroll = () => {
    const nav = this.navRef()?.nativeElement;
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 24);
  };

  constructor() {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    // Titre / description / canonical suivent la vue et la langue
    effect(() => {
      this.i18n.lang();
      this.seo.update(this.view());
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  show(view: View): void {
    this.view.set(view);
    this.menuOpen.set(false);
    window.scrollTo(0, 0);
    if (view === 'studio') {
      // laisse le studio mesurer sa scène avant de rendre la main
      requestAnimationFrame(() => this.studio()?.refreshStage());
    }
  }

  /** Déclenché par la landing : onglet studio + capture immédiate. */
  generateFromLanding(url: string): void {
    this.request.set(url);
    this.show('studio');
  }

  /** Navigation vers une section de la landing (depuis n'importe quelle vue). */
  goSection(id: string): void {
    this.show('landing');
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  onRequestHandled(): void {
    this.request.set(null);
  }
}
