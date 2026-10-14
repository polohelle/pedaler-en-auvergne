# 0012 — Amorçage de l'annuaire par import OpenStreetMap

- Statut : acceptée, complétée par 0019 (brouillons OpenStreetMap minimaux)
- Date : 2026-10-14

## Contexte

L'annuaire démarre à partir des magasins et réparateurs vélo cartographiés dans
OpenStreetMap, puis chaque fiche est vérifiée par un humain. L'import doit pouvoir être
relancé (nouveaux commerces, autres départements) sans jamais écraser une fiche corrigée
à la main. Dans le Puy-de-Dôme, la plupart des objets OSM n'ont pas de tags d'adresse.

## Décision

- `scripts/import-osm.ts` interroge l'API Overpass sur le département
  (`ISO3166-2=FR-63`) : `shop=bicycle`, commerces avec `service:bicycle:*=yes`, loueurs à
  guichet. Les bornes de réparation, parkings et stations en libre-service sont écartés,
  comme les objets sans nom ou hors d'Auvergne.
- **Idempotence** : un objet dont l'`osm_id` figure déjà dans l'annuaire n'est jamais
  modifié ; les fichiers sont créés en mode exclusif. Les slugs (`nom-commune`) en
  collision sont numérotés.
- **Brouillons** : `statut: brouillon`, `source: osm`, `membre: false`, sans description ni
  `verifie_le` ; le rapport liste ce qui reste à compléter avant publication.
- **Commune et code postal** manquants sont complétés par géocodage inverse auprès de la
  Base Adresse Nationale (service de la Géoplateforme, `data.geopf.fr/geocodage`). L'adresse
  postale, elle, n'est jamais déduite : elle reste à vérifier.
- Valeurs OSM invalides (site, téléphone, code postal d'un autre département) écartées
  champ par champ, sans perdre la fiche. Réponses Overpass et BAN validées par Zod.
- Toute la logique est en fonctions pures dans `src/lib/osm/` et `src/lib/ban.ts` ; le script
  n'a que les entrées-sorties, injectables pour ses tests. Option `--overpass` pour une
  instance miroir quand le serveur principal sature, `--entree` pour rejouer une réponse
  enregistrée, `--dry-run` pour voir le plan.

## Conséquences

- Les données importées sont sous ODbL : attribution « © contributeurs OpenStreetMap »
  (ADR 0004) et `osm_id` conservé pour resynchroniser.
- L'agent `maintenance-annuaire` relancera l'import chaque mois en `--dry-run` pour
  signaler les nouveaux commerces.
