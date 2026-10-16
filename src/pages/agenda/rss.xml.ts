/** Flux RSS des événements à venir. */
import type { APIRoute } from 'astro';
import { SITE } from '@config/site';
import { elementRssEvenement } from '@lib/flux';
import { genererFluxRss } from '@lib/rss';
import { evenementsAVenir } from '@services/contenus';

export const GET: APIRoute = async () => {
  const evenements = await evenementsAVenir();
  const xml = genererFluxRss({
    titre: `Agenda vélo — ${SITE.nom}`,
    lien: new URL('/agenda/', SITE.url).href,
    adresseFlux: new URL('/agenda/rss.xml', SITE.url).href,
    description: 'Les prochaines manifestations vélo du Puy-de-Dôme.',
    langue: SITE.langue,
    elements: evenements.map((e) => elementRssEvenement(e, SITE.url)),
  });
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
