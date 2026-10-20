/**
 * Rubriques du site (ADR 0039) : chacune a sa couleur (jetons `--rubrique-<cle>` dans
 * `src/styles/tokens.css`) et son pictogramme, repris dans le menu, sur l'accueil et en tête
 * de ses pages, pour savoir d'un coup d'œil où l'on est.
 */
export const RUBRIQUES = [
  { cle: 'annuaire', href: '/annuaire/', libelle: 'Annuaire' },
  { cle: 'agenda', href: '/agenda/', libelle: 'Agenda' },
  { cle: 'itineraires', href: '/itineraires/', libelle: 'Itinéraires' },
  { cle: 'actus', href: '/actus/', libelle: 'Actus' },
] as const;
export type Rubrique = (typeof RUBRIQUES)[number]['cle'];
