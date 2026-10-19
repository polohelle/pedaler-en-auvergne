# 0038 — Espace organisateur

- Statut : proposée
- Date : 2026-10-19
- Complète : 0002 (site statique), 0018 (données personnelles), 0030 (formulaire), 0032 (Worker
  d'envoi)

## Contexte

Les clubs et associations qui organisent souvent (sorties hebdomadaires, saisons de courses)
doivent aujourd'hui repasser par le formulaire « Proposer un événement » pour chaque date, sans
pouvoir retrouver ni corriger ce qu'ils ont envoyé. L'éditeur veut leur donner un compte : une
page où créer et gérer leurs événements, avec un calendrier pour choisir une ou plusieurs
dates. Le site est statique (ADR 0002), l'agenda vit dans le dépôt, et toute publication passe
par une relecture humaine.

## Décision

- **Seul `/organisateur/` est dynamique**, servi par une fonction Cloudflare Pages
  (`functions/organisateur/[[chemin]].ts`), comme le formulaire (ADR 0030). La logique est dans
  `src/lib/organisateur/`, testée ; la fonction ne fait que brancher Cloudflare.
- **Base Cloudflare D1** `ORGANISATEURS` (schéma dans `migrations/`) : comptes, liens de
  connexion, sessions et événements en cours. Elle ne publie rien : la fiche publiée reste un
  fichier du dépôt.
- **Connexion par lien envoyé par e-mail**, sans mot de passe : jeton de 256 bits, valable
  30 minutes, à usage unique, dont seule l'empreinte SHA-256 est en base ; la page du lien
  demande un clic (les robots des messageries qui ouvrent les liens ne consomment pas le
  jeton). Turnstile et champ piège sur la demande de lien, trois liens valides au plus par
  adresse, réponse identique que l'adresse ait un compte ou non. Session de 30 jours dans un
  cookie `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax`, en plus d'un contrôle de l'en-tête
  `Origin` sur chaque envoi de formulaire.
- **Envoi du lien par Brevo** (offre gratuite, 300 e-mails par jour), appelé directement par
  la fonction avec le secret `BREVO_API_KEY`. À défaut, par le Worker `pedaler-courriel`
  (ADR 0032), route `/lien-connexion`, ce qui demande l'envoi d'e-mails de Cloudflare (Email
  Service) sur le domaine et peut-être l'offre Workers payante ; Email Routing seul n'écrit
  qu'aux adresses vérifiées.
- **Pages rendues côté serveur, sans JavaScript** : la fonction insère le contenu dans la page
  statique `/organisateur/gabarit/` (mise en page, styles et CSP du site) avec `HTMLRewriter`.
  Le calendrier est une grille de cases à cocher, un mois par bloc, douze mois à partir du mois
  en cours. Toute valeur insérée est échappée (`src/lib/organisateur/html.ts`).
- **Plusieurs dates** : chaque jour coché devient une date de l'agenda, aux mêmes heures ; ou,
  case « un seul événement sur plusieurs jours », des jours consécutifs forment un seul
  événement, du premier jour (heure de début) au dernier (heure de fin).
- **Modération inchangée** : « Envoyer pour publication » crée une issue GitHub `[Événement]`,
  étiquetée comme celles du formulaire, avec une fiche par date (nom de fichier et champs en
  YAML, `source: formulaire`, `statut: a_valider`), chaque fiche validée d'avance par le
  schéma de l'agenda. L'agent `propositions` la traite, l'administrateur fusionne. Une
  modification crée une issue `[Modification]` qui cite la précédente ; une annulation, une
  issue `[Annulation]`.
- **Données personnelles** (ADR 0018) : l'adresse du compte reste dans D1, jamais dans une
  issue, un fichier ou un journal ; l'issue porte le numéro du compte et le nom de structure
  saisi. Pages personnelles en `Cache-Control: no-store` et exclues du service worker.

Écartés : un rendu Astro côté serveur (adaptateur Cloudflare), qui remplace tout le dossier
`functions/` et change la construction de tout le site ; des pages statiques remplies en
JavaScript, contraires à l'ADR 0013 ; un service d'identité tiers (Cloudflare Access, Auth0),
disproportionné pour quelques dizaines de comptes.

## Conséquences

- Une base à créer et à sauvegarder (export D1), un service de plus à surveiller (Brevo, ou
  Email Service qui peut demander l'offre Workers payante).
- Un cookie de session existe désormais : les mentions légales le signalent (cookie
  indispensable au service, sans consentement à recueillir).
- L'espace ne sait pas encore quand un événement est publié : l'organisateur voit « Envoyé
  pour vérification » et le lien vers la demande. Relier l'événement à sa fiche publiée, et
  son compte à sa fiche de l'annuaire, est une évolution possible.
- Les tests bout en bout ne couvrent que les pages statiques de l'espace ; le parcours complet
  (connexion, calendrier, envoi) est testé en unitaire sur une base SQLite avec le schéma réel.
- Mise en service : [docs/runbooks/activer-l-espace-organisateur.md](../runbooks/activer-l-espace-organisateur.md).
