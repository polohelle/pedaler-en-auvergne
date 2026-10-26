# 0041 — Référencement : plan du site, données structurées et domaine unique

- Statut : acceptée
- Date : 2026-10-26
- Applique : cahier des charges, « Référencement »

## Contexte

Un audit du 26 octobre 2026 relève : aucun plan du site (`/sitemap.xml` en 404), aucune
donnée structurée schema.org, aucune image de partage, le titre Open Graph de l'accueil réduit
à « Accueil », des pages de service (retour de formulaire, hors connexion) indexables, et le
site servi à l'identique sur `pedaler-en-auvergne.pages.dev`, que seule la balise canonique
distingue de `pedalerenauvergne.fr`.

## Décision

- Le plan du site est écrit en fin de build par une petite intégration locale
  (`astro.config.ts`), à partir des pages réellement construites ; la logique est dans
  `src/lib/referencement.ts`. Écarté : `@astrojs/sitemap`, une dépendance de plus pour
  quelques lignes, à filtrer de toute façon.
- Une seule liste des pages non indexables (espace organisateur, hors connexion, retours du
  formulaire) : elles portent `noindex` et sortent du plan du site. La page 404, servie avec
  le statut 404, sort seulement du plan du site. `robots.txt` déclare
  le plan du site.
- Données structurées JSON-LD (`src/lib/donnees-structurees.ts`) : `Event` pour l'agenda,
  `BikeStore`, `SportsClub`, `NGO`, `GovernmentOrganization` ou `LocalBusiness` pour l'annuaire,
  `NewsArticle` pour les actus, `WebSite` pour l'accueil. Elles ne reprennent que ce que la page
  affiche : une structure sans adresse publique ne donne que sa commune (ADR 0025), l'éditeur
  des actus est le site, jamais une personne (ADR 0035). Le bloc `application/ld+json` n'est
  pas exécuté : la CSP sans script en ligne reste intacte.
- Open Graph : titre complet, image de l'affiche ou de la photo quand il y en a une, icône du
  site à défaut ; `og:type` `article` pour les actus.
- Les copies `*.pages.dev` (production et aperçus) reçoivent `X-Robots-Tag: noindex` par
  `public/_headers` : seul `pedalerenauvergne.fr` est indexé.

## Conséquences

- À la mise en ligne, déclarer `https://pedalerenauvergne.fr/sitemap.xml` dans Google Search
  Console et Bing Webmaster Tools.
- Une nouvelle page de service non indexable s'ajoute à la liste de `src/lib/referencement.ts`.
- `tests/e2e/referencement.spec.ts` vérifie plan du site, `noindex` et données structurées.
