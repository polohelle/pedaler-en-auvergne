# Déployer sur Cloudflare Pages et relier le domaine

À faire une fois par l'administrateur (ADR 0017). Durée : 30 minutes, plus le délai de
propagation DNS. Aucun jeton n'est à copier dans le dépôt.

## 1. Créer le projet Pages

1. Tableau de bord Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**.
2. Autoriser l'application GitHub de Cloudflare **sur le seul dépôt** `pedaler-en-auvergne`.
3. Réglages de build :

   | Réglage                   | Valeur                                                          |
   | ------------------------- | --------------------------------------------------------------- |
   | Production branch         | `main`                                                          |
   | Framework preset          | Astro                                                           |
   | Build command             | `pnpm build`                                                    |
   | Build output directory    | `dist`                                                          |
   | Variables d'environnement | `ASTRO_TELEMETRY_DISABLED` = `1` (et **pas** de `NODE_VERSION`) |

   **Version de Node** : Cloudflare la lit dans le fichier `.nvmrc` du dépôt, qui fixe une version
   exacte (actuellement **24.21.0**), la même que la CI et les postes de développement (ADR 0022).
   Ne pas définir `NODE_VERSION` : cette variable l'emporte sur `.nvmrc`. Avec `NODE_VERSION=24`,
   Cloudflare installe sa propre 24.x (24.13.1 en octobre 2026), trop ancienne pour certaines
   dépendances (`ERR_PNPM_UNSUPPORTED_ENGINE`). Si la variable a été créée, la supprimer
   (**Settings → Variables and Secrets**) ; à défaut, lui donner exactement la valeur de `.nvmrc`.

4. **Save and Deploy**. Le site répond sur `https://<projet>.pages.dev`.
5. **Settings → Builds → Branch control** : production sur `main`, aperçus pour toutes les autres
   branches. Chaque pull request reçoit un lien d'aperçu.

## 2. Relier le domaine `pedalerenauvergne.fr`

1. Cloudflare → **Add a domain** → `pedalerenauvergne.fr`, offre gratuite. Cloudflare indique
   deux serveurs de noms.
2. Espace client o2switch → domaine → **Serveurs DNS** : remplacer les serveurs d'o2switch par
   ceux de Cloudflare. Attendre l'activation (quelques minutes à 24 h).
3. Projet Pages → **Custom domains → Set up a custom domain** : `pedalerenauvergne.fr`, puis
   `www.pedalerenauvergne.fr`.
4. Rediriger `www` vers le domaine nu : **Rules → Redirect Rules** → si le nom d'hôte est
   `www.pedalerenauvergne.fr`, redirection 301 vers `https://pedalerenauvergne.fr` en conservant
   le chemin.
5. **SSL/TLS** : mode _Full (strict)_ ; **Always Use HTTPS** activé.

## 3. Build quotidien

1. Projet Pages → **Settings → Builds → Deploy hooks → Add deploy hook** : nom
   `build-quotidien`, branche `main`. Copier l'URL.
2. GitHub → dépôt → **Settings → Secrets and variables → Actions → New repository secret** :
   `CLOUDFLARE_DEPLOY_HOOK` = l'URL.
3. Onglet **Actions → Build quotidien → Run workflow** pour vérifier : un déploiement apparaît
   dans Cloudflare.

## 4. Vérifications

```bash
curl -sI https://pedalerenauvergne.fr | grep -iE 'content-security-policy|strict-transport|referrer-policy'
curl -sI https://www.pedalerenauvergne.fr | grep -i location
```

- Les en-têtes de `public/_headers` sont présents.
- Le site s'installe sur un téléphone (menu du navigateur → « Ajouter à l'écran d'accueil ») et
  s'ouvre hors connexion après une première visite.
- Lighthouse depuis Chrome sur la page d'accueil : seuils du cahier des charges atteints.

## 5. Mettre à jour Node

1. Choisir la nouvelle version exacte (dernière version de la ligne LTS en cours) et l'écrire dans
   `.nvmrc`.
2. Si une dépendance exige davantage, relever le plancher du champ `engines.node` de
   `package.json`.
3. `pnpm verify` : le test `tests/unit/version-node.test.ts` vérifie que `.nvmrc`, `engines` et les
   exigences de toutes les dépendances concordent.
4. Pull request : la CI s'exécute avec la nouvelle version, et l'aperçu Cloudflare aussi. Rien à
   changer dans Cloudflare.
