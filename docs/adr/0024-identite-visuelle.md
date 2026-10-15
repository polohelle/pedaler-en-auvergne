# 0024 — Identité visuelle « Les Puys », signée d'un tampon

- Statut : acceptée
- Date : 2026-10-15
- Remplace, dans 0013, le seul point « aucune police web (pile système) »

## Contexte

Le site squelette utilisait un vert générique et la pile de polices du système. Le cahier des
charges demande une identité extensible à toute l'Auvergne, déclinable en « Pédaler à… »,
lisible sur téléphone, aux contrastes AA, avec des pages légères. Six pistes ont été comparées
sur maquettes ; l'administrateur a retenu un mélange de « Les Puys » et de « Brevet ».

## Décision

- **Logo** : le profil d'une sortie sur la chaîne des Puys, avec un point pour le cycliste, à
  côté du mot « Pédaler » et du lieu (« en Auvergne », « à Clermont »…). Composant
  `src/components/Logo.astro` ; icônes de l'application régénérées depuis `public/favicon.svg`.
- **Tampon** : un tampon rond de cyclotourisme (`src/components/Tampon.astro`) sert de badge
  « membre » sur les fiches et servira aux déclinaisons « Pédaler à… », avec le numéro du
  département au centre hors Puy-de-Dôme. Il reste rare : le logo principal est le profil.
- **Palette** (`src/styles/tokens.css`) : basalte (texte, bandeau), prairie (liens, membres),
  lave (boutons, tampons), genêt (repères sur le basalte), brume (fond). Chaque couleur de texte
  a son ratio de contraste noté, en clair et en sombre.
- **Polices** : Bricolage Grotesque pour les titres, Source Sans 3 pour le texte, en woff2
  variables auto-hébergées via `@fontsource-variable` (licence SIL OFL 1.1), axe de graisse
  seul. Le navigateur ne télécharge que le sous-ensemble latin utilisé (environ 70 Ko pour les
  deux), `font-display: swap`, pile système en secours. La CSP (`font-src 'self'`) est inchangée.

## Conséquences

- Les nouvelles pages et composants utilisent les jetons, jamais une couleur en dur ; seules
  les couleurs de marque du logo sont fixes.
- Le poids des polices est à surveiller dans Lighthouse ; si besoin, on pourra limiter
  Bricolage Grotesque aux titres principaux.
- Les sections locales « Pédaler à… » réutiliseront `Logo` (prop `lieu`) et `Tampon`.
