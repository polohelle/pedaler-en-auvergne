/** Listes fermées des actualités. */

export const TYPES_ACTU = ['article', 'breve'] as const;
export type TypeActu = (typeof TYPES_ACTU)[number];

export const LIBELLES_TYPE_ACTU = {
  article: 'Article',
  breve: 'Brève',
} as const satisfies Record<TypeActu, string>;

export const CATEGORIES_ACTU = [
  'amenagements',
  'sport',
  'evenements',
  'politique-velo',
  'filiere-economique',
] as const;
export type CategorieActu = (typeof CATEGORIES_ACTU)[number];

export const LIBELLES_CATEGORIE_ACTU = {
  amenagements: 'Aménagements',
  sport: 'Sport',
  evenements: 'Événements',
  'politique-velo': 'Politique vélo',
  'filiere-economique': 'Filière économique',
} as const satisfies Record<CategorieActu, string>;

export const PORTEES = ['local', 'auvergne', 'national'] as const;
export type Portee = (typeof PORTEES)[number];

export const LIBELLES_PORTEE = {
  local: 'Local',
  auvergne: 'Auvergne',
  national: 'National',
} as const satisfies Record<Portee, string>;
