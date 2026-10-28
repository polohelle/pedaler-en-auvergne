/** Référencement : plan du site, pages écartées des moteurs, données structurées, partage. */
import { expect, test, type Page } from '@playwright/test';

async function donneesStructurees(page: Page): Promise<Record<string, unknown>> {
  const bloc = await page.locator('script[type="application/ld+json"]').textContent();
  return JSON.parse(bloc ?? '{}') as Record<string, unknown>;
}

test('le plan du site liste les pages indexables, et seulement elles', async ({ request }) => {
  const reponse = await request.get('/sitemap.xml');
  expect(reponse.status()).toBe(200);
  const xml = await reponse.text();
  expect(xml).toContain('<loc>https://pedalerenauvergne.fr/</loc>');
  expect(xml).toContain('<loc>https://pedalerenauvergne.fr/annuaire/velo-test-riom/</loc>');
  expect(xml).toContain(
    '<loc>https://pedalerenauvergne.fr/agenda/2099-06-14-bourse-test-riom/</loc>',
  );
  expect(xml).not.toContain('/organisateur/');
  expect(xml).not.toContain('/agenda/proposer/merci/');
  expect(xml).not.toContain('/hors-ligne/');
  expect(xml).not.toContain('/404');
});

test('robots.txt indique le plan du site', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://pedalerenauvergne.fr/sitemap.xml');
});

test('un retour de formulaire n’est pas indexé, une fiche l’est', async ({ page }) => {
  await page.goto('/agenda/proposer/merci/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await page.goto('/annuaire/velo-test-riom/');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

test('la fiche événement décrit un Event schema.org', async ({ page }) => {
  await page.goto('/agenda/2099-06-14-bourse-test-riom/');
  const donnees = await donneesStructurees(page);
  expect(donnees['@type']).toBe('Event');
  expect(donnees.name).toBe('Bourse aux vélos de test');
  expect(donnees.eventStatus).toBe('https://schema.org/EventScheduled');
});

test('l’événement annulé est signalé comme tel', async ({ page }) => {
  await page.goto('/agenda/2099-06-21-sortie-test-annulee/');
  expect((await donneesStructurees(page)).eventStatus).toBe('https://schema.org/EventCancelled');
});

test('la fiche acteur décrit la structure et son adresse', async ({ page }) => {
  await page.goto('/annuaire/velo-test-riom/');
  const donnees = await donneesStructurees(page);
  expect(donnees.name).toBe(await page.getByRole('heading', { level: 1 }).textContent());
  expect(donnees.address).toMatchObject({ addressLocality: 'Riom', addressCountry: 'FR' });
});

test('une page se partage avec son titre complet et une image', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    await page.title(),
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /^https:\/\/pedalerenauvergne\.fr\/.+\.(png|webp|jpe?g)$/,
  );
  expect((await donneesStructurees(page))['@type']).toBe('WebSite');
});
