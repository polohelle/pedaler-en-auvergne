/**
 * Garde-fou des commits pour les sessions Claude Code (ADR 0021).
 *
 *   node scripts/garde-commit.ts           hook PreToolUse : lit l'appel Bash sur stdin
 *   node scripts/garde-commit.ts marquer   enregistre l'état vérifié (fin de `pnpm verify`)
 *
 * Un `git commit` est refusé (code 2, motif sur stderr) :
 * 1. si une commande qui le précède n'y est pas reliée par `&&` (`;`, retour à la ligne, `||`,
 *    `|`, `&`), sauf dans un script ouvert par `set -euo pipefail` ;
 * 2. si `pnpm verify` n'a pas réussi sur l'état exact du dépôt, sauf s'il figure plus tôt dans
 *    la même chaîne `&&`.
 *
 * Exécuté directement par Node (suppression native des types) : aucune dépendance, pour que le
 * hook reste rapide à chaque commande.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type Operateur = '&&' | '||' | ';' | '|' | '&' | '\n';

export interface Segment {
  /** Opérateur qui relie ce segment au précédent (`null` pour le premier). */
  operateur: Operateur | null;
  texte: string;
}

/**
 * Découpe une commande shell en segments, hors guillemets et hors corps de heredoc.
 * Analyse volontairement simple : elle vise les erreurs d'enchaînement, pas un adversaire.
 */
export function decouper(commande: string): Segment[] {
  const segments: Segment[] = [];
  let courant = '';
  let operateur: Operateur | null = null;
  let guillemet: "'" | '"' | null = null;
  const heredocs: { fin: string; tabulations: boolean }[] = [];

  const clore = (suivant: Operateur) => {
    segments.push({ operateur, texte: courant.trim() });
    courant = '';
    operateur = suivant;
  };

  for (let i = 0; i < commande.length; i += 1) {
    const c = commande.charAt(i);
    if (guillemet !== null) {
      if (c === '\\' && guillemet === '"') {
        courant += c + commande.charAt(i + 1);
        i += 1;
      } else {
        if (c === guillemet) guillemet = null;
        courant += c;
      }
      continue;
    }
    if (c === "'" || c === '"') {
      guillemet = c;
      courant += c;
      continue;
    }
    if (c === '\\') {
      courant += c + commande.charAt(i + 1);
      i += 1;
      continue;
    }
    if (c === '<' && commande.startsWith('<<', i) && !commande.startsWith('<<<', i)) {
      const marque = /^<<(-?)\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\2/.exec(commande.slice(i));
      if (marque !== null) {
        heredocs.push({ fin: marque[3] ?? '', tabulations: marque[1] === '-' });
        courant += marque[0];
        i += marque[0].length - 1;
        continue;
      }
    }
    if (c === '\n') {
      clore('\n');
      // Corps des heredocs ouverts sur la ligne : sautés jusqu'à leur marque de fin ; le retour à
      // la ligne qui suit la marque sépare la commande suivante.
      for (const { fin, tabulations } of heredocs.splice(0)) {
        let debut = i + 1;
        for (;;) {
          const finLigne = commande.indexOf('\n', debut);
          const ligne = commande.slice(debut, finLigne === -1 ? undefined : finLigne);
          const fermante = (tabulations ? ligne.replace(/^\t+/, '') : ligne) === fin;
          if (finLigne === -1) {
            i = commande.length;
            break;
          }
          if (fermante) {
            i = finLigne - 1;
            break;
          }
          debut = finLigne + 1;
        }
      }
      continue;
    }
    const deux = commande.slice(i, i + 2);
    if (deux === '&&' || deux === '||') {
      clore(deux);
      i += 1;
    } else if (c === ';' || c === '|') {
      clore(c);
    } else if (c === '&' && commande.charAt(i - 1) !== '>' && commande.charAt(i + 1) !== '>') {
      clore('&');
    } else {
      courant += c;
    }
  }
  segments.push({ operateur, texte: courant.trim() });
  return segments.filter((segment) => segment.texte !== '');
}

