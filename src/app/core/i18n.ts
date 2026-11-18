import { Injectable, effect, signal } from '@angular/core';

export type Lang = 'fr' | 'en';

/**
 * Internationalisation FR / EN — 100 % côté navigateur.
 * Aucun stockage : la langue vient de `?lang=fr|en`, sinon de la langue du
 * navigateur. Le choix manuel met à jour l'URL (partageable) sans rechargement.
 */
const FR: Record<string, string> = {
  'meta.title': 'Générateur de mockups multi-appareils — PC, tablette & Android | MockupHub',
  'meta.description': 'Collez une URL et générez en quelques secondes un mockup réaliste de votre site sur ordinateur, tablette et Android. Fonds, ombres et angles réglables, export PNG, WEBP et SVG en 3200 × 2000. Gratuit, sans compte, sans sauvegarde.',
  'meta.title.studio': 'Studio de mockups — PC, tablette & Android | MockupHub',
  'meta.description.studio': 'Composez votre scène : appareils, arrière-plan, ombre, rayon, marges et angle, puis exportez en PNG, WEBP ou SVG haute résolution.',
  'nav.craft': 'Craft', 'nav.workflow': 'Workflow', 'nav.privacy': 'Vie privée', 'nav.studio': 'Studio',
  'nav.openStudio': 'Ouvrir le studio', 'nav.generate': 'Générer un mockup', 'nav.home': 'MockupHub — accueil',
  'nav.menu': 'Ouvrir le menu', 'nav.lang': 'Changer de langue',
  'hero.eyebrow': 'Générateur de mockups multi-appareils',
  'hero.title1': 'Votre site,', 'hero.title2a': 'mis en scène ', 'hero.title2b': 'comme une pièce', 'hero.title3': 'de collection.',
  'hero.lede': 'Collez une URL. En quelques secondes, votre site est rendu sur ordinateur, tablette et mobile, puis composé dans des cadres réalistes — prêt à exporter en haute résolution. Tout se passe dans le navigateur.',
  'hero.placeholder': 'https://votre-site.com', 'hero.urlLabel': 'URL de votre site', 'hero.generate': 'Générer',
  'hero.try': 'Ou essayez :', 'showcase.live': 'Rendu live', 'showcase.open': 'Ouvrir le studio',
  'showcase.devices': 'formats d’appareils', 'showcase.kept': 'donnée conservée', 'showcase.export': 'export maximum',
  'logos.caption': 'Rendus avec MockupHub',
  'craft.eyebrow': 'Le craft', 'craft.title': 'Chaque détail pense à votre marque.',
  'craft.lede': 'Un moteur de capture, un éditeur de scène, un export de niveau studio. Rien de plus, rien de moins.',
  'craft.capture.title': 'Trois résolutions, une seule action',
  'craft.capture.text': 'Votre page est rendue en 1440×900, 768×1024 et 390×844, puis posée automatiquement dans les cadres. Aucune extension, aucun script à installer.',
  'craft.tick1': 'Cadres réalistes avec barre de navigateur', 'craft.tick2': 'Composition trio, duo ou solo', 'craft.tick3': 'Bascule PC / tablette / mobile animée',
  'craft.scene.title': 'Scènes & arrière-plans',
  'craft.scene.text': 'Fonds ivoire, sable, brume, encre, cacao, braise — ombres portées réglables, angles de vue, marges. Votre capture devient une composition.',
  'craft.export.title': 'Export & vecteurs',
  'craft.export.text': 'PNG et WEBP en 3200 × 2000, ou un SVG autonome avec les captures embarquées.',
  'salon.title': 'Scène « Salon »',
  'salon.text': 'Moniteur au centre, portable au premier plan, tablette et téléphone devant : les quatre appareils composés dans une seule scène, sur le fond prédéfini de votre choix.',
  'salon.foot': 'Moniteur · portable · tablette · mobile',
  'workflow.eyebrow': 'Le workflow', 'workflow.title': 'Trois temps. Zéro friction.',
  'step1.title': 'Collez l’URL', 'step1.text': 'Un champ, un bouton. Aucun compte, aucune installation, aucun réglage avant de voir le résultat.',
  'step2.title': 'Laissez composer', 'step2.text': 'Les trois formats arrivent dans une scène équilibrée, prête à être ajustée au pixel.',
  'step3.title': 'Exportez', 'step3.text': 'Fond, ombre, angle, marges : vous réglez, vous téléchargez, vous fermez l’onglet.',
  'teaser.desktop': 'Ordinateur', 'teaser.tablet': 'Tablette', 'teaser.mobile': 'Mobile', 'teaser.hint': 'bascule animée avec GSAP',
  'privacy.eyebrow': 'Vie privée', 'privacy.title1': 'Rien n’est sauvegardé.', 'privacy.title2': 'Sérieusement.',
  'privacy.lede': 'Pas de compte, pas de base de données, pas de serveur à nous. Les captures transitent par un service public de rendu, la composition et l’export se font dans votre navigateur, et tout disparaît à la fermeture de l’onglet.',
  'privacy.c1t': 'Zéro stockage', 'privacy.c1p': 'Aucun cookie, aucun localStorage, aucune galerie distante. Votre travail reste le vôtre.',
  'privacy.c2t': 'Zéro compte', 'privacy.c2p': 'Pas d’inscription, pas d’abonnement, pas de crédits à surveiller. L’outil s’ouvre, travaille, se ferme.',
  'privacy.c3t': 'Code lisible', 'privacy.c3p': 'Un projet Angular autonome : trois services, deux écrans, GSAP pour le mouvement.',
  'cta.title1': 'Prêt à voir votre site', 'cta.title2': 'sous son meilleur angle ?',
  'cta.primary': 'Générer mon premier mockup', 'cta.example': 'Voir un exemple',
  'footer.tagline1': 'Des mockups d’exception, composés en un instant.', 'footer.tagline2': 'Votre site, sublimé sur tous les écrans.',
  'footer.product': 'Produit', 'footer.tech': 'Technique', 'footer.shortcuts': 'Raccourcis',
  'footer.render': 'Rendu des captures', 'footer.backHome': 'Retour à l’accueil', 'footer.edition': 'Studio · Édition 2026',
  'studio.title': 'Studio', 'studio.local': '100 % local', 'studio.url': 'URL du site',
  'studio.capturing': 'Capture en cours', 'studio.capture': 'Capturer & générer', 'studio.examples': 'Exemples :',
  'studio.devices': 'Appareils', 'studio.composition': 'Composition', 'studio.background': 'Arrière-plan',
  'studio.advanced': 'Réglages avancés', 'studio.shadow': 'Ombre portée', 'studio.radius': 'Rayon des cadres',
  'studio.padding': 'Marge de scène', 'studio.angle': 'Angle des appareils', 'studio.chrome': 'Barre de navigateur',
  'studio.downloadPng': 'Télécharger PNG · 3200 px', 'studio.copyCss': 'Copier les styles CSS',
  'studio.all': 'Tout', 'studio.pc': 'PC', 'studio.tablet': 'Tablette',
  'studio.error': 'Erreur', 'studio.ready': 'Prêt', 'studio.waiting': 'En attente',
  'studio.empty.title': 'Collez une URL pour commencer',
  'studio.empty.text': 'Le navigateur rend votre site sur trois formats, les pose dans des cadres réalistes et vous laisse exporter la scène en haute résolution.',
  'studio.empty.try': 'Essayer avec stripe.com', 'studio.unavailable': 'capture indisponible',
  'studio.exports': 'Exports : PNG · WEBP · SVG — 3200 × 2000 px',
  'device.desktop': 'Ordinateur', 'device.tablet': 'Tablette', 'device.mobile': 'Android',
  'layout.trio': 'Trio', 'layout.duo': 'Duo', 'layout.solo': 'Solo', 'layout.salon': 'Salon',
  'bg.mist': 'Brume', 'bg.ivory': 'Ivoire', 'bg.sand': 'Sable', 'bg.ember': 'Braise', 'bg.ink': 'Encre', 'bg.cocoa': 'Cacao', 'bg.sage': 'Sauge', 'bg.sky': 'Ciel',
  'msg.needUrl': 'Collez l’URL d’un site pour lancer la capture.',
  'msg.done': 'Mockup généré — composez votre scène.',
  'msg.captureFail': 'Capture impossible.',
  'msg.keepDevice': 'Gardez au moins un appareil sélectionné.',
  'msg.needMockup': 'Générez d’abord un mockup.',
  'msg.exportFail': 'Export impossible.',
  'msg.cssCopied': 'Styles CSS copiés dans le presse-papier.',
  'msg.copyFail': 'Copie impossible dans ce navigateur.',
  'msg.preparing': 'Préparation de la capture…',
  'msg.ready': 'Prêt', 'msg.generated': 'Mockup généré', 'msg.cancelled': 'Capture annulée.',
  'capture.failed': 'Impossible de rendre {host} pour le moment. Réessayez dans un instant ou utilisez l’un des exemples (stripe.com, linear.app, framer.com).',
  'capture.count': 'Capture {device} — {i}/{n}',
  'css.untitled': 'sans titre',
  'seo.noscript.title': 'MockupHub a besoin de JavaScript',
  'seo.noscript.text': 'La capture, la composition et l’export se font entièrement dans votre navigateur. Activez JavaScript pour utiliser le studio.',
};

