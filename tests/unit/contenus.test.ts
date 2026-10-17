/**
 * Valide chaque fichier de src/content/ puis leur cohérence d'ensemble : c'est ce test qui
 * bloque en CI une fiche publiée incomplète ou un lien cassé, avant même le build.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lireMarkdown } from '@lib/frontmatter';
import { verifierIntegrite } from '@lib/integrite';
import { COLLECTIONS, validerFichier, type NomCollection } from '@lib/validation';
import { schemaActeur } from '@schemas/acteur';
import { schemaEvenement } from '@schemas/evenement';

// Contenus réels, et contenus de test des pages (qui doivent eux aussi être valides).
const racines = ['src/content', 'tests/fixtures/site'].map((r) =>
  join(import.meta.dirname, '../..', r),
);
const [racine = ''] = racines;

function fichiersDe(collection: NomCollection, dossier = racine): string[] {
  return readdirSync(join(dossier, collection))
    .filter((nom) => nom.endsWith('.md'))
    .map((nom) => join(dossier, collection, nom));
}

for (const [dossier, collection] of racines.flatMap((r) =>
  COLLECTIONS.map((c) => [r, c] as const),
)) {
  const fichiers = fichiersDe(collection, dossier);

  describe(`${dossier.split('/').slice(-2).join('/')}/${collection}`, () => {
    it.skipIf(fichiers.length === 0).each(fichiers.map((chemin) => [basename(chemin), chemin]))(
      '%s est valide',
      (nom, chemin) => {
        expect(validerFichier(collection, nom, readFileSync(chemin, 'utf8'))).toEqual([]);
      },
    );

    it('ne contient que des fichiers Markdown', () => {
      const autres = readdirSync(join(dossier, collection)).filter(
        (nom) => !nom.endsWith('.md') && nom !== '.gitkeep',
      );
      expect(autres).toEqual([]);
    });
  });
}

describe.each(racines)('cohérence entre fichiers de %s', (dossier) => {
  it('organisateurs existants et publiés, objets OSM importés une seule fois', () => {
    const acteurs = fichiersDe('acteurs', dossier).flatMap((chemin) => {
      const resultat = schemaActeur.safeParse(lireMarkdown(readFileSync(chemin, 'utf8')).donnees);
      return resultat.success ? [resultat.data] : [];
    });
    const evenements = fichiersDe('evenements', dossier).flatMap((chemin) => {
      const resultat = schemaEvenement.safeParse(
        lireMarkdown(readFileSync(chemin, 'utf8')).donnees,
      );
      return resultat.success ? [{ id: basename(chemin, '.md'), ...resultat.data }] : [];
    });
    expect(verifierIntegrite(acteurs, evenements)).toEqual([]);
  });
});

describe('logos des acteurs (ADR 0031)', () => {
  const dossierLogos = join(import.meta.dirname, '../../public/logos');
  const references = racines.flatMap((dossier) =>
    fichiersDe('acteurs', dossier).flatMap((chemin) => {
      const resultat = schemaActeur.safeParse(lireMarkdown(readFileSync(chemin, 'utf8')).donnees);
      return resultat.success && resultat.data.logo ? [resultat.data.logo.fichier] : [];
    }),
  );

  it('chaque logo déclaré existe dans public/logos/', () => {
    expect(references.filter((fichier) => !existsSync(join(dossierLogos, fichier)))).toEqual([]);
  });

  it('chaque fichier de public/logos/ est déclaré par une fiche, avec sa source', () => {
    const presents = existsSync(dossierLogos) ? readdirSync(dossierLogos) : [];
    expect(presents.filter((fichier) => !references.includes(fichier))).toEqual([]);
  });
});

describe('images des événements (ADR 0034)', () => {
  const dossierImages = join(import.meta.dirname, '../../public/evenements');
  const references = racines.flatMap((dossier) =>
    fichiersDe('evenements', dossier).flatMap((chemin) => {
      const resultat = schemaEvenement.safeParse(
        lireMarkdown(readFileSync(chemin, 'utf8')).donnees,
      );
      return resultat.success && resultat.data.image ? [resultat.data.image] : [];
    }),
  );

  it('chaque image est servie par le site depuis public/evenements/ et existe', () => {
    const absentes = references
      .map((image) => image.src)
      .filter(
        (src) =>
          !src.startsWith('/evenements/') ||
          !existsSync(join(dossierImages, src.slice('/evenements/'.length))),
      );
    expect(absentes).toEqual([]);
  });

  it('chaque image reprise cite sa source, et chaque fichier est déclaré par une fiche', () => {
    expect(references.filter((image) => image.source_url === undefined)).toEqual([]);
    const declares = references.map((image) => image.src.slice('/evenements/'.length));
    const presents = existsSync(dossierImages) ? readdirSync(dossierImages) : [];
    expect(presents.filter((fichier) => !declares.includes(fichier))).toEqual([]);
  });
});
