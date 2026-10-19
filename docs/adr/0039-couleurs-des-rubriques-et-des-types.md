# 0039 — Couleurs des rubriques et des types d'événement

- Statut : acceptée
- Date : 2026-10-19

## Contexte

L'administrateur trouve le site trop « ton sur ton » : tout est vert prairie (ADR 0024), les
rubriques se ressemblent et, dans l'agenda, toutes les cartes portent la même illustration
verte, qu'il s'agisse d'une balade, d'une course ou d'une vélorution. Il veut repérer d'un coup
d'œil la rubrique où il se trouve et le type de chaque sortie.

## Décision

- **Une couleur par rubrique** (`src/config/rubriques.ts`, jetons `--rubrique-<cle>` et
  `--rubrique-<cle>-pale`) : annuaire lac (bleu), agenda lave (orange), itinéraires prairie
  (vert), actus myrtille (violet). `data-rubrique` sur le corps de page (`rubriqueDe` dans
  `src/lib/rubriques.ts`) fixe `--couleur-rubrique` ; la tête des pages (`TetePage`, fiche
  acteur) en prend le fond pâle et un filet ; le menu montre chaque pictogramme à la couleur de
  sa rubrique et l'entrée active sur son fond pâle ; l'accueil a une tuile par rubrique.
  Hors rubrique (accueil, communes, à propos), la prairie reste la couleur de l'identité.
- **Une couleur et un pictogramme par type d'événement** (jetons `--type-<type>`, classe
  `type-<type>`, composant `EtiquetteType`) : l'étiquette du type remplace la mention grise en
  pied de carte, et l'illustration (ciel, collines, sol) prend la teinte du type. Les types
  « rencontres » (formation, conférence, réunion publique) partagent l'ardoise.
- **Nouveau type `velorution`** : les vélorutions et masses critiques étaient classées
  « sortie » ; elles ont leur couleur (myrtille), leur pancarte et leur pictogramme (porte-voix).
- **Pratique VTT en vert forêt**, texte blanc, au lieu de la colline pâle peu visible.
- La couleur n'est jamais le seul repère : le nom est toujours écrit, avec un pictogramme.
  Contrastes AA vérifiés dans les deux thèmes (texte blanc ≥ 6,2:1 sur les types en clair,
  texte foncé ≥ 7,9:1 en sombre ; couleurs de rubrique ≥ 5,2:1 sur surface et fond pâle).

## Conséquences

- Une nouvelle rubrique s'ajoute dans `src/config/rubriques.ts` avec ses deux jetons, son
  pictogramme dans `Icone` et sa règle `[data-rubrique]` dans `src/styles/base.css`.
- Un nouveau type d'événement demande un jeton `--type-<type>` (clair et sombre), une classe
  `type-<type>` et un pictogramme : `Icone` refuse au typage un type sans pictogramme.
