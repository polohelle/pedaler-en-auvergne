---
name: dedoublonner
description: Détecter avant création un contenu déjà présent (acteur, événement, actualité) — même URL source, même identifiant OSM, ou même date et même commune avec un titre proche — et compléter l'existant plutôt que de dupliquer. Utilisé par tous les agents de collecte et par le relecteur.
---

# Dédoublonner

À faire **avant** de créer un fichier, et sur les branches de pull requests ouvertes
(`gh pr list`, `gh pr diff`), pas seulement sur `main`.

## Critères

| Contenu   | Doublon certain                                                         | Doublon probable (à examiner)                            |
| --------- | ----------------------------------------------------------------------- | -------------------------------------------------------- |
| Actualité | même `source_url`                                                       | même date (± 2 jours), même sujet, sources différentes   |
| Événement | même `source_url` ; ou même jour de début + même commune + titre proche | même commune, dates proches, même organisateur           |
| Acteur    | même `osm_id` ; même `site` ; même slug                                 | même nom normalisé dans la même commune ; même téléphone |

« Titre proche » : après mise en minuscules et suppression des accents et des mots vides
(le, la, de, du, des, aux, à), les titres partagent l'essentiel de leurs mots (« Bourse aux
vélos de Riom » et « Riom : bourse vélos »).

## Recherche

```bash
grep -rl "source_url: https://exemple.fr/article" src/content
grep -rl "osm_id: node/123456" src/content/acteurs
ls src/content/evenements | grep '^2027-04-10-'
grep -ril "commune: Riom" src/content/evenements
```

## Décision

- **Doublon certain** : ne rien créer. Si la nouvelle source apporte une information manquante
  (horaire, tarif, lien d'inscription), compléter le fichier existant et le dire dans la pull
  request.
- **Doublon probable** : ne pas créer ; signaler les deux éléments dans la pull request et
  laisser l'administrateur trancher.
- **Report ou annulation** d'un événement existant : modifier l'existant (voir
  `collecte-evenements`), ne pas créer un second fichier.
