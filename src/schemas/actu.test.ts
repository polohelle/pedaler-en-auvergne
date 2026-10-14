import { describe, expect, it } from 'vitest';
import { breve, sans } from '../../tests/fixtures/contenus';
import { schemaActu } from './actu';

const valider = (donnees: Record<string, unknown>) => schemaActu.safeParse(donnees);
const chemins = (donnees: Record<string, unknown>) =>
  valider(donnees).error?.issues.map((issue) => issue.path.join('.')) ?? [];

describe('schéma actu', () => {
  it('accepte une brève sourcée', () => {
    expect(valider(breve()).success).toBe(true);
  });

  it('accepte un article national sans source ni département', () => {
    const article = sans(breve(), 'source_url', 'source_nom', 'departement');
    expect(valider({ ...article, type: 'article', portee: 'national' }).success).toBe(true);
  });

  it('exige la source d’une brève', () => {
    const sansSource = sans(breve(), 'source_url', 'source_nom');
    expect(chemins(sansSource)).toContain('source_url');
  });

  it('exige le nom de la source citée', () => {
    const sansNom = sans(breve(), 'source_nom');
    expect(chemins(sansNom)).toContain('source_nom');
  });

  it('exige le département d’une actualité locale', () => {
    const sansDepartement = sans(breve(), 'departement');
    expect(chemins(sansDepartement)).toContain('departement');
  });

  it('exige texte alternatif et crédit pour une image', () => {
    expect(chemins({ ...breve(), image: { src: '/img/a.jpg', alt: '' } })).toEqual(
      expect.arrayContaining(['image.alt', 'image.credit']),
    );
  });

  it('limite le résumé à 400 caractères', () => {
    expect(chemins({ ...breve(), resume: 'a'.repeat(401) })).toContain('resume');
  });
});
