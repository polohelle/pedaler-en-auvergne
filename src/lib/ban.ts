/**
 * Base Adresse Nationale, via le service de géocodage de la Géoplateforme (IGN), gratuit
 * et officiel. Ce module construit les requêtes et lit les réponses ; l'appel réseau est
 * fait par l'appelant.
 */
import { z } from 'astro/zod';
import { departementDuCodePostal } from './geo';

export const URL_GEOCODAGE = 'https://data.geopf.fr/geocodage';

export const schemaReponseBan = z.object({
  features: z.array(
    z.object({
      geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
      properties: z.object({
        label: z.string().optional(),
        postcode: z.string().optional(),
        city: z.string().optional(),
        score: z.number().optional(),
      }),
    }),
  ),
});

export interface Commune {
  commune: string;
  code_postal: string;
}

export function urlGeocodageInverse(lat: number, lon: number): string {
  const parametres = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    index: 'address',
    limit: '1',
  });
  return `${URL_GEOCODAGE}/reverse?${parametres.toString()}`;
}

/** Commune et code postal de l'adresse la plus proche, s'ils relèvent d'un département couvert. */
export function communeDuGeocodageInverse(reponse: unknown): Commune | undefined {
  const lecture = schemaReponseBan.safeParse(reponse);
  if (!lecture.success) return undefined;
  const proprietes = lecture.data.features[0]?.properties;
  const { city, postcode } = proprietes ?? {};
  if (city === undefined || postcode === undefined) return undefined;
  if (departementDuCodePostal(postcode) === undefined) return undefined;
  return { commune: city, code_postal: postcode };
}
