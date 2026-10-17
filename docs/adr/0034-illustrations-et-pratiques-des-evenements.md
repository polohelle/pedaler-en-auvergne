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

- **Champ facultatif `image`** (`src`, `alt`, `credit`, `source_url`), même schéma que les
  actualités (`schemaImage` dans `src/schemas/communs.ts`), fichier dans `public/evenements/`
  nommé d'après la fiche, puisque la CSP n'autorise que les images du site. Elle remplace
  l'illustration sur la carte et sur la fiche, avec la mention « Visuel : crédit (site) ».
- **Affiches officielles reprises sans demande préalable** (choix de l'administrateur, comme
  pour les logos en 0031) : l'affiche ou le bandeau de l'événement publié par l'organisateur
  sur son site peut être repris, avec crédit et lien vers la page d'origine, puisqu'il est fait
  pour être diffusé. Les photos de reportage restent exclues, sauf licence libre ou accord.
  Retrait à la demande par le formulaire de correction.

## Conséquences

- Les agents de collecte renseignent `pratiques` (skill `normaliser-evenement`).
- Le formulaire public ne demande pas encore la pratique : l'administrateur la complète à la
  validation.
- Un nouveau type d'événement doit recevoir son pictogramme.
- Risque, accepté par l'administrateur, qu'un organisateur ou un graphiste conteste la reprise
  d'une affiche : retrait à la demande. Citer la source ne vaut pas autorisation.
- Sans affiche ni photo utilisable, l'illustration dessinée reste l'image de l'événement.
- Le test des contenus vérifie que chaque image existe dans `public/evenements/`, cite sa page
  d'origine, et qu'aucun fichier n'y est sans fiche.
