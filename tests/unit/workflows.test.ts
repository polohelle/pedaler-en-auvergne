/**
 * Les runners GitHub Actions sont figés sur une version explicite d'Ubuntu, la même pour tous
 * les jobs (ADR 0023) : une migration de `ubuntu-latest` ne doit jamais être subie.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const dossier = join(import.meta.dirname, '../../.github/workflows');
const images = readdirSync(dossier)
  .filter((nom) => nom.endsWith('.yml'))
  .flatMap((nom) => {
    const workflow = parse(readFileSync(join(dossier, nom), 'utf8')) as {
      jobs: Record<string, { 'runs-on'?: unknown }>;
    };
    return Object.entries(workflow.jobs).map(([job, { 'runs-on': image }]) => ({
      job: `${nom} › ${job}`,
      image,
    }));
  });

describe('runners des workflows', () => {
  it('chaque job déclare une image Ubuntu versionnée, jamais « latest »', () => {
    const fautifs = images.filter(
      ({ image }) => typeof image !== 'string' || !/^ubuntu-\d{2}\.\d{2}$/.test(image),
    );
    expect(fautifs).toEqual([]);
  });

  it('tous les jobs utilisent la même image', () => {
    expect(new Set(images.map(({ image }) => image)).size).toBe(1);
  });
});
