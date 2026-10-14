import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { pages } from '../pages';

// Niveau AA visé par le cahier des charges (RGAA / WCAG 2.2).
const reglesAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const aAnalyser = [...pages, { nom: 'page introuvable', chemin: '/page-qui-n-existe-pas/' }];

for (const { nom, chemin } of aAnalyser) {
  for (const schema of ['light', 'dark'] as const) {
    test(`${nom} (${schema === 'light' ? 'clair' : 'sombre'}) : aucune violation AA`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: schema });
      await page.goto(chemin);
      const resultat = await new AxeBuilder({ page }).withTags(reglesAA).analyze();
      expect(resultat.violations).toEqual([]);
    });
  }
}
