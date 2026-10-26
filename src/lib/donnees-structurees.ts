/**
 * Données structurées schema.org (JSON-LD) des pages : `Event` pour l'agenda, `LocalBusiness`,
 * `SportsClub` ou `Organization` pour l'annuaire, `NewsArticle` pour les actualités, `WebSite`
 * pour l'accueil (cahier des charges, « Référencement »). Elles reprennent ce que la page
 * affiche, jamais davantage.
 */
import type { CategorieActeur } from '@config/acteurs';
import { DEPARTEMENTS, type CodeDepartement } from '@config/departements';
import type { Acteur } from '@schemas/acteur';
import type { Actu } from '@schemas/actu';
import type { Evenement } from '@schemas/evenement';

export type DonneesStructurees = Record<string, unknown>;

const CONTEXTE = 'https://schema.org';

/**
 * Sérialise des données pour un bloc `<script type="application/ld+json">` : un `<` écrit
 * `<` empêche un texte contenant `</script>` de refermer le bloc.
 */
export function serialiserJsonLd(donnees: DonneesStructurees): string {
  return JSON.stringify(donnees).replace(/</g, '\\u003c');
}

interface Lieu {
  adresse?: string | undefined;
  code_postal?: string | undefined;
  commune: string;
  departement: CodeDepartement;
  lat?: number | undefined;
  lon?: number | undefined;
}

function adressePostale(lieu: Lieu): DonneesStructurees {
  return {
    '@type': 'PostalAddress',
    streetAddress: lieu.adresse,
    postalCode: lieu.code_postal,
    addressLocality: lieu.commune,
    addressRegion: DEPARTEMENTS[lieu.departement].nom,
    addressCountry: 'FR',
  };
}

function coordonnees(lieu: Lieu): DonneesStructurees | undefined {
  if (lieu.lat === undefined || lieu.lon === undefined) return undefined;
  return { '@type': 'GeoCoordinates', latitude: lieu.lat, longitude: lieu.lon };
}

/** Le site lui-même, déclaré sur l'accueil. */
export function donneesSite(site: { nom: string; url: string; description: string }) {
  return {
    '@context': CONTEXTE,
    '@type': 'WebSite',
    name: site.nom,
    url: site.url,
    description: site.description,
    inLanguage: 'fr-FR',
  } satisfies DonneesStructurees;
}

/** Type schema.org d'un acteur d'après ses catégories, du plus précis au plus général. */
export function typeActeur(categories: readonly CategorieActeur[]): string {
  if (categories.includes('magasin')) return 'BikeStore';
  if (categories.includes('club-sportif')) return 'SportsClub';
  if (categories.includes('collectivite')) return 'GovernmentOrganization';
  if (
    categories.some((c) =>
      ['association-usagers', 'atelier-participatif', 'velo-ecole'].includes(c),
    )
  ) {
    return 'NGO';
  }
  return 'LocalBusiness';
}

/**
 * Fiche d'un acteur. Une structure sans adresse publique ne donne que sa commune, sans
 * position (ADR 0025).
 */
export function donneesActeur(
  acteur: Acteur,
  page: { url: string; description: string; logo?: string | undefined },
) {
  return {
    '@context': CONTEXTE,
    '@type': typeActeur(acteur.categories),
    '@id': `${page.url}#structure`,
    name: acteur.nom,
    description: page.description,
    url: acteur.site ?? page.url,
    mainEntityOfPage: page.url,
    logo: page.logo,
    image: page.logo,
    address: adressePostale(acteur),
    geo: acteur.sans_adresse_publique ? undefined : coordonnees(acteur),
    telephone: acteur.telephone,
    email: acteur.email,
    sameAs: acteur.reseaux,
  } satisfies DonneesStructurees;
}

/** Fiche d'un événement ; l'organisateur est lié à sa fiche de l'annuaire. */
export function donneesEvenement(
  evenement: Evenement,
  page: {
    url: string;
    description: string;
    image?: string | undefined;
    organisateur?: { nom: string; url: string } | undefined;
  },
) {
  return {
    '@context': CONTEXTE,
    '@type': 'Event',
    name: evenement.titre,
    description: page.description,
    url: page.url,
    startDate: evenement.debut.toISOString(),
    endDate: evenement.fin?.toISOString(),
    eventStatus:
      evenement.statut === 'annule'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: evenement.lieu,
      address: adressePostale(evenement),
      geo: coordonnees(evenement),
    },
    image: page.image ? [page.image] : undefined,
    isAccessibleForFree: evenement.tarif && /\bgratuit/i.test(evenement.tarif) ? true : undefined,
    organizer: page.organisateur && {
      '@type': 'Organization',
      name: page.organisateur.nom,
      url: page.organisateur.url,
    },
  } satisfies DonneesStructurees;
}

/** Article ou brève ; l'éditeur est le site, jamais une personne (ADR 0035). */
export function donneesActu(
  actu: Actu,
  page: { url: string; image?: string | undefined },
  site: { nom: string; url: string; logo: string },
) {
  const editeur = {
    '@type': 'Organization',
    name: site.nom,
    url: site.url,
    logo: site.logo,
  };
  return {
    '@context': CONTEXTE,
    '@type': 'NewsArticle',
    headline: actu.titre,
    description: actu.resume,
    datePublished: actu.date,
    inLanguage: 'fr-FR',
    url: page.url,
    mainEntityOfPage: page.url,
    image: page.image ? [page.image] : undefined,
    author: editeur,
    publisher: editeur,
  } satisfies DonneesStructurees;
}
