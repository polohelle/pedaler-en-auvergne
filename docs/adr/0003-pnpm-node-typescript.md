# 0003 — pnpm, Node 24 et TypeScript 6 en mode strictest

- Statut : acceptée
- Date : 2026-10-14

## Contexte

L'outillage doit être reproductible (CI, postes de bénévoles, agents) et le typage aussi
strict que possible. En octobre 2026, TypeScript 7 (réécriture native) est sorti, mais
`@astrojs/check` 0.9 n'accepte que TypeScript 5 ou 6 et `typescript-eslint` 8 exige
une version inférieure à 6.1.

## Décision

- **pnpm** (version figée par `packageManager`), dépendances en versions exactes
  (`save-exact`) ; les mises à jour passent par Dependabot.
- **Node 24 LTS** (`.nvmrc`, `engines`, `engine-strict`).
- **TypeScript 6.0** avec la configuration `astro/tsconfigs/strictest`. Pas de `baseUrl`
  (déprécié en 6.0, supprimé en 7.0) : les alias `@lib/*`, `@config/*`… sont déclarés
  en chemins relatifs dans `paths`.
- Passage à TypeScript 7 quand `@astrojs/check` et `typescript-eslint` le supporteront.

## Conséquences

- Installations identiques partout grâce au lockfile et aux versions exactes.
- Configuration déjà compatible TypeScript 7 : la migration se limitera à la mise à jour
  des paquets.
- `astro check` ne signale pas les erreurs propres au `tsconfig.json` : la CI lancera aussi
  `tsc --noEmit`.
