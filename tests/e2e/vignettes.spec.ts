/** Logos et monogrammes de l'annuaire (ADR 0031), sur le site construit avec les contenus de test. */
import { expect, test } from '@playwright/test';

test('chaque carte de l’annuaire a son logo ou son monogramme', async ({ page }) => {
  await page.goto('/annuaire/');
  const cartes = page.locator('li.acteur');
  await expect(cartes).not.toHaveCount(0);
  for (const carte of await cartes.all()) {
    await expect(carte.locator('.vignette')).toHaveCount(1);
  }
});

test('le monogramme reprend les initiales, sans être lu', async ({ page }) => {
  await page.goto('/annuaire/velo-test-riom/');
  const monogramme = page.locator('.fiche-tete .vignette--monogramme');
  await expect(monogramme).toHaveText('VT');
  await expect(monogramme).toHaveAttribute('aria-hidden', 'true');
});
