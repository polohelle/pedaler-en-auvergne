/** Listes fermées du carnet de sources de veille (data/sources.yaml). */

export const TYPES_SOURCE = ['rss', 'page', 'agenda'] as const;
export type TypeSource = (typeof TYPES_SOURCE)[number];

export const NIVEAUX_SOURCE = ['local', 'regional', 'national'] as const;
export type NiveauSource = (typeof NIVEAUX_SOURCE)[number];

/** `inconnue` tant que le skill evaluer-source n'est pas passé. */
export const FIABILITES = ['inconnue', 'faible', 'moyenne', 'haute'] as const;
export type Fiabilite = (typeof FIABILITES)[number];

export const FREQUENCES = ['quotidienne', 'bihebdomadaire', 'hebdomadaire', 'mensuelle'] as const;
export type Frequence = (typeof FREQUENCES)[number];
