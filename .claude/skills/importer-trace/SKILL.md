---
name: importer-trace
description: Récupérer la trace GPX d'un parcours vélo après avoir vérifié que sa licence en autorise la reprise (Licence Ouverte, ODbL, CC0, CC BY, CC BY-SA ou accord écrit), la nettoyer, l'enregistrer en src/content/itineraires/<slug>.gpx et relever distance, dénivelé et forme. Utilisé par collecte-itineraires.
---

# Importer une trace

## 1. Vérifier la licence (avant tout téléchargement)

Chercher la licence sur la page du parcours, dans les mentions légales ou les conditions
d'utilisation du site, ou dans la fiche du jeu de données (open data).

| Ce qu'on trouve                                                 | `licence`         | Reprise                                       |
| --------------------------------------------------------------- | ----------------- | --------------------------------------------- |
| Licence Ouverte / Open Licence Etalab (1.0 ou 2.0)              | `licence-ouverte` | oui                                           |
| ODbL (OpenStreetMap, portails open data)                        | `odbl`            | oui                                           |
| CC0, domaine public                                             | `cc0`             | oui                                           |
| CC BY                                                           | `cc-by`           | oui                                           |
| CC BY-SA                                                        | `cc-by-sa`        | oui                                           |
| Accord écrit de l'auteur (courriel, message), cité dans la PR   | `autorisation`    | oui, si l'accord dit « reprise et diffusion » |
| CC BY-NC, BY-ND, « tous droits réservés », aucune mention       | —                 | **non** : renvoi                              |
| Komoot, Strava, Openrunner, Visorando, Wikiloc, Garmin Connect… | —                 | **non** : renvoi                              |

Un bouton « Télécharger le GPX » n'est pas une licence. En cas de doute, ne pas reprendre et
le signaler. Noter dans la PR l'URL exacte où la licence est énoncée.

`auteur` : le producteur de la trace tel que la licence demande de le citer (« Département du
Puy-de-Dôme », « Office de tourisme du Sancy », « contributeurs OpenStreetMap »), jamais un
particulier.

## 2. Récupérer la trace

- **GPX publié** : le télécharger tel quel, `trace_url` = son adresse.
- **GeoJSON ou KML** (open data) : convertir en GPX 1.1 (`<trk><trkseg><trkpt lat lon>`),
  en gardant les altitudes s'il y en a.
- **Relation OpenStreetMap** : `[out:json]; relation(<id>); way(r); out geom;` sur l'API
  Overpass, puis assembler les chemins dans l'ordre en segments `<trkseg>` ; `auteur:
contributeurs OpenStreetMap`, `licence: odbl`, `source_url` = page de la relation
  (`https://www.openstreetmap.org/relation/<id>`). Les traces OSM n'ont pas d'altitude : le
  dénivelé affichera « non renseigné ».

## 3. Nettoyer et enregistrer

- Fichier `src/content/itineraires/<slug>.gpx`, même slug que la fiche.
- Retirer ce qui n'est pas la trace ou qui est personnel : horodatages, fréquence cardiaque,
  nom d'appareil, nom de l'utilisateur dans `<metadata>`. Garder `<name>` du parcours.
- Garder une trace (`<trk>`) ou, à défaut, une route (`<rte>`) ; plusieurs `<trkseg>` si le
  tracé est interrompu.
- Au-delà d'environ 5 000 points, alléger (un point tous les 10 m suffit) ; la carte simplifie
  de toute façon, mais le fichier est téléchargé tel quel.

## 4. Relever les mesures

`pnpm verify` contrôle la trace (lisible, départ en Auvergne, boucle cohérente). Pour connaître
distance, dénivelé et forme avant de rédiger la fiche :

```bash
pnpm tsx -e "import { readFileSync } from 'node:fs'; import { lireGpx, mesurerTrace } from './src/lib/gpx.ts'; console.log(mesurerTrace(lireGpx(readFileSync(process.argv[1], 'utf8'))))" src/content/itineraires/<slug>.gpx
```

Comparer avec la distance annoncée par la source : un écart de plus de 10 % signale une trace
incomplète ou une autre variante du parcours, à mentionner dans la PR.
