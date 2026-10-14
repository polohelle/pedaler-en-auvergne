# 0009 — Chaîne d'intégration continue

- Statut : acceptée, déclenchement remplacé par 0020
- Date : 2026-10-14

## Contexte

`main` sera protégée : rien n'y entre sans pull request et contrôles au vert. Les
contributions viennent de l'administrateur, des agents (phase 3), de Dependabot et
éventuellement de forks. Les secrets doivent rester hors du dépôt et les jetons au
strict minimum.

## Décision

- **Un workflow `ci.yml`** en trois jobs : `qualite` (messages de commit, lint, format,
  typage, tests couverts, audit des dépendances de production, build), puis en
  parallèle `e2e` (Playwright et axe sur le build) et `lighthouse`, qui réutilisent
  l'artefact `dist/` au lieu de reconstruire.
- **Déclenchement** : à chaque push sur toute branche du dépôt ; les événements
  `pull_request` ne lancent la CI que pour les forks, afin de ne pas tout exécuter deux
  fois. Les statuts sont attachés au commit et valent pour la PR.
- **Lighthouse en phase 1** : sur le `dist/` servi localement par `lhci`, en profil
  mobile, avec les seuils bloquants du cahier des charges (Performance ≥ 90,
  Accessibilité 100, Bonnes pratiques ≥ 95, SEO 100). Il passera sur l'URL d'aperçu
  Cloudflare quand celle-ci sera reliée. Rapports conservés en artefacts, sans envoi
  vers un service tiers.
- **Sécurité** : permissions `contents: read` par défaut ; actions épinglées par SHA
  (Dependabot les met à jour) ; aucun secret requis par la CI.
- **Versions** : release-please tient une PR de version (CHANGELOG, `package.json`) ;
  sa fusion crée le tag SemVer. Jeton dédié facultatif `RELEASE_PLEASE_TOKEN`, stocké
  dans les secrets GitHub, pour que la CI tourne sur cette PR.
- **Dépendances** : Dependabot hebdomadaire (npm et actions), mises à jour mineures
  regroupées pour limiter la relecture.

## Conséquences

- Une PR d'un fork attend l'approbation de l'administrateur pour lancer la CI.
- La protection de `main` est activée à la main par l'administrateur
  (`docs/runbooks/proteger-main.md`).
- La CI dure quelques minutes ; les jobs `e2e` et `lighthouse` ne démarrent que si
  `qualite` est vert.
