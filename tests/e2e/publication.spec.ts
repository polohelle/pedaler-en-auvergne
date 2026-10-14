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

test('la fiche événement relie l’organisateur et affiche la date en français', async ({ page }) => {
  await page.goto('/agenda/2099-06-14-bourse-test-riom/');
  await expect(page.getByText('dimanche 14 juin 2099 de 9 h à 17 h')).toBeVisible();
  await page.getByRole('link', { name: 'Vélo Test Riom' }).click();
  await expect(page).toHaveURL(/\/annuaire\/velo-test-riom\/$/);
  await expect(page.getByText("Membre de l'association, collège Usagers")).toBeVisible();
});
