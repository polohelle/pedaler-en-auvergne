import { describe, expect, it } from 'vitest';
import { chiffresCles, motDeSaison, saisonDuMois } from './accueil';

describe('chiffresCles', () => {
  it('accorde les libellés au pluriel', () => {
    expect(chiffresCles({ acteurs: 102, communes: 47, rendezVous: 26, parcours: 54 })).toEqual([
      { valeur: 102, libelle: 'acteurs du vélo' },
      { valeur: 47, libelle: 'communes' },
      { valeur: 26, libelle: 'rendez-vous à venir' },
      { valeur: 54, libelle: 'parcours à télécharger' },
    ]);
  });

  it('accorde les libellés au singulier', () => {
    expect(chiffresCles({ acteurs: 1, communes: 1, rendezVous: 1, parcours: 1 })).toEqual([
      { valeur: 1, libelle: 'acteur du vélo' },
      { valeur: 1, libelle: 'commune' },
      { valeur: 1, libelle: 'rendez-vous à venir' },
      { valeur: 1, libelle: 'parcours à télécharger' },
    ]);
  });

  it('omet les comptes nuls', () => {
    expect(chiffresCles({ acteurs: 3, communes: 2, rendezVous: 0, parcours: 0 })).toEqual([
      { valeur: 3, libelle: 'acteurs du vélo' },
      { valeur: 2, libelle: 'communes' },
    ]);
  });
});

describe('saisonDuMois', () => {
  it.each([
    [12, 'hiver'],
    [1, 'hiver'],
    [2, 'hiver'],
    [3, 'printemps'],
    [5, 'printemps'],
    [6, 'ete'],
    [8, 'ete'],
    [9, 'automne'],
    [11, 'automne'],
  ] as const)('%i → %s', (mois, saison) => {
    expect(saisonDuMois(mois)).toBe(saison);
  });
});

describe('motDeSaison', () => {
  it('prend le mois à Paris', () => {
    // 30 novembre 23 h 30 UTC : déjà le 1er décembre à Paris, donc l'hiver.
    expect(motDeSaison(new Date('2026-11-30T23:30:00Z')).saison).toBe('hiver');
    expect(motDeSaison(new Date('2026-11-30T12:00:00Z')).saison).toBe('automne');
  });

  it('donne un titre et une phrase', () => {
    const mot = motDeSaison(new Date('2026-07-14T12:00:00Z'));
    expect(mot).toMatchObject({ saison: 'ete', titre: "L'été à vélo" });
    expect(mot.texte.length).toBeGreaterThan(20);
  });
});
