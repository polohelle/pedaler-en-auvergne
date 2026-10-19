/** Listes fermées de l'agenda. */

export const TYPES_EVENEMENT = [
  'sortie',
  'social-ride',
  'randonnee',
  'course',
  'bourse',
  'atelier-reparation',
  'formation',
  'conference',
  'fete-du-velo',
  'reunion-publique',
] as const;
export type TypeEvenement = (typeof TYPES_EVENEMENT)[number];

export const LIBELLES_TYPE_EVENEMENT = {
  sortie: 'Sortie',
  'social-ride': 'Social ride',
  randonnee: 'Randonnée',
  course: 'Course',
  bourse: 'Bourse aux vélos',
  'atelier-reparation': 'Atelier réparation',
  formation: 'Formation',
  conference: 'Conférence',
  'fete-du-velo': 'Fête du vélo',
  'reunion-publique': 'Réunion publique',
} as const satisfies Record<TypeEvenement, string>;

/**
 * Pratique du vélo d'un événement sportif, affichée en étiquette dans les listes pour repérer
 * d'un coup d'œil route, gravel, VTT ou cyclo-cross (ADR 0034). Facultative : une bourse ou une
 * conférence n'en a pas.
 */
export const PRATIQUES_EVENEMENT = ['route', 'gravel', 'vtt', 'cyclo-cross'] as const;
export type PratiqueEvenement = (typeof PRATIQUES_EVENEMENT)[number];

export const LIBELLES_PRATIQUE_EVENEMENT = {
  route: 'Route',
  gravel: 'Gravel',
  vtt: 'VTT',
  'cyclo-cross': 'Cyclo-cross',
} as const satisfies Record<PratiqueEvenement, string>;

/** Origine d'une fiche événement. */
export const ORIGINES_EVENEMENT = ['agent', 'formulaire', 'admin'] as const;
export type OrigineEvenement = (typeof ORIGINES_EVENEMENT)[number];
