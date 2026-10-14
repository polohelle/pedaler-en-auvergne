# 0014 — Contenus de test pour les tests bout en bout

- Statut : acceptée
- Date : 2026-10-14

## Contexte

Le cahier des charges demande un contrôle d'accessibilité sur chaque modèle de page, et
les règles de publication (brouillon, à valider, annulé, passé) doivent être vérifiées sur
le site réel. Or l'annuaire et l'agenda sont vides au lancement, et publier de faux
contenus sur le site n'est pas envisageable.

## Décision

- Un jeu de contenus fictifs, couvrant chaque modèle et chaque statut, vit dans
  `tests/fixtures/site/` (noms « … de test », adresses en `example.org`).
- La variable `PEA_CONTENU` change la racine des collections (`src/content.config.ts`) et
  le dossier de sortie (`dist-e2e/` au lieu de `dist/`). Playwright la positionne lui-même
  pour construire puis servir le site de test ; la build de production l'ignore.
- Ces contenus sont validés par les mêmes tests de schéma et d'intégrité que les contenus
  réels.
- Lighthouse reste mesuré sur la build de production (`dist/`).

## Conséquences

- Le job `e2e` de la CI construit son propre site au lieu de réutiliser l'artefact `dist`
  (précision apportée à l'ADR 0008).
- Ajouter un modèle de page, c'est ajouter un contenu de test qui l'utilise et le déclarer
  dans `tests/pages.ts`.
