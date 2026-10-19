# 0037 — Cartes d'événements et barre d'onglets mobile

- Statut : acceptée
- Date : 2026-10-19
- Complète : 0024 (identité « Les Puys »), 0034 (illustrations et pratiques des événements)

## Contexte

L'administrateur aime la présentation de Social Rides (socialrides.cc), un site de sorties vélo
de groupe : cartes de sortie avec un grand visuel en tête, pratique en pastille de couleur,
infos courtes précédées d'un pictogramme, barre d'onglets en bas de l'écran sur mobile. Il
souhaite s'en inspirer, en priorité pour l'agenda, sans reprendre ses textes, logos ni images.

## Décision

- **Carte d'événement en colonne** (`CarteEvenement`) : un bandeau 2:1 (affiche ou illustration
  du type, recadrée) portant en surimpression les pratiques à gauche et la pastille de date à
  droite ; puis le titre, la date et la commune précédées d'un pictogramme, et le type avec le
  tarif sous un filet. Toute la carte mène à la fiche par un lien étendu sur le titre (un seul
  lien lu). Les cartes forment une grille (`.grille-evenements`) dans l'agenda, à l'accueil et
  sur les pages par commune.
- **Agenda groupé par mois** (`grouperParMois` dans `src/lib/dates.ts`), un titre par mois avec
  le nombre d'événements.
- **Pictogrammes au trait** (`Icone`) : dessins maison sur une grille de 24, décoratifs,
  toujours à côté de leur libellé.
- **Navigation** : sur petit écran (< 48rem), le menu devient une barre d'onglets fixée en bas,
  pictogramme au-dessus du libellé, onglet actif signalé par la couleur et un trait ; sur grand
  écran, l'en-tête reste collé en haut sur un fond translucide. Aucun JavaScript.
- L'identité visuelle (couleurs, polices, relief des Puys) ne change pas : on reprend des
  principes de mise en page, pas l'apparence de Social Rides.

## Conséquences

- Le corps de page réserve la hauteur de la barre d'onglets sur mobile ; une future page en
  plein écran (carte) devra en tenir compte.
- Une photo d'événement est recadrée en 2:1 depuis le haut : une affiche montre son titre,
  pas forcément tout son texte, qui reste sur la fiche.
