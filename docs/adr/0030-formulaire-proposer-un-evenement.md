# 0030 — Formulaire public « Proposer un événement »

- Statut : proposée
- Date : 2026-10-16

## Contexte

Le cahier des charges prévoit un formulaire public pour proposer un événement, modéré avant
publication, qui arrive dans la même file que le travail des agents : une issue GitHub
étiquetée, traitée par l'agent `propositions`. L'anti-spam retenu est Cloudflare Turnstile et
un champ piège. L'ADR 0018 fixe le sort des données personnelles : rien dans l'issue publique,
l'adresse de l'auteur transmise à part par e-mail. Le site reste statique, sous CSP stricte.

## Décision

- **Page statique** `/agenda/proposer/`, formulaire HTML classique (`method="post"`) vers une
  **fonction Cloudflare Pages** `functions/api/proposer-evenement.ts`, qui répond par une
  redirection 303 vers `/agenda/proposer/merci/` ou `/agenda/proposer/erreur/#<cause>`.
- **Logique dans `src/lib/formulaire/`**, testée : lecture des champs, validation (dont le
  schéma de l'agenda, pour que la future fiche soit valide), refus de tout e-mail ou numéro de
  téléphone dans les champs publics, rédaction de l'issue, message de transmission, appels à
  Turnstile et à GitHub avec `fetch` injecté. La fonction ne fait que brancher Cloudflare.
- **Issue** : titre `[Événement] …`, étiquettes `proposition` et `evenement` (celles du modèle
  d'issue), champs de la fiche en YAML (`source: formulaire`, `statut: a_valider`) et
  description citée dans des blocs de code : aucun texte saisi n'est interprété (lien, mention,
  HTML). Jamais l'adresse de l'auteur.
- **Turnstile chargé à la demande**, au premier champ touché, en rendu explicite : aucune
  requête vers Cloudflare pour qui lit seulement la page. La CSP autorise
  `https://challenges.cloudflare.com` en `script-src` et `frame-src`, sur tout le site (la
  surcharge d'un en-tête par chemin dans `_headers` est moins prévisible) ; seul ce formulaire
  charge le script.
- **Champ piège** `site_web`, hors écran et hors tabulation : rempli, la fonction répond comme
  pour un envoi réussi et ne crée rien.
- **Secrets** dans les variables de la fonction (Cloudflare), jamais dans le dépôt :
  `TURNSTILE_SECRET_KEY`, `GITHUB_TOKEN` (jeton à grain fin limité au dépôt, droit Issues),
  `ADRESSE_ADMINISTRATEUR` et la liaison `send_email` `COURRIEL`. La clé de site Turnstile,
  publique, est lue au build dans `PUBLIC_TURNSTILE_SITE_KEY` ; sans elle, la clé de test de
  Cloudflare est utilisée et la vérification échoue en production.
- **Journal** de la fonction : noms des champs refusés et numéros d'issue seulement.

## Conséquences

- Sans JavaScript, la vérification anti-robot ne peut pas aboutir : la page d'erreur
  l'explique. Le modèle d'issue GitHub reste ouvert aux contributeurs qui ont un compte.
- Les erreurs de saisie détectées par la fonction mènent à une page d'explication générale, pas
  à un message par champ : les contrôles du navigateur (`required`, `type="url"`, longueurs)
  arrêtent la plupart des erreurs avant l'envoi.
- Les formulaires « Référencer ma structure » et « Corriger une fiche » réutiliseront la même
  chaîne (`src/lib/formulaire/`, une fonction par formulaire).
- Mise en service : [docs/runbooks/activer-le-formulaire.md](../runbooks/activer-le-formulaire.md).
