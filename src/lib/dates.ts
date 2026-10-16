/**
 * Affichage des dates du portail.
 *
 * Les dates sont stockées en ISO 8601 avec fuseau et converties en `Date` par les schémas ;
 * ce module est le seul endroit qui les présente, toujours dans le fuseau Europe/Paris
 * et selon la typographie française (« 9 h 30 », « 1er mai »).
 */

export const FUSEAU = 'Europe/Paris';

const formatJour = new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const formatHeure = new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU,
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h23',
});

const formatJourCivil = new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formatPastille = new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

function partie(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  const trouvee = parts.find((p) => p.type === type);
  if (trouvee === undefined) {
    throw new Error(`Partie de date absente : ${type}`);
  }
  return trouvee.value;
}

/** « dimanche 8 novembre 2026 », « vendredi 1er mai 2026 ». */
export function formaterDate(date: Date): string {
  return formatJour
    .formatToParts(date)
    .map((p) => (p.type === 'day' && p.value === '1' ? '1er' : p.value))
    .join('');
}

/** « 9 h 30 », « 12 h ». */
export function formaterHeure(date: Date): string {
  const parts = formatHeure.formatToParts(date);
  const heure = String(Number(partie(parts, 'hour')));
  const minute = partie(parts, 'minute');
  return minute === '00' ? `${heure} h` : `${heure} h ${minute}`;
}

/** Jour civil à Paris au format `AAAA-MM-JJ`, utilisé pour les noms de fichiers et les comparaisons par jour. */
export function jourCivil(date: Date): string {
  const parts = formatJourCivil.formatToParts(date);
  return `${partie(parts, 'year')}-${partie(parts, 'month')}-${partie(parts, 'day')}`;
}

/** Éléments de la pastille de date de l'agenda : « dim. », « 8 », « nov. ». */
export interface PastilleDate {
  jourSemaine: string;
  jour: string;
  mois: string;
}

export function pastilleDate(date: Date): PastilleDate {
  const parts = formatPastille.formatToParts(date);
  return {
    jourSemaine: partie(parts, 'weekday'),
    jour: partie(parts, 'day'),
    mois: partie(parts, 'month'),
  };
}

/**
 * Plage horaire d'un événement :
 * - « dimanche 8 novembre 2026 à 9 h 30 » sans fin ;
 * - « dimanche 8 novembre 2026 de 9 h 30 à 12 h » sur un même jour ;
 * - « du samedi 7 novembre 2026 à 14 h au dimanche 8 novembre 2026 à 18 h » sinon.
 */
export function formaterPlage(debut: Date, fin?: Date): string {
  if (fin === undefined) {
    return `${formaterDate(debut)} à ${formaterHeure(debut)}`;
  }
  if (fin.getTime() < debut.getTime()) {
    throw new RangeError('La fin précède le début.');
  }
  if (jourCivil(debut) === jourCivil(fin)) {
    return `${formaterDate(debut)} de ${formaterHeure(debut)} à ${formaterHeure(fin)}`;
  }
  return `du ${formaterDate(debut)} à ${formaterHeure(debut)} au ${formaterDate(fin)} à ${formaterHeure(fin)}`;
}

const formatDecalage = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSEAU,
  timeZoneName: 'longOffset',
});

/** Décalage de Paris par rapport à UTC à un instant donné : « +01:00 » ou « +02:00 ». */
function decalageParis(instant: number): string {
  const nom = partie(formatDecalage.formatToParts(new Date(instant)), 'timeZoneName');
  return nom === 'GMT' ? '+00:00' : nom.slice(3);
}

/** Heure de Paris au format `HH:MM`. */
function heureParis(date: Date): string {
  const parts = formatHeure.formatToParts(date);
  return `${partie(parts, 'hour').padStart(2, '0')}:${partie(parts, 'minute')}`;
}

/**
 * Date-heure ISO 8601 avec le fuseau de Paris, à partir d'un jour `AAAA-MM-JJ` et d'une heure
 * `HH:MM` saisis à Paris (champs `date` et `time` d'un formulaire) :
 * « 2026-11-08 » et « 09:30 » donnent « 2026-11-08T09:30:00+01:00 ».
 * Refuse un jour impossible et une heure sautée au passage à l'heure d'été.
 */
export function dateHeureParis(jour: string, heure: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour) || !/^\d{2}:\d{2}$/.test(heure)) {
    throw new RangeError('Jour AAAA-MM-JJ et heure HH:MM attendus.');
  }
  const naif = Date.parse(`${jour}T${heure}:00Z`);
  if (Number.isNaN(naif)) {
    throw new RangeError('Jour ou heure impossible.');
  }
  // Paris est en avance d'une ou deux heures sur UTC : on essaie les deux décalages.
  for (const decalage of [decalageParis(naif - 3_600_000), decalageParis(naif - 7_200_000)]) {
    const iso = `${jour}T${heure}:00${decalage}`;
    const date = new Date(iso);
    if (jourCivil(date) === jour && heureParis(date) === heure) {
      return iso;
    }
  }
  throw new RangeError('Jour ou heure impossible à Paris.');
}
