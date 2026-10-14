# 0020 — Déclencheurs de la CI : pull requests et main

- Statut : acceptée
- Date : 2026-10-14
- Remplace : la partie « Déclenchement » de 0009

## Contexte

L'ADR 0009 lançait la CI à chaque push sur toute branche, et n'exécutait les événements
`pull_request` que pour les forks (jobs conditionnés par `if`). Sur les premières pull requests,
chaque contrôle apparaît alors deux fois sous le même nom : « réussi » (exécution `push`) et
« ignoré » (exécution `pull_request`). GitHub considère un job ignoré par condition comme un
succès : une fois la protection de `main` activée, ce doublon pourrait satisfaire un contrôle
obligatoire même si l'exécution réelle avait échoué.

## Décision

- La CI se déclenche sur **toute pull request** (branches du dépôt, agents, Dependabot, forks),
  sur **chaque push vers `main`**, et à la demande (`workflow_dispatch`).
- Plus aucune condition `if` sur les jobs : chaque commit contrôlé a un seul jeu de contrôles,
  tous réellement exécutés.
- Les messages de commit sont vérifiés sur l'intervalle exact de la pull request (de sa base à
  sa tête).

## Conséquences

- Une branche poussée sans pull request n'est plus contrôlée par la CI : les hooks locaux et
  `pnpm verify` restent la première barrière, et ouvrir la pull request (éventuellement en
  brouillon) déclenche les contrôles.
- Les pull requests de forks attendent toujours l'approbation de l'administrateur avant de
  lancer la CI (réglage du dépôt, runbook `proteger-main.md`).
- Les noms des contrôles obligatoires ne changent pas.
