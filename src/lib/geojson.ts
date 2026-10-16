/**
 * Points de l'annuaire au format GeoJSON (RFC 7946), lus par la carte. Une fiche sans position
 * (structure sans adresse publique, ADR 0025) n'a pas de point : elle reste dans la liste.
 */
import { LIBELLES_CATEGORIE_ACTEUR, type CategorieActeur } from '@config/acteurs';

export interface ActeurCartographiable {
  id: string;
  nom: string;
  commune: string;
  categories: readonly CategorieActeur[];
  membre: boolean;
  lat?: number | undefined;
  lon?: number | undefined;
}

export interface ProprietesPoint {
  id: string;
  nom: string;
  commune: string;
  categories: string;
  membre: boolean;
  url: string;
}

export interface PointAnnuaire {
  type: 'Feature';
  /** GeoJSON ordonne longitude puis latitude. */
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: ProprietesPoint;
}

export interface CollectionPoints {
  type: 'FeatureCollection';
  features: PointAnnuaire[];
}

export function pointsAnnuaire(acteurs: readonly ActeurCartographiable[]): CollectionPoints {
  const features = acteurs.flatMap((acteur): PointAnnuaire[] =>
    acteur.lat === undefined || acteur.lon === undefined
      ? []
      : [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [acteur.lon, acteur.lat] },
            properties: {
              id: acteur.id,
              nom: acteur.nom,
              commune: acteur.commune,
              categories: acteur.categories.map((c) => LIBELLES_CATEGORIE_ACTEUR[c]).join(', '),
              membre: acteur.membre,
              url: `/annuaire/${acteur.id}/`,
            },
          },
        ],
  );
  return { type: 'FeatureCollection', features };
}
