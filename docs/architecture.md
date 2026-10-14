# Architecture

Vue d'ensemble technique du portail. Les raisons de chaque choix sont dans les
[ADR](adr/) ; les règles de travail dans [CLAUDE.md](../CLAUDE.md).

## En une image

```
 Agents Claude ─┐                      ┌── tests de contenu, lint, typage (CI)
 Formulaires ───┼─► pull request ─► fusion sur main ─► build Astro ─► Cloudflare Pages
 Administrateur ┘      (relue)               │
                                             ▼
   src/content/*.md ─► src/schemas (Zod) ─► src/services/contenus ─► src/pages ─► HTML statique
   src/config (listes fermées) ┘            (règles de publication)              + sw.js, manifeste
```

Site **statique** (ADR 0002) : ni serveur, ni base de données. Le contenu vit dans Git, un
fichier par acteur, événement et actualité ; la fusion d'une pull request publie.

## Couches du code

| Dossier                                         | Rôle                                                                         | Règle                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------- |
| `src/config/`                                   | listes fermées, identité du site, informations légales                       | une seule définition par liste            |
| `src/schemas/`                                  | schémas Zod partagés (ADR 0010)                                              | sans `astro:content`, importables partout |
| `src/lib/`                                      | logique métier : dates, publication, validation, géographie, slugs, OSM, BAN | fonctions pures, tests ≥ 80 %             |
| `src/services/contenus.ts`                      | seul accès aux collections (ADR 0011)                                        | ne renvoie que le visible, trié           |
| `src/content.config.ts`                         | branche les schémas sur les collections                                      |                                           |
| `src/pages/`, `src/components/`, `src/layouts/` | affichage                                                                    | aucune logique, aucun JS (ADR 0013)       |
| `src/styles/`                                   | jetons et base CSS                                                           | contrastes AA clair et sombre             |
| `scripts/`                                      | outils en ligne de commande (import OSM)                                     | entrées-sorties seulement                 |
| `data/sources.yaml`                             | carnet des sources de veille                                                 | validé par `src/schemas/source.ts`        |

## Modèle de données

Les champs, types et valeurs autorisées font foi dans `src/schemas/` et `src/config/` ; résumé :

- **Acteur** (`src/content/acteurs/<slug>.md`) : nom, slug, catégories, collège (si membre),
  membre, adresse, code postal, commune, département, coordonnées, services, horaires, site,
  e-mail, téléphone, réseaux, source (`osm`, `formulaire`, `agent`, `admin`), `osm_id`,
  `verifie_le`, statut (`brouillon`, `publie`, `archive`). Un brouillon peut être incomplet ;
  un brouillon importé d'OpenStreetMap est minimal (nom, catégories, commune, département,
  `osm_id` — ADR 0019) ; une fiche publiée exige adresse, code postal, coordonnées, vérification
  et description.
- **Événement** (`src/content/evenements/<aaaa-mm-jj>-<slug>.md`) : titre, type, début et fin
  (ISO 8601 avec fuseau), lieu, commune, département, coordonnées, organisateur (slug d'acteur),
  tarif, lien d'inscription, `source_url`, source, statut (`a_valider`, `publie`, `annule`,
  `archive`), description.
- **Actualité** (`src/content/actus/<aaaa-mm-jj>-<slug>.md`) : titre, date, type (`article`,
  `breve`), catégories, résumé, département, `source_url` et `source_nom` (obligatoires pour une
  brève), image (avec texte alternatif et crédit), portée (`local`, `auvergne`, `national`),
  statut (`brouillon`, `publie`, `archive`).
- **Source de veille** (`data/sources.yaml`) : nom, URL, type, niveau, département, acteur,
  fiabilité, fréquence, dernier passage, notes.

## Règles de publication

- Acteurs et actualités : visibles si `publie`.
- Événements : visibles si `publie`, ou `annule` jusqu'à leur dernier jour (affichés barrés avec
  la mention « Annulé ») ; les listes ne montrent que les événements à venir ; l'agent de
  maintenance archive les événements passés.
- « Maintenant » est l'heure du build : un build quotidien planifié garde l'agenda à jour.

Une fiche publiée incomplète est bloquée trois fois : test de contenu (`tests/unit/contenus.test.ts`),
build Astro (schéma), couche d'accès (description manquante).

