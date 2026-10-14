/**
 * Valide chaque fichier de src/content/ : c'est ce test qui bloque en CI une fiche
 * publiée incomplète, avant même le build.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COLLECTIONS } from '@lib/validation';
import { validerFichier } from '@lib/validation';

const racine = join(import.meta.dirname, '../../src/content');

for (const collection of COLLECTIONS) {
  const dossier = join(racine, collection);
  const fichiers = readdirSync(dossier).filter((nom) => nom.endsWith('.md'));

  describe(`src/content/${collection}`, () => {
    it.skipIf(fichiers.length === 0).each(fichiers)('%s est valide', (nom) => {
      expect(validerFichier(collection, nom, readFileSync(join(dossier, nom), 'utf8'))).toEqual([]);
    });

    it('ne contient que des fichiers Markdown', () => {
      const autres = readdirSync(dossier).filter(
        (nom) => !nom.endsWith('.md') && nom !== '.gitkeep',
      );
      expect(autres).toEqual([]);
    });
  });
}
