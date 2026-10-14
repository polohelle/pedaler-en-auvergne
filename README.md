# Pédaler en Auvergne

**Le réseau des acteurs du vélo** — portail de l'association Pédaler en Auvergne : annuaire des
acteurs du vélo du Puy-de-Dôme (puis de l'Auvergne), agenda des manifestations, actualités et
présentation de l'association. Site statique Astro, contenus en Markdown dans ce dépôt,
publié sur Cloudflare Pages à chaque fusion sur `main`.

## Installer en cinq minutes

Prérequis : [Node.js 24](https://nodejs.org/) et Git.

```bash
git clone https://github.com/polohelle/pedaler-en-auvergne.git
cd pedaler-en-auvergne
corepack enable          # active la version de pnpm figée dans package.json
pnpm install
pnpm dev                 # http://localhost:4321
```

Pour les tests bout en bout, installer une fois le navigateur : `pnpm exec playwright install chromium`.

## Commandes

| Commande                      | Rôle                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm dev`                    | serveur de développement                                                              |
| `pnpm verify`                 | lint, format, typage, tests unitaires et couverture (à lancer avant chaque commit)    |
| `pnpm test:e2e`               | tests bout en bout et d'accessibilité sur un site construit avec des contenus de test |
| `pnpm lighthouse`             | Lighthouse CI sur la build de production                                              |
| `pnpm build` / `pnpm preview` | build de production dans `dist/` et aperçu local                                      |
| `pnpm import:osm --dry-run`   | plan d'import des acteurs vélo depuis OpenStreetMap                                   |
| `pnpm icones`                 | régénère les icônes de l'application depuis `public/favicon.svg`                      |

## Ajouter ou modifier un contenu

Un fichier Markdown par contenu, validé automatiquement :

- acteur : `src/content/acteurs/<slug>.md` ;
- événement : `src/content/evenements/<aaaa-mm-jj>-<slug>.md` ;
- actualité : `src/content/actus/<aaaa-mm-jj>-<slug>.md`.

Seuls les contenus au statut `publie` apparaissent sur le site. Les champs et les valeurs
autorisées sont décrits dans [docs/architecture.md](docs/architecture.md) et vérifiés par
`pnpm verify` : une fiche publiée incomplète est refusée.

## Documentation

- [Cahier des charges](docs/cahier-des-charges.md)
- [Architecture](docs/architecture.md) et [décisions (ADR)](docs/adr/)
- [Contribuer](CONTRIBUTING.md)
- Exploitation : [déployer](docs/runbooks/deployer.md),
  [protéger main](docs/runbooks/proteger-main.md),
  [mettre en ligne](docs/runbooks/mettre-en-ligne.md),
  [restaurer une version](docs/runbooks/restaurer-une-version.md),
  [ajouter une source de veille](docs/runbooks/ajouter-une-source.md)
- Consignes des agents Claude : [CLAUDE.md](CLAUDE.md), [.claude/](.claude/)

## Licences

Code sous [MIT](LICENSE), textes sous CC BY-SA 4.0, données de l'annuaire sous ODbL 1.0
(dont une partie © contributeurs OpenStreetMap). Le nom et le logo sont exclus. Détail dans
[LICENSES.md](LICENSES.md).
