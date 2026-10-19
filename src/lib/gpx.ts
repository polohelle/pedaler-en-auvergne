/**
 * Lecture et mesure des traces GPX des itinéraires (ADR 0036), sans dépendance : le format
 * GPX 1.1 est simple et ses points tiennent dans deux attributs et un élément `<ele>`.
 * Distance, dénivelé et forme sont calculés à partir de la trace plutôt que recopiés.
 */
import { ECART_MAX_BOUCLE_M } from '@config/itineraires';

export interface PointTrace {
  lat: number;
  lon: number;
  ele?: number | undefined;
}

/** Une trace : un ou plusieurs segments (une interruption du tracé sépare deux segments). */
export type Trace = PointTrace[][];

const SEGMENT = /<trkseg\b[^>]*>([\s\S]*?)<\/trkseg>/g;
const ROUTE = /<rte\b[^>]*>([\s\S]*?)<\/rte>/g;
const POINT = /<(trkpt|rtept)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;
const ELE = /<ele>\s*([^<]+?)\s*<\/ele>/;

function attribut(attributs: string, nom: string): number {
  const valeur = new RegExp(`\\b${nom}\\s*=\\s*["']([^"']+)["']`).exec(attributs)?.[1];
  const nombre = Number(valeur);
  if (valeur === undefined || !Number.isFinite(nombre)) {
    throw new Error(`Point GPX sans ${nom} valide.`);
  }
  return nombre;
}

function pointsDe(bloc: string): PointTrace[] {
  return [...bloc.matchAll(POINT)].map(([, , attributs = '', contenu = '']) => {
    const texte = ELE.exec(contenu)?.[1];
    const ele = texte === undefined ? NaN : Number(texte);
    return {
      lat: attribut(attributs, 'lat'),
      lon: attribut(attributs, 'lon'),
      ele: Number.isFinite(ele) ? ele : undefined,
    };
  });
}

/** Segments de la trace (`<trkseg>`), ou à défaut de la route (`<rte>`) d'un fichier GPX. */
export function lireGpx(source: string): Trace {
  if (!/<gpx\b/.test(source)) throw new Error('Fichier GPX attendu (élément <gpx> absent).');
  const blocs = [...source.matchAll(SEGMENT)];
  const segments = (blocs.length > 0 ? blocs : [...source.matchAll(ROUTE)])
    .map(([, contenu = '']) => pointsDe(contenu))
    .filter((segment) => segment.length > 0);
  if (segments.reduce((total, segment) => total + segment.length, 0) < 2) {
    throw new Error('Trace GPX vide : au moins deux points attendus.');
  }
  return segments;
}

const RAYON_TERRE_M = 6_371_000;
const RADIAN = Math.PI / 180;

/** Distance à vol d'oiseau entre deux points, en mètres (formule de haversine). */
export function distanceM(a: PointTrace, b: PointTrace): number {
  const dLat = (b.lat - a.lat) * RADIAN;
  const dLon = (b.lon - a.lon) * RADIAN;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RADIAN) * Math.cos(b.lat * RADIAN) * Math.sin(dLon / 2) ** 2;
  return 2 * RAYON_TERRE_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Seuil de dénivelé : une variation d'altitude n'est comptée qu'au-delà de ce seuil, ce qui
 * efface le bruit des altitudes GPS et des modèles de terrain.
 */
export const SEUIL_DENIVELE_M = 5;

/** Dénivelé positif cumulé d'un segment ; `undefined` sans altitudes. */
export function denivelePositifM(points: readonly PointTrace[]): number | undefined {
  const altitudes = points.flatMap(({ ele }) => (ele === undefined ? [] : [ele]));
  const [premiere] = altitudes;
  if (premiere === undefined || altitudes.length < 2) return undefined;
  let reference = premiere;
  let cumul = 0;
  for (const altitude of altitudes) {
    if (altitude - reference >= SEUIL_DENIVELE_M) {
      cumul += altitude - reference;
      reference = altitude;
    } else if (reference - altitude >= SEUIL_DENIVELE_M) {
      reference = altitude;
    }
  }
  return cumul;
}

