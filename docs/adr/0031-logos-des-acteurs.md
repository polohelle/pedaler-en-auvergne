# 0031 — Logos des acteurs : seulement avec un droit de reprise, monogramme sinon

- Statut : proposée
- Date : 2026-10-16

## Contexte

L'administrateur souhaite voir le logo des boutiques sur les cartes de l'annuaire. Un logo est
une œuvre et souvent une marque : le reprendre d'un site sans accord contredit la règle « aucune
image reprise sans droits » (CLAUDE.md). La CSP n'autorise que les images servies par le site
(`img-src 'self'`), et l'annuaire doit garder une allure régulière, que la structure ait un logo
ou non.

## Décision

- Champ facultatif `logo` d'une fiche : `fichier` (dans `public/logos/`, nommé d'après le slug),
  `source_url` et `droits` (`accord-structure` ou `licence-libre`, liste fermée de
  `src/config/acteurs.ts`). Un logo n'est retenu qu'avec l'un de ces deux droits ; la fiche en
  cite la source.
- Sans logo, la carte affiche un **monogramme** : les initiales des deux premiers mots
  significatifs du nom (`src/lib/monogramme.ts`), sur l'une de quatre teintes de la palette
  Prairie, tirée du slug pour rester stable. Logo et monogramme sont décoratifs (`alt=""`,
  `aria-hidden`) : le nom est écrit à côté.
- Le logo est servi par le site, sur fond blanc dans les deux modes (`--couleur-fond-logo`) ; la
  CSP ne change pas.
- Le test des contenus vérifie que chaque logo déclaré existe et que `public/logos/` ne contient
  aucun fichier sans fiche, donc sans source ni droits.

Alternative écartée : reprendre les logos des sites des structures, ou via les marques
d'OpenStreetMap (`brand:wikidata`), sans accord. Rapide, mais sans droit établi pour les
boutiques indépendantes, et les logos de chaînes sur Wikimedia Commons ne sont souvent libres
que comme « logo textuel », sous réserve du droit des marques.

## Conséquences

- Les logos arrivent au fil des accords (à demander lors de la vérification d'une fiche ou par
  le formulaire de correction) ; d'ici là, chaque carte a son monogramme.
- Ajouter un logo : déposer le fichier (SVG de préférence, sinon PNG ou WebP carré de 160 px au
  moins) et remplir `logo` ; voir `docs/runbooks/verifier-une-fiche.md`.
