---
name: geocoder-adresse
description: Obtenir latitude et longitude d'une adresse française via la Base Adresse Nationale (service de géocodage de la Géoplateforme IGN), avec un niveau de confiance ; ou retrouver commune et code postal à partir de coordonnées. Utilisé par collecte-evenements, propositions et maintenance-annuaire.
---

# Géocoder une adresse

Service officiel et gratuit : `https://data.geopf.fr/geocodage` (Base Adresse Nationale). Les
fonctions de lecture des réponses sont dans `src/lib/ban.ts`.

## Adresse → coordonnées

```bash
curl -s "https://data.geopf.fr/geocodage/search?q=$(printf %s '12 rue du Port 63000 Clermont-Ferrand' | jq -sRr @uri)&index=address&limit=1"
```

Dans la réponse (`features[0]`) :

- `geometry.coordinates` = **[longitude, latitude]** (attention à l'ordre) ;
- `properties.score` = confiance entre 0 et 1 ;
- `properties.type` = `housenumber`, `street`, `locality` ou `municipality` ;
- `properties.postcode`, `properties.city`.

## Seuils de confiance

| Résultat                                            | Décision                                     |
| --------------------------------------------------- | -------------------------------------------- |
| `score` ≥ 0,8 et `type` = `housenumber` ou `street` | coordonnées retenues                         |
| `score` ≥ 0,6, ou `type` = `locality`               | retenues, doute signalé dans la pull request |
| `type` = `municipality` ou `score` < 0,6            | coordonnées **omises**, doute signalé        |
| `postcode` hors des départements actifs             | coordonnées omises, périmètre à vérifier     |

Arrondir à 5 décimales. Les schémas refusent des coordonnées hors d'Auvergne : une erreur à ce
sujet signale presque toujours une inversion latitude/longitude.

## Coordonnées → commune

```bash
curl -s "https://data.geopf.fr/geocodage/reverse?lat=45.7772&lon=3.087&index=address&limit=1"
```

`properties.city` et `properties.postcode` donnent la commune et le code postal (fiables) ;
l'adresse la plus proche n'est **pas** l'adresse de la structure : ne jamais la recopier comme
`adresse`.

## Bon usage

Une requête par adresse, sans rafale (au plus quelques requêtes par seconde). Ne jamais envoyer
au service une donnée personnelle (adresse de domicile d'un particulier).
