import { describe, expect, it } from 'vitest';
import {
  issueAnnulation,
  issueEnvoi,
  lireSaisie,
  occurrences,
  saisieDe,
  validerSaisie,
  type Brouillon,
  type Saisie,
} from './evenement';

const maintenant = new Date('2026-10-19T10:00:00+02:00');

function sansHeureDeFin(): Record<string, string> {
  const champs = { ...saisie().champs };
  delete champs.heure_fin;
  return champs;
}

function saisie(champs: Record<string, string> = {}, dates = ['2026-11-03', '2026-11-10']): Saisie {
  return {
    champs: {
      titre: 'Sortie du mardi',
      type: 'sortie',
      description: 'Boucle de 40 km à allure tranquille, retour au café.',
      heure_debut: '18:30',
      heure_fin: '20:30',
      lieu: 'Place de Jaude',
      commune: 'Clermont-Ferrand',
      source_url: 'https://club.example/sorties',
      ...champs,
    },
    dates,
    pratiques: ['route'],
  };
}

function valide(s: Saisie): Brouillon {
  const resultat = validerSaisie(s, maintenant);
  if (!resultat.ok) throw new Error(JSON.stringify(resultat.erreurs));
  return resultat.brouillon;
}

describe('lireSaisie', () => {
  it('garde les listes cochées et oublie les champs vides', () => {
    const lu = lireSaisie([
      ['titre', '  Sortie  '],
      ['tarif', '   '],
      ['dates', '2026-11-03'],
      ['dates', '2026-11-10'],
      ['pratiques', 'gravel'],
      ['fichier', new Blob()],
    ]);
    expect(lu).toEqual({
      champs: { titre: 'Sortie' },
      dates: ['2026-11-03', '2026-11-10'],
      pratiques: ['gravel'],
    });
  });
});

describe('validerSaisie et occurrences', () => {
  it('donne une occurrence par date cochée, aux mêmes heures', () => {
    const b = valide(saisie());
    expect(b.departement).toBe('63');
    expect(occurrences(b)).toEqual([
      { debut: '2026-11-03T18:30:00+01:00', fin: '2026-11-03T20:30:00+01:00' },
      { debut: '2026-11-10T18:30:00+01:00', fin: '2026-11-10T20:30:00+01:00' },
    ]);
  });

  it('donne une seule occurrence pour des jours consécutifs d’un même événement', () => {
    const b = valide(
      saisie({ plusieurs_jours: 'oui', heure_fin: '17:00' }, ['2026-11-08', '2026-11-07']),
    );
    expect(occurrences(b)).toEqual([
      { debut: '2026-11-07T18:30:00+01:00', fin: '2026-11-08T17:00:00+01:00' },
    ]);
  });

  it('accepte une occurrence sans heure de fin', () => {
    const b = valide({ ...saisie(), champs: sansHeureDeFin() });
    expect(occurrences(b)[0]).toEqual({ debut: '2026-11-03T18:30:00+01:00' });
  });

  it('exige au moins une date et les champs obligatoires', () => {
    const resultat = validerSaisie(saisie({ titre: '' }, []), maintenant);
    expect(resultat.ok).toBe(false);
    if (!resultat.ok) {
      expect(resultat.erreurs.map((e) => e.champ)).toEqual(
        expect.arrayContaining(['titre', 'dates']),
      );
    }
  });

  it('refuse des jours non consécutifs ou sans heure de fin pour plusieurs jours', () => {
    const resultat = validerSaisie(
      { ...saisie(), champs: { ...sansHeureDeFin(), plusieurs_jours: 'oui' } },
      maintenant,
    );
    expect(resultat.ok).toBe(false);
    if (!resultat.ok) {
      expect(resultat.erreurs.map((e) => e.champ)).toEqual(['plusieurs_jours', 'heure_fin']);
    }
  });

  it('refuse une fin avant le début le même jour', () => {
    const resultat = validerSaisie(saisie({ heure_fin: '17:00' }), maintenant);
    expect(resultat).toEqual({
      ok: false,
      erreurs: [{ champ: 'heure_fin', message: 'La fin précède le début.' }],
    });
  });

  it('refuse les données personnelles dans les champs publics', () => {
    const resultat = validerSaisie(
      saisie({
        lieu: 'Appeler le 06 12 34 56 78',
        source_url: 'https://club.example/?contact=moi@example.fr',
      }),
      maintenant,
    );
    expect(resultat.ok).toBe(false);
    if (!resultat.ok) {
      expect(resultat.erreurs.map((e) => e.champ)).toEqual(['lieu', 'source_url']);
    }
  });

  it('refuse une date passée et une heure sautée au passage à l’heure d’été', () => {
    expect(
      validerSaisie(saisie({}, ['2026-10-19']), new Date('2026-10-19T20:00:00+02:00')),
    ).toMatchObject({ ok: false, erreurs: [{ champ: 'dates' }] });
    expect(
      validerSaisie(
        saisie({ heure_debut: '02:30', heure_fin: '03:30' }, ['2027-03-28']),
        maintenant,
      ),
    ).toMatchObject({ ok: false, erreurs: [{ champ: 'heure_debut' }] });
  });

  it('refuse une fiche que le schéma de l’agenda rejetterait', () => {
    expect(validerSaisie(saisie({ departement: '15' }), maintenant)).toMatchObject({
      ok: false,
      erreurs: [{ champ: 'departement' }],
    });
  });

  it('retrouve la saisie d’un événement enregistré', () => {
    const s = saisie({ plusieurs_jours: 'oui', tarif: 'Gratuit' }, ['2026-11-07', '2026-11-08']);
    const b = valide(s);
    expect(saisieDe(b)).toEqual({
      champs: { ...s.champs, departement: '63' },
      dates: s.dates,
      pratiques: ['route'],
    });
    expect(saisieDe(valide(saisie())).champs.plusieurs_jours).toBeUndefined();
  });
});

