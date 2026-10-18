/**
 * Statuts de publication. Seuls les contenus `publie` sont affichés, à une exception
 * près : un événement `annule` reste visible, barré, jusqu'à sa date (voir src/lib/publication.ts).
 */

export const STATUTS_ACTEUR = ['brouillon', 'publie', 'archive'] as const;
export type StatutActeur = (typeof STATUTS_ACTEUR)[number];

export const STATUTS_EVENEMENT = ['a_valider', 'publie', 'annule', 'archive'] as const;
export type StatutEvenement = (typeof STATUTS_EVENEMENT)[number];

export const STATUTS_ACTU = ['brouillon', 'publie', 'archive'] as const;
export type StatutActu = (typeof STATUTS_ACTU)[number];

export const STATUTS_ITINERAIRE = ['brouillon', 'publie', 'archive'] as const;
export type StatutItineraire = (typeof STATUTS_ITINERAIRE)[number];
