---
name: ajouter-collection
description: Ajouter une nouvelle collection de contenus (ex. itinéraires, membres, communiqués) de bout en bout — listes fermées, schéma Zod et tests, chargement, accès publié, validation des fichiers, pages, contenus de test, documentation et ADR.
---

# Ajouter une collection

Suivre l'ordre ; chaque étape a ses tests.

1. **Décision** : rédiger un ADR (skill `ecrire-adr`) — besoin, champs, statuts, URL.
2. **Listes fermées** : `src/config/<collection>.ts` (tuples `as const` + `LIBELLES_*` vérifiés
   par `satisfies Record<…>`), ajoutées à `tests/unit/config.test.ts`.
3. **Statuts** : dans `src/config/statuts.ts` ; règle de visibilité dans
   `src/lib/publication.ts` et ses tests.
4. **Schéma** : `src/schemas/<collection>.ts` avec les briques de `communs.ts`
   (`schemaTexte`, `schemaJour`, `schemaDateHeure`, `schemaUrl`…), objet strict, règles
   transverses en `superRefine` ; `src/schemas/<collection>.test.ts` couvrant chaque champ
   obligatoire et chaque règle. Si la collection a un statut publié plus exigeant, union
   discriminée sur `statut` (voir `acteur.ts`).
5. **Chargement** : ajouter la collection dans `src/content.config.ts` (loader `glob`, racine
   `racine`) et le dossier `src/content/<collection>/.gitkeep`.
6. **Validation des fichiers** : ajouter le cas dans `src/lib/validation.ts`
   (`COLLECTIONS`, `descriptionRequise`, convention de nom de fichier) et ses tests ;
   intégrité entre fichiers dans `src/lib/integrite.ts` si la collection référence d'autres
   contenus.
7. **Accès** : fonction dans `src/services/contenus.ts` qui filtre par la règle de visibilité et
   trie.
8. **Pages** : liste et fiche (skill `creer-composant`), déclarées dans `tests/pages.ts`, avec
   des contenus fictifs dans `tests/fixtures/site/<collection>/` couvrant chaque statut.
9. **Service worker** : décider si la liste est précachée (`astro.config.ts`, ADR 0015).
10. **Agents** : mettre à jour les agents et skills concernés et `CLAUDE.md`.
11. **Documentation** : `docs/architecture.md`, README si une commande change.
12. `pnpm verify` et `pnpm test:e2e`, puis un commit `feat(content): …`.
