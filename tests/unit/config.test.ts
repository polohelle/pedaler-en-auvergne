import { describe, expect, it } from 'vitest';
import { CATEGORIES_ACTEUR, COLLEGES, ORIGINES_ACTEUR, SERVICES } from '@config/acteurs';
import { CATEGORIES_ACTU, PORTEES, TYPES_ACTU } from '@config/actus';
import { ASSOCIATION, COLLEGES_ASSOCIATION, PAGES_ASSOCIATION } from '@config/association';
import { CODES_DEPARTEMENT, DEPARTEMENT_PAR_DEFAUT, DEPARTEMENTS } from '@config/departements';
import { ORIGINES_EVENEMENT, TYPES_EVENEMENT } from '@config/evenements';
import { FIABILITES, FREQUENCES, NIVEAUX_SOURCE, TYPES_SOURCE } from '@config/sources';
import { STATUTS_ACTEUR, STATUTS_ACTU, STATUTS_EVENEMENT } from '@config/statuts';
import { lienHelloAsso } from '@lib/association';
import { pages } from '../pages';

const listes = {
  CATEGORIES_ACTEUR,
  COLLEGES,
  COLLEGES_ASSOCIATION,
  SERVICES,
  ORIGINES_ACTEUR,
  TYPES_EVENEMENT,
  ORIGINES_EVENEMENT,
  TYPES_ACTU,
  CATEGORIES_ACTU,
  PORTEES,
  STATUTS_ACTEUR,
  STATUTS_EVENEMENT,
  STATUTS_ACTU,
  TYPES_SOURCE,
  NIVEAUX_SOURCE,
  FIABILITES,
  FREQUENCES,
};

describe('listes fermées', () => {
  it.each(Object.entries(listes))(
    '%s : valeurs uniques en minuscules sans accent',
    (_, valeurs) => {
      expect(new Set(valeurs).size).toBe(valeurs.length);
      for (const valeur of valeurs) {
        expect(valeur).toMatch(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/);
      }
    },
  );

  it('le département par défaut est déclaré et actif', () => {
    expect(CODES_DEPARTEMENT).toContain(DEPARTEMENT_PAR_DEFAUT);
    expect(DEPARTEMENTS[DEPARTEMENT_PAR_DEFAUT].actif).toBe(true);
  });

  it('chaque collège de l’annuaire est un collège de l’association', () => {
    expect(COLLEGES_ASSOCIATION).toEqual(expect.arrayContaining([...COLLEGES]));
  });
});

describe('association', () => {
  it('les adresses HelloAsso configurées mènent à HelloAsso', () => {
    expect(() => lienHelloAsso(ASSOCIATION.helloasso.adhesion)).not.toThrow();
    expect(() => lienHelloAsso(ASSOCIATION.helloasso.don)).not.toThrow();
  });

  it('la date d’adoption des statuts est une date AAAA-MM-JJ ou null', () => {
    const date: string | null = ASSOCIATION.statutsAdoptesLe;
    if (date !== null) expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('chaque page de l’association est contrôlée par les tests de pages', () => {
    const chemins = pages.map(({ chemin }) => chemin as string);
    for (const { href } of PAGES_ASSOCIATION) expect(chemins).toContain(href);
  });
});
