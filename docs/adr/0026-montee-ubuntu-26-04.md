# 0026 — Montée des runners GitHub Actions vers Ubuntu 26.04

- Statut : acceptée
- Date : 2026-10-14
- Remplace : l'image `ubuntu-24.04` fixée par 0023 (la règle d'une image
  explicite et unique reste en vigueur)

## Contexte

L'ADR 0023 fige les runners sur `ubuntu-24.04` pour ne pas subir la migration de `ubuntu-latest`
vers Ubuntu 26.04, annoncée par GitHub à partir du 19 octobre 2026. Ubuntu 26.04 est une version
LTS, maintenue plus longtemps que la 24.04 ; il faudra y passer tôt ou tard, de préférence par une
décision explicite et vérifiée.

## Vérification (14 octobre 2026)

La CI complète a tourné sur `ubuntu-26.04` (pull request #8) et, en parallèle, sur `ubuntu-24.04`
(pull request #7), avec le même code :

| Contrôle                                                                              | ubuntu-24.04  | ubuntu-26.04  |
| ------------------------------------------------------------------------------------- | ------------- | ------------- |
| Lint, typage, tests unitaires (272), build                                            | réussi, 64 s  | réussi, 57 s  |
| Playwright + axe : 134 tests (mobile et bureau, clair et sombre, hors connexion, CSP) | réussi, 85 s  | réussi, 78 s  |
| Lighthouse (seuils bloquants du cahier des charges)                                   | réussi, 196 s | réussi, 187 s |

- `playwright install --with-deps chromium` installe les dépendances système sans avertissement
  de plateforme non prise en charge ; Chromium 156.0.8078.4 sur les deux images.
- Lighthouse trouve le Chrome préinstallé de l'image et respecte les seuils.
- Au cours du même run, les jobs 26.04 ont tourné sur deux versions d'image (20260927 et 20261012) : GitHub déploie encore l'image, ce qui n'a eu aucun effet sur les résultats.

## Décision

- Passer tous les jobs à **`runs-on: ubuntu-26.04`**, après la fusion de la pull request #7.
- Garder la règle de l'ADR 0023 : image versionnée, identique pour tous les jobs, vérifiée par
  `tests/unit/workflows.test.ts`.

## Conséquences

- Environnement de CI sur la LTS la plus récente, sans changement subi le 19 octobre.
- Retour arrière simple si une régression apparaît : rétablir `ubuntu-24.04` (une ligne par job)
  par une pull request, tant que GitHub fournit cette image.
- Prochaine montée : même démarche (CI complète sur les deux images, ADR).
