# 0007 — Tests unitaires avec Vitest et seuil de couverture bloquant

- Statut : acceptée
- Date : 2026-10-14

## Contexte

Le cahier des charges exige des tests unitaires sur toute la logique métier de
`src/lib/`, avec une couverture d'au moins 80 %.

## Décision

- **Vitest 5**, configuré par `getViteConfig` d'Astro pour partager les alias et la
  résolution de modules du site.
- Tests colocalisés (`src/lib/dates.test.ts` à côté de `dates.ts`) ; tests des scripts
  dans `scripts/`, tests transverses (validation des contenus) dans `tests/unit/`.
- Couverture v8 mesurée sur `src/lib/` et `src/schemas/`, seuil de 80 % sur les lignes,
  fonctions, branches et instructions : en dessous, la commande échoue, en local
  comme en CI.
- `pnpm verify` enchaîne lint, format, typage et tests couverts : c'est la commande à
  lancer avant chaque commit d'étape.

## Conséquences

- Une logique ajoutée sans test fait échouer la CI.
- Les tests n'appellent jamais le réseau : les accès externes sont injectés et
  remplacés par des fixtures.
