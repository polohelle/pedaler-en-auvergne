# Activer l'espace organisateur

L'espace (ADR 0038) est en ligne dès la fusion, mais il affiche « pas encore ouvert » tant que
la base n'est pas reliée. Il réutilise les réglages du formulaire
([activer-le-formulaire.md](activer-le-formulaire.md)) : Turnstile, jeton GitHub et Worker
`pedaler-courriel` doivent déjà fonctionner. Aucune valeur ci-dessous ne va dans le dépôt.

## 1. Créer la base D1

1. Cloudflare → **Stockage et bases de données** → **D1** → **Créer une base** : nom
   `pedaler-organisateurs`, emplacement Europe de l'Ouest.
2. Dans la base → **Console** : coller tout le contenu de
   [`migrations/0001_espace_organisateur.sql`](../../migrations/0001_espace_organisateur.sql),
   puis **Exécuter**. Les tables `organisateurs`, `jetons_connexion`, `sessions` et
   `evenements` apparaissent.

(En ligne de commande, équivalent : `npx wrangler d1 migrations apply pedaler-organisateurs
--remote` depuis la racine du dépôt.)

## 2. Relier la base au site

Projet Pages `pedaler-en-auvergne` → **Paramètres** → **Liaisons** → **Ajouter** → **Base de
données D1** : nom de variable `ORGANISATEURS`, base `pedaler-organisateurs`, pour
**Production** (et **Preview** si l'on veut tester sur les aperçus, de préférence avec une
seconde base). Relancer ensuite un déploiement.

## 3. Envoyer les liens de connexion

Le lien part du Worker `pedaler-courriel` vers l'adresse de l'organisateur, une adresse
quelconque : Email Routing ne suffit pas, il faut l'envoi d'e-mails de Cloudflare.

1. Cloudflare → **Compute** → **Email Service** (ou **Email** → **Email Sending**) : intégrer
   le domaine `pedalerenauvergne.fr` pour l'envoi et ajouter les enregistrements DNS proposés
   (SPF, DKIM). Selon l'offre du compte, l'envoi vers des adresses non vérifiées peut demander
   l'offre **Workers Paid**.
2. Le Worker se redéploie seul à la fusion (intégration Git) ; sa liaison `EMAIL` reste celle
   de `workers/courriel/wrangler.toml`, sans restriction de destinataire.

Tant que cette étape n'est pas faite, la demande de lien affiche « Le lien n'a pas pu être
envoyé » et le journal du Worker indique le refus.

## 4. Vérifier

1. Ouvrir `/organisateur/connexion/`, saisir votre adresse, valider : un e-mail « Votre lien de
   connexion à l'espace organisateur » arrive.
2. Ouvrir le lien, cliquer sur **Ouvrir mon espace** : le tableau de bord s'affiche.
3. Créer un faux événement daté de l'an prochain, cocher deux dates, **Envoyer pour
   publication** : une issue `[Événement] …` étiquetée `proposition` apparaît, avec deux fiches
   et sans votre adresse.
4. Fermer l'issue de test, supprimer l'événement de l'espace (case de confirmation puis
   **Demander l'annulation** ou **Supprimer**).

## Exploitation

- **Retrouver l'adresse d'un organisateur** (pour lui répondre) : console D1,
  `SELECT courriel FROM organisateurs WHERE id = <numéro de compte de l'issue>;`.
- **Supprimer un compte** à sa demande : `DELETE FROM organisateurs WHERE id = <n>;` (ses
  sessions et événements suivent).
- **Sauvegarde** : D1 garde un historique de 30 jours (Time Travel) ; un export ponctuel se
  fait depuis la console de la base.
