# 0032 — Worker d'envoi de l'e-mail de transmission

- Statut : proposée
- Date : 2026-10-16
- Complète : 0018 (canal de transmission) et 0030 (formulaire)

## Contexte

L'ADR 0018 retient l'envoi d'e-mails de Cloudflare (liaison `send_email`, Email Routing) pour
transmettre à l'administrateur l'adresse de l'auteur d'une proposition. Mise en service le
16 octobre 2026 : le tableau de bord ne propose pas la liaison « Send Email » aux fonctions
Cloudflare Pages, seulement aux Workers. Les propositions arrivaient bien en issue, mais
l'adresse n'était transmise nulle part.

## Décision

- Un **Worker dédié** `workers/courriel/` (`pedaler-courriel`) porte la liaison `send_email`
  `EMAIL`, déclarée dans son `wrangler.toml`. Il reçoit en JSON le numéro et l'adresse de
  l'issue et l'adresse de l'auteur, les valide (`src/lib/formulaire/transmission.ts`) et
  envoie le message de `src/lib/formulaire/courriel.ts`, inchangé.
- La fonction du formulaire l'appelle par une **liaison de service** `COURRIEL`, configurée
  dans le projet Pages. Le Worker n'a **aucune adresse publique** (`workers_dev = false`,
  `preview_urls = false`, aucune route) : seule la fonction peut l'appeler.
- L'adresse de l'administrateur est le **secret** `ADRESSE_ADMINISTRATEUR` du Worker,
  vérifiée dans Email Routing ; elle ne figure ni dans le dépôt ni dans le projet Pages.
- Le Worker est construit par l'**intégration Git de Cloudflare Workers** (répertoire racine
  `workers/courriel`), comme le site par celle de Pages (ADR 0017) : aucun jeton Cloudflare
  dans GitHub.
- Le code du Worker n'importe que des modules sans dépendance (imports relatifs), pour se
  construire sans les modules du site.

## Conséquences

- Un service de plus à surveiller, mais gratuit et sans état. Une panne du Worker n'empêche
  pas la création de l'issue ; la fonction journalise l'échec, sans l'adresse.
- Le tableau de bord ne suffit plus à décrire toute la configuration : la liaison `EMAIL` vit
  dans `workers/courriel/wrangler.toml`.
- Mise en service : [docs/runbooks/activer-le-formulaire.md](../runbooks/activer-le-formulaire.md).