const EN: Record<string, string> = {
  'meta.title': 'Multi-device mockup generator — Desktop, tablet & Android | MockupHub',
  'meta.description': 'Paste a URL and generate a realistic mockup of your website on desktop, tablet and Android in seconds. Adjustable backgrounds, shadows and angles, PNG, WEBP and SVG export at 3200 × 2000. Free, no account, nothing stored.',
  'meta.title.studio': 'Mockup studio — Desktop, tablet & Android | MockupHub',
  'meta.description.studio': 'Compose your scene: devices, background, shadow, radius, padding and angle, then export in high-resolution PNG, WEBP or SVG.',
  'nav.craft': 'Craft', 'nav.workflow': 'Workflow', 'nav.privacy': 'Privacy', 'nav.studio': 'Studio',
  'nav.openStudio': 'Open the studio', 'nav.generate': 'Generate a mockup', 'nav.home': 'MockupHub — home',
  'nav.menu': 'Open menu', 'nav.lang': 'Switch language',
  'hero.eyebrow': 'Multi-device mockup generator',
  'hero.title1': 'Your website,', 'hero.title2a': 'staged ', 'hero.title2b': 'like a collector’s', 'hero.title3': 'piece.',
  'hero.lede': 'Paste a URL. In seconds, your site is rendered on desktop, tablet and mobile, composed in realistic frames — ready to export in high resolution. Everything happens in your browser.',
  'hero.placeholder': 'https://your-site.com', 'hero.urlLabel': 'Your website URL', 'hero.generate': 'Generate',
  'hero.try': 'Or try:', 'showcase.live': 'Live render', 'showcase.open': 'Open the studio',
  'showcase.devices': 'device formats', 'showcase.kept': 'data kept', 'showcase.export': 'maximum export',
  'logos.caption': 'Rendered with MockupHub',
  'craft.eyebrow': 'The craft', 'craft.title': 'Every detail serves your brand.',
  'craft.lede': 'A capture engine, a scene editor, a studio-grade export. Nothing more, nothing less.',
  'craft.capture.title': 'Three resolutions, one action',
  'craft.capture.text': 'Your page is rendered at 1440×900, 768×1024 and 390×844, then placed in frames automatically. No extension, no script to install.',
  'craft.tick1': 'Realistic frames with browser bar', 'craft.tick2': 'Trio, duo or solo composition', 'craft.tick3': 'Animated desktop / tablet / mobile switch',
  'craft.scene.title': 'Scenes & backgrounds',
  'craft.scene.text': 'Ivory, sand, mist, ink, cocoa, ember backgrounds — adjustable drop shadows, viewing angles, padding. Your capture becomes a composition.',
  'craft.export.title': 'Export & vectors',
  'craft.export.text': 'PNG and WEBP at 3200 × 2000, or a self-contained SVG with embedded captures.',
  'salon.title': '“Living room” scene',
  'salon.text': 'Monitor in the centre, laptop in the foreground, tablet and phone in front: all four devices composed in a single scene, on the preset background of your choice.',
  'salon.foot': 'Monitor · laptop · tablet · phone',
  'workflow.eyebrow': 'The workflow', 'workflow.title': 'Three steps. Zero friction.',
  'step1.title': 'Paste the URL', 'step1.text': 'One field, one button. No account, no installation, no settings before you see the result.',
  'step2.title': 'Let it compose', 'step2.text': 'The three formats land in a balanced scene, ready to be fine-tuned to the pixel.',
  'step3.title': 'Export', 'step3.text': 'Background, shadow, angle, padding: adjust, download, close the tab.',
  'teaser.desktop': 'Desktop', 'teaser.tablet': 'Tablet', 'teaser.mobile': 'Mobile', 'teaser.hint': 'GSAP-animated switch',
  'privacy.eyebrow': 'Privacy', 'privacy.title1': 'Nothing is stored.', 'privacy.title2': 'Seriously.',
  'privacy.lede': 'No account, no database, no server of ours. Captures go through a public rendering service, composition and export happen in your browser, and everything disappears when you close the tab.',
  'privacy.c1t': 'Zero storage', 'privacy.c1p': 'No cookies, no localStorage, no remote gallery. Your work stays yours.',
  'privacy.c2t': 'Zero account', 'privacy.c2p': 'No sign-up, no subscription, no credits to watch. The tool opens, works, closes.',
  'privacy.c3t': 'Readable code', 'privacy.c3p': 'A standalone Angular project: three services, two screens, GSAP for motion.',
  'cta.title1': 'Ready to see your site', 'cta.title2': 'from its best angle?',
  'cta.primary': 'Generate my first mockup', 'cta.example': 'See an example',
  'footer.tagline1': 'Exceptional mockups, composed in an instant.', 'footer.tagline2': 'Your site, elevated on every screen.',
  'footer.product': 'Product', 'footer.tech': 'Tech', 'footer.shortcuts': 'Shortcuts',
  'footer.render': 'Capture rendering', 'footer.backHome': 'Back to home', 'footer.edition': 'Studio · 2026 Edition',
  'studio.title': 'Studio', 'studio.local': '100% local', 'studio.url': 'Website URL',
  'studio.capturing': 'Capturing', 'studio.capture': 'Capture & generate', 'studio.examples': 'Examples:',
  'studio.devices': 'Devices', 'studio.composition': 'Composition', 'studio.background': 'Background',
  'studio.advanced': 'Advanced settings', 'studio.shadow': 'Drop shadow', 'studio.radius': 'Frame radius',
  'studio.padding': 'Scene padding', 'studio.angle': 'Device angle', 'studio.chrome': 'Browser bar',
  'studio.downloadPng': 'Download PNG · 3200 px', 'studio.copyCss': 'Copy CSS styles',
  'studio.all': 'All', 'studio.pc': 'Desktop', 'studio.tablet': 'Tablet',
  'studio.error': 'Error', 'studio.ready': 'Ready', 'studio.waiting': 'Waiting',
  'studio.empty.title': 'Paste a URL to get started',
  'studio.empty.text': 'The browser renders your site in three formats, places them in realistic frames and lets you export the scene in high resolution.',
  'studio.empty.try': 'Try with stripe.com', 'studio.unavailable': 'capture unavailable',
  'studio.exports': 'Exports: PNG · WEBP · SVG — 3200 × 2000 px',
  'device.desktop': 'Desktop', 'device.tablet': 'Tablet', 'device.mobile': 'Android',
  'layout.trio': 'Trio', 'layout.duo': 'Duo', 'layout.solo': 'Solo', 'layout.salon': 'Living room',
  'bg.mist': 'Mist', 'bg.ivory': 'Ivory', 'bg.sand': 'Sand', 'bg.ember': 'Ember', 'bg.ink': 'Ink', 'bg.cocoa': 'Cocoa', 'bg.sage': 'Sage', 'bg.sky': 'Sky',
  'msg.needUrl': 'Paste a website URL to start the capture.',
  'msg.done': 'Mockup generated — compose your scene.',
  'msg.captureFail': 'Capture failed.',
  'msg.keepDevice': 'Keep at least one device selected.',
  'msg.needMockup': 'Generate a mockup first.',
  'msg.exportFail': 'Export failed.',
  'msg.cssCopied': 'CSS styles copied to the clipboard.',
  'msg.copyFail': 'Copy is not available in this browser.',
  'msg.preparing': 'Preparing the capture…',
  'msg.ready': 'Ready', 'msg.generated': 'Mockup generated', 'msg.cancelled': 'Capture cancelled.',
  'capture.failed': 'Could not render {host} right now. Try again in a moment or use one of the examples (stripe.com, linear.app, framer.com).',
  'capture.count': 'Capturing {device} — {i}/{n}',
  'css.untitled': 'untitled',
  'seo.noscript.title': 'MockupHub needs JavaScript',
  'seo.noscript.text': 'Capture, composition and export run entirely in your browser. Enable JavaScript to use the studio.',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(I18nService.initial());
  private readonly dict = { fr: FR, en: EN } as const;

  constructor() {
    effect(() => {
      document.documentElement.lang = this.lang();
    });
  }

  private static initial(): Lang {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (param === 'en' || param === 'fr') return param;
    return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'fr';
  }

  set(lang: Lang): void {
    this.lang.set(lang);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState(null, '', url);
  }

  toggle(): void {
    this.set(this.lang() === 'fr' ? 'en' : 'fr');
  }

  t(key: string, params?: Record<string, string | number>): string {
    let value = this.dict[this.lang()][key as keyof typeof FR] ?? FR[key as keyof typeof FR] ?? key;
    if (params) {
      for (const [name, val] of Object.entries(params)) value = value.replaceAll(`{${name}}`, String(val));
    }
    return value;
  }
}
