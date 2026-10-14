# 0018 — Données personnelles des formulaires publics hors du dépôt

- Statut : acceptée (canal de transmission à confirmer en phase 2)
- Date : 2026-10-14

## Contexte

Les formulaires publics (proposer un événement, référencer une structure, corriger ou retirer
une fiche) arriveront en phase 2 sous forme d'une fonction Cloudflare Pages qui crée une issue
GitHub. Le dépôt est **public** : une issue est lisible par tous, indexée par les moteurs de
recherche et conservée dans l'historique même après modification. Pour répondre à l'auteur
d'une proposition, l'administrateur a pourtant besoin de son adresse e-mail.

## Décision

- **L'issue ne contient que le contenu proposé** (l'événement, la structure, la correction),
  jamais l'adresse e-mail, le nom ou le téléphone de l'auteur.
- **L'adresse e-mail de l'auteur est transmise à l'administrateur par un autre canal**, jamais
  écrite dans le dépôt, dans une issue, dans un commentaire ou dans les journaux de la fonction.
  Le message de transmission contient seulement le numéro de l'issue et l'adresse.
- **Canal retenu par défaut** (à confirmer à la mise en œuvre) : l'envoi d'e-mails de Cloudflare
  Email Routing depuis la fonction (liaison `send_email`) vers l'adresse de l'administrateur,
  vérifiée dans Cloudflare. Gratuit, sans sous-traitant supplémentaire, aucune donnée stockée par
  la fonction.
- **Conservation** : l'adresse est supprimée de la boîte de l'administrateur une fois la demande
  traitée (réponse envoyée), au plus tard trois mois après réception ; elle n'est utilisée que
  pour répondre à la proposition.
- La fonction valide les champs avec les schémas Zod partagés, refuse tout champ libre qui
  ressemblerait à une adresse e-mail ou à un numéro de téléphone dans le contenu destiné à
  l'issue, et renvoie des messages d'erreur sans détail interne.
- Les modèles d'issue GitHub (contributeurs ayant un compte) rappellent de ne publier aucune
  donnée personnelle ; l'agent `propositions` ne recopie jamais une donnée personnelle trouvée
  dans une issue et demande à l'administrateur de la masquer.

## Conséquences

- La page « Mentions légales et confidentialité » décrit ce traitement (finalité : répondre ;
  conservation : jusqu'au traitement).
- Le dépôt reste publiable tel quel : aucune donnée personnelle n'y entre par les formulaires.
- Si l'envoi par Cloudflare Email Routing ne convient pas (limites, délivrabilité), un autre canal
  pourra être choisi par un nouvel ADR, à condition de respecter les mêmes règles : hors du dépôt,
  minimisation, suppression après traitement.
