/**
 * Import des acteurs vélo d'OpenStreetMap en fiches « brouillon » (source: osm).
 *
 *   pnpm import:osm                      département 63, écrit les fiches
 *   pnpm import:osm --dry-run            affiche le plan sans rien écrire
 *   pnpm import:osm --departement 03     autre département couvert
 *   pnpm import:osm --entree rep.json    rejoue une réponse Overpass enregistrée
 *   pnpm import:osm --sans-ban           sans géocodage inverse des objets sans adresse
 *   pnpm import:osm --overpass <url>     autre instance Overpass si la principale sature
 *
 * Les brouillons sont minimaux (nom, catégories, commune, département, osm_id — ADR 0019) :
 * adresse, coordonnées et contacts sont saisis à la vérification humaine, avant publication.
 * Les fiches existantes (même osm_id) ne sont jamais modifiées. La logique est dans
 * src/lib/osm/ ; ce script ne fait que lire les arguments, appeler l'API et écrire.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { CODES_DEPARTEMENT, type CodeDepartement } from '@config/departements';
import { SITE } from '@config/site';
import { communeDuGeocodageInverse, urlGeocodageInverse, type Commune } from '@lib/ban';
import { lireMarkdown } from '@lib/frontmatter';
import { schemaUrl } from '@schemas/communs';
import { schemaReponseOverpass } from '@lib/osm/correspondance';
import { aGeocoder, planifierImport, type Existants, type PlanImport } from '@lib/osm/import';
import { requeteOverpass } from '@lib/osm/requete';

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const DOSSIER_ACTEURS = join(import.meta.dirname, '../src/content/acteurs');

export interface Options {
  departement: CodeDepartement;
  essai: boolean;
  /** Compléter commune et code postal par géocodage inverse (Base Adresse Nationale). */
  geocoder: boolean;
  /** Point d'accès de l'API Overpass. */
  overpass: string;
  entree?: string | undefined;
}

export interface Dependances {
  /** Envoie la requête Overpass et renvoie la réponse JSON brute. */
  interroger: (requete: string) => Promise<unknown>;
  /** Géocodage inverse BAN ; renvoie la réponse JSON brute. */
  geocoderInverse: (lat: number, lon: number) => Promise<unknown>;
  lireTexte: (chemin: string) => Promise<string>;
  lister: (dossier: string) => Promise<string[]>;
  /** Crée un fichier ; échoue s'il existe déjà. */
  creer: (chemin: string, contenu: string) => Promise<void>;
  journal: (ligne: string) => void;
}

export function analyserArguments(args: string[]): Options {
  const { values } = parseArgs({
    args,
    options: {
      departement: { type: 'string', default: '63' },
      'dry-run': { type: 'boolean', default: false },
      'sans-ban': { type: 'boolean', default: false },
      entree: { type: 'string' },
      overpass: { type: 'string', default: OVERPASS },
    },
    strict: true,
  });
  const departement = CODES_DEPARTEMENT.find((code) => code === values.departement);
  if (departement === undefined) {
    throw new Error(
      `Département inconnu : ${values.departement}. Attendu : ${CODES_DEPARTEMENT.join(', ')}.`,
    );
  }
  if (!schemaUrl.safeParse(values.overpass).success) {
    throw new Error(`Adresse Overpass invalide : ${values.overpass}`);
  }
  return {
    departement,
    essai: values['dry-run'],
    geocoder: !values['sans-ban'],
    overpass: values.overpass,
    entree: values.entree,
  };
}

async function existants(dossier: string, deps: Dependances): Promise<Existants> {
  const fichiers = (await deps.lister(dossier)).filter((nom) => nom.endsWith('.md'));
  const osmIds = new Set<string>();
  for (const nom of fichiers) {
    const { donnees } = lireMarkdown(await deps.lireTexte(join(dossier, nom)));
    const osmId = (donnees as { osm_id?: unknown } | null)?.osm_id;
    if (typeof osmId === 'string') osmIds.add(osmId);
  }
  return { slugs: new Set(fichiers.map((nom) => nom.slice(0, -'.md'.length))), osmIds };
}

