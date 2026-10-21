# 0040 — Section « Associations et clubs » de l'annuaire

- Statut : acceptée
- Date : 2026-10-21
- Complète : 0025 (fiches sans adresse publique)

## Contexte

L'administrateur veut que l'annuaire recense toutes les associations et tous les clubs autour du
vélo : clubs sportifs (FFC, FFVélo…), associations d'usagers, ateliers participatifs,
vélo-écoles. Jusqu'ici, l'annuaire était une seule liste où ces structures se perdaient parmi les
magasins. Les clubs n'ont, pour la plupart, ni local d'accueil ni adresse publique : le siège
déclaré à leur fédération est souvent le domicile d'un dirigeant.

## Décision

- La page `/annuaire/` a **deux sections** : « Commerces et services » et « Associations et
  clubs », avec un sommaire en tête de page. La seconde est découpée en sous-sections selon
  `CATEGORIES_ASSOCIATIVES` (`src/config/acteurs.ts`) : clubs sportifs, associations d'usagers,
  ateliers participatifs, vélo-écoles. Une fiche n'y figure qu'une fois, sous la première
  catégorie associative de sa fiche, pour ne pas répéter de liens sur la page ; ses autres
  catégories restent visibles en étiquettes (`sectionsAnnuaire`, `src/lib/annuaire.ts`).
- Champ facultatif **`disciplines`** (route, gravel, VTT, cyclo-cross, piste, BMX) pour les clubs,
  affiché en étiquettes sur la carte et la fiche, aux couleurs des pratiques de l'agenda (ADR 0034) quand elles existent.
- Champ facultatif **`source_url`**, **obligatoire pour une fiche `source: agent`** : la page où
  l'information a été vérifiée (annuaire de fédération, réseau FUB). La fiche l'affiche.
- Les clubs sont publiés **sans adresse publique** (ADR 0025), avec leur commune et leur site.
  Quand le nom du club cite une ville et que le siège déclaré à la fédération est ailleurs
  (souvent chez un dirigeant), la fiche retient la ville du nom ; ni nom, ni téléphone, ni adresse électronique personnelle de dirigeant,
  même quand la fédération les publie.
- Sources de la collecte initiale (Puy-de-Dôme) : liste des clubs de la FFC (velo.ffc.fr),
  carte des clubs de la FFVélo (veloenfrance.fr), réseau des associations de la FUB (fub.fr).

## Conséquences

- Les clubs n'ont pas de point sur la carte ; la liste reste la référence complète.
- La commune d'un club est donc celle où il est connu, pas forcément celle de son siège légal ;
  elle se corrige sur signalement du club.
- Les fiches des clubs sont à revérifier chaque saison (affiliations annuelles) par l'agent de
  maintenance de l'annuaire. Les autres départements suivront à leur ouverture.
