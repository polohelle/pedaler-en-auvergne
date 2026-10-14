# 0002 — Site statique Astro avec content collections

- Statut : acceptée
- Date : 2026-10-14

## Contexte

Le cahier des charges impose un coût quasi nul, aucun serveur à maintenir, un contenu
versionné dans Git (un fichier par acteur, événement, article) et des pages rapides sur
réseau mobile faible.

## Décision

- Astro 7 en sortie `static`, sans adaptateur serveur. Les formulaires publics
  (phase 2) seront des Cloudflare Pages Functions indépendantes du build Astro.
- Contenu en Markdown dans `src/content/`, chargé par les content collections
  (loader `glob`) et validé par des schémas Zod.
- URL canoniques avec barre finale (`trailingSlash: 'always'`, `build.format: 'directory'`),
  ce qui correspond au service de fichiers `dossier/index.html` de Cloudflare Pages
  et évite les redirections.
- Aucun département dans les URL (`/annuaire/<slug>/`), conformément à l'extension prévue.

## Conséquences

- Hébergement gratuit, aucune base de données, déploiement par simple fusion.
- Toute donnée dynamique (formulaires, notifications) passe par une fonction serverless
  séparée, à justifier par un ADR.
- La publication d'un contenu dépend d'un nouveau build : délai de quelques minutes acceptable.
