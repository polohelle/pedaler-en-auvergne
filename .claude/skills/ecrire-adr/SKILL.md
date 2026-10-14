---
name: ecrire-adr
description: Rédiger une note de décision d'architecture (ADR) courte dans docs/adr/ pour tout choix structurant — numérotation, gabarit Contexte / Décision / Conséquences, statut, remplacement d'une décision antérieure.
---

# Écrire un ADR

## Quand

Tout choix structurant : dépendance majeure, format de données, règle de publication, service
externe, sécurité, organisation du code, écart avec le cahier des charges. Pas pour un détail
d'implémentation réversible en une ligne.

## Fichier

`docs/adr/NNNN-titre-en-kebab-case.md`, où `NNNN` est le numéro suivant le plus élevé
(`ls docs/adr | sort | tail -1`).

## Gabarit

```markdown
# NNNN — Titre de la décision

- Statut : acceptée
- Date : AAAA-MM-JJ

## Contexte

Le problème, les contraintes (cahier des charges, coût, sécurité, accessibilité), en quelques
phrases factuelles.

## Décision

Ce qui est décidé, en liste courte ; les alternatives écartées et pourquoi, si elles éclairent.

## Conséquences

Ce qui devient plus facile ou plus difficile ; ce qu'il faudra surveiller ou revoir.
```

## Règles

- Une page au plus ; en français ; des faits, pas de promesse vague.
- Une décision acceptée n'est jamais réécrite : en créer une nouvelle « remplace NNNN » et passer
  l'ancienne en `Statut : remplacée par MMMM`.
- Statuts : `proposée` (en attente de l'administrateur), `acceptée`, `remplacée par NNNN`.
- Citer l'ADR dans le message de commit ou la pull request qui met la décision en œuvre.
