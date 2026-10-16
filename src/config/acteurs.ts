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
 * Droit de reprendre le logo d'une structure (ADR 0031) : son accord écrit, ou une licence
 * libre (Wikimedia Commons, par exemple). Sans l'un ou l'autre, la carte garde son monogramme.
 */
export const DROITS_LOGO = ['accord-structure', 'licence-libre'] as const;
export type DroitLogo = (typeof DROITS_LOGO)[number];

export const LIBELLES_DROITS_LOGO = {
  'accord-structure': "Logo reproduit avec l'accord de la structure",
  'licence-libre': 'Logo sous licence libre',
} as const satisfies Record<DroitLogo, string>;
