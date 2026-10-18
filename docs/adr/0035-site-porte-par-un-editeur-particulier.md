# 0035 — Site porté par un éditeur particulier

- Statut : acceptée
- Date : 2026-10-17
- Remplace : [0028](0028-pages-association-provisoires.md)

## Contexte

Le cahier des charges prévoyait un site édité par l'association Pédaler en Auvergne, avec une
rubrique association (charte, gouvernance par collèges, membres, adhésion et dons HelloAsso).
L'administrateur a décidé de porter le site seul pour l'instant : l'association n'est pas créée,
et sans elle il n'y a ni adhésion, ni dons, ni membres.

## Décision

- La rubrique `/association/` est retirée. Une page **À propos** (`/a-propos/`) présente le
  site, ses règles éditoriales (neutralité, sources citées, données professionnelles seulement,
  validation humaine, corrections sous 7 jours) et le contact. `public/_redirects` renvoie les
  anciennes adresses `/association/…` vers elle (301).
- Les mentions légales désignent un éditeur particulier, non professionnel et bénévole, qui use
  de la faculté de la LCEN de ne pas publier son identité après l'avoir communiquée à
  l'hébergeur. Il est responsable de traitement des données des formulaires.
  `src/config/editeur.ts` remplace `src/config/association.ts`.
- Le badge « membre » n'est plus affiché (fiche, liste, carte). Les champs `membre` et
  `college` restent dans le schéma des acteurs, à `false` et absent, pour ne pas reprendre le
  modèle de données si l'association est créée.

## Conséquences

- Créer plus tard l'association demandera de rétablir une rubrique (l'historique Git garde
  celle de l'ADR 0028), de remplir l'éditeur et de réafficher le badge.
- Le projet de statuts et de charte reste disponible hors du dépôt, en pause.
