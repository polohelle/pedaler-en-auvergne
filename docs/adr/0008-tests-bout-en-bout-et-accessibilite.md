# 0008 — Tests bout en bout et d'accessibilité sur le site construit

- Statut : acceptée
- Date : 2026-10-14

## Contexte

Le cahier des charges demande des tests Playwright sur les parcours clés et un contrôle
axe-core sur chaque modèle de page, avec un objectif d'accessibilité AA et une
conception mobile d'abord.

## Décision

- **Playwright** sur Chromium, en deux profils : `mobile` (Pixel 7) puis `bureau`.
  Locale `fr-FR`, fuseau `Europe/Paris`.
- Les tests tournent sur le **site construit** (`astro build` puis `astro preview`),
  jamais sur le serveur de développement, pour tester ce qui sera déployé.
- `astro preview` est lancé avec `--ignore-lock` : Astro 7 passe sinon en arrière-plan
  lorsqu'il détecte un agent, et Playwright croit que le serveur s'est arrêté.
- **axe-core** (`@axe-core/playwright`) sur chaque entrée de `tests/pages.ts`, avec les
  règles WCAG 2.0, 2.1 et 2.2 de niveaux A et AA ; toute violation fait échouer le test.
- `tests/pages.ts` est la liste unique des modèles de page : ajouter une page, c'est
  l'y déclarer, ce qui l'inclut d'office dans les deux familles de tests.

## Conséquences

- axe ne détecte qu'une partie des défauts d'accessibilité : l'agent
  `audit-accessibilite` et les vérifications manuelles (clavier, lecteur d'écran)
  restent nécessaires avant une mise en production importante.
- Seul Chromium est testé en CI pour limiter la durée ; Firefox et WebKit pourront être
  ajoutés si un défaut propre à un navigateur apparaît.
