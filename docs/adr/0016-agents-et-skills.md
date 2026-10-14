# 0016 — Agents, skills et garde-fous de Claude Code

- Statut : acceptée
- Date : 2026-10-14

## Contexte

Le portail fonctionne avec un seul administrateur, assisté d'agents Claude qui assurent la
veille, la collecte et la relecture. Le dépôt est public, les pages web consultées par les
agents ne sont pas sûres, et rien ne doit être publié sans validation humaine.

## Décision

- **Règles communes** dans `CLAUDE.md` (lues par toute session Claude dans le dépôt) : celles du
  cahier des charges, plus le statut non publié imposé aux contenus d'agent et le mode
  « rapport seul ».
- **Dix sous-agents** dans `.claude/agents/` : sept pour la veille et la collecte
  (`veille-locale`, `veille-nationale`, `collecte-evenements`, `propositions`,
  `maintenance-annuaire`, `synthese-hebdo`, `relecteur`), trois pour le développement
  (`revue-code`, `audit-accessibilite`, `audit-performance`). Chacun liste ses outils au plus
  juste : le relecteur et les auditeurs n'ont ni `Write` ni `Edit`. Modèle `sonnet` par défaut
  pour maîtriser le coût, `opus` pour la revue de code.
- **Dix skills** dans `.claude/skills/`, qui portent les savoir-faire partagés (rédiger une
  brève, normaliser un événement, géocoder, dédoublonner, évaluer une source, ouvrir une PR,
  rédiger la synthèse, créer un composant, ajouter une collection, écrire un ADR).
- **Garde-fous** dans `.claude/settings.json`, qui s'imposent à toute session : interdits
  (pousser sur `main`, forcer un push, fusionner ou approuver une PR, contourner les hooks,
  modifier le dépôt ou ses secrets, lire `.env`), et autorisation des seules commandes de
  lecture et de vérification courantes.
- **Pas de planification en phase 1.** En phase 3, une GitHub Action par agent lancera Claude
  Code en mode non interactif (`anthropics/claude-code-action`, option `--agent`, outils
  explicitement autorisés), avec un jeton limité au dépôt (contenu, PR, issues), sans accès à
  Cloudflare ni à `main` ; deux semaines en « rapport seul » avant les vraies PR.

## Conséquences

- La protection de `main` (runbook `proteger-main.md`) reste la garantie ultime : les règles de
  `settings.json` sont un filet, pas une frontière de sécurité.
- Un nouvel agent ou skill suit la même structure et met à jour `CLAUDE.md` si une règle commune
  change.
- Les consignes des agents évolueront avec les premiers rapports ; chaque changement passe par
  une PR relue.
