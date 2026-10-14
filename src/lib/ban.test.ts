import { describe, expect, it } from 'vitest';
import { communeDuGeocodageInverse, urlGeocodageInverse } from './ban';

function reponse(properties: Record<string, unknown>) {
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { coordinates: [3.087, 45.777] }, properties }],
  };
}

describe('urlGeocodageInverse', () => {
  it('interroge l’index des adresses de la Géoplateforme', () => {
    expect(urlGeocodageInverse(45.7772, 3.087)).toBe(
      'https://data.geopf.fr/geocodage/reverse?lat=45.7772&lon=3.087&index=address&limit=1',
    );
  });
});

describe('communeDuGeocodageInverse', () => {
  it('extrait commune et code postal', () => {
    expect(
      communeDuGeocodageInverse(reponse({ city: 'Clermont-Ferrand', postcode: '63000', score: 1 })),
    ).toEqual({ commune: 'Clermont-Ferrand', code_postal: '63000' });
  });

  it('ignore une commune hors des départements couverts', () => {
    expect(communeDuGeocodageInverse(reponse({ city: 'Lyon', postcode: '69001' }))).toBeUndefined();
  });

  it('ignore une réponse vide, incomplète ou mal formée', () => {
    expect(communeDuGeocodageInverse({ features: [] })).toBeUndefined();
    expect(communeDuGeocodageInverse(reponse({ city: 'Riom' }))).toBeUndefined();
    expect(communeDuGeocodageInverse('erreur')).toBeUndefined();
  });
});
