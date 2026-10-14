# 0010 — Schémas Zod partagés et validation selon le statut

- Statut : acceptée
- Date : 2026-10-14

## Contexte

Le cahier des charges veut une seule source de vérité pour les données, utilisée par le
site, les scripts, les formulaires et les agents. Or l'import OpenStreetMap produit des
fiches incomplètes (pas d'adresse, jamais vérifiées), alors qu'une fiche publiée doit être
complète. Enfin, le dépôt étant public, une fiche publiée incomplète ne doit jamais
atteindre la production.

## Décision

- Les schémas vivent dans `src/schemas/`, sans dépendre d'`astro:content` ; ils importent
  `z` depuis `astro/zod` pour n'avoir qu'une version de Zod. `src/content.config.ts` ne fait
  que les brancher sur les collections.
- Les valeurs fermées viennent de `src/config/`.
- **Acteur** : union discriminée sur `statut`. `publie` exige adresse, code postal, commune et
  `verifie_le` ; `brouillon` et `archive` les rendent facultatifs. Les autres champs
  obligatoires du cahier (nom, slug, catégories, membre, département, coordonnées, source)
  le sont dans tous les cas.
- Objets stricts : une clé inconnue (faute de frappe) est une erreur.
- Règles transverses dans le schéma : collège si et seulement si membre ; fin après début ;
  latitude et longitude ensemble ; brève toujours sourcée ; actu locale avec département ;
  image avec texte alternatif et crédit.
- Les règles hors frontmatter sont dans `src/lib/validation.ts` : description (corps
  Markdown) obligatoire pour un acteur publié, un événement, un article ; nom de fichier
  égal au slug (acteurs) ou préfixé par la date (événements, actus).
- Messages d'erreur de Zod en français (`z.locales.fr`).

## Conséquences

- Une fiche publiée incomplète est bloquée trois fois : par le test de contenu
  (`tests/unit/contenus.test.ts`), par le build Astro (schéma) et par la couche d'accès
  (description manquante).
- Les scripts et les futures fonctions de formulaire valident avec exactement les mêmes
  règles que le site.
- Le champ `agglomeration` prévu pour les déclinaisons « Pédaler à… » s'ajoutera au schéma
  le moment venu, en champ facultatif.
