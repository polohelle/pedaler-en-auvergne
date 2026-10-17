/** Illustrations et pratiques des événements (ADR 0034), sur le site construit avec les contenus de test. */
import { expect, test } from '@playwright/test';

test('chaque carte de l’agenda a son illustration, sans être lue', async ({ page }) => {
  await page.goto('/agenda/');
  const cartes = page.locator('li.evenement');
  await expect(cartes).not.toHaveCount(0);
  for (const carte of await cartes.all()) {
    const illustration = carte.locator('svg.illustration');
    await expect(illustration).toHaveCount(1);
    await expect(illustration).toHaveAttribute('aria-hidden', 'true');
  }
});

test('les pratiques s’affichent en étiquettes nommées', async ({ page }) => {
  await page.goto('/agenda/');
  const carte = page.locator('li.evenement', { hasText: 'annulée' });
  await expect(carte.locator('.etiquette-route')).toHaveText('Route');
  await expect(carte.locator('.etiquette-gravel')).toHaveText('Gravel');
});

test('la fiche montre l’illustration en grand et la vignette de l’organisateur', async ({
  page,
}) => {
  await page.goto('/agenda/2099-06-14-bourse-test-riom/');
  await expect(page.locator('svg.illustration--grande')).toHaveCount(1);
  await expect(page.locator('.organisateur .vignette')).toHaveCount(1);
});
