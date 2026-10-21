import { describe, expect, it } from 'vitest';
import type { CategorieActeur } from '@config/acteurs';
import { sectionsAnnuaire } from './annuaire';

interface Fiche {
  nom: string;
  categories: CategorieActeur[];
}

const fiche = (nom: string, ...categories: CategorieActeur[]): Fiche => ({ nom, categories });
const ranger = (fiches: Fiche[]) => sectionsAnnuaire(fiches, (f) => f.categories);
const noms = (fiches: Fiche[]) => fiches.map((f) => f.nom);

describe('sectionsAnnuaire', () => {
  it('sépare commerces et associations en gardant l’ordre reçu', () => {
    const { commerces, associations } = ranger([
      fiche('Cycles A', 'magasin'),
      fiche('Club B', 'club-sportif'),
      fiche('Loueur C', 'loueur', 'tourisme'),
      fiche('Club D', 'club-sportif'),
    ]);
    expect(noms(commerces)).toEqual(['Cycles A', 'Loueur C']);
    expect(associations).toHaveLength(1);
    expect(associations[0]?.categorie).toBe('club-sportif');
    expect(noms(associations[0]?.acteurs ?? [])).toEqual(['Club B', 'Club D']);
  });

  it('ordonne les groupes selon la liste des catégories associatives, sans groupe vide', () => {
    const { associations } = ranger([
      fiche('École E', 'velo-ecole'),
      fiche('Atelier F', 'atelier-participatif'),
      fiche('Club G', 'club-sportif'),
    ]);
    expect(associations.map((g) => g.categorie)).toEqual([
      'club-sportif',
      'atelier-participatif',
      'velo-ecole',
    ]);
  });

  it('place une structure à la fois commerce et association parmi les associations', () => {
    const { commerces, associations } = ranger([
      fiche('Atelier H', 'reparateur', 'atelier-participatif'),
    ]);
    expect(commerces).toEqual([]);
    expect(associations.map((g) => g.categorie)).toEqual(['atelier-participatif']);
  });

  it('range une association sous la première catégorie associative de sa fiche, une fois', () => {
    const { associations, nombreAssociations } = ranger([
      fiche('Usagers I', 'velo-ecole', 'association-usagers'),
      fiche('Club J', 'club-sportif'),
    ]);
    expect(associations.map((g) => [g.categorie, noms(g.acteurs)])).toEqual([
      ['club-sportif', ['Club J']],
      ['velo-ecole', ['Usagers I']],
    ]);
    expect(nombreAssociations).toBe(2);
  });

  it('accepte un annuaire vide', () => {
    expect(ranger([])).toEqual({ commerces: [], associations: [], nombreAssociations: 0 });
  });
});
