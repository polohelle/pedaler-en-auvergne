/** Itinéraires (ADR 0035), sur le site construit avec les contenus de test. */
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Les tuiles viennent d'un service externe : elles ne sont pas nécessaires au test.
  await page.route('https://data.geopf.fr/**', (route) => route.abort());
});

test('les traces publiées seules sont servies, simplifiées, avec leurs mesures', async ({
  request,
}) => {
  const lignes = (await (await request.get('/itineraires.geojson')).json()) as {
    features: {
      geometry: { type: string; coordinates: number[][][] };
      properties: { id: string; distanceKm: number; deniveleM?: number };
    }[];
  };
  const ids = lignes.features.map((f) => f.properties.id);
  expect(ids).toEqual(['boucle-test-volvic', 'vtt-test-riom']);
  const boucle = lignes.features.find((f) => f.properties.id === 'boucle-test-volvic');
  expect(boucle?.geometry.type).toBe('MultiLineString');
  expect(boucle?.properties.distanceKm).toBeGreaterThan(20);
  expect(boucle?.properties.deniveleM).toBeGreaterThan(100);
});

test('la trace GPX d’un parcours publié se télécharge, pas celle d’un brouillon', async ({
  request,
}) => {
  const trace = await request.get('/itineraires/boucle-test-volvic.gpx');
  expect(trace.status()).toBe(200);
  expect(await trace.text()).toContain('<gpx');
  expect((await request.get('/itineraires/gravel-test-brouillon.gpx')).status()).toBe(404);
  expect((await request.get('/itineraires/gravel-test-brouillon/')).status()).toBe(404);
});

test('la carte IGN trace les parcours et les filtres les trient', async ({ page }) => {
  await page.goto('/itineraires/');
  await expect(page.getByText('2 parcours tracé(s) sur la carte.')).toBeVisible();
  await expect(page.locator('#carte-itineraires path.trace')).toHaveCount(2);
  await expect(page.getByText('© IGN Géoplateforme').first()).toBeVisible();

  const liste = page.locator('li[data-itineraire]');
  await page.getByRole('checkbox', { name: 'VTT' }).check();
  await expect(page.getByText('1 parcours sur 2 correspondent aux filtres.')).toBeVisible();
  await expect(liste.filter({ visible: true })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Montée test en VTT' })).toBeVisible();
  await expect(page.locator('#carte-itineraires path.trace')).toHaveCount(1);
  await expect(page).toHaveURL(/\?pratique=vtt$/);

  await page.getByRole('checkbox', { name: 'Boucles seulement' }).check();
  await expect(page.getByText('0 parcours sur 2 correspondent aux filtres.')).toBeVisible();

  await page.getByRole('button', { name: 'Tout afficher' }).click();
  await expect(page.getByText('2 parcours affiché(s).')).toBeVisible();
  await expect(liste.filter({ visible: true })).toHaveCount(2);
});

test('une adresse filtrée se partage', async ({ page }) => {
  await page.goto('/itineraires/?distance=moins-de-30&commune=Riom');
  await expect(page.getByLabel('Distance')).toHaveValue('moins-de-30');
  await expect(page.getByText('1 parcours sur 2 correspondent aux filtres.')).toBeVisible();
  await expect(page.locator('li[data-itineraire]').filter({ visible: true })).toHaveCount(1);
});

test('la fiche cite la licence et la source et trace le seul parcours', async ({ page }) => {
  await page.goto('/itineraires/boucle-test-volvic/');
  await expect(page.getByText('Trace du parcours sur fond IGN.')).toBeVisible();
  await expect(page.locator('#carte-itineraires path.trace')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Licence Ouverte 2.0 (Etalab)' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'tourisme.example.org' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vélo Test Riom' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Télécharger la trace GPX' })).toHaveAttribute(
    'href',
    '/itineraires/boucle-test-volvic.gpx',
  );
});
