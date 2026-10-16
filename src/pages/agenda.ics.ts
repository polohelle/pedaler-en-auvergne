/** Agenda complet au format iCal, pour s'y abonner depuis un téléphone ou un agenda en ligne. */
import type { APIRoute } from 'astro';
import { SITE } from '@config/site';
import { evenementCalendrier } from '@lib/flux';
import { genererCalendrier } from '@lib/ical';
import { evenementsVisibles } from '@services/contenus';

export const GET: APIRoute = async () => {
  const evenements = await evenementsVisibles();
  const ics = genererCalendrier({
    nom: `Agenda vélo — ${SITE.nom}`,
    domaine: new URL(SITE.url).hostname,
    genereLe: new Date(),
    evenements: evenements.map((e) => evenementCalendrier(e, SITE.url)),
  });
  return new Response(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
