/**
 * Trace GPX d'un itinéraire publié, rediffusée telle quelle : sa licence le permet (ADR 0035),
 * et la fiche cite son auteur et sa licence.
 */
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { itinerairesPublies } from '@services/contenus';

export const getStaticPaths = (async () => {
  const itineraires = await itinerairesPublies();
  return itineraires.map(({ id, gpx }) => ({ params: { id }, props: { gpx } }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = ({ props }) =>
  new Response(props.gpx, { headers: { 'Content-Type': 'application/gpx+xml; charset=utf-8' } });
