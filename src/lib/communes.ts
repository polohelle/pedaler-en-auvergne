/**
 * Pages par commune « Pédaler à… » (ADR 0027) : identifiant d'URL, préposition et liste
 * des communes présentes dans les contenus publiés.
 */
import { slugifier } from './slug';

/** Commune qui a au moins un contenu publié. */
export interface Commune {
  slug: string;
  nom: string;
}

/**
 * Préposition et nom pour la marque : « à Riom », « au Cendre », « aux Martres-de-Veyre ».
 * Les articles « La » et « L' » restent dans le nom : « à La Bourboule ».
 */
export function lieuPedaler(commune: string): string {
  const nom = commune.trim();
  if (/^Le[ -]/.test(nom)) return `au ${nom.slice(3)}`;
  if (/^Les[ -]/.test(nom)) return `aux ${nom.slice(4)}`;
  return `à ${nom}`;
}

/**
 * Communes distinctes, dédoublonnées par identifiant (la première orthographe rencontrée
 * l'emporte) et triées dans l'ordre alphabétique français.
 */
export function listerCommunes(noms: Iterable<string>): Commune[] {
  const parSlug = new Map<string, Commune>();
  for (const brut of noms) {
    const nom = brut.trim();
    const slug = slugifier(nom);
    if (slug !== '' && !parSlug.has(slug)) parSlug.set(slug, { slug, nom });
  }
  return [...parSlug.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

/** Range des contenus par identifiant de commune, dans l'ordre reçu. */
export function regrouperParCommune<T>(
  entrees: Iterable<T>,
  communeDe: (entree: T) => string,
): Map<string, T[]> {
  const groupes = new Map<string, T[]>();
  for (const entree of entrees) {
    const slug = slugifier(communeDe(entree));
    const groupe = groupes.get(slug);
    if (groupe === undefined) groupes.set(slug, [entree]);
    else groupe.push(entree);
  }
  return groupes;
}

/** Résumé d'une commune dans l'index : « 3 acteurs », « 1 acteur, 2 événements à venir ». */
export function resumerCommune(nbActeurs: number, nbEvenements: number): string {
  const parties: string[] = [];
  if (nbActeurs > 0) parties.push(`${String(nbActeurs)} acteur${nbActeurs > 1 ? 's' : ''}`);
  if (nbEvenements > 0) {
    parties.push(`${String(nbEvenements)} événement${nbEvenements > 1 ? 's' : ''} à venir`);
  }
  return parties.join(', ');
}
