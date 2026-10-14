/**
 * Valide chaque fichier de src/content/ puis leur cohérence d'ensemble : c'est ce test qui
 * bloque en CI une fiche publiée incomplète ou un lien cassé, avant même le build.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lireMarkdown } from '@lib/frontmatter';
import { verifierIntegrite } from '@lib/integrite';
import { COLLECTIONS, validerFichier, type NomCollection } from '@lib/validation';
import { schemaActeur } from '@schemas/acteur';
import { schemaEvenement } from '@schemas/evenement';

const racine = join(import.meta.dirname, '../../src/content');

function fichiersDe(collection: NomCollection): string[] {
  return readdirSync(join(racine, collection))
    .filter((nom) => nom.endsWith('.md'))
    .map((nom) => join(racine, collection, nom));
}

for (const collection of COLLECTIONS) {
  const fichiers = fichiersDe(collection);

  describe(`src/content/${collection}`, () => {
    it.skipIf(fichiers.length === 0).each(fichiers.map((chemin) => [basename(chemin), chemin]))(
      '%s est valide',
      (nom, chemin) => {
        expect(validerFichier(collection, nom, readFileSync(chemin, 'utf8'))).toEqual([]);
      },
    );

    it('ne contient que des fichiers Markdown', () => {
      const autres = readdirSync(join(racine, collection)).filter(
        (nom) => !nom.endsWith('.md') && nom !== '.gitkeep',
      );
      expect(autres).toEqual([]);
    });
  });
}

describe('cohérence entre fichiers', () => {
  it('organisateurs existants et publiés, objets OSM importés une seule fois', () => {
    const acteurs = fichiersDe('acteurs').flatMap((chemin) => {
      const resultat = schemaActeur.safeParse(lireMarkdown(readFileSync(chemin, 'utf8')).donnees);
      return resultat.success ? [resultat.data] : [];
    });
    const evenements = fichiersDe('evenements').flatMap((chemin) => {
      const resultat = schemaEvenement.safeParse(
        lireMarkdown(readFileSync(chemin, 'utf8')).donnees,
      );
      return resultat.success ? [{ id: basename(chemin, '.md'), ...resultat.data }] : [];
    });
    expect(verifierIntegrite(acteurs, evenements)).toEqual([]);
  });
});
