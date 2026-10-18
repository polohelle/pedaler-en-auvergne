/**
 * Listes fermées des itinéraires (ADR 0036) : une carte unique de tous les parcours route,
 * gravel et VTT du secteur, filtrable par ces critères.
 */
import type { PratiqueEvenement } from './evenements';

/** Mêmes valeurs et mêmes étiquettes de couleur que les pratiques des événements (ADR 0034). */
export const PRATIQUES_ITINERAIRE = [
  'route',
  'gravel',
  'vtt',
] as const satisfies readonly PratiqueEvenement[];
export type PratiqueItineraire = (typeof PRATIQUES_ITINERAIRE)[number];

export const LIBELLES_PRATIQUE_ITINERAIRE = {
  route: 'Route',
  gravel: 'Gravel',
  vtt: 'VTT',
} as const satisfies Record<PratiqueItineraire, string>;

/**
 * Difficulté, sur le modèle du balisage VTT de la FFC (vert, bleu, rouge, noir) : la cotation
 * de la source quand elle existe, sinon la grille du skill rediger-itineraire.
 */
export const DIFFICULTES = ['facile', 'moyen', 'difficile', 'tres-difficile'] as const;
export type Difficulte = (typeof DIFFICULTES)[number];

export const LIBELLES_DIFFICULTE = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
  'tres-difficile': 'Très difficile',
} as const satisfies Record<Difficulte, string>;

export const FORMES = ['boucle', 'aller-retour', 'aller-simple'] as const;
export type Forme = (typeof FORMES)[number];

export const LIBELLES_FORME = {
  boucle: 'Boucle',
  'aller-retour': 'Aller-retour',
  'aller-simple': 'Aller simple',
} as const satisfies Record<Forme, string>;

/**
 * Licences qui autorisent la reprise et la rediffusion d'une trace, avec attribution. Une
 * trace sans l'une d'elles n'est pas reprise : on renvoie vers sa source (cahier des charges,
 * « agréger plutôt que refaire »). `autorisation` : accord écrit de l'auteur, cité dans la PR.
 */
export const LICENCES_TRACE = [
  'licence-ouverte',
  'odbl',
  'cc0',
  'cc-by',
  'cc-by-sa',
  'autorisation',
] as const;
export type LicenceTrace = (typeof LICENCES_TRACE)[number];

export const LICENCES = {
  'licence-ouverte': {
    libelle: 'Licence Ouverte 2.0 (Etalab)',
    url: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
  },
  odbl: { libelle: 'ODbL 1.0', url: 'https://opendatacommons.org/licenses/odbl/1-0/' },
  cc0: { libelle: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/deed.fr' },
  'cc-by': { libelle: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/deed.fr' },
  'cc-by-sa': {
    libelle: 'CC BY-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.fr',
  },
  autorisation: { libelle: 'Reprise autorisée par l’auteur', url: null },
} as const satisfies Record<LicenceTrace, { libelle: string; url: string | null }>;

/** Origine d'une fiche itinéraire. */
export const ORIGINES_ITINERAIRE = ['agent', 'admin'] as const;
export type OrigineItineraire = (typeof ORIGINES_ITINERAIRE)[number];

/** Tranches des filtres de distance (km) et de dénivelé positif (m) : bornes [min, max[. */
export interface Tranche {
  valeur: string;
  libelle: string;
  min: number;
  max: number;
}

export const TRANCHES_DISTANCE = [
  { valeur: 'moins-de-30', libelle: 'Moins de 30 km', min: 0, max: 30 },
  { valeur: '30-60', libelle: '30 à 60 km', min: 30, max: 60 },
  { valeur: '60-100', libelle: '60 à 100 km', min: 60, max: 100 },
  { valeur: 'plus-de-100', libelle: 'Plus de 100 km', min: 100, max: Infinity },
] as const satisfies readonly Tranche[];

export const TRANCHES_DENIVELE = [
  { valeur: 'moins-de-500', libelle: 'Moins de 500 m', min: 0, max: 500 },
  { valeur: '500-1000', libelle: '500 à 1 000 m', min: 500, max: 1000 },
  { valeur: '1000-2000', libelle: '1 000 à 2 000 m', min: 1000, max: 2000 },
  { valeur: 'plus-de-2000', libelle: 'Plus de 2 000 m', min: 2000, max: Infinity },
] as const satisfies readonly Tranche[];

/** Écart maximal entre départ et arrivée d'une boucle, en mètres. */
export const ECART_MAX_BOUCLE_M = 1000;

/** Tolérance de simplification des traces de la carte d'ensemble, en mètres. */
export const TOLERANCE_SIMPLIFICATION_M = 15;
