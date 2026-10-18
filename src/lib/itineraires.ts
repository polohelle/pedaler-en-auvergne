/**
 * Logique des itinéraires (ADR 0036) : contrôle d'une trace, lignes GeoJSON de la carte,
 * critères des filtres. Les filtres s'exécutent dans le navigateur (src/scripts/itineraires.ts)
 * sur les caractéristiques que la page pose en attributs `data-*` de chaque parcours.
 */
import {
  DIFFICULTES,
  FORMES,
  PRATIQUES_ITINERAIRE,
  TOLERANCE_SIMPLIFICATION_M,
  TRANCHES_DENIVELE,
  TRANCHES_DISTANCE,
  type Difficulte,
  type Forme,
  type PratiqueItineraire,
  type Tranche,
} from '@config/itineraires';
import { estEnAuvergne } from './geo';
import { lireGpx, mesurerTrace, simplifier, type MesuresTrace, type Trace } from './gpx';

/** Erreurs d'une trace : lisible, partant d'Auvergne, cohérente avec la forme déclarée. */
export function verifierTrace(source: string, forme: Forme): string[] {
  let mesures: MesuresTrace;
  try {
    mesures = mesurerTrace(lireGpx(source));
  } catch (erreur) {
    return [erreur instanceof Error ? erreur.message : String(erreur)];
  }
  const erreurs: string[] = [];
  const { depart, boucle } = mesures;
  if (!estEnAuvergne(depart.lat, depart.lon)) {
    erreurs.push('Départ de la trace hors d’Auvergne : latitude et longitude inversées ?');
  }
  if (forme === 'boucle' && !boucle) {
    erreurs.push('Forme « boucle », mais la trace ne revient pas à son point de départ.');
  }
  return erreurs;
}

/** Caractéristiques d'un parcours, celles sur lesquelles portent les filtres. */
export interface Caracteristiques {
  pratique: PratiqueItineraire;
  difficulte: Difficulte;
  forme: Forme;
  balise: boolean;
  commune: string;
  distanceKm: number;
  deniveleM?: number | undefined;
}

/** Caractéristiques d'une fiche, distance et dénivelé lus dans sa trace. */
export function caracteristiques(
  fiche: Pick<Caracteristiques, 'pratique' | 'difficulte' | 'forme' | 'balise' | 'commune'>,
  mesures: Pick<MesuresTrace, 'distanceKm' | 'deniveleM'>,
): Caracteristiques {
  const { pratique, difficulte, forme, balise, commune } = fiche;
  return {
    pratique,
    difficulte,
    forme,
    balise,
    commune,
    distanceKm: mesures.distanceKm,
    deniveleM: mesures.deniveleM,
  };
}

export interface ProprietesLigne extends Caracteristiques {
  id: string;
  titre: string;
  url: string;
}

export interface LigneItineraire {
  type: 'Feature';
  /** Coordonnées GeoJSON : longitude puis latitude, un tableau par segment. */
  geometry: { type: 'MultiLineString'; coordinates: [number, number][][] };
  properties: ProprietesLigne;
}

export interface CollectionLignes {
  type: 'FeatureCollection';
  features: LigneItineraire[];
}

/** Arrondi à 5 décimales, soit environ un mètre : assez pour une carte, bien plus léger. */
const arrondir = (degres: number) => Math.round(degres * 1e5) / 1e5;

export function ligneItineraire(
  proprietes: ProprietesLigne,
  trace: Trace,
  toleranceM = TOLERANCE_SIMPLIFICATION_M,
): LigneItineraire {
  return {
    type: 'Feature',
    geometry: {
      type: 'MultiLineString',
      coordinates: trace.map((segment) =>
        simplifier(segment, toleranceM).map(({ lat, lon }): [number, number] => [
          arrondir(lon),
          arrondir(lat),
        ]),
      ),
    },
    properties: proprietes,
  };
}

// --- Filtres ---------------------------------------------------------------------------------

export interface Criteres {
  /** Liste vide : toutes. */
  pratiques: PratiqueItineraire[];
  difficultes: Difficulte[];
  /** Valeur d'une tranche de `TRANCHES_DISTANCE`, ou chaîne vide pour toutes. */
  distance: string;
  denivele: string;
  boucle: boolean;
  balise: boolean;
  /** Commune de départ, ou chaîne vide pour toutes. */
  commune: string;
}

export const CRITERES_VIDES: Criteres = {
  pratiques: [],
  difficultes: [],
  distance: '',
  denivele: '',
  boucle: false,
  balise: false,
  commune: '',
};

function dansTranche(tranches: readonly Tranche[], valeur: string, mesure: number | undefined) {
  if (valeur === '') return true;
  const tranche = tranches.find((t) => t.valeur === valeur);
  return (
    tranche !== undefined && mesure !== undefined && mesure >= tranche.min && mesure < tranche.max
  );
}

