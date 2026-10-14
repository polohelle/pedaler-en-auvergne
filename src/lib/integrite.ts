/**
 * Contrôles qui portent sur plusieurs fichiers à la fois et qu'un schéma ne peut pas faire :
 * organisateurs existants et publiés, identifiants OSM uniques.
 */
import type { StatutActeur, StatutEvenement } from '@config/statuts';

export interface ActeurIndexe {
  slug: string;
  statut: StatutActeur;
  osm_id?: string | undefined;
}

export interface EvenementIndexe {
  id: string;
  statut: StatutEvenement;
  organisateur?: string | undefined;
}

export function verifierIntegrite(
  acteurs: readonly ActeurIndexe[],
  evenements: readonly EvenementIndexe[],
): string[] {
  const erreurs: string[] = [];
  const parSlug = new Map(acteurs.map((acteur) => [acteur.slug, acteur]));

  const parOsm = new Map<string, string[]>();
  for (const { slug, osm_id } of acteurs) {
    if (osm_id !== undefined) parOsm.set(osm_id, [...(parOsm.get(osm_id) ?? []), slug]);
  }
  for (const [osmId, slugs] of parOsm) {
    if (slugs.length > 1) {
      erreurs.push(`${osmId} est importé plusieurs fois : ${slugs.join(', ')}.`);
    }
  }

  for (const { id, statut, organisateur } of evenements) {
    if (organisateur === undefined) continue;
    const acteur = parSlug.get(organisateur);
    if (acteur === undefined) {
      erreurs.push(`${id} : l'organisateur « ${organisateur} » n'existe pas dans l'annuaire.`);
    } else if ((statut === 'publie' || statut === 'annule') && acteur.statut !== 'publie') {
      erreurs.push(`${id} : l'organisateur « ${organisateur} » n'est pas publié.`);
    }
  }
  return erreurs;
}
