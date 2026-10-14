# 0022 — Une seule source de vérité pour la version de Node

- Statut : acceptée
- Date : 2026-10-14
- Précise : 0003 (Node 24) et 0017 (réglages Cloudflare Pages)

## Contexte

Le premier déploiement sur Cloudflare Pages a échoué. Le runbook demandait `NODE_VERSION=24` et
`.nvmrc` contenait `24` : Cloudflare a installé sa propre version 24 (24.13.1), alors
qu'`astro-eslint-parser` exige au moins 24.16.0. Avec `engine-strict`, pnpm a refusé
l'installation (`ERR_PNPM_UNSUPPORTED_ENGINE`). La CI, elle, prenait la dernière 24.x : la version
dépendait de l'environnement, et le champ `engines` (`>=24.0.0`) promettait à tort que toute
version 24 convenait.

## Décision

- **`.nvmrc` fixe une version exacte** (`24.21.0`) et c'est la seule source de vérité. Il est lu
  par Cloudflare Pages, par `actions/setup-node` (`node-version-file`) et par nvm. Il est préféré à
  `.node-version`, que nvm ne lit pas.
- **Aucune variable `NODE_VERSION`** dans Cloudflare : elle l'emporterait sur `.nvmrc`.
- **`engines.node`** de `package.json` reflète le plancher réel des dépendances : `>=24.16.0 <25`.
- **Un test** (`tests/unit/version-node.test.ts`) vérifie que `.nvmrc` est une version exacte, qu'il
  respecte `engines`, que la version minimale permise par `engines` satisfait l'exigence de Node de
  chaque paquet du lockfile installable sous Linux x64 (la plateforme de Cloudflare et de la CI), et
  que le runbook de déploiement cite la même version.

## Conséquences

- Développement, CI et production utilisent la même version de Node ; une incompatibilité est
  détectée par `pnpm verify` avant d'atteindre Cloudflare.
- Dependabot ne met pas `.nvmrc` à jour : la montée de version se fait à la main, selon la
  procédure du runbook `deployer.md` (section « Mettre à jour Node »).
- Une mise à jour de dépendance qui relève son exigence de Node fait échouer le test, ce qui impose
  de relever `.nvmrc` ou `engines` dans la même pull request.
