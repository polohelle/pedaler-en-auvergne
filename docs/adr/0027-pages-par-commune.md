# 0027 — Pages par commune « Pédaler à… »

- Statut : acceptée
- Date : 2026-10-16

## Contexte

Le cahier des charges prévoit une page par commune générée à partir des données (« Pédaler à
Riom »), pour le référencement, et des déclinaisons locales (« Pédaler à Clermont ») qui
reprendront et enrichiront ces pages. Le champ `agglomeration` nécessaire aux déclinaisons
n'existe pas encore, et aucune déclinaison n'est ouverte.

## Décision

- Une page `/communes/<slug>/` pour chaque commune qui a au moins un acteur publié ou un
  événement à venir, et un index `/communes/`. Le slug vient du nom de commune
  (`slugifier`) ; les URL ne contiennent pas le département.
- Le titre suit la marque : « Pédaler à Riom », « au Cendre », « aux Martres-de-Veyre »
  (`lieuPedaler`, `src/lib/communes.ts`). La page porte le tampon de la déclinaison, avec le
  numéro du département au centre hors Puy-de-Dôme (ADR 0024).
- La page reprend les cartes de l'annuaire et de l'agenda (`CarteActeur`, `CarteEvenement`) ;
  la commune de chaque carte d'annuaire mène à sa page.

## Conséquences

- Les pages apparaissent et disparaissent avec les contenus, sans configuration.
- Une déclinaison locale (`/clermont`, agglomération entière, actus, relais) restera une
  décision à part : elle ajoutera le champ `agglomeration` et pourra regrouper plusieurs pages
  communes.
- Deux orthographes d'une même commune donnent la même page ; la première rencontrée sert au
  titre.
