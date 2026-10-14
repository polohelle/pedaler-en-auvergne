# 0021 — Garde-fou automatique des commits des sessions Claude Code

- Statut : acceptée
- Date : 2026-10-14

## Contexte

À quatre reprises pendant la phase 1 et sa suite, un commit est passé alors qu'une étape
précédente avait échoué : sortie de `pnpm verify` filtrée par un tube (`| grep`) qui masquait son
code de sortie ; étapes séparées par `;` ou par un retour à la ligne ; script de modification
interrompu au milieu, suivi d'un commit conditionné à la seule vérification. Les hooks Git
(lint-staged, commitlint) ne contrôlent que le formatage, le lint des fichiers indexés et le
message, pas le typage, les tests ni l'échec d'une étape antérieure. Une règle écrite ne suffit
pas : il faut une barrière automatique.

## Décision

- **Hook PreToolUse** de Claude Code sur l'outil Bash (`.claude/settings.json`), qui exécute
  `scripts/garde-commit.ts` avant chaque commande. Si la commande contient un `git commit`, il
  la refuse (code 2, motif renvoyé à Claude) dans deux cas :
  1. **Enchaînement** : une commande qui précède le commit n'y est pas reliée par `&&`
     (`;`, retour à la ligne, `||`, `|`, `&`). Exception : un script ouvert par
     `set -euo pipefail`, où seuls `||` et `&` restent interdits.
  2. **Vérification** : `pnpm verify` n'a pas réussi sur l'état exact du dépôt. À la fin d'un
     verify réussi, une empreinte (HEAD, modifications indexées ou non, fichiers non suivis) est
     écrite dans `.git/pea-verify-ok` ; le commit n'est accepté que si l'empreinte actuelle est
     identique, ou si `pnpm verify` figure plus tôt dans la même chaîne `&&`.
- L'analyse ignore les guillemets et le corps des heredocs, pour ne pas confondre un texte qui
  mentionne `git commit` avec une commande.
- Le script n'a aucune dépendance et s'exécute directement par Node 24 (suppression native des
  types), pour rester rapide à chaque commande ; il est couvert par des tests qui rejouent les
  quatre incidents.
- Règle écrite correspondante dans `CLAUDE.md` (section « Enchaîner les commandes »).

## Conséquences

- S'applique à toute session Claude Code dans le dépôt, y compris aux agents planifiés de la
  phase 3 : un agent ne peut plus committer sans verify réussi.
- Ne s'applique pas aux commits faits à la main ; pour un humain, la protection de `main` et la
  CI restent la barrière.
- Ce n'est pas une frontière de sécurité : une commande détournée (`bash -c "git commit"`) y
  échappe. Le but est d'empêcher les erreurs d'enchaînement, pas un contournement délibéré.
- Une modification faite après le verify (même un formatage) impose un nouveau verify avant le
  commit : c'est voulu.
