/** Un fichier iCal par événement : « Ajouter à mon calendrier » depuis la fiche. */
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { SITE } from '@config/site';
import { evenementCalendrier } from '@lib/flux';
import { genererCalendrier } from '@lib/ical';
import { evenementsVisibles } from '@services/contenus';

export const getStaticPaths = (async () => {
  const evenements = await evenementsVisibles();
  return evenements.map((evenement) => ({ params: { id: evenement.id }, props: { evenement } }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = ({ props }) => {
  const ics = genererCalendrier({
    nom: props.evenement.data.titre,
    domaine: new URL(SITE.url).hostname,
    genereLe: new Date(),
    evenements: [evenementCalendrier(props.evenement, SITE.url)],
  });
  return new Response(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
