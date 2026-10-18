/** Traces des itinéraires publiés pour la carte (ADR 0035), simplifiées. */
import type { APIRoute } from 'astro';
import { caracteristiques, ligneItineraire, type CollectionLignes } from '@lib/itineraires';
import { itinerairesPublies } from '@services/contenus';

export const GET: APIRoute = async () => {
  const itineraires = await itinerairesPublies();
  const lignes: CollectionLignes = {
    type: 'FeatureCollection',
    features: itineraires.map(({ id, data, trace, mesures }) =>
      ligneItineraire(
        {
          id,
          titre: data.titre,
          url: `/itineraires/${id}/`,
          ...caracteristiques(data, mesures),
        },
        trace,
      ),
    ),
  };
  return new Response(JSON.stringify(lignes), {
    headers: { 'Content-Type': 'application/geo+json; charset=utf-8' },
  });
};
