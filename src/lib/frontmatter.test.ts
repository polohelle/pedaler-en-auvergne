import { join } from 'node:path';
import { check, resolveConfig } from 'prettier';
import { describe, expect, it } from 'vitest';
import { ecrireMarkdown, lireMarkdown } from './frontmatter';

describe('lireMarkdown', () => {
  it('sépare le frontmatter du corps', () => {
    const { donnees, corps } = lireMarkdown('---\nnom: Atelier\nmembre: true\n---\n\nTexte.\n');
    expect(donnees).toEqual({ nom: 'Atelier', membre: true });
    expect(corps.trim()).toBe('Texte.');
  });

  it('convertit comme Astro les dates sans guillemets en Date', () => {
    const { donnees } = lireMarkdown('---\nverifie_le: 2026-10-14\nquote: "2026-10-14"\n---\n');
    expect(donnees).toEqual({ verifie_le: new Date('2026-10-14T00:00:00Z'), quote: '2026-10-14' });
  });

  it('accepte un corps vide', () => {
    expect(lireMarkdown('---\nnom: A\n---\n').corps).toBe('');
  });

  it('refuse un fichier sans frontmatter', () => {
    expect(() => lireMarkdown('# Titre\n')).toThrow(/Frontmatter YAML absent/);
  });

  it('refuse un YAML invalide', () => {
    expect(() => lireMarkdown('---\nnom: [a\n---\n')).toThrow(/YAML invalide/);
  });
});

describe('ecrireMarkdown', () => {
  it('produit un fichier relu à l’identique', () => {
    const donnees = {
      nom: 'Vélo : ça roule',
      debut: '2026-11-08T09:30:00+01:00',
      jour: '2026-10-14',
    };
    const source = ecrireMarkdown(donnees, 'Une description.');
    expect(source).toContain("debut: '2026-11-08T09:30:00+01:00'");
    expect(lireMarkdown(source)).toEqual({ donnees, corps: '\nUne description.\n' });
  });

  it('produit un fichier déjà conforme au style Prettier du projet', async () => {
    const source = ecrireMarkdown(
      { nom: "L'Atelier", categories: ['magasin', 'reparateur'], departement: '63' },
      'Une description.',
    );
    const options = await resolveConfig(join(import.meta.dirname, 'exemple.md'));
    expect(await check(source, { ...options, filepath: 'exemple.md' })).toBe(true);
  });

  it('omet le corps s’il est vide', () => {
    expect(ecrireMarkdown({ nom: 'A' }, '  ')).toBe('---\nnom: A\n---\n');
  });
});
