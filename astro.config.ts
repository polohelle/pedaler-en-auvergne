import { defineConfig } from 'astro/config';

// Les tests bout en bout construisent le site avec un jeu de contenus de test
// (variable PEA_CONTENU, voir src/content.config.ts) dans un dossier séparé, pour
// qu'aucun contenu de test ne puisse se retrouver dans le site publié.
const avecContenusDeTest = process.env.PEA_CONTENU !== undefined;

export default defineConfig({
  site: 'https://pedalerenauvergne.fr',
  output: 'static',
  trailingSlash: 'always',
  outDir: avecContenusDeTest ? './dist-e2e' : './dist',
  build: {
    format: 'directory',
    // Feuilles de style toujours externes : la CSP n'autorise aucun style en ligne.
    inlineStylesheets: 'never',
  },
});
