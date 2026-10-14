import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { analyser, controler, decouper, empreinte, estVerifie, marquer } from './garde-commit';

const refuse = (commande: string) => {
  const analyse = analyser(commande);
  return analyse.commit && analyse.refus !== null;
};

describe('decouper', () => {
  it('sépare les commandes sur les opérateurs, hors guillemets', () => {
    expect(decouper('a && b "c; d" || e | f ; g')).toEqual([
      { operateur: null, texte: 'a' },
      { operateur: '&&', texte: 'b "c; d"' },
      { operateur: '||', texte: 'e' },
      { operateur: '|', texte: 'f' },
      { operateur: ';', texte: 'g' },
    ]);
  });

  it('ne confond pas une redirection avec une mise en arrière-plan', () => {
    expect(decouper('pnpm verify 2>&1 && git commit').map((s) => s.operateur)).toEqual([
      null,
      '&&',
    ]);
  });

  it('saute le corps des heredocs, puis reprend après la marque de fin', () => {
    const commande = "cat > f <<'EOF' && echo ok\ngit commit; x\nEOF\ngit status";
    expect(decouper(commande)).toEqual([
      { operateur: null, texte: "cat > f <<'EOF'" },
      { operateur: '&&', texte: 'echo ok' },
      { operateur: '\n', texte: 'git status' },
    ]);
  });
});

describe('analyser — incidents réels, tous refusés', () => {
  it.each([
    [
      'tube qui masque le code de sortie',
      'pnpm verify 2>&1 | grep -E "Tests" && git add -A && git commit -q -m "test: x"',
    ],
    [
      'point-virgule après la vérification',
      'pnpm verify > v.log 2>&1; echo "verify=$?"; git add -A && git commit -q -m "feat: x"',
    ],
    [
      'script de modification puis commit conditionné à verify seulement',
      'python3 - <<\'EOF\'\nraise SystemExit(1)\nEOF\npnpm exec prettier --write docs; if pnpm verify; then git add -A && git commit -q -m "docs: x"; fi',
    ],
    [
      'commit dans un if après un point-virgule',
      'sed -i s/a/b/ f; if pnpm verify > v.log; then git add -A && git commit -m "docs: y"; fi',
    ],
  ])('%s', (_, commande) => {
    expect(refuse(commande)).toBe(true);
  });
});

describe('analyser — enchaînements acceptés', () => {
  it('verify puis commit reliés par &&', () => {
    expect(analyser('pnpm verify && git add -A && git commit -m "feat: x"')).toEqual({
      commit: true,
      refus: null,
      verifieDansLaChaine: true,
    });
  });

  it('commit seul ou après git add : la vérification préalable sera exigée', () => {
    expect(analyser('git add -A && git commit -m "a; b | c"')).toEqual({
      commit: true,
      refus: null,
      verifieDansLaChaine: false,
    });
  });

  it('heredoc dont le corps mentionne git commit, chaîne en &&', () => {
    const commande =
      "python3 - <<'EOF' && pnpm verify && git commit -F msg\nprint('git commit; echo')\nEOF";
    expect(analyser(commande)).toMatchObject({ refus: null, verifieDansLaChaine: true });
  });

  it('script ouvert par set -euo pipefail', () => {
    const commande = 'set -euo pipefail\nsed -i s/a/b/ f\npnpm verify\ngit commit -m "x"';
    expect(analyser(commande)).toMatchObject({ refus: null, verifieDansLaChaine: true });
  });

  it('reconnaît git -C et les affectations de variables', () => {
    expect(analyser('FOO=1 git -C depot commit -m x')).toMatchObject({ commit: true });
  });
});

describe('analyser — autres refus et non-commits', () => {
  it.each([
    ['ou logique', 'pnpm verify || true && git commit -m x'],
    ['arrière-plan', 'pnpm build & git commit -m x'],
    ['ou logique même en mode strict', 'set -euo pipefail\npnpm verify || true\ngit commit -m x'],
  ])('refuse : %s', (_, commande) => {
    expect(refuse(commande)).toBe(true);
  });

  it.each([
    'git status; git log --oneline -3',
    'echo "git commit; x"',
    'gh pr create --body "lancer git commit après verify"',
  ])('ignore une commande sans commit : %s', (commande) => {
    expect(analyser(commande)).toEqual({ commit: false });
  });
});

describe('empreinte et vérification', () => {
  let depot: string;
  const git = (...args: string[]) => execFileSync('git', args, { cwd: depot, stdio: 'pipe' });

  beforeEach(() => {
    depot = mkdtempSync(join(tmpdir(), 'garde-commit-'));
    git('init', '-q');
    git('config', 'user.email', 'test@example.org');
    git('config', 'user.name', 'Test');
    writeFileSync(join(depot, 'a.txt'), 'un\n');
    git('add', '-A');
    git('commit', '-q', '-m', 'init');
  });

  afterEach(() => {
    rmSync(depot, { recursive: true, force: true });
  });

  it('change avec une modification ou un fichier non suivi, pas avec git add', () => {
    const initiale = empreinte(depot);
    writeFileSync(join(depot, 'a.txt'), 'deux\n');
    const modifiee = empreinte(depot);
    expect(modifiee).not.toBe(initiale);
    git('add', '-A');
    expect(empreinte(depot)).toBe(modifiee);
    writeFileSync(join(depot, 'b.txt'), 'nouveau\n');
    expect(empreinte(depot)).not.toBe(modifiee);
  });

  it('marque l’état vérifié et le perd à la première modification', () => {
    expect(estVerifie(depot)).toBe(false);
    marquer(depot);
    expect(estVerifie(depot)).toBe(true);
    writeFileSync(join(depot, 'a.txt'), 'modifié après verify\n');
    expect(estVerifie(depot)).toBe(false);
  });

  it('controler exige un verify réussi sur l’état exact', () => {
    expect(controler('git add -A && git commit -m x', depot)).toMatch(/pnpm verify n'a pas réussi/);
    marquer(depot);
    expect(controler('git add -A && git commit -m x', depot)).toBeNull();
    expect(controler('git status; git log', depot)).toBeNull();
    expect(controler('echo a; git commit -m x', depot)).toMatch(/précédé de « ; »/);
  });

  it('fonctionne comme hook : code 2 et motif sur stderr', () => {
    const appeler = (entree: object) =>
      spawnSync(process.execPath, [join(import.meta.dirname, 'garde-commit.ts')], {
        input: JSON.stringify(entree),
        env: { ...process.env, CLAUDE_PROJECT_DIR: depot },
        encoding: 'utf8',
      });

    const refuse = appeler({ tool_name: 'Bash', tool_input: { command: 'x; git commit -m y' } });
    expect(refuse.status).toBe(2);
    expect(refuse.stderr).toMatch(/précédé de « ; »/);

    const autorise = appeler({ tool_name: 'Bash', tool_input: { command: 'git status' } });
    expect(autorise.status).toBe(0);

    const autreOutil = appeler({ tool_name: 'Read', tool_input: { file_path: 'a.txt' } });
    expect(autreOutil.status).toBe(0);
  });
});
