import { describe, expect, it } from 'vitest';
import type { PointTrace } from '../gpx';
import { chainer, partirDe, raccorder, relationItineraire, souder } from './relation';

describe('chainer', () => {
  it('met bout à bout les chemins, en retournant ceux qui sont à l’envers', () => {
    expect(
      chainer([
        [1, 2],
        [3, 2],
        [3, 4],
      ]),
    ).toEqual([[1, 2, 3, 4]]);
  });

  it('retourne le premier chemin quand il était à l’envers', () => {
    expect(
      chainer([
        [2, 1],
        [2, 3],
      ]),
    ).toEqual([[1, 2, 3]]);
    expect(
      chainer([
        [2, 1],
        [3, 2],
      ]),
    ).toEqual([[1, 2, 3]]);
  });

  it('ignore les chemins d’un seul nœud et ouvre un segment à chaque rupture', () => {
    expect(chainer([[1, 2], [9], [5, 6]])).toEqual([
      [1, 2],
      [5, 6],
    ]);
  });
});

describe('raccorder', () => {
  it('raccorde les segments mal ordonnés qui partagent une extrémité', () => {
    expect(
      raccorder([
        [1, 2],
        [5, 6],
        [3, 2],
        [4, 3],
      ]),
    ).toEqual([
      [1, 2, 3, 4],
      [5, 6],
    ]);
    expect(
      raccorder([
        [3, 4],
        [1, 2],
        [3, 2],
      ]),
    ).toEqual([[1, 2, 3, 4]]);
    expect(
      raccorder([
        [3, 4],
        [2, 3],
        [2, 1],
      ]),
    ).toEqual([[1, 2, 3, 4]]);
  });
});

const p = (lat: number, lon: number): PointTrace => ({ lat, lon });

describe('souder', () => {
  it('soude les segments séparés de moins de la tolérance, au besoin retournés', () => {
    const trace = [
      [p(45, 3), p(45, 3.01)],
      [p(45, 3.03), p(45, 3.0101)],
      [p(45, 2.98), p(45, 2.9999)],
    ];
    expect(souder(trace)).toEqual([
      [p(45, 2.98), p(45, 2.9999), p(45, 3), p(45, 3.01), p(45, 3.0101), p(45, 3.03)],
    ]);
  });

  it('garde séparés les segments trop éloignés', () => {
    const trace = [
      [p(45, 3), p(45, 3.01)],
      [p(45, 3.1), p(45, 3.11)],
    ];
    expect(souder(trace)).toEqual(trace);
  });
});

describe('partirDe', () => {
  const boucle = [p(45, 3), p(45, 3.01), p(45.01, 3.01), p(45.01, 3), p(45, 3)];

  it('fait partir une boucle fermée du point le plus proche', () => {
    expect(partirDe([boucle], p(45.0101, 3.0101))).toEqual([
      [p(45.01, 3.01), p(45.01, 3), p(45, 3), p(45, 3.01), p(45.01, 3.01)],
    ]);
  });

  it('referme une boucle ouverte après rotation', () => {
    const ouverte = boucle.slice(0, -1).concat([p(45.0001, 3)]);
    const [segment] = partirDe([ouverte], p(45, 3.01));
    expect(segment?.[0]).toEqual(p(45, 3.01));
    expect(segment?.at(-1)).toEqual(p(45, 3.01));
  });

  it('rend telles quelles une trace en plusieurs segments ou qui n’est pas une boucle', () => {
    const ligne = [[p(45, 3), p(45, 3.1)]];
    expect(partirDe(ligne, p(45, 3.1))).toBe(ligne);
    const deux = [boucle, boucle];
    expect(partirDe(deux, p(45, 3.01))).toBe(deux);
    expect(partirDe([], p(45, 3))).toEqual([]);
  });
});

describe('relationItineraire', () => {
  const reponse = {
    elements: [
      { type: 'node', id: 1, lat: 45, lon: 3 },
      { type: 'node', id: 2, lat: 45, lon: 3.01 },
      { type: 'node', id: 3, lat: 45.01, lon: 3.01 },
      { type: 'node', id: 4, lat: 45.5, lon: 3.5 },
      { type: 'way', id: 10, nodes: [1, 2] },
      { type: 'way', id: 11, nodes: [3, 2] },
      { type: 'way', id: 12, nodes: [3, 4] },
      { type: 'way', id: 13, nodes: [3, 99] },
      {
        type: 'relation',
        id: 7,
        tags: { name: 'Boucle', route: 'bicycle' },
        members: [
          { type: 'way', ref: 10, role: '' },
          { type: 'way', ref: 11, role: '' },
          { type: 'way', ref: 12, role: 'alternative' },
          { type: 'way', ref: 13, role: '' },
          { type: 'way', ref: 404, role: '' },
          { type: 'node', ref: 1, role: 'start' },
        ],
      },
    ],
  };

  it('assemble la trace des chemins, sans variantes ni nœuds absents', () => {
    expect(relationItineraire(reponse, 7)).toEqual({
      id: 7,
      tags: { name: 'Boucle', route: 'bicycle' },
      trace: [[p(45, 3), p(45, 3.01), p(45.01, 3.01)]],
    });
  });

  it('refuse une réponse qui ne contient pas la relation', () => {
    expect(() => relationItineraire(reponse, 8)).toThrow('Relation 8 absente');
  });
});
