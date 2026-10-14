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
