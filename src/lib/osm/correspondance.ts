/** Conversion d'un élément OpenStreetMap en fiche acteur brouillon. */
import type { CategorieActeur, Service } from '@config/acteurs';
import type { CodeDepartement } from '@config/departements';
import { schemaActeur, type ActeurSaisi } from '@schemas/acteur';
import { schemaTelephone, schemaUrl } from '@schemas/communs';
import { z } from 'astro/zod';
import { departementDuCodePostal } from '../geo';
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

export type Correspondance =
  { ok: true; acteur: ActeurSaisi; manques: string[] } | { ok: false; motif: string };

const EXCLUS: Record<string, readonly string[]> = {
  amenity: ['bicycle_repair_station', 'bicycle_parking', 'compressed_air'],
};

const RESEAUX = ['contact:facebook', 'contact:instagram', 'contact:mastodon', 'contact:youtube'];

function oui(valeur: string | undefined): boolean {
  return valeur === 'yes' || valeur === 'only';
}

/** Première valeur d'un tag multiple (`a;b`), nettoyée. */
function premiere(valeur: string | undefined): string | undefined {
  const texte = valeur?.split(';')[0]?.trim();
  return texte === undefined || texte === '' ? undefined : texte;
}

function urlValide(valeur: string | undefined): string | undefined {
  const brute = premiere(valeur);
  if (brute === undefined) return undefined;
  const url = /^https?:\/\//i.test(brute) ? brute : `https://${brute}`;
  return schemaUrl.safeParse(url).success ? url : undefined;
}

function siValide(schema: z.ZodType<string>, valeur: string | undefined): string | undefined {
  const texte = premiere(valeur);
  return texte !== undefined && schema.safeParse(texte).success ? texte : undefined;
}

export function categoriesEtServices(tags: Record<string, string>): {
  categories: CategorieActeur[];
  services: Service[];
} {
  const vente = tags.shop === 'bicycle' || oui(tags['service:bicycle:retail']);
  const reparation = oui(tags['service:bicycle:repair']);
  const location =
    oui(tags['service:bicycle:rental']) ||
    (tags.amenity === 'bicycle_rental' && tags.bicycle_rental === 'shop');
  const occasion = oui(tags['service:bicycle:second_hand']);

  const categories: CategorieActeur[] = [];
  if (vente || occasion) categories.push('magasin');
  if (reparation) categories.push('reparateur');
  if (location) categories.push('loueur');

  const services: Service[] = [];
  if (oui(tags['service:bicycle:retail'])) services.push('vente-neuf');
  if (occasion) services.push('occasion');
  if (reparation) services.push('reparation');
  if (location) services.push('location');
  if (oui(tags['service:bicycle:diy'])) services.push('auto-reparation');
  return { categories, services };
}

/** `nom-commune`, sans répéter la commune si le nom la contient déjà (« Vélo Riom » à Riom). */
export function slugActeur(nom: string, commune: string | undefined): string {
  const base = slugifier(nom);
  const suffixe = slugifier(commune ?? '');
  const contient = `-${base}-`.includes(`-${suffixe}-`);
  return suffixe === '' || contient ? base : `${base}-${suffixe}`;
}

function adresse(tags: Record<string, string>): string | undefined {
  const rue = tags['addr:street'];
  if (rue === undefined) return undefined;
  const numero = tags['addr:housenumber'];
  return numero === undefined ? rue : `${numero} ${rue}`;
}

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
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (lat === undefined || lon === undefined) {
    return { ok: false, motif: `${osmId} : sans coordonnées.` };
  }
  const { categories, services } = categoriesEtServices(tags);
  if (categories.length === 0) {
    return { ok: false, motif: `${osmId} : aucune activité vélo reconnue.` };
  }

  const codePostal = tags['addr:postcode']?.trim();
  const codePostalValide =
    codePostal !== undefined && departementDuCodePostal(codePostal) === departement
      ? codePostal
      : undefined;
  const commune = tags['addr:city']?.trim();
  const reseaux = RESEAUX.map((cle) => urlValide(tags[cle])).filter(
    (url): url is string => url !== undefined,
  );

  const candidat = {
    nom,
    slug: slugActeur(nom, commune),
    categories,
    membre: false,
    adresse: adresse(tags),
    code_postal: codePostalValide,
    commune,
    departement,
    lat,
    lon,
    services: services.length > 0 ? services : undefined,
    horaires: premiere(tags.opening_hours),
    site: urlValide(tags.website ?? tags['contact:website']),
    email: siValide(z.email(), tags.email ?? tags['contact:email']),
    telephone: siValide(schemaTelephone, tags.phone ?? tags['contact:phone']),
    reseaux: reseaux.length > 0 ? reseaux : undefined,
    source: 'osm',
    osm_id: osmId,
    statut: 'brouillon',
  } as const;

  const acteur = Object.fromEntries(
    Object.entries(candidat).filter(([, valeur]) => valeur !== undefined),
  ) as ActeurSaisi;
  const verification = schemaActeur.safeParse(acteur);
  if (!verification.success) {
    const detail = verification.error.issues.map((issue) => issue.message).join(' ; ');
    return { ok: false, motif: `${osmId} (${nom}) : ${detail}` };
  }

  const manques = (['adresse', 'code_postal', 'commune'] as const).filter(
    (champ) => acteur[champ] === undefined,
  );
  return { ok: true, acteur, manques: [...manques, 'description', 'verifie_le'] };
}
