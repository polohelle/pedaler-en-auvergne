/**
 * Contrôles qui portent sur plusieurs fichiers à la fois et qu'un schéma ne peut pas faire :
 * organisateurs et structures des itinéraires existants et publiés, identifiants OSM uniques.
 */
import type { StatutActeur, StatutEvenement, StatutItineraire } from '@config/statuts';

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

export interface ItineraireIndexe {
  id: string;
  statut: StatutItineraire;
  acteur?: string | undefined;
}

export function verifierIntegrite(
  acteurs: readonly ActeurIndexe[],
  evenements: readonly EvenementIndexe[],
  itineraires: readonly ItineraireIndexe[] = [],
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

  for (const { id, statut, acteur: slug } of itineraires) {
    if (slug === undefined) continue;
    const acteur = parSlug.get(slug);
    if (acteur === undefined) {
      erreurs.push(`${id} : la structure « ${slug} » n'existe pas dans l'annuaire.`);
    } else if (statut === 'publie' && acteur.statut !== 'publie') {
      erreurs.push(`${id} : la structure « ${slug} » n'est pas publiée.`);
    }
  }
  return erreurs;
}
