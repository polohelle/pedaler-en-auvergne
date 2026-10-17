/** Règles de publication vérifiées sur le site construit avec les contenus de test. */
import { expect, test } from '@playwright/test';

test('l’annuaire ne montre que les fiches publiées', async ({ page }) => {
  await page.goto('/annuaire/');
  await expect(page.getByRole('link', { name: 'Vélo Test Riom' })).toBeVisible();
  await expect(page.getByText('Brouillon Test')).toHaveCount(0);
  expect((await page.request.get('/annuaire/brouillon-test/')).status()).toBe(404);
});

test('l’agenda montre l’annulé barré et masque l’à-valider et le passé', async ({ page }) => {
  await page.goto('/agenda/');
  await expect(page.getByRole('link', { name: 'Bourse aux vélos de test' })).toBeVisible();
  const annule = page.getByRole('listitem').filter({ hasText: 'Sortie de test annulée' });
  await expect(annule.getByText('Annulé', { exact: true })).toBeVisible();
  await expect(page.getByText('Atelier de test à valider')).toHaveCount(0);
  await expect(page.getByText('Fête du vélo de test passée')).toHaveCount(0);
  expect((await page.request.get('/agenda/2099-07-01-atelier-test-a-valider/')).status()).toBe(404);
});

test('un événement passé non archivé garde sa page', async ({ page }) => {
  const reponse = await page.goto('/agenda/2020-05-30-fete-test-passee/');
  expect(reponse?.status()).toBe(200);
});

test('les actus en brouillon ne sont pas publiées', async ({ page }) => {
  await page.goto('/actus/');
  await expect(page.getByText('Actu de test en brouillon')).toHaveCount(0);
});

test('une actu illustrée montre sa photo dans la liste, puis avec texte et crédit', async ({
  page,
}) => {
  await page.goto('/actus/');
  const carte = page.locator('li', { has: page.getByRole('link', { name: 'Brève de test' }) });
  await expect(carte.locator('img')).toHaveAttribute('src', '/pwa-512x512.png');
  await page.goto('/actus/2026-10-05-breve-test/');
  await expect(page.getByRole('img', { name: 'Logo fictif de la brève de test' })).toBeVisible();
  await expect(page.getByText('Photo : Crédit fictif')).toBeVisible();
});

test('la fiche événement relie l’organisateur et affiche la date en français', async ({ page }) => {
  await page.goto('/agenda/2099-06-14-bourse-test-riom/');
  await expect(page.getByText('dimanche 14 juin 2099 de 9 h à 17 h')).toBeVisible();
  await page.getByRole('link', { name: 'Vélo Test Riom' }).click();
  await expect(page).toHaveURL(/\/annuaire\/velo-test-riom\/$/);
});

test('une fiche sans adresse publique n’affiche ni adresse ni position', async ({ page }) => {
  await page.goto('/annuaire/atelier-mobile-test/');
  await expect(
    page.getByText("Pas d'adresse d'accueil publique : contactez la structure."),
  ).toBeVisible();
  await expect(page.getByText('Clermont-Ferrand et sa métropole')).toBeVisible();
  await expect(page.getByRole('term').filter({ hasText: /^Adresse$/ })).toHaveCount(0);
});

test('la page commune rassemble les acteurs et l’agenda de la commune', async ({ page }) => {
  await page.goto('/annuaire/');
  await page.getByRole('link', { name: 'Riom', exact: true }).click();
  await expect(page).toHaveURL(/\/communes\/riom\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pédaler à Riom');
  await expect(page.getByRole('link', { name: 'Vélo Test Riom' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Bourse aux vélos de test' })).toBeVisible();
  await expect(page.getByText('Sortie de test annulée')).toHaveCount(0);
});
