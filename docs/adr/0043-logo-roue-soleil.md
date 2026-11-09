# 0043 — Logo « roue-soleil »

- Statut : acceptée
- Date : 2026-11-05
- Remplace, dans 0024, le seul point « Logo »

## Contexte

Le logo de 0024 (profil d'une sortie sur la chaîne des Puys, un point pour le cycliste) est
sobre mais abstrait : le grand public n'y voit pas forcément un vélo. Le lancement d'un compte
Instagram demande aussi un symbole rond, lisible une fois rogné en cercle. Trois pistes ont été
comparées (roue-soleil, pastille « cycliste des Puys », monogramme « P-roue ») ;
l'administrateur a retenu la roue-soleil, avec la montagne redessinée en puy de Dôme.

## Décision

- **Symbole** : une roue de vélo dont le moyeu est un soleil genêt qui se lève derrière le
  puy de Dôme (dôme, épaule et antenne au sommet), une route en lacets sur son flanc.
- **Mot-marque** inchangé : « Pédaler » et le lieu, en Bricolage Grotesque.
- `src/components/Logo.astro` : la roue (pneu, jante, rayons, antenne) suit la couleur du
  texte pour le mode sombre ; soleil, prairie, collines et route gardent leurs couleurs fixes.
  La prop `variante` rend unique l'identifiant du découpage quand le logo figure deux fois
  dans une page (en-tête et pied).
- `public/favicon.svg` : la roue sur un disque prairie pâle, lisible sur onglet clair ou
  sombre ; icônes de l'application régénérées par `pnpm icones`.
- Le même symbole sert de photo de profil Instagram.

## Conséquences

- Le profil de relief reste un motif décoratif (bandeau d'accueil, pied de page) ; il n'est
  plus le logo.
- Les sections locales « Pédaler à… » réutilisent `Logo` (prop `lieu`), sans changement.
