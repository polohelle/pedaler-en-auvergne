/**
 * Carte de l'annuaire (ADR 0029) : fond Plan IGN de la Géoplateforme, gratuit, sans clé et
 * sous Licence ouverte, qui autorise l'usage d'un site public. Les points viennent de l'annuaire,
 * dont une partie provient d'OpenStreetMap.
 */
export const CARTE = {
  /** Hôte des tuiles, autorisé dans la CSP (`img-src`) de public/_headers. */
  hoteTuiles: 'https://data.geopf.fr',
  urlTuiles:
    'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
    '&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM' +
    '&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
  attribution:
    'Fond <a href="https://geoservices.ign.fr/">© IGN Géoplateforme</a> · Données ' +
    '<a href="https://www.openstreetmap.org/copyright">© contributeurs OpenStreetMap</a> (ODbL) et Pédaler en Auvergne',
  zoomMax: 18,
  /** Vue initiale quand l'annuaire n'a aucun point : le Puy-de-Dôme. */
  centre: [45.77, 3.08] as const,
  zoomInitial: 9,
  /** Fichier des points, généré au build. */
  urlDonnees: '/annuaire.geojson',
} as const;

/** Tuile WMTS de la Géoplateforme, en projection Web Mercator (`PM`). */
function tuilesGeoplateforme(couche: string, format: 'image/png' | 'image/jpeg'): string {
  return (
    'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
    `&LAYER=${couche}&STYLE=normal&TILEMATRIXSET=PM&FORMAT=${format}` +
    '&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}'
  );
}

/**
 * Carte des itinéraires (ADR 0036) : mêmes conditions que la carte de l'annuaire (Géoplateforme,
 * sans clé, Licence ouverte, même hôte dans la CSP), avec trois couches au choix.
 */
export const CARTE_ITINERAIRES = {
  fonds: [
    {
      nom: 'Plan IGN',
      url: tuilesGeoplateforme('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', 'image/png'),
      zoomMax: 19,
    },
    {
      nom: 'Photographies aériennes',
      url: tuilesGeoplateforme('ORTHOIMAGERY.ORTHOPHOTOS', 'image/jpeg'),
      zoomMax: 19,
    },
  ],
  /** Superposition utile en VTT et en gravel, désactivée à l'ouverture. */
  courbes: {
    nom: 'Courbes de niveau',
    url: tuilesGeoplateforme('ELEVATION.CONTOUR.LINE', 'image/png'),
    zoomMax: 18,
  },
  attribution:
    'Fond <a href="https://geoservices.ign.fr/">© IGN Géoplateforme</a> · Traces : auteur et ' +
    'licence sur chaque fiche',
  centre: CARTE.centre,
  zoomInitial: CARTE.zoomInitial,
  urlDonnees: '/itineraires.geojson',
} as const;
