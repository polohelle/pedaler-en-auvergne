# 0017 — Déploiement par l'intégration Git de Cloudflare Pages

- Statut : acceptée, version de Node précisée par 0022
- Date : 2026-10-14

## Contexte

Le cahier des charges retient Cloudflare Pages : gratuit, HTTPS, déploiement à chaque fusion sur
`main`, aperçu de chaque pull request. Aucun secret ne doit être stocké dans le dépôt, et la CI
ne doit pas détenir de droits sur l'hébergement si ce n'est pas nécessaire. Le site étant
statique, l'agenda dépend de la date du build.

## Décision

- **Intégration Git native** de Cloudflare Pages (et non un déploiement depuis GitHub Actions
  avec `wrangler`) : Cloudflare lit le dépôt, construit et publie ; aucun jeton Cloudflare dans
  GitHub. Réglages : commande `pnpm build`, sortie `dist`, variables `NODE_VERSION=24` et
  `ASTRO_TELEMETRY_DISABLED=1`. Production sur `main`, aperçu pour toute autre branche.
- **Domaine** `pedalerenauvergne.fr` : enregistré chez o2switch, DNS délégués à Cloudflare,
  domaine personnalisé du projet Pages ; `www` redirigé vers le domaine nu.
- **En-têtes** de sécurité et de cache servis par `public/_headers`.
- **Build quotidien** : la workflow `build-quotidien.yml` appelle chaque matin un crochet de
  déploiement Cloudflare (URL stockée dans le secret GitHub `CLOUDFLARE_DEPLOY_HOOK`), pour que
  les événements passés et les annulations expirées disparaissent sans attendre une fusion. Sans
  secret, la workflow ne fait rien.

## Conséquences

- La mise en production ne dépend pas du résultat de la CI : c'est la protection de `main`
  (contrôles obligatoires avant fusion) qui garantit qu'on ne déploie que du code vérifié.
- Lighthouse passera sur l'URL d'aperçu des pull requests quand le projet Cloudflare existera
  (aujourd'hui sur la build locale, ADR 0009).
- Cloudflare oriente les nouveaux projets vers les Workers avec ressources statiques ; si Pages
  devait être abandonné, la migration ne toucherait que la configuration d'hébergement, le site
  restant un dossier statique.
- Le crochet de déploiement ne permet que de relancer un build : sa fuite n'exposerait rien
  d'autre ; il se régénère dans le tableau de bord Cloudflare.
