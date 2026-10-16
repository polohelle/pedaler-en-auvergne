# Activer le formulaire « Proposer un événement »

Le formulaire est en ligne dès la fusion, mais il refuse tout envoi tant que les réglages
ci-dessous ne sont pas faits (ADR 0030). Aucune de ces valeurs ne va dans le dépôt.

## 1. Turnstile

1. Tableau de bord Cloudflare → **Turnstile** → **Ajouter un widget**.
2. Nom « Pédaler en Auvergne », domaines `pedalerenauvergne.fr` et
   `pedaler-en-auvergne.pages.dev` (aperçus), mode **Géré**.
3. Noter la **clé de site** (publique) et la **clé secrète**.

## 2. Jeton GitHub

1. GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate new token.
2. Dépôt : `polohelle/pedaler-en-auvergne` seulement ; permission **Issues : Read and write** ;
   rien d'autre. Expiration : un an, avec un rappel pour le renouveler.

## 3. Variables du projet Cloudflare Pages

Projet Pages → **Settings** → **Variables and Secrets**, pour **Production** (et **Preview**
si l'on veut tester sur les aperçus) :

| Nom                         | Type   | Valeur                                      |
| --------------------------- | ------ | ------------------------------------------- |
| `PUBLIC_TURNSTILE_SITE_KEY` | texte  | clé de site Turnstile (lue au build)        |
| `TURNSTILE_SECRET_KEY`      | secret | clé secrète Turnstile                       |
| `GITHUB_TOKEN`              | secret | jeton de l'étape 2                          |
| `ADRESSE_ADMINISTRATEUR`    | secret | adresse qui reçoit les adresses des auteurs |

Relancer ensuite un déploiement : la clé de site est intégrée à la page au build.

## 4. Transmission de l'adresse des auteurs (ADR 0018)

1. Cloudflare → domaine `pedalerenauvergne.fr` → **Email** → **Email Routing** : l'activer et
   vérifier l'adresse de l'administrateur comme destination.
2. Projet Pages → **Settings** → **Bindings** → ajouter une liaison **Send Email** nommée
   `COURRIEL`, destination l'adresse vérifiée.

Sans cette étape, les propositions arrivent quand même en issue, mais l'adresse laissée par
l'auteur n'est transmise nulle part (le journal de la fonction le signale, sans l'adresse).

## 5. Vérifier

1. Sur le site, proposer un faux événement daté de l'an prochain, avec votre adresse.
2. Une issue `[Événement] …` étiquetée `proposition` apparaît, sans votre adresse ; un e-mail
   « Proposition d'événement #N » arrive, avec l'adresse en « Répondre à ».
3. Fermer l'issue de test et supprimer l'e-mail.
