---
name: evaluer-source
description: Évaluer une source de veille — accessible, datée, fiable, et autorisant la reprise d'un résumé avec lien — puis mettre à jour son champ fiabilite (et notes) dans data/sources.yaml, ou proposer son retrait. Utilisé par les agents de veille et par maintenance-annuaire.
---

# Évaluer une source

## Grille

| Critère    | Question                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accessible | La page ou le flux répond-il (HTTP 200) ? Protection anti-robots (403, 402, 429) à noter.                                                              |
| Datée      | Chaque information porte-t-elle une date de publication ?                                                                                              |
| Fiable     | Émetteur identifié (organisme officiel, association, média reconnu) ? Informations vérifiables ailleurs ? Corrections publiées ?                       |
| Reprise    | Les mentions légales ou conditions d'utilisation interdisent-elles la reprise d'un résumé avec lien ? Le `robots.txt` interdit-il l'accès automatisé ? |
| Utile      | A-t-elle fourni au moins une information retenue dans les trois derniers mois ?                                                                        |
| Licence    | Pour une source de **données** (annuaire), sa licence est-elle compatible avec l'ODbL ?                                                                |

## Niveaux de `fiabilite`

- `haute` : organisme officiel ou acteur de référence, informations datées et vérifiables.
- `moyenne` : émetteur identifié, informations parfois imprécises ou non datées.
- `faible` : émetteur peu identifiable, erreurs constatées ; à recouper systématiquement.
- `inconnue` : pas encore évaluée.

## Mise à jour

- Modifier `fiabilite` et compléter `notes` (motif court, date de l'évaluation) dans
  `data/sources.yaml`.
- **Reprise interdite** (conditions d'utilisation ou `robots.txt`) : retirer la source du
  carnet et l'expliquer dans la pull request.
- **Inaccessible** trois passages de suite : le signaler ; proposer une adresse de remplacement
  si elle existe.
- **Nouvelle source** : l'ajouter avec tous les champs, `fiabilite: inconnue` puis évaluée,
  `dernier_passage: null` ; une source locale porte son `departement`.

`pnpm verify` valide le carnet (schéma, pas de doublon).
