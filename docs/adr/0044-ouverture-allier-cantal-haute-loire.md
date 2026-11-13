# 0044 — Ouverture de l'Allier, du Cantal et de la Haute-Loire

- Statut : acceptée
- Date : 2026-11-13
- Complète : 0040 (associations et clubs dans l'annuaire)

## Contexte

Le site a été ouvert sur le seul Puy-de-Dôme ; l'Allier, le Cantal et la Haute-Loire étaient
déclarés dans `src/config/departements.ts` sans être actifs. L'agenda contenait pourtant déjà des
épreuves de ces départements (cyclo-cross de Moulins, Yzeure, Montluçon, Brioude, randonnée de
Montsalvy), et le tour d'horizon du 13 novembre 2026 a repéré des acteurs et des projets
structurants hors du Puy-de-Dôme (V75 Ouest, Via Fluvia, associations d'usagers d'Aurillac et du
Puy-en-Velay). L'administrateur a demandé d'ouvrir les trois départements.

## Décision

- Les quatre départements auvergnats sont **actifs** : le formulaire « proposer un événement » et
  l'espace organisateur proposent le choix du département, et les agents de veille et de collecte
  couvrent tout le périmètre (règle 5 de `CLAUDE.md`).
- Les textes du site parlent de l'Auvergne et non plus du seul Puy-de-Dôme.
- Le carnet `data/sources.yaml` reçoit des sources locales pour chaque département ouvert.
- L'annuaire s'étend au fil des sources : pas d'import en masse ; les associations et clubs des
  nouveaux départements suivent les règles de l'ADR 0040 (commune du nom, sans adresse publique).

## Conséquences

- La couverture des trois nouveaux départements sera longtemps moins complète que celle du
  Puy-de-Dôme ; les agents de maintenance et de collecte doivent y chercher en priorité.
- Le département par défaut reste le Puy-de-Dôme (carte, formulaires).
- Un import OpenStreetMap par département (`pnpm import:osm`) reste possible plus tard, avec la
  même vérification humaine que pour le Puy-de-Dôme (ADR 0019).
