/**
 * Passage des fiches du site aux formats d'export : événement → iCal ou RSS, actualité → RSS.
 * Les adresses sont absolues, construites à partir de l'adresse du site.
 */
import { LIBELLES_TYPE_EVENEMENT } from '@config/evenements';
import type { Actu } from '@schemas/actu';
import type { Evenement } from '@schemas/evenement';
import { formaterPlage } from './dates';
import type { EvenementCalendrier } from './ical';
import type { ElementRss } from './rss';
import { texteBrut } from './texte';

export interface Fiche<T> {
  id: string;
  data: T;
  /** Corps Markdown de la fiche. */
  body?: string | undefined;
}

export function adresseEvenement(id: string, site: string): string {
  return new URL(`/agenda/${id}/`, site).href;
}

export function adresseActu(id: string, site: string): string {
  return new URL(`/actus/${id}/`, site).href;
}

export function evenementCalendrier(
  { id, data, body }: Fiche<Evenement>,
  site: string,
): EvenementCalendrier {
  return {
    id,
    titre: data.titre,
    debut: data.debut,
    fin: data.fin,
    lieu: data.lieu,
    commune: data.commune,
    description: texteBrut(body ?? ''),
    url: adresseEvenement(id, site),
    annule: data.statut === 'annule',
    lat: data.lat,
    lon: data.lon,
  };
}

/** Un événement n'a pas de date de parution : la date de l'événement figure dans le titre. */
export function elementRssEvenement({ id, data }: Fiche<Evenement>, site: string): ElementRss {
  const annule = data.statut === 'annule' ? ' (annulé)' : '';
  return {
    titre: `${data.titre}${annule} — ${data.commune}`,
    lien: adresseEvenement(id, site),
    description: `${LIBELLES_TYPE_EVENEMENT[data.type]}, ${formaterPlage(data.debut, data.fin)}, ${data.lieu}, ${data.commune}.`,
    date: undefined,
  };
}

/** Le jour de l'actualité est daté à midi UTC pour rester le même jour dans tous les fuseaux. */
export function elementRssActu({ id, data }: Fiche<Actu>, site: string): ElementRss {
  return {
    titre: data.titre,
    lien: adresseActu(id, site),
    description: data.resume,
    date: new Date(`${data.date}T12:00:00Z`),
  };
}
