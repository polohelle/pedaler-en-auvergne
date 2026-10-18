/**
 * Trace d'un itinéraire à partir d'une relation OpenStreetMap (`route=bicycle` ou `route=mtb`,
 * licence ODbL — ADR 0036), lue par l'API OSM (`/relation/<id>/full.json`). Les chemins de la
 * relation sont mis bout à bout dans leur ordre, retournés au besoin ; une rupture de
 * continuité ouvre un nouveau segment.
 */
import { z } from 'astro/zod';
import { ECART_MAX_BOUCLE_M } from '@config/itineraires';
import { distanceM, type PointTrace, type Trace } from '@lib/gpx';

const schemaElement = z.discriminatedUnion('type', [
  z.object({ type: z.literal('node'), id: z.number(), lat: z.number(), lon: z.number() }),
  z.object({ type: z.literal('way'), id: z.number(), nodes: z.array(z.number()) }),
  z.object({
    type: z.literal('relation'),
    id: z.number(),
    members: z.array(z.object({ type: z.string(), ref: z.number(), role: z.string() })),
    tags: z.record(z.string(), z.string()).default({}),
  }),
]);

export const schemaRelationComplete = z.object({ elements: z.array(schemaElement) });

export interface RelationItineraire {
  id: number;
  tags: Record<string, string>;
  trace: Trace;
}

/** Rôles des membres qui ne font pas partie du tracé (variantes, accès, points). */
const ROLES_ECARTES = new Set(['alternative', 'excursion', 'approach', 'connection']);

/** Met bout à bout des suites de nœuds ; chaque rupture ouvre un nouveau segment. */
export function chainer(chemins: readonly (readonly number[])[]): number[][] {
  const segments: number[][] = [];
  let courant: number[] = [];
  for (const chemin of chemins) {
    if (chemin.length < 2) continue;
    const debut = chemin[0];
    const fin = chemin.at(-1);
    const dernier = courant.at(-1);
    if (courant.length === 0) {
      courant = [...chemin];
    } else if (dernier === debut) {
      courant.push(...chemin.slice(1));
    } else if (dernier === fin) {
      courant.push(...[...chemin].reverse().slice(1));
    } else if (courant[0] === debut || courant[0] === fin) {
      // Le premier chemin du segment était à l'envers : on le retourne, puis on enchaîne.
      courant.reverse();
      courant.push(...(courant.at(-1) === debut ? chemin : [...chemin].reverse()).slice(1));
    } else {
      segments.push(courant);
      courant = [...chemin];
    }
  }
  if (courant.length > 0) segments.push(courant);
  return raccorder(segments);
}

/**
 * Raccorde les segments qui se touchent par une extrémité, quel que soit leur ordre dans la
 * relation : les membres d'une relation sont souvent mal ordonnés.
 */
export function raccorder(segments: readonly number[][]): number[][] {
  const restants = segments.map((segment) => [...segment]);
  const resultat: number[][] = [];
  for (let courant = restants.shift(); courant !== undefined; courant = restants.shift()) {
    for (let suite = true; suite;) {
      suite = false;
      const fin = courant.at(-1);
      const debut = courant[0];
      const i = restants.findIndex((s) => s[0] === fin || s.at(-1) === fin);
      if (i !== -1) {
        const [autre = []] = restants.splice(i, 1);
        courant.push(...(autre[0] === fin ? autre : autre.reverse()).slice(1));
        suite = true;
        continue;
      }
      const j = restants.findIndex((s) => s[0] === debut || s.at(-1) === debut);
      if (j !== -1) {
        const [autre = []] = restants.splice(j, 1);
        courant.splice(0, 1, ...(autre.at(-1) === debut ? autre : autre.reverse()));
        suite = true;
      }
    }
    resultat.push(courant);
  }
  return resultat;
}

/** Écart maximal comblé entre deux segments (carrefour, chaussées séparées), en mètres. */
export const ECART_SOUDURE_M = 100;

interface Proche {
  indice: number;
  ecart: number;
  inverser: boolean;
}

