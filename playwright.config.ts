import { defineConfig, devices } from '@playwright/test';

const port = 4321;
const estEnCi = process.env.CI !== undefined;

export default defineConfig({
  testDir: 'tests',
  testMatch: ['e2e/**/*.spec.ts', 'a11y/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: estEnCi,
  retries: estEnCi ? 1 : 0,
  reporter: estEnCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${String(port)}`,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'retain-on-failure',
  },
  projects: [
    // Mobile d'abord : la majorité des consultations se fera sur téléphone.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'bureau', use: { ...devices['Desktop Chrome'] } },
  ],
  // Les tests tournent sur le site construit avec les contenus de test (dist-e2e/), jamais
  // sur le serveur de développement ni sur les contenus réels.
  webServer: {
    // --ignore-lock garde le serveur au premier plan, même lancé par un agent.
    command: `pnpm build && pnpm preview --port ${String(port)} --ignore-lock`,
    env: { PEA_CONTENU: 'tests/fixtures/site' },
    port,
    reuseExistingServer: !estEnCi,
    timeout: 180_000,
  },
});
