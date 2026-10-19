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

Le lien part vers l'adresse de l'organisateur, une adresse quelconque : Email Routing ne suffit
pas. Deux solutions ; la fonction prend Brevo si sa clé existe, sinon le Worker.

### Brevo (recommandé, gratuit jusqu'à 300 e-mails par jour)

1. Créer un compte sur [brevo.com](https://www.brevo.com) (offre gratuite).
2. **Expéditeurs, domaines et IP dédiées** → **Domaines** → **Ajouter un domaine** :
   `pedalerenauvergne.fr`, puis **Authentifier** : Brevo affiche des enregistrements DNS (code
   Brevo, DKIM, DMARC). Les ajouter dans Cloudflare → domaine → **DNS** → **Enregistrements**,
   en laissant le **proxy désactivé** (nuage gris), puis revenir sur Brevo et cliquer sur
   **Vérifier**. Garder l'enregistrement SPF existant d'Email Routing ; s'il y en a déjà un,
   y ajouter `include:spf.brevo.com` plutôt que d'en créer un second.
3. **Expéditeurs** → **Ajouter un expéditeur** : nom « Pédaler en Auvergne », adresse
   `formulaire@pedalerenauvergne.fr`.
4. **SMTP et API** → **Clés API** → **Générer une nouvelle clé**, nommée
   « pedaler-en-auvergne ». La copier (elle ne s'affiche qu'une fois).
5. Projet Pages `pedaler-en-auvergne` → **Paramètres** → **Variables et secrets** →
   **Ajouter** : nom `BREVO_API_KEY`, type **Secret**, valeur = la clé, pour **Production**.
   Relancer un déploiement.

### Cloudflare Email Service (sans compte de plus, peut demander l'offre Workers payante)

1. Cloudflare → **Compute** → **Email Service** (ou **Email** → **Email Sending**) : intégrer
   le domaine `pedalerenauvergne.fr` pour l'envoi et ajouter les enregistrements DNS proposés.
2. Le Worker `pedaler-courriel` envoie alors les liens par sa route `/lien-connexion`, avec la
   liaison `COURRIEL` déjà configurée pour le formulaire.

Tant qu'aucune solution n'est en place, la demande de lien affiche « Le lien n'a pas pu être
envoyé ».

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
