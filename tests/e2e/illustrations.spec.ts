/** Illustrations et pratiques des événements (ADR 0034), sur le site construit avec les contenus de test. */
import { expect, test } from '@playwright/test';

test('chaque carte de l’agenda a son illustration, sans être lue', async ({ page }) => {
  await page.goto('/agenda/');
  const cartes = page.locator('li.evenement');
  await expect(cartes).not.toHaveCount(0);
  for (const carte of await cartes.all()) {
    // Dessin du type masqué aux lecteurs d'écran, ou image de la pratique au texte de
    // remplacement vide (ADR 0039).
    await expect(carte.locator('.illustration')).toHaveCount(1);
    await expect(
      carte.locator('svg.illustration[aria-hidden="true"], picture.illustration:has(img[alt=""])'),
    ).toHaveCount(1);
  }
});

test('une sortie route prend l’image de sa pratique, décorative', async ({ page }) => {
  await page.goto('/agenda/');
  const image = page.locator('li.evenement', { hasText: 'annulée' }).locator('picture img');
  await expect(image).toHaveAttribute('src', '/illustrations/route-clair.webp');
  await expect(image).toHaveAttribute('alt', '');
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
