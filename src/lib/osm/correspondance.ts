/** Conversion d'un élément OpenStreetMap en fiche acteur brouillon minimale. */
import type { CategorieActeur } from '@config/acteurs';
import type { CodeDepartement } from '@config/departements';
import { schemaActeur, type ActeurSaisi } from '@schemas/acteur';
import { z } from 'astro/zod';
import { slugifier } from '../slug';

/** Réponse de l'API Overpass, validée avant usage : c'est une donnée externe. */
export const schemaReponseOverpass = z.object({
  elements: z.array(
    z.object({
      type: z.enum(['node', 'way', 'relation']),
      id: z.number().int().positive(),
      lat: z.number().optional(),
      lon: z.number().optional(),
      center: z.object({ lat: z.number(), lon: z.number() }).optional(),
      tags: z.record(z.string(), z.string()).optional(),
    }),
  ),
});

export type ElementOsm = z.infer<typeof schemaReponseOverpass>['elements'][number];

export type Correspondance = { ok: true; acteur: ActeurSaisi } | { ok: false; motif: string };

const EXCLUS: Record<string, readonly string[]> = {
  amenity: ['bicycle_repair_station', 'bicycle_parking', 'compressed_air'],
};

function oui(valeur: string | undefined): boolean {
  return valeur === 'yes' || valeur === 'only';
}

/** Catégories de l'annuaire déduites des tags vélo d'un objet OSM. */
export function categoriesOsm(tags: Record<string, string>): CategorieActeur[] {
  const vente =
    tags.shop === 'bicycle' ||
    oui(tags['service:bicycle:retail']) ||
    oui(tags['service:bicycle:second_hand']);
  const reparation = oui(tags['service:bicycle:repair']);
  const location =
    oui(tags['service:bicycle:rental']) ||
    (tags.amenity === 'bicycle_rental' && tags.bicycle_rental === 'shop');

  const categories: CategorieActeur[] = [];
  if (vente) categories.push('magasin');
  if (reparation) categories.push('reparateur');
  if (location) categories.push('loueur');
  return categories;
}

/** `nom-commune`, sans répéter la commune si le nom la contient déjà (« Vélo Riom » à Riom). */
export function slugActeur(nom: string, commune: string): string {
  const base = slugifier(nom);
  const suffixe = slugifier(commune);
  const contient = `-${base}-`.includes(`-${suffixe}-`);
  return suffixe === '' || contient ? base : `${base}-${suffixe}`;
}

/**
 * Brouillon minimal (ADR 0019) : nom, catégories, commune, département, identifiant OSM.
 * Adresse, coordonnées, horaires et contacts ne sont pas repris : le dépôt est public et ils
 * peuvent être ceux d'un artisan travaillant à domicile ; ils sont saisis à la vérification.
 */
export function versActeur(element: ElementOsm, departement: CodeDepartement): Correspondance {
  const tags = element.tags ?? {};
  const osmId = `${element.type}/${String(element.id)}`;

  for (const [cle, valeurs] of Object.entries(EXCLUS)) {
    const valeur = tags[cle];
    if (valeur !== undefined && valeurs.includes(valeur)) {
      return { ok: false, motif: `${osmId} : ${cle}=${valeur} n'est pas un acteur.` };
    }
  }
  const nom = tags.name?.trim();
  if (nom === undefined || nom === '') {
    return { ok: false, motif: `${osmId} : sans nom.` };
  }
  const categories = categoriesOsm(tags);
  if (categories.length === 0) {
    return { ok: false, motif: `${osmId} : aucune activité vélo reconnue.` };
  }
  const commune = tags['addr:city']?.trim();
  if (commune === undefined || commune === '') {
    return { ok: false, motif: `${osmId} (${nom}) : commune introuvable.` };
  }

  const acteur: ActeurSaisi = {
    nom,
    slug: slugActeur(nom, commune),
    categories,
    commune,
    departement,
    source: 'osm',
    osm_id: osmId,
    statut: 'brouillon',
  };
  const verification = schemaActeur.safeParse(acteur);
  if (!verification.success) {
    const detail = verification.error.issues.map((issue) => issue.message).join(' ; ');
    return { ok: false, motif: `${osmId} (${nom}) : ${detail}` };
  }
  return { ok: true, acteur };
}
