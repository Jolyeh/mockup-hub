import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { I18nService } from './i18n';

export const SITE_URL = 'https://mockuphub.vercel.app';

/**
 * SEO dynamique : titre, description, canonical et Open Graph suivent la
 * langue et la vue (accueil / studio). Le socle statique est dans index.html.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly i18n = inject(I18nService);

  update(view: 'landing' | 'studio'): void {
    const lang = this.i18n.lang();
    const studio = view === 'studio';
    const title = this.i18n.t(studio ? 'meta.title.studio' : 'meta.title');
    const description = this.i18n.t(studio ? 'meta.description.studio' : 'meta.description');
    const url = `${SITE_URL}/?lang=${lang}`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:locale', content: lang === 'fr' ? 'fr_FR' : 'en_GB' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }
}
