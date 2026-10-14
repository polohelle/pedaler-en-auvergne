---
name: creer-composant
description: Créer ou modifier un composant ou une page Astro selon les conventions du projet — props typées, affichage seulement, styles à portée avec les jetons CSS, accessibilité AA, aucun script ni style en ligne, tests e2e et axe. À utiliser pour tout travail dans src/components, src/layouts ou src/pages.
---

# Créer un composant ou une page

## Conventions

- Fichier `src/components/NomEnPascalCase.astro` ; noms et commentaires en français.
- Props déclarées par `interface Props` ; pour une route dynamique,
  `type Props = InferGetStaticPropsType<typeof getStaticPaths>`.
- **Affichage seulement** : aucune logique métier (calcul, tri, filtrage, formatage de date)
  dans le composant ; l'ajouter dans `src/lib/` avec ses tests, puis l'appeler. Les contenus
  viennent de `src/services/contenus.ts`, jamais de `getCollection`.
- Libellés des valeurs fermées : les dictionnaires `LIBELLES_*` de `src/config/`.
- Dates : `src/lib/dates.ts` uniquement.
- Styles : bloc `<style>` à portée du composant, avec les variables de
  `src/styles/tokens.css` (couleurs, espacements, `--cible-tactile`) ; mobile d'abord, puis
  `@media (min-width: …)` si nécessaire. **Aucun** attribut `style=`, aucune balise `<style>`
  globale en ligne, aucun `define:vars` (CSP stricte).
- JavaScript : aucun, sauf carte, filtres ou PWA ; alors un `<script>` traité par Astro (fichier
  externe), jamais `is:inline` avec du code.

## Accessibilité (AA)

- HTML sémantique (`nav`, `main`, `article`, `ul`, `dl`, `button` pour une action, `a` pour une
  navigation) ; un seul `h1` par page ; hiérarchie des titres sans saut.
- Intitulés de liens et de boutons compréhensibles hors contexte ; cibles d'au moins
  `var(--cible-tactile)`.
- Images : `alt` pertinent, ou `alt=""` si décorative.
- Information jamais portée par la seule couleur ou le seul barré (ajouter un texte).
- Contrastes vérifiés dans les deux thèmes (clair et sombre).

## Tests

- Nouvelle page ou nouveau modèle : l'ajouter à `tests/pages.ts` (bout en bout et axe, clair et
  sombre) et, s'il dépend de contenus, ajouter un contenu fictif dans `tests/fixtures/site/`.
- Comportement spécifique : un test Playwright dans `tests/e2e/`.
- `pnpm verify` puis `pnpm test:e2e`.
