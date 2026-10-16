# 0027 — Pages de l'association : textes provisoires, collège Cyclistes et liens HelloAsso

- Statut : proposée
- Date : 2026-10-16

## Contexte

Le cahier des charges prévoit une partie association (présentation, charte, gouvernance par
collèges, membres par collège, adhésion et dons via HelloAsso, contact). Le projet de statuts
ajoute un collège Cyclistes pour les particuliers, alors que l'annuaire ne contient que des
structures et aucune donnée de particulier. Les statuts ne sont pas encore adoptés et la campagne
HelloAsso n'existe pas encore.

## Décision

- Une rubrique `/association/` de six pages, avec un menu secondaire défini par
  `PAGES_ASSOCIATION` (`src/config/association.ts`) et un gabarit commun
  (`src/layouts/Association.astro`).
- Les collèges de l'association (`COLLEGES_ASSOCIATION`) englobent ceux de l'annuaire
  (`COLLEGES`) et ajoutent `cyclistes`. Le champ `college` d'une fiche acteur ne peut pas valoir
  `cyclistes` : la liste des membres vient du badge « membre » de l'annuaire, et le collège
  Cyclistes y figure sans aucun nom.
- Tant que `ASSOCIATION.statutsAdoptesLe` vaut `null`, chaque page de la rubrique affiche un
  bandeau « association en cours de création » ; le barème de cotisation est présenté comme
  proposé.
- Les adresses HelloAsso (`ASSOCIATION.helloasso.adhesion` et `.don`) sont des constantes de
  configuration, pas des variables d'environnement : elles sont publiques et relues en pull
  request. `null` affiche une mention neutre ; une adresse qui ne commence pas par
  `https://www.helloasso.com/associations/` fait échouer les tests et le build. Un simple lien
  est préféré à l'intégration du formulaire HelloAsso, qui demanderait une iframe et un
  assouplissement de la CSP.

## Conséquences

- Adopter les statuts ou ouvrir la campagne HelloAsso se fait en une ligne de configuration
  (runbook `mettre-en-ligne.md`).
- Les textes des pages reprennent le projet de statuts : ils sont à relire si l'assemblée
  constitutive le modifie.
- Le nombre d'adhérents particuliers n'est pas affiché ; il pourra l'être, sans nom, si
  l'association le souhaite.
