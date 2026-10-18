import { describe, expect, it } from 'vitest';
import { gpx } from '../../tests/fixtures/contenus';
import { denivelePositifM, distanceM, lireGpx, mesurerTrace, simplifier } from './gpx';

describe('lireGpx', () => {
  it('lit les points d’une trace, avec ou sans altitude', () => {
    const trace = lireGpx(gpx([45.9, 3.0, 500], [45.91, 3.01]));
    expect(trace).toEqual([
      [
        { lat: 45.9, lon: 3.0, ele: 500 },
        { lat: 45.91, lon: 3.01, ele: undefined },
      ],
    ]);
  });

  it('accepte les attributs dans les deux ordres et entre apostrophes', () => {
    const source = `<gpx><trk><trkseg><trkpt lon='3.1' lat='45.8'/><trkpt lat="45.81" lon="3.11"></trkpt></trkseg></trk></gpx>`;
    expect(
      lireGpx(source)
        .flat()
        .map(({ lat, lon }) => [lat, lon]),
    ).toEqual([
      [45.8, 3.1],
      [45.81, 3.11],
    ]);
  });

  it('garde les segments séparés et ignore un segment vide', () => {
    const source = `<gpx><trk>
      <trkseg><trkpt lat="45.8" lon="3.1"/><trkpt lat="45.81" lon="3.1"/></trkseg>
      <trkseg></trkseg>
      <trkseg><trkpt lat="45.9" lon="3.2"/><trkpt lat="45.91" lon="3.2"/></trkseg>
    </trk></gpx>`;
    expect(lireGpx(source)).toHaveLength(2);
  });

  it('lit une route quand le fichier n’a pas de trace', () => {
    const source = `<gpx><rte><rtept lat="45.8" lon="3.1"><ele>400</ele></rtept><rtept lat="45.81" lon="3.1"/></rte></gpx>`;
    expect(lireGpx(source).flat()).toHaveLength(2);
  });

  it('refuse un fichier qui n’est pas du GPX, une trace vide ou un point invalide', () => {
    expect(() => lireGpx('<kml></kml>')).toThrow(/GPX attendu/);
    expect(() => lireGpx(gpx([45.9, 3.0]))).toThrow(/deux points/);
    expect(() =>
      lireGpx(
        '<gpx><trk><trkseg><trkpt lat="abc" lon="3"/><trkpt lat="45" lon="3"/></trkseg></trk></gpx>',
      ),
    ).toThrow(/lat valide/);
  });
});

describe('mesures', () => {
  it('distanceM : un degré de latitude fait environ 111 km', () => {
    expect(distanceM({ lat: 45, lon: 3 }, { lat: 46, lon: 3 })).toBeCloseTo(111_195, -2);
  });

  it('denivelePositifM ignore les variations sous le seuil', () => {
    const altitudes = [500, 503, 501, 504, 520, 515, 540].map((ele) => ({ lat: 45, lon: 3, ele }));
    expect(denivelePositifM(altitudes)).toBe(45);
    expect(denivelePositifM([{ lat: 45, lon: 3 }])).toBeUndefined();
    expect(
      denivelePositifM([
        { lat: 45, lon: 3, ele: 400 },
        { lat: 45, lon: 3 },
      ]),
    ).toBeUndefined();
  });

  it('mesurerTrace : distance, dénivelé arrondi, départ, arrivée et boucle', () => {
    const mesures = mesurerTrace(
      lireGpx(gpx([45.9, 3.0, 400], [45.95, 3.0, 520], [45.9, 3.0, 400])),
    );
    expect(mesures.distanceKm).toBeCloseTo(11.1, 1);
    expect(mesures.deniveleM).toBe(120);
    expect(mesures.depart).toEqual({ lat: 45.9, lon: 3.0, ele: 400 });
    expect(mesures.boucle).toBe(true);
  });

  it('mesurerTrace : un aller simple sans altitudes', () => {
    const mesures = mesurerTrace(lireGpx(gpx([45.9, 3.0], [45.95, 3.0])));
    expect(mesures.boucle).toBe(false);
    expect(mesures.deniveleM).toBeUndefined();
  });

  it('mesurerTrace refuse une trace vide', () => {
    expect(() => mesurerTrace([])).toThrow(/vide/);
  });
});

describe('simplifier', () => {
  it('retire les points alignés et garde les virages', () => {
    const points = [
      { lat: 45.0, lon: 3.0 },
      { lat: 45.001, lon: 3.0 },
      { lat: 45.002, lon: 3.0 },
      { lat: 45.002, lon: 3.01 },
    ];
    expect(simplifier(points, 15)).toEqual([points[0], points[2], points[3]]);
  });

  it('garde une trace de deux points et des points confondus', () => {
    const deux = [
      { lat: 45, lon: 3 },
      { lat: 45.1, lon: 3 },
    ];
    expect(simplifier(deux, 15)).toEqual(deux);
    const confondus = [
      { lat: 45, lon: 3 },
      { lat: 45.0005, lon: 3 },
      { lat: 45, lon: 3 },
    ];
    expect(simplifier(confondus, 15)).toEqual(confondus);
  });
});
