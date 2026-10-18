import { describe, expect, it } from 'vitest';
import { gpx } from '../../tests/fixtures/contenus';
import { lireGpx } from './gpx';
import {
  attributsCaracteristiques,
  caracteristiques,
  correspond,
  CRITERES_VIDES,
  ecrireCriteres,
  formaterDenivele,
  formaterDistance,
  ligneItineraire,
  lireCaracteristiques,
  lireCriteres,
  resumeFiltres,
  verifierTrace,
  type Caracteristiques,
} from './itineraires';

const boucle = gpx([45.9, 3.0, 400], [45.95, 3.0, 520], [45.9, 3.0005, 400]);

const route: Caracteristiques = {
  pratique: 'route',
  difficulte: 'moyen',
  forme: 'boucle',
  balise: false,
  commune: 'Volvic',
  distanceKm: 72.4,
  deniveleM: 1150,
};

const vtt: Caracteristiques = {
  pratique: 'vtt',
  difficulte: 'difficile',
  forme: 'aller-simple',
  balise: true,
  commune: 'Riom',
  distanceKm: 24,
};

describe('verifierTrace', () => {
  it('accepte une boucle en Auvergne', () => {
    expect(verifierTrace(boucle, 'boucle')).toEqual([]);
  });

  it('signale une trace illisible', () => {
    expect(verifierTrace('pas du GPX', 'boucle')).toEqual([
      'Fichier GPX attendu (élément <gpx> absent).',
    ]);
  });

  it('signale un départ hors d’Auvergne et une fausse boucle', () => {
    const inversee = gpx([3.0, 45.9], [3.1, 45.9]);
    expect(verifierTrace(inversee, 'boucle')).toHaveLength(2);
    expect(verifierTrace(gpx([45.9, 3.0], [45.95, 3.0]), 'aller-simple')).toEqual([]);
  });
});

describe('caracteristiques', () => {
  it('ne garde que les champs filtrés et les mesures de la trace', () => {
    const fiche = { ...route, titre: 'Boucle', auteur: 'OT' };
    expect(caracteristiques(fiche, { distanceKm: 72.4, deniveleM: 1150 })).toEqual(route);
  });
});

describe('ligneItineraire', () => {
  it('produit une ligne GeoJSON longitude puis latitude, arrondie et simplifiée', () => {
    const trace = lireGpx(
      gpx([45.123456, 3.000001], [45.124, 3.000001], [45.125, 3.000001], [45.125, 3.01]),
    );
    const proprietes = { ...route, id: 'boucle', titre: 'Boucle', url: '/itineraires/boucle/' };
    const ligne = ligneItineraire(proprietes, trace);
    expect(ligne.geometry.coordinates).toEqual([
      [
        [3, 45.12346],
        [3, 45.125],
        [3.01, 45.125],
      ],
    ]);
    expect(ligne.properties).toBe(proprietes);
  });
});

describe('filtres', () => {
  it('sans critère, tout correspond', () => {
    expect(correspond(route, CRITERES_VIDES)).toBe(true);
    expect(correspond(vtt, CRITERES_VIDES)).toBe(true);
  });

  it('filtre par pratique, difficulté, boucle, balisage et commune', () => {
    expect(correspond(route, { ...CRITERES_VIDES, pratiques: ['vtt', 'gravel'] })).toBe(false);
    expect(correspond(vtt, { ...CRITERES_VIDES, pratiques: ['vtt'] })).toBe(true);
    expect(correspond(route, { ...CRITERES_VIDES, difficultes: ['facile'] })).toBe(false);
    expect(correspond(vtt, { ...CRITERES_VIDES, boucle: true })).toBe(false);
    expect(correspond(route, { ...CRITERES_VIDES, balise: true })).toBe(false);
    expect(correspond(route, { ...CRITERES_VIDES, commune: 'Riom' })).toBe(false);
    expect(correspond(vtt, { ...CRITERES_VIDES, commune: 'Riom' })).toBe(true);
  });

  it('filtre par tranche de distance et de dénivelé, bornes comprises au début', () => {
    expect(correspond(route, { ...CRITERES_VIDES, distance: '60-100' })).toBe(true);
    expect(correspond(vtt, { ...CRITERES_VIDES, distance: '60-100' })).toBe(false);
    expect(correspond({ ...vtt, distanceKm: 30 }, { ...CRITERES_VIDES, distance: '30-60' })).toBe(
      true,
    );
    expect(correspond(route, { ...CRITERES_VIDES, denivele: '1000-2000' })).toBe(true);
    // Dénivelé inconnu : écarté dès qu'une tranche est choisie.
    expect(correspond(vtt, { ...CRITERES_VIDES, denivele: 'moins-de-500' })).toBe(false);
    expect(correspond(route, { ...CRITERES_VIDES, distance: 'inconnue' })).toBe(false);
  });

  it('lit les critères d’une adresse en ignorant les valeurs inconnues', () => {
    const parametres = new URLSearchParams(
      'pratique=vtt&pratique=bmx&difficulte=facile&distance=30-60&denivele=999&boucle=oui&balise=non&commune=Paris',
    );
    expect(lireCriteres(parametres, ['Riom'])).toEqual({
      ...CRITERES_VIDES,
      pratiques: ['vtt'],
      difficultes: ['facile'],
      distance: '30-60',
      boucle: true,
    });
    expect(lireCriteres(new URLSearchParams('commune=Riom'), ['Riom']).commune).toBe('Riom');
  });

  it('écrit les critères actifs en adresse, relue à l’identique', () => {
    const criteres = {
      pratiques: ['route' as const, 'gravel' as const],
      difficultes: ['moyen' as const],
      distance: 'plus-de-100',
      denivele: '500-1000',
      boucle: true,
      balise: true,
      commune: 'Volvic',
    };
    const adresse = ecrireCriteres(criteres);
    expect(adresse.toString()).toBe(
      'pratique=route&pratique=gravel&difficulte=moyen&distance=plus-de-100&denivele=500-1000&boucle=oui&balise=oui&commune=Volvic',
    );
    expect(lireCriteres(adresse, ['Volvic'])).toEqual(criteres);
    expect(ecrireCriteres(CRITERES_VIDES).toString()).toBe('');
  });

  it('pose puis relit les caractéristiques en attributs data-*', () => {
    const versDataset = (attributs: Record<string, string>) =>
      Object.fromEntries(
        Object.entries(attributs).map(([cle, valeur]) => [cle.replace('data-', ''), valeur]),
      );
    expect(lireCaracteristiques(versDataset(attributsCaracteristiques(route)))).toEqual(route);
    expect(lireCaracteristiques(versDataset(attributsCaracteristiques(vtt)))).toEqual({
      ...vtt,
      deniveleM: undefined,
    });
    expect(lireCaracteristiques({ pratique: 'route' })).toBeUndefined();
  });
});

describe('textes', () => {
  it('résume le nombre de parcours affichés', () => {
    expect(resumeFiltres(3, 3)).toBe('3 parcours affiché(s).');
    expect(resumeFiltres(1, 3)).toBe('1 parcours sur 3 correspondent aux filtres.');
  });

  it('formate distance et dénivelé', () => {
    expect(formaterDistance(42.5)).toBe('42,5 km');
    expect(formaterDenivele(850)).toBe('850 m D+');
    expect(formaterDenivele(undefined)).toBe('non renseigné');
  });
});
