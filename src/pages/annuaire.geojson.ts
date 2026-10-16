/** Points de l'annuaire pour la carte (ADR 0029). */
import type { APIRoute } from 'astro';
import { pointsAnnuaire } from '@lib/geojson';
import { acteursPublies } from '@services/contenus';

export const GET: APIRoute = async () => {
  const acteurs = await acteursPublies();
  const points = pointsAnnuaire(acteurs.map(({ id, data }) => ({ id, ...data })));
  return new Response(JSON.stringify(points), {
    headers: { 'Content-Type': 'application/geo+json; charset=utf-8' },
  });
};
