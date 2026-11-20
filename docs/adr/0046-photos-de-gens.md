# 0046 — Photos de gens à vélo

- Statut : acceptée
- Date : 2026-11-20
- Complète 0045 (site plus chaleureux) ; la règle « aucune image reprise sans droits » reste
  entière

## Contexte

Après la refonte de 0045, l'administrateur trouve qu'il manque encore « de vrais humains » :
les illustrations dessinées ne remplacent pas des photos de gens. Le site ne reprend aucune
image sans droits, et une personne reconnaissable a un droit à l'image. L'administrateur a
choisi de commencer par des photos libres, puis de les remplacer au fil de l'eau par les
siennes et par celles que les structures fourniront.

## Décision

- **Sources admises** : photos sous licence libre (CC0, CC BY, CC BY-SA) ou dans le domaine
  public, en priorité prises en Auvergne (Wikimedia Commons, Gallica) ; photos de
  l'administrateur ou d'une structure, avec l'accord écrit de l'auteur et des personnes
  reconnaissables.
- **Une seule définition** : `src/config/photos.ts` (texte alternatif, légende, auteur,
  licence, source, dimensions). Fichiers recadrés et réduits en WebP 640 et 1 200 pixels
  dans `public/photos/`, hors précache du service worker.
- **Crédit toujours visible** sous la photo (`PhotoCreditee.astro`) : légende, auteur,
  licence liée, source liée. Une photo recadrée sous CC BY-SA reste sous CC BY-SA.
- **Emplacements** : bandeau d'accueil, tête de l'agenda, de l'annuaire et des itinéraires
  (prop `photo` de `TetePage`), page À propos.
- **Pas de banque d'images** ni de photo de mise en scène : des gens d'ici, en vrai.

## Conséquences

- Remplacer une photo = déposer les deux fichiers et changer son entrée dans
  `src/config/photos.ts`.
- Une prochaine étape pourra ajouter une photo facultative aux fiches des acteurs, fournie
  par la structure avec son accord.