const PREFIXES_SHELL = /^(?:(?:then|do|else|\{|\()\s+|[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*/;
const GIT_COMMIT = /^git(?:\s+-[Cc]\s+\S+)*\s+commit(?:\s|$)/;
const PNPM_VERIFY = /^pnpm\s+(?:run\s+)?verify\s*$/;
/** `set -euo pipefail`, `set -e -o pipefail`… : une étape en échec arrête le script. */
const MODE_STRICT = /^set\s+-[a-zA-Z]*e[a-zA-Z]*\b.*\bpipefail\b/;

function commandeDe(segment: Segment): string {
  return segment.texte.replace(PREFIXES_SHELL, '');
}

export type Analyse =
  | { commit: false }
  | { commit: true; refus: string }
  | { commit: true; refus: null; verifieDansLaChaine: boolean };

/** Décide si une commande qui contient un `git commit` est correctement enchaînée. */
export function analyser(commande: string): Analyse {
  const segments = decouper(commande);
  const rang = segments.findIndex((segment) => GIT_COMMIT.test(commandeDe(segment)));
  if (rang === -1) return { commit: false };

  const strict = MODE_STRICT.test(segments[0]?.texte ?? '');
  const avant = segments.slice(1, rang + 1).map((segment) => segment.operateur);
  const interdits: readonly (Operateur | null)[] = strict
    ? ['||', '&']
    : ['||', '|', '&', ';', '\n'];
  const fautif = avant.find((operateur) => interdits.includes(operateur));
  if (fautif !== undefined) {
    const nom = fautif === '\n' ? 'un retour à la ligne' : `« ${String(fautif)} »`;
    return {
      commit: true,
      refus:
        `git commit est précédé de ${nom} : l'échec d'une étape antérieure n'empêcherait pas le ` +
        'commit. Enchaîner chaque étape avec « && », ou ouvrir le script par « set -euo pipefail », ' +
        'ou lancer le commit dans un appel séparé après un pnpm verify réussi.',
    };
  }
  // Les opérateurs autorisés garantissent qu'un pnpm verify en échec arrête la commande.
  const verifieDansLaChaine = segments
    .slice(0, rang)
    .some((segment) => PNPM_VERIFY.test(commandeDe(segment)));
  return { commit: true, refus: null, verifieDansLaChaine };
}

function git(args: string[], racine: string): string {
  return execFileSync('git', args, { cwd: racine, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
}

/**
 * Empreinte de l'état à committer : HEAD, modifications par rapport à HEAD (indexées ou non),
 * fichiers non suivis et non ignorés. L'indexation (`git add`) ne la change pas.
 */
export function empreinte(racine: string): string {
  const hash = createHash('sha256');
  hash.update(git(['rev-parse', '--verify', '--quiet', 'HEAD'], racine).trim());
  hash.update(git(['diff', 'HEAD', '--binary', '--no-ext-diff', '--no-color'], racine));
  const nonSuivis = git(['ls-files', '--others', '--exclude-standard', '-z'], racine)
    .split('\0')
    .filter((chemin) => chemin !== '')
    .sort();
  for (const chemin of nonSuivis) {
    hash.update(`\0${chemin}\0`);
    hash.update(readFileSync(join(racine, chemin)));
  }
  return hash.digest('hex');
}

function fichierMarque(racine: string): string {
  return join(racine, git(['rev-parse', '--git-dir'], racine).trim(), 'pea-verify-ok');
}

export function marquer(racine: string): void {
  writeFileSync(fichierMarque(racine), `${empreinte(racine)}\n`);
}

export function estVerifie(racine: string): boolean {
  try {
    return readFileSync(fichierMarque(racine), 'utf8').trim() === empreinte(racine);
  } catch {
    return false;
  }
}

/** Motif de refus d'un appel Bash, ou `null` s'il est autorisé. */
export function controler(commande: string, racine: string): string | null {
  const analyse = analyser(commande);
  if (!analyse.commit) return null;
  if (analyse.refus !== null) return analyse.refus;
  if (analyse.verifieDansLaChaine || estVerifie(racine)) return null;
  return (
    "git commit refusé : pnpm verify n'a pas réussi sur l'état actuel du dépôt (aucune " +
    'vérification, ou fichiers modifiés depuis). Lancer pnpm verify, vérifier son succès, puis ' +
    'committer ; ou enchaîner « pnpm verify && git add … && git commit … ».'
  );
}

function lancer(): void {
  const racine = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  if (process.argv[2] === 'marquer') {
    marquer(racine);
    return;
  }
  const entree = JSON.parse(readFileSync(0, 'utf8')) as {
    tool_name?: string;
    tool_input?: { command?: unknown };
  };
  const commande = entree.tool_input?.command;
  if (entree.tool_name !== 'Bash' || typeof commande !== 'string') return;
  const refus = controler(commande, racine);
  if (refus !== null) {
    process.stderr.write(`${refus}\n`);
    process.exitCode = 2;
  }
}

if (import.meta.main) lancer();