export function correspond(parcours: Caracteristiques, criteres: Criteres): boolean {
  return (
    (criteres.pratiques.length === 0 || criteres.pratiques.includes(parcours.pratique)) &&
    (criteres.difficultes.length === 0 || criteres.difficultes.includes(parcours.difficulte)) &&
    dansTranche(TRANCHES_DISTANCE, criteres.distance, parcours.distanceKm) &&
    dansTranche(TRANCHES_DENIVELE, criteres.denivele, parcours.deniveleM) &&
    (!criteres.boucle || parcours.forme === 'boucle') &&
    (!criteres.balise || parcours.balise) &&
    (criteres.commune === '' || parcours.commune === criteres.commune)
  );
}

/** Lecture d'un formulaire ou d'une adresse (`URLSearchParams`), en ignorant l'inconnu. */
interface Parametres {
  get(nom: string): unknown;
  getAll(nom: string): unknown[];
}

function parmi<T extends string>(liste: readonly T[], valeurs: unknown[]): T[] {
  return liste.filter((valeur) => valeurs.includes(valeur));
}

function tranche(tranches: readonly Tranche[], valeur: unknown): string {
  return tranches.some((t) => t.valeur === valeur) ? (valeur as string) : '';
}

export function lireCriteres(parametres: Parametres, communes: readonly string[]): Criteres {
  const commune = parametres.get('commune');
  return {
    pratiques: parmi(PRATIQUES_ITINERAIRE, parametres.getAll('pratique')),
    difficultes: parmi(DIFFICULTES, parametres.getAll('difficulte')),
    distance: tranche(TRANCHES_DISTANCE, parametres.get('distance')),
    denivele: tranche(TRANCHES_DENIVELE, parametres.get('denivele')),
    boucle: parametres.get('boucle') === 'oui',
    balise: parametres.get('balise') === 'oui',
    commune: typeof commune === 'string' && communes.includes(commune) ? commune : '',
  };
}

/** Critères actifs, en paramètres d'adresse : la sélection se partage par un lien. */
export function ecrireCriteres(criteres: Criteres): URLSearchParams {
  const parametres = new URLSearchParams();
  for (const pratique of criteres.pratiques) parametres.append('pratique', pratique);
  for (const difficulte of criteres.difficultes) parametres.append('difficulte', difficulte);
  if (criteres.distance !== '') parametres.set('distance', criteres.distance);
  if (criteres.denivele !== '') parametres.set('denivele', criteres.denivele);
  if (criteres.boucle) parametres.set('boucle', 'oui');
  if (criteres.balise) parametres.set('balise', 'oui');
  if (criteres.commune !== '') parametres.set('commune', criteres.commune);
  return parametres;
}

/** Attributs `data-*` d'un parcours dans la liste, relus par `lireCaracteristiques`. */
export function attributsCaracteristiques(parcours: Caracteristiques): Record<string, string> {
  return {
    'data-pratique': parcours.pratique,
    'data-difficulte': parcours.difficulte,
    'data-forme': parcours.forme,
    'data-balise': parcours.balise ? 'oui' : 'non',
    'data-commune': parcours.commune,
    'data-distance': String(parcours.distanceKm),
    ...(parcours.deniveleM === undefined ? {} : { 'data-denivele': String(parcours.deniveleM) }),
  };
}

/** Relit les caractéristiques posées par `attributsCaracteristiques` (`element.dataset`). */
export function lireCaracteristiques(
  dataset: Readonly<Record<string, string | undefined>>,
): Caracteristiques | undefined {
  const pratique = PRATIQUES_ITINERAIRE.find((p) => p === dataset.pratique);
  const difficulte = DIFFICULTES.find((d) => d === dataset.difficulte);
  const forme = FORMES.find((f) => f === dataset.forme);
  const distanceKm = Number(dataset.distance);
  const deniveleM = dataset.denivele === undefined ? undefined : Number(dataset.denivele);
  if (
    pratique === undefined ||
    difficulte === undefined ||
    forme === undefined ||
    dataset.commune === undefined ||
    !Number.isFinite(distanceKm)
  ) {
    return undefined;
  }
  return {
    pratique,
    difficulte,
    forme,
    balise: dataset.balise === 'oui',
    commune: dataset.commune,
    distanceKm,
    deniveleM: deniveleM !== undefined && Number.isFinite(deniveleM) ? deniveleM : undefined,
  };
}

export function resumeFiltres(affiches: number, total: number): string {
  if (affiches === total) return `${String(total)} parcours affiché(s).`;
  return `${String(affiches)} parcours sur ${String(total)} correspondent aux filtres.`;
}

/** Distance et dénivelé en clair : « 42,5 km », « 850 m D+ ». */
export function formaterDistance(distanceKm: number): string {
  return `${distanceKm.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
}

export function formaterDenivele(deniveleM: number | undefined): string {
  return deniveleM === undefined ? 'non renseigné' : `${deniveleM.toLocaleString('fr-FR')} m D+`;
}
