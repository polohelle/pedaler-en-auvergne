import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { pages } from '../pages';

// Niveau AA visé par le cahier des charges (RGAA / WCAG 2.2).
const reglesAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const { nom, chemin } of pages) {
  test(`${nom} ne présente aucune violation d'accessibilité AA`, async ({ page }) => {
    await page.goto(chemin);
    const resultat = await new AxeBuilder({ page }).withTags(reglesAA).analyze();
    expect(resultat.violations).toEqual([]);
  });
}