describe('issues', () => {
  const contexte = { compte: 7, structure: 'Club ```du``` mardi', recueLe: maintenant };

  it('propose une fiche par date, sans adresse e-mail, avec le compte et la structure', () => {
    const issue = issueEnvoi(
      valide(saisie({ description: 'Texte ``` piégé, assez long pour passer.' })),
      contexte,
    );
    expect(issue.titre).toBe('[Événement] Sortie du mardi');
    expect(issue.etiquettes).toEqual(['proposition', 'evenement']);
    expect(issue.corps).toContain('2 fiches proposées, une par date');
    expect(issue.corps).toContain('`src/content/evenements/2026-11-03-sortie-du-mardi.md`');
    expect(issue.corps).toContain('`src/content/evenements/2026-11-10-sortie-du-mardi.md`');
    expect(issue.corps).toContain('pratiques: ["route"]');
    expect(issue.corps).toContain('statut: a_valider');
    expect(issue.corps).toContain('Compte organisateur n° 7');
    expect(issue.corps).not.toContain('```du```');
    expect(issue.corps.match(/```/g)?.length).toBe(8);
    expect(issue.corps).not.toMatch(/@/);
  });

  it('signale une modification et la demande précédente', () => {
    const issue = issueEnvoi(
      valide(
        saisie({ tarif: '5 €', inscription_url: 'https://club.example/inscription' }, [
          '2026-11-03',
        ]),
      ),
      { compte: 7, recueLe: maintenant, precedente: 12 },
    );
    expect(issue.titre).toBe('[Modification] Sortie du mardi');
    expect(issue.corps).toContain('Fiche proposée :');
    expect(issue.corps).toContain('Remplace la demande #12');
    expect(issue.corps).toContain('(non renseignée)');
  });

  it('demande une annulation en listant les dates', () => {
    const issue = issueAnnulation(valide(saisie()), { ...contexte, precedente: 12 });
    expect(issue.titre).toBe('[Annulation] Sortie du mardi');
    expect(issue.corps).toContain('- mardi 3 novembre 2026');
    expect(issue.corps).toContain('statut: annule');
  });
});
