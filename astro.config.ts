import AstroPWA from '@vite-pwa/astro';
import { defineConfig } from 'astro/config';
import { SITE } from './src/config/site';

// Les tests bout en bout construisent le site avec un jeu de contenus de test
// (variable PEA_CONTENU, voir src/content.config.ts) dans un dossier séparé, pour
// qu'aucun contenu de test ne puisse se retrouver dans le site publié.
const avecContenusDeTest = process.env.PEA_CONTENU !== undefined;

/** Pages mises en cache à l'installation : consultables hors connexion (ADR 0015). */
const PAGES_HORS_CONNEXION = [
  'index.html',
  'annuaire/index.html',
  'agenda/index.html',
  'actus/index.html',
  'association/index.html',
  'mentions-legales/index.html',
  'hors-ligne/index.html',
];

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
        // Pas de repli global façon application monopage : chaque page reste une vraie page.
        navigateFallback: null,
        runtimeCaching: [
          {
            // Fiches et autres pages : réseau d'abord, copie locale des pages déjà vues,
            // page « hors connexion » en dernier recours.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 3600 },
              // Clé de précache réécrite par l'intégration en URL de dossier.
              precacheFallback: { fallbackURL: '/hors-ligne/' },
            },
          },
        ],
      },
    }),
  ],
});
