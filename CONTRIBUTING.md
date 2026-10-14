# Contribuer à Pédaler en Auvergne

Merci de votre intérêt ! Le portail est maintenu par un administrateur bénévole assisté
d'agents Claude : chaque contribution passe par une pull request relue avant publication.

## Proposer un contenu sans coder

- un événement, une structure à référencer, une correction : utilisez les formulaires du site,
  ou les [modèles d'issue](https://github.com/polohelle/pedaler-en-auvergne/issues/new/choose).
- **Le dépôt est public** : n'écrivez aucune donnée personnelle (adresse e-mail ou téléphone
  personnels, adresse de domicile) dans une issue ou une pull request.

## Contribuer au code ou aux contenus

1. Installez le projet (voir le [README](README.md)).
2. Créez une branche depuis `main` : `feat/…`, `fix/…`, `content/…`, `docs/…`.
3. Travaillez par petites étapes ; chaque commit suit les
   [Conventional Commits](https://www.conventionalcommits.org/fr/) en français
   (`feat:`, `fix:`, `content:`, `docs:`, `test:`, `ci:`, `build:`, `chore:`). Les hooks Git
   vérifient le format du message, le lint et le formatage : ne les contournez pas.
4. Lancez `pnpm verify` (et `pnpm test:e2e` si vous touchez l'interface).
5. Ouvrez une pull request vers `main` en remplissant le modèle. La CI doit être verte ; la
   fusion déclenche la mise en ligne.

## Règles de code

Les conventions complètes sont dans [CLAUDE.md](CLAUDE.md), commun aux humains et aux agents.
L'essentiel :

- TypeScript strict, aucun `any` non justifié.
- La logique métier vit dans `src/lib/` en fonctions pures, avec ses tests (couverture ≥ 80 %,
  bloquante). Pages et composants ne font qu'afficher.
- Listes fermées dans `src/config/`, schémas dans `src/schemas/`, accès aux contenus par
  `src/services/contenus.ts` uniquement.
- Accessibilité AA : HTML sémantique, contrastes, clavier ; toute nouvelle page est déclarée
  dans `tests/pages.ts` pour être contrôlée par axe.
- Aucun script ni style en ligne (CSP stricte), JavaScript seulement pour la carte, les filtres
  et la PWA.
- Un choix structurant s'accompagne d'un [ADR](docs/adr/).
- Aucun secret dans le dépôt.

## Règles de contenu

- Toute information reprise cite sa source (`source_url`) et est **rédigée avec vos mots** :
  aucune copie d'article, aucune image sans droits.
- Annuaire : coordonnées professionnelles publiques uniquement.
- Les textes sont publiés sous CC BY-SA 4.0 et les données de l'annuaire sous ODbL 1.0 : en
  contribuant, vous acceptez ces licences.

## Signaler une faille de sécurité

N'ouvrez pas d'issue publique : utilisez le
[signalement privé de vulnérabilité](https://github.com/polohelle/pedaler-en-auvergne/security/advisories/new)
de GitHub.
