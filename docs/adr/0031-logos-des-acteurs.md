# 0031 — Logos des acteurs, monogramme à défaut

- Statut : acceptée
- Date : 2026-10-16

## Contexte

L'administrateur souhaite voir le logo des boutiques sur les cartes de l'annuaire. La CSP
n'autorise que les images servies par le site (`img-src 'self'`), et l'annuaire doit garder une
allure régulière, que la structure ait un logo ou non.

## Décision

- Champ facultatif `logo` d'une fiche : `fichier` (dans `public/logos/`, nommé d'après le slug),
  `source_url` et `origine` (`site-structure`, `fourni-structure` ou `licence-libre`, liste
  fermée de `src/config/acteurs.ts`). La fiche cite la source du logo.
- **Pas de demande d'autorisation préalable** (choix de l'administrateur) : le logo d'une
  structure peut être repris de son propre site ou de ses réseaux, pour l'identifier sur sa
  fiche. C'est la seule exception à la règle « aucune image reprise sans droits » (CLAUDE.md).
  Une structure qui demande le retrait de son logo l'obtient par le formulaire de correction.
- Sans logo, la carte affiche un **monogramme** : les initiales des deux premiers mots
  significatifs du nom (`src/lib/monogramme.ts`), sur l'une de quatre teintes de la palette
  Prairie, tirée du slug pour rester stable. Logo et monogramme sont décoratifs (`alt=""`,
  `aria-hidden`) : le nom est écrit à côté.
- Le logo est servi par le site, sur fond blanc dans les deux modes (`--couleur-fond-logo`) ; la
  CSP ne change pas.
- Le test des contenus vérifie que chaque logo déclaré existe et que `public/logos/` ne contient
  aucun fichier sans fiche, donc sans source.

Alternative écartée : demander l'accord écrit de chaque structure avant d'afficher son logo.
Plus sûr juridiquement, mais l'annuaire serait resté presque sans logo.

## Conséquences

- Risque, accepté par l'administrateur, qu'une structure conteste l'usage de son logo : retrait
  à la demande.
- Les logos arrivent au fil des vérifications de fiches ; d'ici là, chaque carte a son
  monogramme. Ajouter un logo : voir `docs/runbooks/verifier-une-fiche.md`.
