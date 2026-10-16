# 0013 — Interface en CSS natif, sans JavaScript, sous CSP stricte

- Statut : acceptée ; le point sur les polices est remplacé par 0024
- Date : 2026-10-14

## Contexte

Le portail est consulté surtout sur téléphone, parfois sur réseau rural faible. Le cahier
des charges vise l'accessibilité AA, une performance Lighthouse d'au moins 90, une CSP
stricte, et du JavaScript seulement pour la carte, les filtres et la PWA.

## Décision

- **CSS natif** : jetons de conception en variables (`src/styles/tokens.css`), base commune
  (`base.css`), styles propres à un composant dans son `<style>` (portée Astro). Aucun
  framework CSS, aucune police web (pile système).
- **Mobile d'abord** : mise en page fluide (grilles `auto-fit`, `clamp()`), cibles tactiles
  d'au moins 44 px, menu sans JavaScript qui passe à la ligne.
- **Accessibilité** : contrastes AA en mode clair et en mode sombre
  (`prefers-color-scheme`), lien d'évitement, `aria-current` dans le menu, focus visible,
  état « annulé » signalé par un texte et pas seulement par le barré, mouvements réduits
  respectés.
- **Aucun JavaScript** dans les pages squelettes.
- **CSP stricte** dans `public/_headers` : `'self'` uniquement, ni script ni style en ligne
  (`build.inlineStylesheets: 'never'`). Un test parcourt le HTML construit pour le vérifier,
  car `astro preview` n'applique pas `_headers`. En-têtes HSTS, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy` (géolocalisation réservée au site pour la future
  fonction « Autour de moi »), `frame-ancestors 'none'`.
- Les informations légales encore inconnues (RNA, siège, directeur de publication, contact)
  sont des `null` dans `src/config/association.ts` ; les pages affichent une mention neutre,
  jamais une valeur inventée.

## Conséquences

- Toute ressource externe (tuiles de carte, mesure d'audience, Turnstile) devra être
  ajoutée à la CSP par une décision explicite.
- Les règles typées `no-unsafe-return` sont désactivées dans les `.astro` : l'analyseur ne
  résout pas le type des éléments JSX renvoyés par les `.map()` des templates.
