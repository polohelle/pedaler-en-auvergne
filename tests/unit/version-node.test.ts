/**
 * Une seule source de vérité pour Node : `.nvmrc` (version exacte), lu par Cloudflare Pages,
 * la CI (`actions/setup-node`) et nvm. Ce test garantit sa cohérence avec le champ `engines` de
 * package.json et avec les exigences de chaque dépendance du lockfile (ADR 0022) : un écart
 * ferait échouer l'installation (`engine-strict`), comme lors du premier déploiement.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { minVersion, satisfies, valid } from 'semver';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const racine = join(import.meta.dirname, '../..');
const nvmrc = readFileSync(join(racine, '.nvmrc'), 'utf8').trim();
const { engines } = JSON.parse(readFileSync(join(racine, 'package.json'), 'utf8')) as {
  engines: { node: string };
};
const lockfile = parse(readFileSync(join(racine, 'pnpm-lock.yaml'), 'utf8')) as {
  packages: Record<string, { engines?: { node?: string }; os?: string[]; cpu?: string[] }>;
};

/** Cloudflare Pages et la CI construisent sous Linux x64 ; pnpm n'y installe pas les autres. */
function installableSurLinuxX64({ os, cpu }: { os?: string[]; cpu?: string[] }): boolean {
  const accepte = (liste: string[] | undefined, valeur: string) =>
    liste === undefined ||
    liste.some((v) => v === valeur) ||
    (liste.every((v) => v.startsWith('!')) && !liste.includes(`!${valeur}`));
  return accepte(os, 'linux') && accepte(cpu, 'x64');
}

const exigences = Object.entries(lockfile.packages).flatMap(([paquet, description]) =>
  description.engines?.node === undefined || !installableSurLinuxX64(description)
    ? []
    : [{ paquet, plage: description.engines.node }],
);

describe('version de Node', () => {
  it('.nvmrc fixe une version exacte', () => {
    expect(valid(nvmrc)).toBe(nvmrc);
  });

  it('la version de .nvmrc respecte le champ engines de package.json', () => {
    expect(satisfies(nvmrc, engines.node)).toBe(true);
  });

  it('le lockfile déclare des exigences de version à contrôler', () => {
    expect(exigences.length).toBeGreaterThan(10);
  });

  it('la version de .nvmrc convient à toutes les dépendances', () => {
    const incompatibles = exigences.filter(({ plage }) => !satisfies(nvmrc, plage));
    expect(incompatibles).toEqual([]);
  });

  it('le runbook de déploiement cite la version de .nvmrc', () => {
    const runbook = readFileSync(join(racine, 'docs/runbooks/deployer.md'), 'utf8');
    expect(runbook).toContain(`**${nvmrc}**`);
  });

  it('la version minimale permise par engines convient à toutes les dépendances', () => {
    const minimum = minVersion(engines.node)?.version ?? '';
    const incompatibles = exigences.filter(({ plage }) => !satisfies(minimum, plage));
    expect(incompatibles).toEqual([]);
  });
});
