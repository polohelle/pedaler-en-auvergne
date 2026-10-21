/** Listes fermées de l'annuaire des acteurs. */

export const CATEGORIES_ACTEUR = [
  'magasin',
  'reparateur',
  'loueur',
  'atelier-participatif',
  'velo-ecole',
  'association-usagers',
  'club-sportif',
  'entreprise-a-velo',
  'tourisme',
  'collectivite',
] as const;
export type CategorieActeur = (typeof CATEGORIES_ACTEUR)[number];

export const LIBELLES_CATEGORIE_ACTEUR = {
  magasin: 'Magasin',
  reparateur: 'Réparateur',
  loueur: 'Loueur',
  'atelier-participatif': 'Atelier participatif',
  'velo-ecole': 'Vélo-école',
  'association-usagers': "Association d'usagers",
  'club-sportif': 'Club sportif',
  'entreprise-a-velo': 'Entreprise à vélo',
  tourisme: 'Tourisme',
  collectivite: 'Collectivité',
} as const satisfies Record<CategorieActeur, string>;

/**
 * Catégories de la section « Associations et clubs » de l'annuaire, dans l'ordre de ses
 * sous-sections ; les autres catégories forment la section « Commerces et services ».
 */
export const CATEGORIES_ASSOCIATIVES = [
  'club-sportif',
  'association-usagers',
  'atelier-participatif',
  'velo-ecole',
] as const satisfies readonly CategorieActeur[];
export type CategorieAssociative = (typeof CATEGORIES_ASSOCIATIVES)[number];

/** Intitulés des sous-sections « Associations et clubs », au pluriel. */
export const LIBELLES_CATEGORIE_ASSOCIATIVE = {
  'club-sportif': 'Clubs sportifs',
  'association-usagers': "Associations d'usagers",
  'atelier-participatif': 'Ateliers participatifs',
  'velo-ecole': 'Vélo-écoles',
} as const satisfies Record<CategorieAssociative, string>;

/** Disciplines pratiquées par un club, d'après sa fédération (FFC, FFVélo…). */
export const DISCIPLINES = ['route', 'gravel', 'vtt', 'cyclo-cross', 'piste', 'bmx'] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const LIBELLES_DISCIPLINE = {
  route: 'Route',
  gravel: 'Gravel',
  vtt: 'VTT',
  'cyclo-cross': 'Cyclo-cross',
  piste: 'Piste',
  bmx: 'BMX',
} as const satisfies Record<Discipline, string>;

/** Collèges de l'association ; renseigné seulement pour les membres. */
export const COLLEGES = [
  'commerce-reparation',
  'entreprises-a-velo',
  'usagers',
  'sport-loisir',
  'partenaires',
] as const;
export type College = (typeof COLLEGES)[number];

export const LIBELLES_COLLEGE = {
  'commerce-reparation': 'Commerce et réparation',
  'entreprises-a-velo': 'Entreprises à vélo',
  usagers: 'Usagers',
  'sport-loisir': 'Sport et loisir',
  partenaires: 'Partenaires',
} as const satisfies Record<College, string>;

/**
 * Services proposés, utilisés comme filtres. Les activités des entreprises à vélo
 * (livraison, cyclologistique, artisanat) sont des services plutôt que des catégories.
 */
export const SERVICES = [
  'vente-neuf',
  'occasion',
  'reparation',
  'reparation-toutes-marques',
  'vae',
  'velo-cargo',
  'velo-adapte',
  'location',
  'auto-reparation',
  'apprentissage',
  'livraison',
  'cyclologistique',
  'artisanat',
  'accueil-velo',
] as const;
export type Service = (typeof SERVICES)[number];

export const LIBELLES_SERVICE = {
  'vente-neuf': 'Vente de vélos neufs',
  occasion: "Vélos d'occasion",
  reparation: 'Réparation',
  'reparation-toutes-marques': 'Réparation toutes marques',
  vae: 'Vélo à assistance électrique',
  'velo-cargo': 'Vélo-cargo',
  'velo-adapte': 'Vélo adapté',
  location: 'Location',
  'auto-reparation': "Atelier d'auto-réparation",
  apprentissage: 'Apprentissage',
  livraison: 'Livraison à vélo',
  cyclologistique: 'Cyclologistique',
  artisanat: 'Artisan à vélo',
  'accueil-velo': 'Label Accueil Vélo',
} as const satisfies Record<Service, string>;

/** Origine d'une fiche acteur. */
export const ORIGINES_ACTEUR = ['osm', 'formulaire', 'agent', 'admin'] as const;
export type OrigineActeur = (typeof ORIGINES_ACTEUR)[number];

/**
 * Provenance du logo d'une structure (ADR 0031) : son propre site ou ses réseaux, un fichier
 * qu'elle a fourni, ou une licence libre (Wikimedia Commons, par exemple).
 */
export const ORIGINES_LOGO = ['site-structure', 'fourni-structure', 'licence-libre'] as const;
export type OrigineLogo = (typeof ORIGINES_LOGO)[number];

export const LIBELLES_ORIGINE_LOGO = {
  'site-structure': 'Logo repris du site de la structure',
  'fourni-structure': 'Logo fourni par la structure',
  'licence-libre': 'Logo sous licence libre',
} as const satisfies Record<OrigineLogo, string>;
