# MockupHub — Angular 21 · sans API, sans sauvegarde

Collez une URL → votre site est rendu sur **ordinateur, tablette et mobile**, composé dans des cadres réalistes, puis exporté en **PNG / WEBP / SVG** haute résolution.

Tout se passe **dans le navigateur** : aucun backend, aucun compte, aucune base de données, aucun cookie. Fermez l'onglet, il ne reste rien.

> **Angular 21.2** · CLI 21 · TypeScript 5.9 · **zoneless** (aucun `zone.js`) · signals · GSAP 3.15

---

## Démarrer

```bash
cd mockuphub-ng
npm install        # (.npmrc fournit legacy-peer-deps pour npm 10)
npm start          # → http://localhost:4200
```

Build de production :

```bash
npm run build      # → web/browser
npm run serve:dist # → http://localhost:8081
```

---

## Ce que contient le projet

| Écran | Contenu |
|---|---|
| **Landing** | Hero éditorial (Inter + Instrument Serif), entrée animée GSAP, scène live PC/tablette/mobile avec parallaxe, bento du produit, workflow avec **bascule d'appareils animée**, section « rien n'est sauvegardé », CTA |
| **Studio** | Champ URL, captures des trois formats, composition **Trio / Duo / Solo**, vues **Tout / PC / Tablette / Mobile**, 8 arrière-plans, ombre, rayon, marge, angle, barre de navigateur, export PNG · WEBP (3200 × 2000) · SVG vectoriel, copie d'un snippet CSS |
| **Motion** | GSAP + ScrollTrigger : timeline du hero, révélations au scroll, boutons magnétiques, morphing des cadres, micro-interactions, respect de `prefers-reduced-motion` |

Aucune dépendance réseau à l'exécution : polices auto-hébergées, captures de démonstration embarquées, GSAP bundlé par Angular.

---

## Spécificités Angular 21 de ce projet

- **Zoneless par défaut** : `app.config.ts` ne déclare que `provideBrowserGlobalErrorListeners()`. Aucun `zone.js` dans le bundle (voir les chunks de build : `main` + `styles`, plus de `polyfills`).
- **API modernes** : `signal`, `computed`, `input()`, `output()`, `viewChild()`, `effect()`, `@if` / `@for`, `ChangeDetectionStrategy.OnPush`.
- **Nommage v20+** : composants `App`, `Landing`, `Studio` (fichiers `app.ts`, `landing.ts`, `studio.ts`), directives sans `standalone: true` (implicite).
- **Builder `@angular/build:application`**, budget initial 500 kB — sortie réelle ≈ **100 kB compressés**.
- **Directives maison** : `appReveal` (ScrollTrigger), `appMagnetic` — dans `src/app/shared/motion.ts`.

---

## Comment la capture fonctionne sans API

`src/app/core/capture.ts` demande à un **service public de rendu** d'exécuter la page et de renvoyer une image, puis la charge en CORS pour qu'elle soit exploitable dans le canvas :

1. **Captures embarquées** (`public/demo/*`) pour les sites de démonstration — stripe, linear, framer, vercel, github. Instantané, fonctionne hors-ligne.
2. **Microlink** — viewport réel 1440×900 / 768×1024 / 390×844 en DPR 2.
3. **thum.io** — repli fiable ; pour les formats tablette et mobile, une tranche verticale du rendu large est recadrée dans un canvas.

> Les deux services sont gratuits et limités en débit : une capture « live » peut prendre quelques secondes, ou échouer temporairement si le quota est atteint (l'interface l'annonce clairement). Pour un usage intensif, remplacez `captureOne()` par votre propre service de rendu — le reste du studio ne change pas.

L'export ne dépend d'aucun réseau : `src/app/core/exporter.ts` réutilise exactement le même modèle de scène (`computeFrames()` dans `models.ts`) que l'affichage, donc le fichier téléchargé est fidèle au pixel près, en 2× (3200 × 2000).

---

## Structure

```
mockuphub-ng/
├─ src/app/
│  ├─ core/
│  │  ├─ models.ts       # appareils, scènes, arrière-plans, géométrie partagée
│  │  ├─ capture.ts      # chaîne de capture navigateur (zéro backend)
│  │  └─ exporter.ts     # rendu canvas + SVG autonome
│  ├─ landing/           # landing.ts · landing.html · landing.css
│  ├─ studio/            # studio.ts · studio.html · studio.css
│  ├─ shared/motion.ts   # directives GSAP : appReveal, appMagnetic
│  ├─ app.ts/html/css    # navigation + vues
│  └─ app.config.ts
├─ src/styles.css        # design system complet
└─ public/
   ├─ fonts/             # Inter + Instrument Serif (woff2)
   └─ demo/              # captures pré-rendues des sites de démo
```

**Design system** — Encre `#131316` · Ivoire `#F6F2EC` · Terracotta `#E2542B` · Sauge `#5C6B58`. Titres Inter 500 à interlettrage −0,04 em, accents éditoriaux en *Instrument Serif* italique, micro-labels monospace, ombres douces multi-couches, grain 3,5 %.

---

## Aperçus

| | |
|---|---|
| ![Landing](docs/preview/01-landing.png) | ![Studio](docs/preview/02-studio.png) |
| ![Workflow](docs/preview/03-workflow.png) | ![Scène Duo](docs/preview/04-scene-duo.png) |
| ![Scène Salon](docs/preview/07-scene-salon.png) | |

## Langues

Interface en **mode clair uniquement**. **Français / English** : bouton FR/EN dans la barre de navigation. La langue suit `?lang=fr|en`, sinon la langue du navigateur ; toute l'interface (landing, studio, messages, exports) est traduite, ainsi que le titre et la description de la page.

## SEO

- Domaine de production : **https://mockuphub.vercel.app** (défini dans `src/app/core/seo.ts` et `src/index.html`).
- Balises title/description dynamiques selon la langue et la vue (accueil / studio), canonical, Open Graph + Twitter Card (image `public/og-cover.jpg`, 1200 × 630), `hreflang` fr/en, données structurées Schema.org (`SoftwareApplication`), `public/robots.txt`, `public/sitemap.xml`, `public/manifest.webmanifest`.
- Après déploiement : déclarer le site dans Google Search Console et Bing Webmaster Tools, puis soumettre `https://mockuphub.vercel.app/sitemap.xml`.

## Déploiement Vercel

Le fichier `vercel.json` est fourni : build `npm run build`, sortie `web/browser`, réécriture SPA vers `index.html`, en-têtes de sécurité et cache long pour `demo/` et `fonts/`.

```bash
npm i -g vercel   # ou importer le dépôt sur vercel.com
vercel --prod
```
