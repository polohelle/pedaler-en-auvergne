---
name: rediger-itineraire
description: Rédiger la fiche d'un itinéraire vélo (src/content/itineraires/<slug>.md) conforme au schéma — pratique route/gravel/VTT, difficulté selon la grille, forme, balisage, départ, structure, auteur, licence et source de la trace — avec une description écrite avec ses propres mots. Utilisé par collecte-itineraires.
---

# Rédiger une fiche itinéraire

La trace `<slug>.gpx` est déjà enregistrée (skill `importer-trace`).

## Fichier

`src/content/itineraires/<slug>.md`, où le slug résume le parcours et sa commune de départ
(`boucle-des-puys-volvic`, `vtt-gorges-de-la-sioule-chateauneuf`).

```markdown
---
titre: Boucle des puys par Volvic
pratique: route
difficulte: moyen
forme: boucle
balise: false
commune: Volvic
departement: '63'
depart: Parking de la Maison de la pierre
acteur: office-de-tourisme-riom-limagne
auteur: Office de tourisme Riom Limagne et Volcans
licence: licence-ouverte
source_url: https://exemple.fr/parcours/boucle-des-puys
trace_url: https://exemple.fr/parcours/boucle-des-puys.gpx
source: agent
statut: brouillon
---

Description rédigée de 2 à 5 phrases.
```

## Champs

- **pratique** : `route` (bitume, vélo de route), `gravel` (chemins roulants et petites routes),
  `vtt` (sentiers, singles). Un parcours mixte prend sa pratique dominante ; le signaler.
- **difficulte** : la cotation de la source quand elle existe (vert `facile`, bleu `moyen`,
  rouge `difficile`, noir `tres-difficile` en VTT-FFC). Sinon, cette grille, en retenant la
  ligne la plus exigeante entre distance et dénivelé :

  | Difficulté       | Route               | Gravel              | VTT                             |
  | ---------------- | ------------------- | ------------------- | ------------------------------- |
  | `facile`         | < 40 km, < 400 m    | < 30 km, < 300 m    | < 15 km, < 300 m                |
  | `moyen`          | < 80 km, < 1 000 m  | < 60 km, < 800 m    | < 30 km, < 700 m                |
  | `difficile`      | < 130 km, < 2 000 m | < 100 km, < 1 500 m | < 50 km, < 1 200 m              |
  | `tres-difficile` | au-delà             | au-delà             | au-delà, ou passages techniques |

  Une difficulté estimée par la grille se signale dans la PR.

- **forme** : `boucle` (retour au départ, à moins d'1 km : le test le vérifie),
  `aller-retour`, `aller-simple`.
- **balise** : `true` seulement si la source indique un balisage sur le terrain.
- **commune**, **departement** : commune officielle du départ (skill `geocoder-adresse` en
  inverse sur le premier point de la trace si besoin) ; département actif uniquement.
- **depart** : lieu de départ précis s'il est connu (parking, gare, place) ; sinon omettre.
- **acteur** : slug d'une structure de `src/content/acteurs/` qui propose le parcours ; sinon
  omettre.
- **auteur**, **licence**, **source_url**, **trace_url** : relevés par `importer-trace`.
- **source** : `agent` ; **statut** : `brouillon`. Ne jamais renseigner `verifie_le` : c'est
  l'administrateur qui le pose en publiant.
- Distance et dénivelé ne s'écrivent pas : ils sont calculés à partir de la trace.

## Description

2 à 5 phrases avec tes mots : le paysage et les points d'intérêt, le type de revêtement, les
passages délicats, les points d'eau ou la gare proche. Jamais de copie de la source, pas de
données personnelles, pas d'avis commercial.

## Vérification

`pnpm verify` : schéma, nom de fichier, trace présente et cohérente, structure existante.
