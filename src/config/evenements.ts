/** Listes fermées de l'agenda. */

export const TYPES_EVENEMENT = [
  'sortie',
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
  randonnee: 'Randonnée',
  course: 'Course',
  bourse: 'Bourse aux vélos',
  'atelier-reparation': 'Atelier réparation',
  formation: 'Formation',
  conference: 'Conférence',
  'fete-du-velo': 'Fête du vélo',
  'reunion-publique': 'Réunion publique',
} as const satisfies Record<TypeEvenement, string>;

/** Origine d'une fiche événement. */
export const ORIGINES_EVENEMENT = ['agent', 'formulaire', 'admin'] as const;
export type OrigineEvenement = (typeof ORIGINES_EVENEMENT)[number];
