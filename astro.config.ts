import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://pedalerenauvergne.fr',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
