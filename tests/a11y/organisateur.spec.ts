/**
 * Pages de l'espace organisateur (ADR 0038). Leur contenu est rendu par la fonction Cloudflare,
 * absente du site de test : on l'insère ici dans le gabarit statique, avec ses vrais styles,
 * pour contrôler l'accessibilité et le calendrier.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { moisCalendrier } from '../../src/lib/organisateur/calendrier';
import type { Brouillon } from '../../src/lib/organisateur/evenement';
import { formulaireEvenement, pageConfirmer, tableauDeBord } from '../../src/lib/organisateur/vues';

const reglesAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const brouillon: Brouillon = {
  titre: 'Sortie du mardi',
  type: 'sortie',
  pratiques: ['route'],
  description: 'Boucle de 40 km à allure tranquille.',
  dates: ['2099-06-02', '2099-06-09'],
  heure_debut: '18:30',
  plusieurs_jours: false,
  lieu: 'Place de Jaude',
  commune: 'Clermont-Ferrand',
  departement: '63',
  source_url: 'https://club.example/',
};

const contenus = {
  'tableau de bord': tableauDeBord(
    { id: 1, courriel: 'club@example.fr', structure: 'Vélo Club' },
    [
      { id: 1, brouillon, statut: 'envoye', issue: 12, modifieLe: '2099-01-01T00:00:00Z' },
      { id: 2, brouillon, statut: 'brouillon', modifieLe: '2099-01-01T00:00:00Z' },
    ],
    'envoye',
  ).toString(),
  'formulaire avec erreurs': formulaireEvenement({
    saisie: { champs: { titre: 'Sortie' }, dates: ['2099-06-02'], pratiques: [] },
    erreurs: [
      { champ: 'description', message: 'Champ obligatoire.' },
      { champ: 'dates', message: 'Une des dates est déjà passée.' },
    ],
    mois: moisCalendrier('2099-05-20', 12),
    evenement: { id: 1, statut: 'envoye', issue: 12 },
  }).toString(),
  confirmation: pageConfirmer('a'.repeat(43)).toString(),
};

async function afficher(page: Page, contenu: string): Promise<void> {
  await page.goto('/organisateur/gabarit/');
  await page.locator('[data-contenu-organisateur]').evaluate((element, html) => {
    element.innerHTML = html;
  }, contenu);
}

for (const [nom, contenu] of Object.entries(contenus)) {
  for (const schema of ['light', 'dark'] as const) {
    test(`espace organisateur, ${nom} (${schema === 'light' ? 'clair' : 'sombre'}) : aucune violation AA`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: schema });
      await afficher(page, contenu);
      const resultat = await new AxeBuilder({ page }).withTags(reglesAA).analyze();
      expect(resultat.violations).toEqual([]);
    });
  }
}

test('le calendrier se coche au doigt et au clavier, jours passés exclus', async ({ page }) => {
  await afficher(page, contenus['formulaire avec erreurs']);
  const jour = page.getByRole('checkbox', { name: 'mercredi 3 juin 2099' });
  await expect(page.getByRole('checkbox', { name: 'mardi 2 juin 2099' })).toBeChecked();
  await jour.click();
  await expect(jour).toBeChecked();
  await jour.focus();
  await page.keyboard.press('Space');
  await expect(jour).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'mardi 19 mai 2099' })).toBeDisabled();
});
