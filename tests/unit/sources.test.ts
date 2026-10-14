/** Valide data/sources.yaml : un carnet mal formé bloquerait les agents de veille. */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { schemaCarnetSources } from '@schemas/source';

const racine = join(import.meta.dirname, '../..');
const brut: unknown = parse(readFileSync(join(racine, 'data/sources.yaml'), 'utf8'));

describe('data/sources.yaml', () => {
  const resultat = schemaCarnetSources.safeParse(brut);

  it('respecte le schéma', () => {
    expect(resultat.error?.issues ?? []).toEqual([]);
  });

  it('ne cite que des acteurs présents dans l’annuaire', () => {
    const absents = (resultat.data?.sources ?? [])
      .map((source) => source.acteur)
      .filter((slug): slug is string => slug !== null)
      .filter((slug) => !existsSync(join(racine, 'src/content/acteurs', `${slug}.md`)));
    expect(absents).toEqual([]);
  });
});
