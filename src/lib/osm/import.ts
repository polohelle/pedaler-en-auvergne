/** Plan d'import : quelles fiches créer, lesquelles ignorer, sans rien écrire. */
import type { CodeDepartement } from '@config/departements';
import type { ActeurSaisi } from '@schemas/acteur';
import type { Commune } from '../ban';
import { departementDuCodePostal } from '../geo';
import { ecrireMarkdown } from '../frontmatter';
import { slugLibre } from '../slug';
import { versActeur, type ElementOsm } from './correspondance';

/** Ordre des champs dans le frontmatter, celui du cahier des charges. */
const ORDRE_CHAMPS = [
  'nom',
  'slug',
  'categories',
  'college',
  'membre',
  'adresse',
  'code_postal',
  'commune',
  'departement',
  'lat',
  'lon',
  'services',
  'horaires',
  'site',
  'email',
  'telephone',
  'reseaux',
  'source',
  'osm_id',
  'verifie_le',
  'statut',
] as const satisfies readonly (keyof ActeurSaisi)[];

export function ficheActeur(acteur: ActeurSaisi): string {
  const donnees: Record<string, unknown> = {};
  for (const champ of ORDRE_CHAMPS) {
    if (acteur[champ] !== undefined) donnees[champ] = acteur[champ];
  }
  return ecrireMarkdown(donnees, '');
}

export interface Existants {
  slugs: ReadonlySet<string>;
  osmIds: ReadonlySet<string>;
}

/** Objets à soumettre au géocodage inverse : sans commune dans OSM. */
export function aGeocoder(
  elements: readonly ElementOsm[],
  existants: Existants,
): { osmId: string; lat: number; lon: number }[] {
  return elements.flatMap((element) => {
    const osmId = `${element.type}/${String(element.id)}`;
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    const tags = element.tags ?? {};
    if (
      tags['addr:city'] !== undefined ||
      existants.osmIds.has(osmId) ||
      lat === undefined ||
      lon === undefined
    )
      return [];
    return [{ osmId, lat, lon }];
  });
}

/**
 * Ajoute aux tags OSM la commune trouvée par géocodage inverse si elle manque et qu'elle
 * relève bien du département importé.
 */
function completer(
  element: ElementOsm,
  commune: Commune | undefined,
  departement: CodeDepartement,
): ElementOsm {
  const tags = element.tags ?? {};
  if (
    commune === undefined ||
    tags['addr:city'] !== undefined ||
    departementDuCodePostal(commune.code_postal) !== departement
  ) {
    return element;
  }
  return { ...element, tags: { ...tags, 'addr:city': commune.commune } };
}

export interface PlanImport {
  creations: { nomFichier: string; contenu: string; nom: string }[];
  dejaPresents: string[];
  ignores: string[];
}

/**
 * Les objets déjà présents (même `osm_id`) ne sont jamais touchés : leur fiche a pu être
 * vérifiée et corrigée à la main. Les slugs en collision sont numérotés. `communes` complète,
 * par géocodage inverse, les objets sans adresse dans OSM.
 */
export function planifierImport(
  elements: readonly ElementOsm[],
  existants: Existants,
  departement: CodeDepartement,
  communes: ReadonlyMap<string, Commune> = new Map(),
): PlanImport {
  const plan: PlanImport = { creations: [], dejaPresents: [], ignores: [] };
  const slugsPris = new Set(existants.slugs);
  const osmVus = new Set(existants.osmIds);
  const tries = [...elements].sort((a, b) =>
    `${a.type}/${String(a.id)}`.localeCompare(`${b.type}/${String(b.id)}`),
  );

  for (const element of tries) {
    const osmId = `${element.type}/${String(element.id)}`;
    if (osmVus.has(osmId)) {
      plan.dejaPresents.push(osmId);
      continue;
    }
    const resultat = versActeur(completer(element, communes.get(osmId), departement), departement);
    if (!resultat.ok) {
      plan.ignores.push(resultat.motif);
      continue;
    }
    const slug = slugLibre(resultat.acteur.slug, slugsPris);
    slugsPris.add(slug);
    osmVus.add(osmId);
    const acteur = { ...resultat.acteur, slug };
    plan.creations.push({
      nomFichier: `${slug}.md`,
      contenu: ficheActeur(acteur),
      nom: acteur.nom,
    });
  }
  return plan;
}
