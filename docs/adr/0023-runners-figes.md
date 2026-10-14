# 0023 — Runners GitHub Actions figés sur une version d'Ubuntu

- Statut : acceptée
- Date : 2026-10-14

## Contexte

GitHub fait migrer l'étiquette `ubuntu-latest` vers Ubuntu 26.04 à partir du 19 octobre 2026.
Tous les jobs (CI, release, build quotidien) utilisaient `ubuntu-latest` : la migration aurait
changé du jour au lendemain le système, les bibliothèques et le Chrome préinstallé dont
dépendent Playwright, axe et Lighthouse, sans modification du dépôt ni pull request à relire.

## Décision

- Tous les jobs déclarent **`runs-on: ubuntu-24.04`**, la même image partout.
- Un test (`tests/unit/workflows.test.ts`) refuse toute image `*-latest` ou non versionnée, et
  toute divergence entre jobs.
- Une montée de version d'Ubuntu est une décision explicite : pull request dédiée, CI complète
  (bout en bout, accessibilité, Lighthouse) sur la nouvelle image, ADR.

## Conséquences

- L'environnement de CI ne change que par une pull request relue.
- Il faudra monter de version avant la fin du support de l'image 24.04 par GitHub ; le passage à
  26.04 est évalué dans un ADR séparé.
- Dependabot met à jour les actions mais pas l'image : la surveillance des annonces de GitHub
  (avertissements dans les journaux de la CI) reste nécessaire.
