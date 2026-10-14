import { describe, expect, it } from 'vitest';
import { schemaCarnetSources, schemaSource } from './source';

const source = {
  nom: 'Fédération des usagers de la bicyclette',
  url: 'https://www.fub.fr/rss.xml',
  type: 'rss',
  niveau: 'national',
  departement: null,
  acteur: null,
  fiabilite: 'haute',
  frequence: 'bihebdomadaire',
  dernier_passage: null,
};

const chemins = (donnees: unknown) =>
  schemaSource.safeParse(donnees).error?.issues.map((issue) => issue.path.join('.')) ?? [];

describe('schéma source', () => {
  it('accepte une source nationale', () => {
    expect(schemaSource.safeParse(source).success).toBe(true);
  });

  it('accepte une source locale rattachée à un département et à un acteur', () => {
    const locale = { ...source, niveau: 'local', departement: '63', acteur: 'velocite-63' };
    expect(schemaSource.safeParse(locale).success).toBe(true);
  });

  it('exige le département d’une source locale', () => {
    expect(chemins({ ...source, niveau: 'local' })).toContain('departement');
  });

  it('refuse un département pour une source nationale', () => {
    expect(chemins({ ...source, departement: '63' })).toContain('departement');
  });

  it('accepte un dernier passage écrit sans guillemets', () => {
    const resultat = schemaSource.safeParse({ ...source, dernier_passage: new Date('2026-10-14') });
    expect(resultat.data?.dernier_passage).toBe('2026-10-14');
  });

  it.each([
    ['type', 'twitter'],
    ['fiabilite', 'excellente'],
    ['frequence', 'horaire'],
    ['url', 'fub.fr'],
  ])('refuse %s = %j', (champ, valeur) => {
    expect(chemins({ ...source, [champ]: valeur })).toContain(champ);
  });
});

describe('carnet de sources', () => {
  it('refuse les doublons d’adresse et de nom', () => {
    const resultat = schemaCarnetSources.safeParse({ sources: [source, source] });
    expect(resultat.error?.issues.map((issue) => issue.message)).toEqual([
      'Adresse de source en double.',
      'Nom de source en double.',
    ]);
  });
});