## Dates et géographie

- Dates stockées en ISO 8601 avec décalage, affichées en Europe/Paris par `src/lib/dates.ts`
  (ADR 0006).
- Départements dans `src/config/departements.ts` : 63 actif ; 03, 15 et 43 déclarés. Les URL ne
  contiennent pas de département. Les schémas refusent des coordonnées hors d'Auvergne et un code
  postal d'un autre département.

## Sorties du build

HTML statique (`dist/`), `sw.js` et manifeste de l'application (ADR 0015), icônes, `_headers`
(CSP stricte et en-têtes de sécurité). Flux RSS, iCal, GeoJSON, plan du site et pages par commune
arrivent avec les phases suivantes.

## Qualité et CI

- `pnpm verify` : ESLint strict typé, Prettier, `astro check` et `tsc`, Vitest avec couverture
  bloquante (ADR 0005, 0007).
- `pnpm test:e2e` : Playwright sur un site construit avec les contenus fictifs de
  `tests/fixtures/site/` (ADR 0008, 0014) — parcours, règles de publication, hors connexion,
  axe sur chaque modèle de page en clair et en sombre, absence de script et de style en ligne.
- CI GitHub Actions (ADR 0009) : qualité → bout en bout et accessibilité → Lighthouse
  (seuils bloquants). Dependabot hebdomadaire, release-please pour le CHANGELOG et les tags.

## Données externes

| Service                                | Usage                         | Où                                                 |
| -------------------------------------- | ----------------------------- | -------------------------------------------------- |
| API Overpass (OpenStreetMap)           | amorçage de l'annuaire        | `scripts/import-osm.ts`, `src/lib/osm/` (ADR 0012) |
| Base Adresse Nationale (Géoplateforme) | géocodage, commune d'un point | `src/lib/ban.ts`, skill `geocoder-adresse`         |

Toute réponse externe est validée par Zod avant usage.

## Agents

Règles communes dans `CLAUDE.md`, sous-agents dans `.claude/agents/`, savoir-faire partagés dans
`.claude/skills/`, garde-fous dans `.claude/settings.json` (ADR 0016). Aucun agent ne publie :
ils ouvrent des pull requests que l'administrateur relit.

## Extension à l'Auvergne

Ouvrir un département : le passer `actif` dans `src/config/departements.ts`, ajouter ses sources
dans `data/sources.yaml`, lancer `pnpm import:osm --departement <code> --dry-run`. Aucun
changement de code ni d'URL n'est nécessaire.

## Décisions

| ADR                                                     | Sujet                                |
| ------------------------------------------------------- | ------------------------------------ |
| [0001](adr/0001-consigner-les-decisions.md)             | Consigner les décisions              |
| [0002](adr/0002-astro-statique.md)                      | Site statique Astro                  |
| [0003](adr/0003-pnpm-node-typescript.md)                | pnpm, Node 24, TypeScript            |
| [0004](adr/0004-licences.md)                            | Licences                             |
| [0005](adr/0005-qualite-du-code.md)                     | Lint, formatage, hooks               |
| [0006](adr/0006-dates-et-fuseau.md)                     | Dates et fuseau                      |
| [0007](adr/0007-tests-unitaires.md)                     | Tests unitaires                      |
| [0008](adr/0008-tests-bout-en-bout-et-accessibilite.md) | Tests bout en bout et accessibilité  |
| [0009](adr/0009-chaine-ci.md)                           | Chaîne CI                            |
| [0010](adr/0010-schemas-partages.md)                    | Schémas partagés                     |
| [0011](adr/0011-acces-au-contenu-et-publication.md)     | Accès au contenu et publication      |
| [0012](adr/0012-import-osm.md)                          | Import OpenStreetMap                 |
| [0013](adr/0013-interface-css-natif-sans-javascript.md) | Interface, CSS, CSP                  |
| [0014](adr/0014-contenus-de-test.md)                    | Contenus de test                     |
| [0015](adr/0015-pwa.md)                                 | Application installable              |
| [0016](adr/0016-agents-et-skills.md)                    | Agents et skills                     |
| [0017](adr/0017-deploiement-cloudflare-pages.md)        | Déploiement                          |
| [0018](adr/0018-donnees-des-formulaires.md)             | Données personnelles des formulaires |
