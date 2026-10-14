/** Application installable et consultation hors connexion (parcours clé du cahier des charges). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const dist = join(import.meta.dirname, '../../dist-e2e');
const PAGES_PRECACHEES = [
  '/',
  'annuaire/',
  'agenda/',
  'actus/',
  'association/',
  'mentions-legales/',
  'hors-ligne/',
];

test.describe('service worker', () => {
  const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
  const precache = [...sw.matchAll(/\{url:"([^"]+)",revision:/g)].map(([, url]) => url);

  test('précache les pages HTML consultables hors connexion', () => {
    expect(precache).toEqual(expect.arrayContaining(PAGES_PRECACHEES));
  });

  test('ne précache pas les fiches, mises en cache à la consultation', () => {
    expect(precache.filter((url) => /^(annuaire|agenda|actus)\/.+\//.test(url ?? ''))).toEqual([]);
  });

  test('replie sur la page hors connexion, qui est précachée', () => {
    expect(sw).toContain('"/hors-ligne/"');
  });
});

test('le manifeste rend le site installable', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBe('/manifest.webmanifest');
  const manifeste = (await (await request.get(href ?? '')).json()) as {
    name: string;
    lang: string;
    display: string;
    start_url: string;
    icons: { src: string; sizes: string; purpose?: string }[];
  };
  expect(manifeste).toMatchObject({
    name: 'Pédaler en Auvergne',
    lang: 'fr',
    display: 'standalone',
    start_url: '/',
  });
  expect(manifeste.icons.map((i) => i.sizes)).toEqual(
    expect.arrayContaining(['192x192', '512x512']),
  );
  expect(manifeste.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  for (const { src } of manifeste.icons) {
    expect((await request.get(src)).status()).toBe(200);
  }
});

test('le site se consulte hors connexion', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Une fiche consultée en ligne reste disponible ensuite.
  await page.goto('/annuaire/velo-test-riom/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vélo Test Riom');

  await context.setOffline(true);

  await page.goto('/agenda/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Agenda des manifestations vélo',
  );
  await page.goto('/annuaire/velo-test-riom/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vélo Test Riom');
  // Une page jamais ouverte mène à la page « hors connexion ».
  await page.goto('/actus/2026-10-01-article-test/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vous êtes hors connexion');
});
