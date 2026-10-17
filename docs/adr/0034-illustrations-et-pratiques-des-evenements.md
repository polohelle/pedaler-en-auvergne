# 0034 — Illustrations et pratiques des événements

- Statut : acceptée
- Date : 2026-10-17

## Contexte

L'administrateur souhaite plus d'images dans l'agenda et veut repérer d'un coup d'œil, dans la
liste, les événements route, gravel et VTT. Les photos des organisateurs posent une question de
droits (CLAUDE.md : aucune image reprise sans droits) et la CSP n'autorise que les images
servies par le site.

## Décision

- **Illustration par type** (`src/components/IllustrationEvenement.astro`) : un dessin SVG maison,
  dans le style du logo (relief des Puys, soleil genêt), avec un pictogramme par type (vélo,
  panneau de randonnée, drapeau à damier, étiquette de prix, clé et roue, micro…). Aucun fichier
  à charger, aucun droit à gérer, couleurs tirées des jetons donc lisible en clair et en sombre.
  Décorative (`aria-hidden`) : le type est écrit à côté. Grisée pour un événement annulé. Sur
  la carte, à droite ; sous la pastille de date sur petit écran ; en grand sur la fiche.
- **Logo de l'organisateur** sur la fiche, à côté de son nom (composant `Vignette`, ADR 0031).
- **Champ facultatif `pratiques`** : liste parmi `route`, `gravel`, `vtt`, `cyclo-cross`
  (`src/config/evenements.ts`), plusieurs valeurs quand l'événement propose plusieurs parcours.
  Le cyclo-cross a sa propre valeur : ce n'est ni de la route ni du VTT, et il remplit l'agenda
  d'hiver. Affichée en étiquettes de couleur, toujours avec leur nom (la couleur n'est jamais
  le seul repère), contrastes AA.

- **Champ facultatif `image`** (`src`, `alt`, `credit`), même schéma que les actualités
  (`schemaImage` dans `src/schemas/communs.ts`) : une photo ou une affiche avec droits (licence
  libre ou accord de l'organisateur), copiée dans `public/` puisque la CSP n'autorise que les
  images du site. Elle remplace l'illustration sur la carte et sur la fiche, avec son crédit.

## Conséquences

- Les agents de collecte renseignent `pratiques` (skill `normaliser-evenement`).
- Le formulaire public ne demande pas encore la pratique : l'administrateur la complète à la
  validation.
- Un nouveau type d'événement doit recevoir son pictogramme.
- Sans photo à droits vérifiés, l'illustration dessinée reste l'image de l'événement.
