---
name: rediger-synthese
description: Mettre en forme la note de veille hebdomadaire interne docs/veille/AAAA-SS.md — faits marquants locaux et nationaux, appels à projets et dates limites, sujets de plaidoyer, état de la relecture. Utilisé par synthese-hebdo.
---

# Rédiger la note de veille hebdomadaire

## Fichier

`docs/veille/<AAAA>-<SS>.md`, semaine ISO (lundi au dimanche), par exemple
`docs/veille/2026-42.md`.

## Gabarit

```markdown
# Veille de la semaine 42 (12 au 18 octobre 2026)

## L'essentiel

Trois phrases au plus : ce que l'administrateur doit retenir.

## Local et Auvergne

- **<fait>** — une phrase. [contenu](../../src/content/actus/…) · [source](url)

## National, utile aux acteurs locaux

- **<fait>** — une phrase, et ce que cela change localement. [source](url)

## Appels à projets et aides

| Intitulé | Public | Date limite | Source |
| -------- | ------ | ----------- | ------ |

## Agenda des quinze prochains jours

- <date> — <événement>, <commune> (<statut>)

## Sujets de plaidoyer

- Faits de la semaine qui appellent une prise de position de l'association.

## Relecture

- Pull requests d'agents ouvertes : N ; plus ancienne : <date>.
- Points de doute en attente de décision.
```

## Règles

- Faits sourcés uniquement, en lien ; pas de nouvelle recherche, pas d'opinion.
- Dates limites des quinze prochains jours en **gras**.
- Une à deux pages au plus : la note se lit en cinq minutes.
- Aucune donnée personnelle.
