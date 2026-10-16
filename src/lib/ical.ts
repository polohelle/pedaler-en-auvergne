/**
 * Export iCalendar (RFC 5545) de l'agenda : un fichier pour tout l'agenda (abonnement depuis
 * un téléphone) et un fichier par événement (« Ajouter à mon calendrier »).
 *
 * Les heures sont écrites en UTC (suffixe `Z`) : les dates du site portent leur décalage, et
 * l'UTC évite d'embarquer une définition de fuseau que chaque application interprète à sa façon.
 * Les applications affichent l'heure locale de l'utilisateur, donc l'heure de Paris dans la région.
 */

export interface EvenementCalendrier {
  /** Identifiant stable, unique dans le site (l'identifiant de la fiche). */
  id: string;
  titre: string;
  debut: Date;
  fin?: Date | undefined;
  lieu: string;
  commune: string;
  /** Texte brut, sans balisage. */
  description: string;
  /** Adresse absolue de la fiche sur le site. */
  url: string;
  annule: boolean;
  lat?: number | undefined;
  lon?: number | undefined;
}

export interface Calendrier {
  nom: string;
  /** Domaine du site, pour des UID uniques au monde (`<id>@<domaine>`). */
  domaine: string;
  /** Date de génération, reportée dans `DTSTAMP`. */
  genereLe: Date;
  evenements: readonly EvenementCalendrier[];
}

const LONGUEUR_MAX_OCTETS = 75;
const encodeur = new TextEncoder();

/** Échappe une valeur de type TEXT : barre oblique inverse, point-virgule, virgule, sauts de ligne. */
export function echapperTexte(texte: string): string {
  return texte
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Plie une ligne de contenu à 75 octets au plus (UTF-8), sans couper un caractère :
 * chaque suite commence par un espace.
 */
export function plierLigne(ligne: string): string {
  const morceaux: string[] = [];
  let courant = '';
  let octets = 0;
  for (const caractere of ligne) {
    const taille = encodeur.encode(caractere).length;
    // La première ligne a 75 octets ; les suivantes 74, plus l'espace de continuation.
    const limite = morceaux.length === 0 ? LONGUEUR_MAX_OCTETS : LONGUEUR_MAX_OCTETS - 1;
    if (octets + taille > limite) {
      morceaux.push(courant);
      courant = '';
      octets = 0;
    }
    courant += caractere;
    octets += taille;
  }
  morceaux.push(courant);
  return morceaux.join('\r\n ');
}

/** `2026-11-08T08:30:00.000Z` → `20261108T083000Z`. */
export function horodatageUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function lignesEvenement(evenement: EvenementCalendrier, calendrier: Calendrier): string[] {
  const lignes = [
    'BEGIN:VEVENT',
    `UID:${evenement.id}@${calendrier.domaine}`,
    `DTSTAMP:${horodatageUtc(calendrier.genereLe)}`,
    `DTSTART:${horodatageUtc(evenement.debut)}`,
  ];
  if (evenement.fin !== undefined) {
    lignes.push(`DTEND:${horodatageUtc(evenement.fin)}`);
  }
  lignes.push(
    `SUMMARY:${echapperTexte(evenement.annule ? `[Annulé] ${evenement.titre}` : evenement.titre)}`,
    `LOCATION:${echapperTexte(`${evenement.lieu}, ${evenement.commune}`)}`,
    `DESCRIPTION:${echapperTexte(`${evenement.description}\n\n${evenement.url}`)}`,
    `URL:${evenement.url}`,
    `STATUS:${evenement.annule ? 'CANCELLED' : 'CONFIRMED'}`,
  );
  if (evenement.lat !== undefined && evenement.lon !== undefined) {
    lignes.push(`GEO:${String(evenement.lat)};${String(evenement.lon)}`);
  }
  lignes.push('END:VEVENT');
  return lignes;
}

/** Fichier `.ics` complet, lignes terminées par CRLF comme l'exige la norme. */
export function genererCalendrier(calendrier: Calendrier): string {
  const lignes = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${calendrier.domaine}//Agenda//FR`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${echapperTexte(calendrier.nom)}`,
    'X-WR-TIMEZONE:Europe/Paris',
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
    ...calendrier.evenements.flatMap((evenement) => lignesEvenement(evenement, calendrier)),
    'END:VCALENDAR',
  ];
  return `${lignes.map(plierLigne).join('\r\n')}\r\n`;
}
