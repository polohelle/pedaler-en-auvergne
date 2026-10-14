# 0004 — Licences du code, des contenus et de l'annuaire

- Statut : acceptée
- Date : 2026-10-14

## Contexte

Le dépôt est public. Il contient trois choses de nature différente : du code,
des textes rédigés par l'association ou ses agents, et une base de données
d'acteurs amorcée à partir d'OpenStreetMap, elle-même sous ODbL. Sans licence
explicite, rien n'est réutilisable, et des données dérivées d'OSM ne peuvent
pas être placées sous une licence incompatible.

## Décision

- **Code** : MIT (`LICENSE`, champ `license` de `package.json`).
- **Textes rédigés** (actus, descriptions d'événements et d'acteurs) : CC BY-SA 4.0.
- **Base de l'annuaire** (champs structurés des fiches acteurs) : ODbL 1.0, avec la
  mention « © contributeurs OpenStreetMap », obligatoire pour les données issues d'OSM.
- **Marque** : le nom, les déclinaisons « Pédaler à… » et le logo sont exclus.
- Le découpage est expliqué dans `LICENSES.md`, et rappelé dans le pied de page
  du site et à côté de la carte.

## Conséquences

- L'annuaire peut être réutilisé (par une collectivité, un autre réseau) à condition
  de citer les sources et de repartager ses améliorations.
- Toute donnée importée d'une autre source que OSM doit avoir une licence compatible
  avec l'ODbL ; le skill `evaluer-source` le vérifie.
- Les événements ne sont pas issus d'OSM : leurs descriptions sont sous CC BY-SA.
  Si leurs champs structurés devaient être diffusés comme jeu de données, une
  nouvelle décision fixera leur licence.
