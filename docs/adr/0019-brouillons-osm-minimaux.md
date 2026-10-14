# 0019 — Brouillons OpenStreetMap minimaux dans le dépôt public

- Statut : acceptée
- Date : 2026-10-14
- Complète : 0010 (validation selon le statut) et 0012 (import OpenStreetMap)

## Contexte

L'import OpenStreetMap (ADR 0012) produisait des brouillons avec adresse, coordonnées,
horaires, site, téléphone et e-mail tirés d'OSM. Or le dépôt est public, et le cahier des
charges demande de n'y mettre aucune donnée qui ne serait pas publiée sur le site. Certains
réparateurs travaillent à domicile : leur adresse, leur position ou leur téléphone peuvent être
des données personnelles, et un brouillon peut ne jamais être publié.

## Décision

- Un brouillon importé d'OSM (`source: osm`, `statut: brouillon`) ne contient que : `nom`,
  `slug`, `categories`, `commune`, `departement`, `source`, `osm_id`, `statut` (et `membre`,
  qui vaut `false` par défaut). Ni adresse, ni code postal, ni coordonnées, ni horaires, ni
  site, ni téléphone, ni e-mail, ni services.
- **Le schéma l'impose** (`CHAMPS_BROUILLON_OSM` dans `src/schemas/acteur.ts`) : tout autre champ
  dans un tel brouillon est une erreur, quel que soit l'outil ou l'agent qui l'écrit. Une fiche
  `source: osm` garde toujours son `osm_id`.
- Les champs manquants sont saisis **lors de la vérification humaine**, dans le même commit que
  le passage en `publie` ; la fiche publiée exige adresse, code postal, coordonnées, description
  et `verifie_le` (règle de l'ADR 0010, inchangée).
- Pour toutes les fiches : `commune` devient obligatoire ; `lat`/`lon` ne sont obligatoires que
  pour une fiche publiée, et vont toujours ensemble. Un brouillon proposé par formulaire peut
  rester plus complet (coordonnées professionnelles fournies par la structure).
- L'import ne retient un objet que si sa commune est connue (tag `addr:city`, ou géocodage
  inverse BAN dans le département importé) ; sinon il est ignoré, avec son motif. Les
  coordonnées OSM servent seulement à interroger la BAN et ne sont jamais écrites.

## Conséquences

- Les brouillons peuvent être versionnés dans le dépôt public sans exposer de donnée
  personnelle ; l'`osm_id` permet à l'administrateur de retrouver l'objet sur OpenStreetMap au
  moment de la vérification.
- La vérification d'une fiche demande un peu plus de saisie (adresse, coordonnées, contacts),
  ce qui garantit aussi qu'elle a réellement été contrôlée.
