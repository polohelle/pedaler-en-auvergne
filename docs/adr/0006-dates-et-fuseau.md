# 0006 — Dates stockées en ISO 8601, affichées en Europe/Paris

- Statut : acceptée
- Date : 2026-10-14

## Contexte

Les événements sont saisis par des agents, des formulaires et l'administrateur, puis
générés sur des machines de CI en UTC. Une date sans fuseau, ou affichée dans le fuseau
de la machine, décale un événement d'une heure ou d'un jour sans que personne ne le voie.
YAML convertit en outre les dates non entourées de guillemets en objets `Date`.

## Décision

- **Stockage** : chaînes ISO 8601 avec décalage explicite, entre guillemets dans le
  frontmatter (`debut: "2026-11-08T09:30:00+01:00"`). Les schémas Zod refusent toute
  date sans décalage et la convertissent en `Date`.
- **Affichage** : un seul module, `src/lib/dates.ts`, fondé sur `Intl.DateTimeFormat`
  avec `timeZone: 'Europe/Paris'`, sans dépendance. Il applique la typographie
  française : « 9 h 30 », « 12 h », « 1er mai ».
- **Comparaisons par jour** (archivage, noms de fichiers) : `jourCivil()` renvoie le jour
  à Paris au format `AAAA-MM-JJ`, jamais le jour UTC.
- `Temporal` n'est pas encore disponible dans Node 24 : à réévaluer quand il le sera.

## Conséquences

- Le résultat ne dépend pas du fuseau de la machine ; les tests le vérifient sous
  plusieurs valeurs de `TZ`.
- Aucun composant ne formate une date lui-même ; la relecture de code le vérifie.
