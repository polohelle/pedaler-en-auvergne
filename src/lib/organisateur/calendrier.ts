/**
 * Calendrier de choix des dates de l'espace organisateur : les mois à venir, jour par jour,
 * calculés sur le calendrier civil (sans heure ni fuseau). Le jour « aujourd'hui » est fourni
 * par l'appelant, déjà ramené à Paris (`jourCivil`).
 */

const FORMAT_JOUR = /^(\d{4})-(\d{2})-(\d{2})$/;
const UN_JOUR = 86_400_000;

const libelleJour = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const libelleMois = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
});

/** Jour `AAAA-MM-JJ` qui existe vraiment (pas de 31 avril). */
export function estUnJour(texte: string): boolean {
  const morceaux = FORMAT_JOUR.exec(texte);
  if (morceaux === null) return false;
  const date = new Date(`${texte}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(texte);
}

function enDate(jour: string): Date {
  return new Date(`${jour}T00:00:00Z`);
}

function enJour(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** « mardi 3 novembre 2026 ». */
export function libelleDuJour(jour: string): string {
  return libelleJour.format(enDate(jour));
}

export interface JourCalendrier {
  jour: string;
  numero: number;
  libelle: string;
  /** Jour passé : il ne peut plus être choisi. */
  passe: boolean;
}

export interface MoisCalendrier {
  /** `AAAA-MM`. */
  cle: string;
  /** « novembre 2026 ». */
  libelle: string;
  /** Colonne du premier jour, lundi = 1 … dimanche = 7. */
  colonneDuPremier: number;
  jours: JourCalendrier[];
}

/** Les `nombre` mois à partir de celui d'`aujourdhui`, jours passés marqués. */
export function moisCalendrier(aujourdhui: string, nombre: number): MoisCalendrier[] {
  if (!estUnJour(aujourdhui)) {
    throw new RangeError('Jour AAAA-MM-JJ attendu.');
  }
  const [annee, mois] = aujourdhui.split('-').map(Number) as [number, number];
  const resultat: MoisCalendrier[] = [];
  for (let rang = 0; rang < nombre; rang += 1) {
    const premier = new Date(Date.UTC(annee, mois - 1 + rang, 1));
    const jours: JourCalendrier[] = [];
    for (
      let date = premier;
      date.getUTCMonth() === premier.getUTCMonth();
      date = new Date(date.getTime() + UN_JOUR)
    ) {
      const jour = enJour(date);
      jours.push({
        jour,
        numero: date.getUTCDate(),
        libelle: libelleJour.format(date),
        passe: jour < aujourdhui,
      });
    }
    resultat.push({
      cle: enJour(premier).slice(0, 7),
      libelle: libelleMois.format(premier),
      colonneDuPremier: ((premier.getUTCDay() + 6) % 7) + 1,
      jours,
    });
  }
  return resultat;
}

/** Dates sans doublon, dans l'ordre. */
export function trierDates(dates: readonly string[]): string[] {
  return [...new Set(dates)].sort();
}

/** Vrai si les dates, triées, se suivent sans trou (au moins deux). */
export function datesConsecutives(dates: readonly string[]): boolean {
  const triees = trierDates(dates);
  if (triees.length < 2) return false;
  return triees.every(
    (jour, rang) =>
      rang === 0 || enDate(jour).getTime() - enDate(triees[rang - 1] ?? jour).getTime() === UN_JOUR,
  );
}