export async function executer(
  options: Options,
  dossier: string,
  deps: Dependances,
): Promise<PlanImport> {
  const brut =
    options.entree === undefined
      ? await deps.interroger(requeteOverpass(options.departement))
      : (JSON.parse(await deps.lireTexte(options.entree)) as unknown);
  const { elements } = schemaReponseOverpass.parse(brut);
  const dejaLa = await existants(dossier, deps);
  const communes = new Map<string, Commune>();
  if (options.geocoder) {
    // Appels successifs : quelques dizaines d'objets, bien en deçà des limites du service.
    for (const { osmId, lat, lon } of aGeocoder(elements, dejaLa)) {
      const commune = communeDuGeocodageInverse(await deps.geocoderInverse(lat, lon));
      if (commune !== undefined) communes.set(osmId, commune);
    }
  }
  const plan = planifierImport(elements, dejaLa, options.departement, communes);

  if (!options.essai) {
    for (const { nomFichier, contenu } of plan.creations) {
      await deps.creer(join(dossier, nomFichier), contenu);
    }
  }

  const { journal } = deps;
  journal(
    `${String(elements.length)} objets OSM reçus pour le département ${options.departement}.`,
  );
  if (options.geocoder) {
    journal(`${String(communes.size)} commune(s) complétée(s) par la Base Adresse Nationale.`);
  }
  journal(
    `${String(plan.creations.length)} fiche(s) ${options.essai ? 'à créer (essai, rien écrit)' : 'créée(s) en brouillon'} :`,
  );
  for (const { nomFichier } of plan.creations) {
    journal(`  + ${nomFichier}`);
  }
  if (plan.creations.length > 0) {
    journal(
      'À compléter avant publication : adresse, code postal, coordonnées, description, verifie_le.',
    );
  }
  journal(
    `${String(plan.dejaPresents.length)} objet(s) déjà dans l'annuaire, laissé(s) intact(s).`,
  );
  journal(`${String(plan.ignores.length)} objet(s) ignoré(s) :`);
  for (const motif of plan.ignores) journal(`  - ${motif}`);
  return plan;
}

const USER_AGENT = `pedaler-en-auvergne-import-osm (+${SITE.depot})`;

async function lireJson(reponse: Response, service: string): Promise<unknown> {
  if (!reponse.ok) {
    throw new Error(`${service} a répondu ${String(reponse.status)} ${reponse.statusText}.`);
  }
  return reponse.json();
}

async function geocoderInverseBan(lat: number, lon: number): Promise<unknown> {
  const reponse = await fetch(urlGeocodageInverse(lat, lon), {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(20_000),
  });
  return lireJson(reponse, 'La Base Adresse Nationale');
}

async function interrogerOverpass(url: string, requete: string): Promise<unknown> {
  const reponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // La politique d'usage d'Overpass demande d'identifier le client.
      'User-Agent': USER_AGENT,
    },
    body: `data=${encodeURIComponent(requete)}`,
    signal: AbortSignal.timeout(180_000),
  });
  return lireJson(reponse, 'Overpass');
}

const estLanceDirectement =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (estLanceDirectement) {
  try {
    const options = analyserArguments(process.argv.slice(2));
    await executer(options, DOSSIER_ACTEURS, {
      interroger: (requete) => interrogerOverpass(options.overpass, requete),
      geocoderInverse: geocoderInverseBan,
      lireTexte: (chemin) => readFile(chemin, 'utf8'),
      lister: (dossier) => readdir(dossier),
      creer: (chemin, contenu) => writeFile(chemin, contenu, { flag: 'wx' }),
      journal: (ligne) => {
        console.log(ligne);
      },
    });
  } catch (erreur) {
    console.error(erreur instanceof Error ? erreur.message : erreur);
    process.exitCode = 1;
  }
}
