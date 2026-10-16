import { expect, test } from '@playwright/test';

test('l’agenda mène au formulaire « Proposer un événement »', async ({ page }) => {
  await page.goto('/agenda/');
  await page.getByRole('link', { name: 'Proposer un événement' }).click();
  await expect(page).toHaveURL(/\/agenda\/proposer\/$/);
});

test('le formulaire envoie à la fonction, avec des champs étiquetés', async ({ page }) => {
  await page.goto('/agenda/proposer/');
  const formulaire = page.locator('form[data-anti-robot]');
  await expect(formulaire).toHaveAttribute('method', 'post');
  await expect(formulaire).toHaveAttribute('action', '/api/proposer-evenement');
  for (const libelle of [
    'Titre',
    'Type',
    'Description',
    'Jour de début',
    'Heure de début',
    'Lieu de rendez-vous',
    'Commune',
    'Page de référence',
  ]) {
    await expect(page.getByLabel(libelle, { exact: false }).first()).toHaveAttribute(
      'required',
      '',
    );
  }
  await expect(page.getByLabel('Votre adresse e-mail')).toHaveAttribute('type', 'email');
  await expect(page.getByRole('button', { name: 'Envoyer la proposition' })).toBeVisible();
});

test('le champ piège est hors de portée du clavier et des lecteurs d’écran', async ({ page }) => {
  await page.goto('/agenda/proposer/');
  const piege = page.locator('input[name="site_web"]');
  await expect(piege).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('.piege')).toHaveAttribute('aria-hidden', 'true');
});

test('Turnstile ne se charge qu’au premier champ rempli', async ({ page }) => {
  const appels: string[] = [];
  await page.route('https://challenges.cloudflare.com/**', (route) => {
    appels.push(route.request().url());
    return route.abort();
  });
  await page.goto('/agenda/proposer/');
  expect(appels).toEqual([]);

  await page.getByLabel('Titre').focus();
  const etat = page.locator('[data-etat-turnstile]');
  await expect(etat).toContainText('n’a pas pu se charger');
  expect(appels).toHaveLength(1);
  expect(appels[0]).toContain('render=explicit');
});

test('la page d’erreur explique chaque cause', async ({ page }) => {
  await page.goto('/agenda/proposer/erreur/#saisie');
  await expect(
    page.getByRole('heading', { name: "Une information n'est pas acceptée" }),
  ).toBeVisible();
  await expect(page.locator('#verification h2')).toBeVisible();
  await expect(page.locator('#indisponible h2')).toBeVisible();
});
