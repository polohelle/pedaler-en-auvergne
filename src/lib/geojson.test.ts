import { describe, expect, it } from 'vitest';
import { pointsAnnuaire } from './geojson';

describe('pointsAnnuaire', () => {
  it('place chaque fiche positionnée, longitude d’abord', () => {
    const collection = pointsAnnuaire([
      {
        id: 'cycles-riom',
        nom: 'Cycles Riom',
        commune: 'Riom',
        categories: ['magasin', 'reparateur'],
        membre: true,
        lat: 45.89,
        lon: 3.11,
      },
    ]);
    expect(collection).toEqual({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [3.11, 45.89] },
          properties: {
            id: 'cycles-riom',
            nom: 'Cycles Riom',
            commune: 'Riom',
            categories: 'Magasin, Réparateur',
            membre: true,
            url: '/annuaire/cycles-riom/',
          },
        },
      ],
    });
  });

  it('laisse de côté une fiche sans position', () => {
    const collection = pointsAnnuaire([
      {
        id: 'atelier-mobile',
        nom: 'Atelier mobile',
        commune: 'Clermont-Ferrand',
        categories: ['reparateur'],
        membre: false,
      },
    ]);
    expect(collection.features).toEqual([]);
  });
});
