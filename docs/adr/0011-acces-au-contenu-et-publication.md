# 0011 — Accès unique au contenu et règles de publication

- Statut : acceptée
- Date : 2026-10-14

## Contexte

Les agents et les formulaires créent des contenus en `brouillon` ou `a_valider` dans le
dépôt public. Le site ne doit en afficher aucun. Le cahier des charges prévoit aussi qu'un
événement annulé reste visible, barré, jusqu'à sa date, puis soit archivé.

## Décision

- `src/services/contenus.ts` est le seul module qui lit les collections ; une règle ESLint
  interdit `getCollection`, `getEntry` et `getEntries` ailleurs.
- Les règles sont des fonctions pures testées dans `src/lib/publication.ts` :
  - acteurs et actus : visibles si `publie` ;
  - événements : visibles si `publie`, ou si `annule` et que leur dernier jour (à Paris)
    n'est pas révolu ;
  - un événement est « passé » le lendemain de son dernier jour, à Paris.
- Les événements `publie` passés restent accessibles (pages de détail) jusqu'à leur
  archivage par l'agent `maintenance-annuaire` ; les listes n'affichent que les
  événements à venir.

## Conséquences

- Le site étant statique, « maintenant » est l'heure du build : un événement annulé disparaît
  au premier build qui suit sa date. Un build quotidien planifié (crochet de déploiement
  Cloudflare appelé par une GitHub Action) sera ajouté avec le déploiement, pour que
  l'agenda reste juste même sans fusion.
- Ajouter une collection, c'est ajouter sa fonction d'accès ici (skill `ajouter-collection`).
