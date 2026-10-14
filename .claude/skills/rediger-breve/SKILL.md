---
name: rediger-breve
description: Rédiger une brève d'actualité (src/content/actus) à partir d'une information sourcée — titre factuel, résumé de 2 à 4 phrases rédigées, catégorie, portée, lien et nom de la source, sans citation longue. Utilisé par veille-locale et veille-nationale.
---

# Rédiger une brève

## Fichier

`src/content/actus/<aaaa-mm-jj>-<slug>.md`, où la date est celle de l'information (publication
de la source) et le slug est le titre slugifié, court (5 à 6 mots au plus).

```markdown
---
titre: Une voie verte relie Riom à Clermont-Ferrand
date: 2026-10-12
type: breve
categories: [amenagements]
resume: >-
  Clermont Auvergne Métropole a ouvert le 10 octobre une voie verte de 8 km entre Riom et
  Clermont-Ferrand. Séparée de la circulation, elle longe la voie ferrée et dessert trois
  zones d'activités. Un second tronçon vers Aulnat est annoncé pour 2027.
departement: '63'
source_url: https://exemple.fr/article
source_nom: Clermont Auvergne Métropole
portee: local
statut: brouillon
---
```

## Règles de rédaction

- **Titre** : factuel, au présent, sans point d'exclamation ni formule de presse ; 90 caractères
  au plus. Le sujet et le lieu y figurent.
- **Résumé** : 2 à 4 phrases, 400 caractères au plus, **rédigées avec tes mots** : qui, quoi,
  où, quand, et ce que cela change. Aucune phrase de la source reprise ; une citation de
  quelques mots au plus, entre guillemets, seulement si elle est indispensable.
- **Au national** : une phrase dit en quoi cela concerne les acteurs locaux (« Les ateliers
  participatifs peuvent candidater jusqu'au … »).
- **Catégories** (au moins une, `src/config/actus.ts`) : `amenagements`, `sport`, `evenements`,
  `politique-velo`, `filiere-economique`.
- **Portée** : `local` (une commune ou un département, `departement` obligatoire), `auvergne`
  (plusieurs départements), `national` (sans `departement`).
- **Source** : `source_url` vers la page d'origine précise (pas la page d'accueil) et
  `source_nom` (le média ou l'organisme).
- **Image** : aucune par défaut. Seulement libre de droits ou fournie avec autorisation, avec
  `alt` et `credit`.
- **Statut** : toujours `brouillon`. Pas de corps de fichier pour une brève.
- **Personnes** : pas de nom de particulier ; les élus et responsables seulement quand ils
  s'expriment publiquement à ce titre.

## Vérification

`pnpm verify` doit passer (le test de contenu valide le schéma et le nom de fichier).
