/** Flux RSS des actualités publiées. */
import type { APIRoute } from 'astro';
import { SITE } from '@config/site';
import { elementRssActu } from '@lib/flux';
import { genererFluxRss } from '@lib/rss';
import { actusPubliees } from '@services/contenus';

export const GET: APIRoute = async () => {
  const actus = await actusPubliees();
  const xml = genererFluxRss({
    titre: `Actualités — ${SITE.nom}`,
    lien: new URL('/actus/', SITE.url).href,
    adresseFlux: new URL('/actus/rss.xml', SITE.url).href,
    description: 'Actualités du vélo local et national utiles aux acteurs du Puy-de-Dôme.',
    langue: SITE.langue,
    elements: actus.map((a) => elementRssActu(a, SITE.url)),
  });
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
