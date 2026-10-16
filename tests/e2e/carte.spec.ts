/** Carte de l'annuaire (ADR 0029), sur le site construit avec les contenus de test. */
import { expect, test } from '@playwright/test';

test('les points de l’annuaire excluent les fiches sans adresse publique', async ({ request }) => {
  const points = (await (await request.get('/annuaire.geojson')).json()) as {
    features: { properties: { id: string } }[];
  };
  const ids = points.features.map((f) => f.properties.id);
  expect(ids).toContain('velo-test-riom');
  expect(ids).not.toContain('atelier-mobile-test');
  expect(ids).not.toContain('brouillon-test');
});

test('la carte s’ouvre à la demande et place les acteurs', async ({ page }) => {
  // Les tuiles viennent d'un service externe : elles ne sont pas nécessaires au test.
  await page.route('https://data.geopf.fr/**', (route) => route.abort());
  await page.goto('/annuaire/');
  const fond = page.locator('#carte-annuaire');
  await expect(fond).toBeHidden();
  await page.getByRole('button', { name: 'Afficher la carte' }).click();
  await expect(page.getByRole('status')).toHaveText(/acteur\(s\) placé\(s\) sur la carte/);
  await expect(fond).toBeVisible();
  await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible();
  await expect(page.getByText('contributeurs OpenStreetMap').first()).toBeVisible();
});
