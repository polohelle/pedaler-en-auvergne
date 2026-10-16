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
