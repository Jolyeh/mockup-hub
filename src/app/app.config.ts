import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

/**
 * Angular 21 — zoneless par défaut : aucun zone.js, la détection de changement
 * est déclenchée par les signals (état du studio, vues, toasts).
 */
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};
