# 0001 — Consigner les décisions dans des ADR

- Statut : acceptée
- Date : 2026-10-14

## Contexte

Le portail est maintenu par un seul administrateur, assisté d'agents Claude, et doit durer.
Les choix structurants doivent rester compréhensibles par quelqu'un qui découvre le dépôt,
humain ou agent, sans dépendre de la mémoire de leur auteur.

## Décision

Chaque choix structurant fait l'objet d'une note courte dans `docs/adr/`, nommée
`NNNN-titre-en-kebab-case.md`, numérotée dans l'ordre, avec quatre rubriques :
Contexte, Décision, Conséquences, et un statut (`proposée`, `acceptée`, `remplacée par NNNN`).

Une décision n'est jamais réécrite : on en crée une nouvelle qui remplace l'ancienne,
et l'on met à jour le statut de cette dernière.

## Conséquences

- L'historique du raisonnement est versionné avec le code.
- Le skill `ecrire-adr` encadre la rédaction pour les agents.
- Une PR qui introduit un choix structurant sans ADR est à corriger avant fusion.
