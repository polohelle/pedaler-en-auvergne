import { describe, expect, it } from 'vitest';
import { acteurBrouillon, acteurPublie, sans } from '../../tests/fixtures/contenus';
import { schemaActeur } from './acteur';

const valider = (donnees: Record<string, unknown>) => schemaActeur.safeParse(donnees);
const chemins = (donnees: Record<string, unknown>) =>
  valider(donnees).error?.issues.map((issue) => issue.path.join('.')) ?? [];

describe('schéma acteur — brouillon (validation souple)', () => {
  it('accepte une fiche importée sans adresse, sans description ni vérification', () => {
    expect(valider(acteurBrouillon()).success).toBe(true);
  });

  it('accepte une fiche archivée incomplète', () => {
    expect(valider({ ...acteurBrouillon(), statut: 'archive' }).success).toBe(true);
  });

  it('exige quand même les champs indispensables', () => {
    const sansNomNiLat = sans(acteurBrouillon(), 'nom', 'lat');
    expect(chemins(sansNomNiLat)).toEqual(expect.arrayContaining(['nom', 'lat']));
  });
});

describe('schéma acteur — publié (validation stricte)', () => {
  it('accepte une fiche complète', () => {
    expect(valider(acteurPublie()).success).toBe(true);
  });

  it.each(['adresse', 'code_postal', 'commune', 'verifie_le'])(
    'refuse une fiche publiée sans %s',
    (champ) => {
      expect(chemins(sans(acteurPublie(), champ))).toContain(champ);
    },
  );

  it('refuse le passage en publié d’un brouillon resté incomplet', () => {
    expect(valider({ ...acteurBrouillon(), statut: 'publie' }).success).toBe(false);
  });

  it('ramène un jour écrit sans guillemets (Date YAML) à sa chaîne', () => {
    const resultat = valider({ ...acteurPublie(), verifie_le: new Date('2026-10-14T00:00:00Z') });
    expect(resultat.success && resultat.data.verifie_le).toBe('2026-10-14');
  });
});

describe('schéma acteur — règles communes', () => {
  it('lie le collège au statut de membre', () => {
    expect(chemins({ ...acteurBrouillon(), membre: true })).toContain('college');
    expect(chemins({ ...acteurBrouillon(), college: 'usagers' })).toContain('college');
    expect(valider({ ...acteurBrouillon(), membre: true, college: 'usagers' }).success).toBe(true);
  });

  it('refuse un champ inconnu (faute de frappe)', () => {
    expect(valider({ ...acteurBrouillon(), telephon: '0473000000' }).success).toBe(false);
  });

  it.each([
    ['slug', 'Cycles du Centre'],
    ['categories', []],
    ['categories', ['magasin', 'magasin']],
    ['categories', ['boulangerie']],
    ['departement', '75'],
    ['email', 'pas-un-email'],
    ['site', 'ftp://exemple.fr'],
    ['telephone', '12345'],
    ['osm_id', '123456'],
    ['statut', 'en_ligne'],
  ])('refuse %s = %j', (champ, valeur) => {
    const enErreur = chemins({ ...acteurBrouillon(), [champ]: valeur });
    expect(enErreur.some((chemin) => chemin === champ || chemin.startsWith(`${champ}.`))).toBe(
      true,
    );
  });
});
