/** Pages de l'association, sur le site construit avec les contenus de test. */
import { expect, test } from '@playwright/test';
import { ASSOCIATION, PAGES_ASSOCIATION } from '../../src/config/association';

test('le menu de l’association mène à chaque page et signale la page courante', async ({
  page,
}) => {
  for (const { href, libelle } of PAGES_ASSOCIATION) {
    await page.goto(href);
    const menu = page.getByRole('navigation', { name: "Pages de l'association" });
    await expect(menu.getByRole('link', { name: libelle })).toHaveAttribute('aria-current', 'page');
    await expect(menu.locator('[aria-current="page"]')).toHaveCount(1);
  }
});

test('les textes de l’association sont présentés comme un projet', async ({ page }) => {
  await page.goto('/association/charte/');
  await expect(page.getByRole('complementary', { name: 'Textes provisoires' })).toContainText(
    'en cours de création',
  );
});

test('les membres sont listés par collège depuis l’annuaire', async ({ page }) => {
  await page.goto('/association/membres/');
  const usagers = page.getByRole('region', { name: 'Usagers' });
  await expect(usagers.getByRole('link', { name: 'Vélo Test Riom' })).toHaveAttribute(
    'href',
    '/annuaire/velo-test-riom/',
  );
  await expect(page.getByRole('region', { name: 'Cyclistes' })).toContainText(
    'leurs noms ne sont pas publiés',
  );
  await expect(page.getByText('Brouillon Test')).toHaveCount(0);
});

test('sans campagne HelloAsso, la page Adhérer n’affiche aucun lien de paiement', async ({
  page,
}) => {
  test.skip(ASSOCIATION.helloasso.adhesion !== null, 'campagne HelloAsso configurée');
  await page.goto('/association/adherer/');
  await expect(page.getByText('ouvrira sur HelloAsso')).toBeVisible();
  await expect(page.locator('a[href*="helloasso"]')).toHaveCount(0);
});

test('avec une campagne HelloAsso, la page Adhérer y mène', async ({ page }) => {
  const adresse = ASSOCIATION.helloasso.adhesion;
  test.skip(adresse === null, 'aucune campagne HelloAsso configurée');
  await page.goto('/association/adherer/');
  await expect(page.getByRole('link', { name: 'Adhérer sur HelloAsso' })).toHaveAttribute(
    'href',
    adresse ?? '',
  );
});
