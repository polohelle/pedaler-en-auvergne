import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Icônes de l'application (PWA, écran d'accueil iPhone) générées depuis public/favicon.svg :
// `pnpm icones`. Les PNG produits sont versionnés dans public/.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#22303a' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#22303a' } },
  },
  images: ['public/favicon.svg'],
});
