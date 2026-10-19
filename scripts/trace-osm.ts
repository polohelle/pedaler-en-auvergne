/**
 * Trace GPX d'un itinéraire à partir d'une relation OpenStreetMap (ADR 0036, skill
 * importer-trace) : chemins mis bout à bout, altitudes du RGE ALTI de l'IGN (Géoplateforme).
 *
 *   pnpm trace:osm <id-relation> <fichier.gpx> [--nom "…"] [--depart lat,lon] [--sans-altitude]
 *
 * `--depart` fait partir une boucle du point le plus proche (le bourg de départ officiel).
 *
 * Affiche ensuite les mesures (distance, dénivelé, boucle) et le nombre de segments : plus d'un
 * segment signale une relation incomplète ou mal ordonnée, à vérifier avant de publier.
 */
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { z } from 'astro/zod';
import { ecrireGpx, mesurerTrace, type Trace } from '@lib/gpx';
import { partirDe, relationItineraire } from '@lib/osm/relation';

const API_OSM = 'https://api.openstreetmap.org/api/0.6';
const API_ALTI = 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json';
/** Points par requête d'altitude, pour garder des adresses de taille raisonnable. */
const LOT = 100;

const schemaAltitudes = z.object({ elevations: z.array(z.number()) });

async function json(url: string): Promise<unknown> {
  const reponse = await fetch(url, { headers: { 'User-Agent': 'pedaler-en-auvergne' } });
  if (!reponse.ok) throw new Error(`${url} : HTTP ${String(reponse.status)}`);
  return reponse.json();
}

async function ajouterAltitudes(trace: Trace): Promise<Trace> {
  const points = trace.flat();
  const altitudes: number[] = [];
  for (let i = 0; i < points.length; i += LOT) {
    const lot = points.slice(i, i + LOT);
    const parametres = new URLSearchParams({
      lon: lot.map((p) => p.lon.toFixed(6)).join('|'),
      lat: lot.map((p) => p.lat.toFixed(6)).join('|'),
      resource: 'ign_rge_alti_wld',
      delimiter: '|',
      zonly: 'true',
    });
    const { elevations } = schemaAltitudes.parse(await json(`${API_ALTI}?${parametres}`));
    altitudes.push(...elevations);
  }
  let i = 0;
  return trace.map((segment) =>
    segment.map((point) => {
      const ele = altitudes[i];
      i += 1;
      // Le service renvoie -99999 hors couverture.
      return { ...point, ele: ele !== undefined && ele > -1000 ? ele : undefined };
    }),
  );
}

async function principal(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      nom: { type: 'string' },
      depart: { type: 'string' },
      'sans-altitude': { type: 'boolean', default: false },
    },
  });
  const [idTexte, fichier] = positionals;
  const id = Number(idTexte);
  if (!Number.isInteger(id) || fichier === undefined) {
    throw new Error('Usage : pnpm trace:osm <id-relation> <fichier.gpx> [--nom "…"]');
  }
  const relation = relationItineraire(
    await json(`${API_OSM}/relation/${String(id)}/full.json`),
    id,
  );
  const [lat, lon] = (values.depart ?? '').split(',').map(Number);
  const tracee =
    lat !== undefined && lon !== undefined && Number.isFinite(lat) && Number.isFinite(lon)
      ? partirDe(relation.trace, { lat, lon })
      : relation.trace;
  const trace = values['sans-altitude'] ? tracee : await ajouterAltitudes(tracee);
  const nom = values.nom ?? relation.tags.name ?? `Relation ${String(id)}`;
  await writeFile(fichier, ecrireGpx(nom, trace, 'contributeurs OpenStreetMap'));
  const { distanceKm, deniveleM, boucle, depart } = mesurerTrace(trace);
  console.log(
    JSON.stringify({ id, nom, segments: trace.length, distanceKm, deniveleM, boucle, depart }),
  );
}

principal().catch((erreur: unknown) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  process.exitCode = 1;
});
