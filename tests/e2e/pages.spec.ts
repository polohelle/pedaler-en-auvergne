import { expect, test } from '@playwright/test';
import { pages } from '../pages';

for (const { nom, chemin } of pages) {
  test(`${nom} se charge en français avec un titre de niveau 1`, async ({ page }) => {
    const reponse = await page.goto(chemin);
    expect(reponse?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });
}

test('le lien d’évitement mène au contenu', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#contenu$/);
});

test('la page courante est signalée dans le menu', async ({ page }) => {
  await page.goto('/agenda/');
  const menu = page.getByRole('navigation', { name: 'Navigation principale' });
  await expect(menu.getByRole('link', { name: 'Agenda' })).toHaveAttribute('aria-current', 'page');
});

test('une adresse inconnue renvoie la page 404', async ({ page }) => {
  const reponse = await page.goto('/page-qui-n-existe-pas/');
  expect(reponse?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page introuvable');
});

test('le pied de page mentionne les licences et OpenStreetMap', async ({ page }) => {
  await page.goto('/');
  const pied = page.getByRole('contentinfo');
  await expect(pied.getByRole('link', { name: 'contributeurs OpenStreetMap' })).toBeVisible();
  await expect(pied.getByRole('link', { name: 'ODbL 1.0' })).toBeVisible();
  await expect(pied).toContainText('textes sous licence CC BY-SA 4.0, données');
});
