import AstroPWA from '@vite-pwa/astro';
import { defineConfig } from 'astro/config';
import { SITE } from './src/config/site';

// Les tests bout en bout construisent le site avec un jeu de contenus de test
// (variable PEA_CONTENU, voir src/content.config.ts) dans un dossier séparé, pour
// qu'aucun contenu de test ne puisse se retrouver dans le site publié.
const avecContenusDeTest = process.env.PEA_CONTENU !== undefined;

/** Pages mises en cache à l'installation : consultables hors connexion (ADR 0015, 0033). */
const PAGES_HORS_CONNEXION = [
  'index.html',
  'annuaire/index.html',
  'agenda/index.html',
  'actus/index.html',
  'mentions-legales/index.html',
  'hors-ligne/index.html',
];

/**
 * Suffixe des copies précachées des pages : sans lui, Workbox servirait la copie
 * d'installation avant le réseau, et un visiteur verrait l'ancienne version après chaque
 * publication (ADR 0033). Avec lui, ces pages passent par le cache « réseau d'abord » et la
 * copie précachée ne sert que hors connexion. La page « hors connexion » garde sa clé.
 */
const SUFFIXE_HORS_CONNEXION = '?hors-connexion';

/**
 * Réécrit les clés de précache des pages : `agenda/index.html` devient
 * `agenda/?hors-connexion` (URL de dossier, comme le fait l'intégration par défaut).
 */
function clesDePrecache(entrees: { url: string; revision: string | null; size: number }[]) {
  return {
    manifest: entrees.map((entree) => {
      if (!entree.url.endsWith('index.html')) return entree;
      const dossier = entree.url.replace(/index\.html$/, '');
      const url = dossier === '' ? '/' : dossier;
      return { ...entree, url: url === 'hors-ligne/' ? url : `${url}${SUFFIXE_HORS_CONNEXION}` };
    }),
    warnings: [],
  };
}

export default defineConfig({
  site: SITE.url,
  output: 'static',
  trailingSlash: 'always',
  outDir: avecContenusDeTest ? './dist-e2e' : './dist',
  build: {
    format: 'directory',
    // Feuilles de style toujours externes : la CSP n'autorise aucun style en ligne.
    inlineStylesheets: 'never',
  },
  vite: {
    // Scripts toujours externes, même petits : la CSP n'autorise aucun script en ligne.
    build: { assetsInlineLimit: 0 },
  },
  integrations: [
    AstroPWA({
      registerType: 'autoUpdate',
      // Script d'enregistrement en fichier séparé (registerSW.js), compatible avec la CSP.
      injectRegister: 'script',
      manifest: {
        id: '/',
        name: SITE.nom,
        short_name: 'Pédaler',
        description: SITE.description,
        lang: SITE.langue,
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: SITE.couleurFond,
        theme_color: SITE.couleurTheme,
        icons: [
          { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['_astro/*.{css,js}', '*.{svg,png,ico}', ...PAGES_HORS_CONNEXION],
        manifestTransforms: [clesDePrecache],
        // Pas de repli global façon application monopage : chaque page reste une vraie page.
        navigateFallback: null,
        runtimeCaching: [
          {
            // Toutes les pages : réseau d'abord, copie locale des pages déjà vues, puis copie
            // précachée de la page, puis page « hors connexion » en dernier recours.
            // L'espace organisateur, personnel, n'est jamais mis en cache (ADR 0038).
            urlPattern: ({ request, url }) =>
              request.mode === 'navigate' && !url.pathname.startsWith('/organisateur/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 3600 },
              plugins: [
                {
                  // Copie précachée de la page (clé suffixée, avec révision Workbox).
                  // Sérialisé dans sw.js : ne dépend que de l'API Cache du navigateur.
                  handlerDidError: async ({ request }) =>
                    caches.match(new URL(request.url).pathname, { ignoreSearch: true }),
                },
              ],
              // Clé de précache réécrite par l'intégration en URL de dossier.
              precacheFallback: { fallbackURL: '/hors-ligne/' },
            },
          },
        ],
      },
    }),
  ],
});
