# 0045 — Un site plus humain et chaleureux

- Statut : acceptée
- Date : 2026-11-19
- Complète 0024 (identité « Les Puys ») et 0039 (couleurs des rubriques), sans les remplacer

## Contexte

Le site était juste, accessible et cohérent, mais l'administrateur le trouvait « sans vie ».
Deux relectures (design web, marketing éditorial) ont convergé : neutres gris-bleu froids, un
seul modèle de carte plate, un bandeau d'accueil qui répète le nom du site, et surtout un
texte sans voix, au « nous » institutionnel, alors qu'une seule personne porte le site
(0035), avec le mot « réseau » qui laisse croire à une association.

## Décision

- **Neutres chauds** : fond papier crème, surface à peine teintée, bordures foin ; en sombre,
  vert-brun profond. Les couleurs de rubrique, de type et de pratique ne changent pas. Toutes
  les paires de texte restent AA (ratios notés dans `tokens.css`).
- **Profondeur et douceur** : rayons agrandis, ombres teintées de terre (`--ombre-1`,
  `--ombre-2`), carte qui se soulève au survol (translation seulement sans
  `prefers-reduced-motion`), boutons en pastille, bouton secondaire `bouton-contour`,
  `surtitre` à la couleur de la rubrique.
- **Bandeau d'accueil vivant** : un titre qui parle au lecteur, une accroche à la première
  personne, deux actions, des chiffres réels recomptés à chaque construction
  (`src/lib/accueil.ts`), et un relief en trois plans où un soleil genêt se lève derrière le
  puy et un cycliste passe, en écho au logo (0043).
- **Courbes de niveau** en filigrane (`public/motifs/courbes.svg`, masque CSS) dans le
  bandeau et la tête des pages et des fiches, à 8-9 % d'opacité, jamais sous un texte à
  contraste limite.
- **Mot de saison** sur l'accueil, choisi par le mois à Paris (`motDeSaison`) : un conseil
  pratique, sans date ni promesse.
- **Voix** : vouvoiement du lecteur, « je » pour l'éditeur, plus de « nous » ; slogan
  « Les adresses, les rendez-vous et les routes du vélo ». Aucun nom, aucune photo de l'éditeur, aucun témoignage
  inventé, aucun chiffre écrit en dur.

## Conséquences

- Les textes des pages et des formulaires parlent à la première personne ; un nouveau texte
  suit cette voix.
- L'image Instagram (`src/lib/instagram.ts`) garde ses couleurs : elle a sa propre charte.
- Pas de photo, de police supplémentaire ni de JavaScript : la chaleur vient des neutres, du
  dessin et des mots.
