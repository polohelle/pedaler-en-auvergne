/** Fabriques de contenus valides pour les tests ; chaque test modifie ce qu'il éprouve. */
import type { ActeurSaisi } from '@schemas/acteur';
import type { ActuSaisie } from '@schemas/actu';
import type { EvenementSaisi } from '@schemas/evenement';

/** Copie des données sans les clés indiquées. */
export function sans(donnees: Record<string, unknown>, ...cles: string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(donnees).filter(([cle]) => !cles.includes(cle)));
}

/** Fiche telle que l'import OSM la produit : minimale, jamais vérifiée (ADR 0019). */
const ACTEUR_BROUILLON = {
  nom: 'Cycles du Centre',
  slug: 'cycles-du-centre-clermont-ferrand',
  categories: ['magasin', 'reparateur'],
  commune: 'Clermont-Ferrand',
  departement: '63',
  source: 'osm',
  osm_id: 'node/123456',
  statut: 'brouillon',
} satisfies ActeurSaisi;

export function acteurBrouillon(): Record<string, unknown> {
  return { ...ACTEUR_BROUILLON };
}

/** Fiche complétée par la vérification humaine et publiée. */
export function acteurPublie(): Record<string, unknown> {
  return {
    ...ACTEUR_BROUILLON,
    membre: false,
    adresse: '12 rue du Port',
    code_postal: '63000',
    lat: 45.7772,
    lon: 3.087,
    services: ['reparation-toutes-marques', 'vae'],
    site: 'https://cycles-du-centre.example',
    telephone: '04 73 00 00 00',
    verifie_le: '2026-10-14',
    statut: 'publie',
  } satisfies ActeurSaisi;
}

export function evenement(): Record<string, unknown> {
  return {
    titre: 'Bourse aux vélos de Riom',
    type: 'bourse',
    debut: '2026-11-08T09:00:00+01:00',
    fin: '2026-11-08T17:00:00+01:00',
    lieu: 'Place de la Fédération',
    commune: 'Riom',
    departement: '63',
    lat: 45.8936,
    lon: 3.1126,
    organisateur: 'velo-riom',
    source_url: 'https://velo-riom.example/bourse',
    source: 'admin',
    statut: 'publie',
  } satisfies EvenementSaisi;
}

export function breve(): Record<string, unknown> {
  return {
    titre: 'Nouvelle voie verte entre Riom et Clermont',
    date: '2026-10-12',
    type: 'breve',
    categories: ['amenagements'],
    resume: 'La métropole annonce l’ouverture d’une voie verte.',
    departement: '63',
    source_url: 'https://presse.example/voie-verte',
    source_nom: 'La Presse locale',
    portee: 'local',
    statut: 'publie',
  } satisfies ActuSaisie;
}
