# Protéger la branche `main`

À faire une fois, par l'administrateur, quand le dépôt est public (la protection de
branche est gratuite pour les dépôts publics). Durée : 10 minutes.

## 1. Règle de protection

GitHub → dépôt → **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.

| Réglage                               | Valeur                                                                                                                                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nom                                   | `main`                                                                                                                                                                                 |
| Enforcement status                    | Active                                                                                                                                                                                 |
| Target branches                       | Include default branch                                                                                                                                                                 |
| Restrict deletions                    | coché                                                                                                                                                                                  |
| Block force pushes                    | coché                                                                                                                                                                                  |
| Require a pull request before merging | coché ; _Required approvals_ : 0 (administrateur seul) ; cocher _Dismiss stale pull request approvals when new commits are pushed_ et _Require conversation resolution before merging_ |
| Require status checks to pass         | coché ; cocher _Require branches to be up to date before merging_                                                                                                                      |
| Status checks requis                  | `Lint, typage, tests, build`, `Bout en bout et accessibilité`, `Lighthouse`                                                                                                            |
| Bypass list                           | vide (l'administrateur passe aussi par les PR)                                                                                                                                         |

Les noms des contrôles n'apparaissent dans la liste qu'après une première exécution
de la CI. Si un job est renommé dans `.github/workflows/ci.yml`, mettre la règle à jour.

## 2. Réglages des Actions

**Settings → Actions → General** :

- _Workflow permissions_ : **Read repository contents and packages permissions**
  (les workflows qui écrivent le déclarent eux-mêmes).
- _Allow GitHub Actions to create and approve pull requests_ : **coché** (nécessaire
  à release-please, et plus tard aux agents).
- _Fork pull request workflows_ : **Require approval for first-time contributors**.

## 3. Jeton de release-please (facultatif mais recommandé)

Une pull request ouverte avec le jeton par défaut des Actions ne déclenche pas la CI :
la PR de version de release-please resterait bloquée par la règle ci-dessus.

1. GitHub → photo de profil → **Settings → Developer settings → Fine-grained tokens →
   Generate new token**.
2. _Repository access_ : uniquement `pedaler-en-auvergne`. _Permissions_ :
   **Contents : Read and write**, **Pull requests : Read and write**. Expiration :
   1 an (noter la date de renouvellement).
3. Dépôt → **Settings → Secrets and variables → Actions → New repository secret** :
   nom `RELEASE_PLEASE_TOKEN`, valeur le jeton.

Sans ce secret, le workflow utilise le jeton par défaut : la PR de version est créée
mais sa CI ne tourne pas. On peut alors la mettre à jour manuellement (pousser un
commit vide sur sa branche) pour déclencher les contrôles.

## 4. Vérification

- Tenter `git push origin main` depuis un poste : le push doit être refusé.
- Ouvrir une PR de test : le bouton de fusion reste grisé tant que les trois contrôles
  ne sont pas verts.