function lePlusProche(
  point: PointTrace,
  segments: readonly PointTrace[][],
  versDebut: boolean,
): Proche | undefined {
  let meilleur: Proche | undefined;
  for (const [indice, segment] of segments.entries()) {
    const [premier, dernier] = [segment[0], segment.at(-1)];
    if (premier === undefined || dernier === undefined) continue;
    // Vers la fin : on accroche le début du segment (ou sa fin, en l'inversant), et l'inverse.
    for (const [extremite, inverser] of [
      [premier, versDebut],
      [dernier, !versDebut],
    ] as const) {
      const ecart = distanceM(point, extremite);
      if (meilleur === undefined || ecart < meilleur.ecart) meilleur = { indice, ecart, inverser };
    }
  }
  return meilleur;
}

/**
 * Soude les segments séparés de moins de `toleranceM` en un tracé continu, en reliant à
 * chaque fois l'extrémité la plus proche : une relation passe souvent par un carrefour ou une
 * chaussée séparée sans nœud commun.
 */
export function souder(trace: Trace, toleranceM = ECART_SOUDURE_M): Trace {
  const restants = trace.map((segment) => [...segment]);
  const resultat: Trace = [];
  for (let courant = restants.shift(); courant !== undefined; courant = restants.shift()) {
    for (let suite = true; suite;) {
      suite = false;
      const fin = courant.at(-1);
      const apres = fin === undefined ? undefined : lePlusProche(fin, restants, false);
      if (apres !== undefined && apres.ecart <= toleranceM) {
        const [autre = []] = restants.splice(apres.indice, 1);
        courant.push(...(apres.inverser ? autre.reverse() : autre));
        suite = true;
        continue;
      }
      const debut = courant[0];
      const avant = debut === undefined ? undefined : lePlusProche(debut, restants, true);
      if (avant !== undefined && avant.ecart <= toleranceM) {
        const [autre = []] = restants.splice(avant.indice, 1);
        courant.unshift(...(avant.inverser ? autre.reverse() : autre));
        suite = true;
      }
    }
    resultat.push(courant);
  }
  return resultat;
}

/**
 * Fait partir une boucle d'un seul segment du point le plus proche de `point` (le départ
 * officiel, souvent le bourg) : l'ordre des chemins d'une relation ne dit rien du départ.
 * Une trace en plusieurs segments, ou qui n'est pas une boucle, est rendue telle quelle.
 */
export function partirDe(trace: Trace, point: PointTrace): Trace {
  const [segment] = trace;
  const [premier, dernier] = [segment?.[0], segment?.at(-1)];
  if (trace.length !== 1 || segment === undefined || premier === undefined || dernier === undefined)
    return trace;
  if (distanceM(premier, dernier) > ECART_MAX_BOUCLE_M) return trace;
  let indice = 0;
  for (const [i, candidat] of segment.entries()) {
    if (distanceM(candidat, point) < distanceM(segment[indice] ?? premier, point)) indice = i;
  }
  // Sans le dernier point (doublon du premier quand la boucle est fermée), puis on referme.
  const ouvert = distanceM(premier, dernier) === 0 ? segment.slice(0, -1) : segment;
  const tourne = [...ouvert.slice(indice), ...ouvert.slice(0, indice)];
  const [nouveauDepart] = tourne;
  return nouveauDepart === undefined ? trace : [[...tourne, nouveauDepart]];
}

export function relationItineraire(reponse: unknown, id: number): RelationItineraire {
  const { elements } = schemaRelationComplete.parse(reponse);
  const noeuds = new Map<number, PointTrace>();
  const chemins = new Map<number, number[]>();
  let relation: Extract<z.output<typeof schemaElement>, { type: 'relation' }> | undefined;
  for (const element of elements) {
    if (element.type === 'node') noeuds.set(element.id, { lat: element.lat, lon: element.lon });
    else if (element.type === 'way') chemins.set(element.id, element.nodes);
    else if (element.id === id) relation = element;
  }
  if (relation === undefined) throw new Error(`Relation ${String(id)} absente de la réponse.`);
  const ordonnes = relation.members
    .filter((m) => m.type === 'way' && !ROLES_ECARTES.has(m.role))
    .flatMap((m) => {
      const chemin = chemins.get(m.ref);
      return chemin === undefined ? [] : [chemin];
    });
  const trace = chainer(ordonnes).map((segment) =>
    segment.flatMap((ref) => {
      const point = noeuds.get(ref);
      return point === undefined ? [] : [point];
    }),
  );
  return {
    id,
    tags: relation.tags,
    trace: souder(trace.filter((segment) => segment.length >= 2)),
  };
}