export interface MesuresTrace {
  distanceKm: number;
  /** Arrondi à 10 m ; absent quand la trace n'a pas d'altitudes. */
  deniveleM?: number | undefined;
  depart: PointTrace;
  arrivee: PointTrace;
  /** Départ et arrivée à moins de `ECART_MAX_BOUCLE_M`. */
  boucle: boolean;
}

export function mesurerTrace(trace: Trace): MesuresTrace {
  const points = trace.flat();
  const depart = points[0];
  const arrivee = points.at(-1);
  if (depart === undefined || arrivee === undefined) throw new Error('Trace vide.');
  let metres = 0;
  let denivele: number | undefined;
  for (const segment of trace) {
    let precedent: PointTrace | undefined;
    for (const point of segment) {
      if (precedent !== undefined) metres += distanceM(precedent, point);
      precedent = point;
    }
    const d = denivelePositifM(segment);
    if (d !== undefined) denivele = (denivele ?? 0) + d;
  }
  return {
    distanceKm: Math.round(metres / 100) / 10,
    deniveleM: denivele === undefined ? undefined : Math.round(denivele / 10) * 10,
    depart,
    arrivee,
    boucle: distanceM(depart, arrivee) <= ECART_MAX_BOUCLE_M,
  };
}

/** Distance d'un point au segment [a, b], en mètres, en projection locale équirectangulaire. */
function ecartAuSegmentM(p: PointTrace, a: PointTrace, b: PointTrace): number {
  const kx = Math.cos(a.lat * RADIAN) * RADIAN * RAYON_TERRE_M;
  const ky = RADIAN * RAYON_TERRE_M;
  const [px, py] = [(p.lon - a.lon) * kx, (p.lat - a.lat) * ky];
  const [bx, by] = [(b.lon - a.lon) * kx, (b.lat - a.lat) * ky];
  const longueur2 = bx * bx + by * by;
  const t = longueur2 === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / longueur2));
  return Math.hypot(px - t * bx, py - t * by);
}

/**
 * Simplification de Douglas-Peucker : garde les points qui s'écartent de plus de `toleranceM`
 * du tracé simplifié. Allège la carte d'ensemble sans changer l'allure des parcours.
 */
export function simplifier(points: readonly PointTrace[], toleranceM: number): PointTrace[] {
  if (points.length <= 2) return [...points];
  const garder = new Array<boolean>(points.length).fill(false);
  garder[0] = true;
  garder[points.length - 1] = true;
  const pile: [number, number][] = [[0, points.length - 1]];
  for (let intervalle = pile.pop(); intervalle !== undefined; intervalle = pile.pop()) {
    const [debut, fin] = intervalle;
    const [a, b] = [points[debut], points[fin]];
    if (a === undefined || b === undefined) continue;
    let ecartMax = 0;
    let indice = -1;
    for (const [i, point] of points.slice(debut + 1, fin).entries()) {
      const ecart = ecartAuSegmentM(point, a, b);
      if (ecart > ecartMax) {
        ecartMax = ecart;
        indice = debut + 1 + i;
      }
    }
    if (indice !== -1 && ecartMax > toleranceM) {
      garder[indice] = true;
      pile.push([debut, indice], [indice, fin]);
    }
  }
  return points.filter((_, i) => garder[i]);
}

function echapperXml(texte: string): string {
  return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Écrit une trace en GPX 1.1 : coordonnées à 6 décimales, altitude au décimètre. */
export function ecrireGpx(nom: string, trace: Trace, auteur: string): string {
  const segments = trace.map((segment) => {
    const points = segment.map(({ lat, lon, ele }) => {
      const coordonnees = `lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}"`;
      return ele === undefined
        ? `      <trkpt ${coordonnees}/>`
        : `      <trkpt ${coordonnees}><ele>${ele.toFixed(1)}</ele></trkpt>`;
    });
    return ['    <trkseg>', ...points, '    </trkseg>'].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="Pédaler en Auvergne" xmlns="http://www.topografix.com/GPX/1/1">',
    `  <metadata><name>${echapperXml(nom)}</name><author><name>${echapperXml(auteur)}</name></author></metadata>`,
    '  <trk>',
    `    <name>${echapperXml(nom)}</name>`,
    ...segments,
    '  </trk>',
    '</gpx>',
    '',
  ].join('\n');
}
