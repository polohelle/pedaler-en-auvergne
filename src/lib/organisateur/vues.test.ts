import { describe, expect, it } from 'vitest';
import { moisCalendrier } from './calendrier';
import { formulaireEvenement, libelleStatut, pageConfirmer, resumeDates } from './vues';

describe('resumeDates', () => {
  it('résume une, quelques ou beaucoup de dates', () => {
    expect(resumeDates({ dates: [], plusieurs_jours: false })).toBe('Aucune date');
    expect(resumeDates({ dates: ['2026-11-03'], plusieurs_jours: false })).toBe(
      'mardi 3 novembre 2026',
    );
    expect(resumeDates({ dates: ['2026-11-08', '2026-11-07'], plusieurs_jours: true })).toBe(
      'du samedi 7 novembre 2026 au dimanche 8 novembre 2026',
    );
    expect(
      resumeDates({
        dates: ['2026-11-03', '2026-11-10', '2026-11-17', '2026-11-24'],
        plusieurs_jours: false,
      }),
    ).toBe('4 dates, du mardi 3 novembre 2026 au mardi 24 novembre 2026');
  });
});

describe('libelleStatut', () => {
  it('distingue un brouillon jamais envoyé d’un brouillon modifié', () => {
    expect(libelleStatut({ statut: 'brouillon' })).toBe('Brouillon, pas encore envoyé');
    expect(libelleStatut({ statut: 'brouillon', issue: 3 })).toBe('Modifié, à renvoyer');
    expect(libelleStatut({ statut: 'envoye', issue: 3 })).toBe('Envoyé pour vérification');
    expect(libelleStatut({ statut: 'annulation_demandee', issue: 4 })).toBe('Annulation demandée');
  });
});

describe('pages', () => {
  it('échappe le jeton de la page de confirmation', () => {
    expect(pageConfirmer('a"b').toString()).toContain('value="a&quot;b"');
  });

  it('ouvre les mois suivants quand une date cochée s’y trouve, et relie les erreurs', () => {
    const html = formulaireEvenement({
      saisie: {
        champs: { plusieurs_jours: 'oui', description: '<b>' },
        dates: ['2027-06-01'],
        pratiques: [],
      },
      erreurs: [
        { champ: 'plusieurs_jours', message: 'Jours non consécutifs.' },
        { champ: 'titre', message: 'Champ obligatoire.' },
      ],
      mois: moisCalendrier('2026-10-19', 12),
      evenement: { id: 4, statut: 'annulation_demandee', issue: 9 },
    }).toString();
    expect(html).toContain('<details class="mois-suivants"  open>');
    expect(html).toContain('aria-describedby="erreur-titre" aria-invalid="true"');
    expect(html).toContain('erreur-plusieurs_jours');
    expect(html).toContain('2 points sont');
    expect(html).toContain('&lt;b&gt;</textarea>');
    expect(html).toContain('Supprimer l’événement');
  });
});
