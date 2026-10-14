# 0005 — Lint, formatage et hooks de commit

- Statut : acceptée
- Date : 2026-10-14

## Contexte

Le cahier des charges exige ESLint et Prettier appliqués avant chaque commit,
des Conventional Commits et l'absence de `any` non justifié. Le code est écrit
par un humain et par des agents : les règles doivent être vérifiées par des
outils, pas par la relecture seule.

## Décision

- **ESLint 10** en configuration plate : `typescript-eslint` en `strictTypeChecked`
  et `stylisticTypeChecked`, `eslint-plugin-astro` (règles recommandées et
  accessibilité stricte), puis `eslint-config-prettier` pour éviter les conflits.
  Zéro avertissement toléré (`--max-warnings=0`).
- **Accessibilité** : `eslint-plugin-jsx-a11y-x`, fork maintenu par es-tooling.
  L'original n'est plus publié depuis octobre 2024 et ne supporte pas ESLint 10 ;
  `eslint-plugin-astro` prend officiellement en charge les deux.
- **Accès au contenu** : `no-restricted-imports` interdit `getCollection`, `getEntry`
  et `getEntries` hors de `src/services/` et `src/content.config.ts`, pour qu'aucune
  page ne puisse afficher un contenu non publié.
- **Prettier** avec `prettier-plugin-astro`.
- **Hooks** : husky ; `pre-commit` lance lint-staged (ESLint puis Prettier sur les
  fichiers indexés) ; `commit-msg` lance commitlint.
- **Commits** : `@commitlint/config-conventional`, plus le type `content` pour les
  contenus éditoriaux ; sujet libre en casse, car les messages sont en français.

## Conséquences

- Un commit qui ne respecte pas le style, le typage strict ou le format de message
  est refusé localement ; la CI rejoue les mêmes contrôles sur l'ensemble du dépôt.
- Les fichiers `.astro` sont analysés via `project: true`, car `astro-eslint-parser`
  ne gère pas `projectService`.
- Contourner un hook (`--no-verify`) est interdit aux agents par `CLAUDE.md`.
