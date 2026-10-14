# Ajouter une source de veille

Enrichir `data/sources.yaml` suffit à étendre la veille : les agents lisent ce carnet à chaque
passage.

1. Vérifier que la source est **accessible**, **datée**, **fiable** et qu'elle **autorise la
   reprise d'un résumé avec lien** (mentions légales, `robots.txt`). Grille complète : skill
   `.claude/skills/evaluer-source/SKILL.md`.
2. Chercher un flux RSS (balise `<link rel="alternate" type="application/rss+xml">` dans la
   page, ou `/feed/`, `/rss.xml`) : un flux est plus fiable qu'une page à surveiller.
3. Ajouter l'entrée dans la bonne section de `data/sources.yaml` :

   ```yaml
   - nom: Club cycliste de Riom
     url: https://exemple.fr/agenda
     type: agenda # rss | page | agenda
     niveau: local # local | regional | national
     departement: '63' # null pour regional sans département, et pour national
     acteur: club-cycliste-riom # slug dans l'annuaire, ou null
     fiabilite: inconnue # inconnue | faible | moyenne | haute
     frequence: hebdomadaire # quotidienne | bihebdomadaire | hebdomadaire | mensuelle
     dernier_passage: null
     notes: Calendrier des sorties du club.
   ```

4. `pnpm verify` (le carnet est validé : champs, doublons, acteur existant).
5. Commit `content: ajoute la source <nom>` et pull request.

Retirer une source : supprimer l'entrée et expliquer le motif dans la pull request (reprise
interdite, source morte, fiabilité insuffisante).
