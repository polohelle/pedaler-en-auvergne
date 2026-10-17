---
name: normaliser-evenement
description: Transformer une annonce d'événement brute (page web, agenda, issue de formulaire) en fiche conforme au schéma de src/content/evenements — dates ISO avec fuseau Europe/Paris, type, lieu, tarif, lien d'inscription, source, description rédigée. Utilisé par collecte-evenements et propositions.
---

# Normaliser un événement

## Fichier

`src/content/evenements/<aaaa-mm-jj>-<slug>.md`, où la date est le **jour de début à Paris** et
le slug résume le titre et la commune (`bourse-aux-velos-riom`).

```markdown
---
titre: Bourse aux vélos de printemps
type: bourse
debut: '2027-04-10T09:00:00+02:00'
fin: '2027-04-10T17:00:00+02:00'
lieu: Gymnase Pierre-de-Coubertin
commune: Riom
departement: '63'
lat: 45.8936
lon: 3.1126
organisateur: atelier-velo-riom
tarif: Entrée libre ; dépôt 2 € par vélo
inscription_url: https://exemple.fr/inscription
source_url: https://exemple.fr/agenda/bourse
source: agent
statut: a_valider
---

Description rédigée de 2 à 5 phrases : ce qui se passe, pour qui, ce qu'il faut savoir.
```

## Règles

- **Dates** : ISO 8601 **avec décalage**, **entre guillemets**. Heure d'été (dernier dimanche
  de mars au dernier dimanche d'octobre) : `+02:00` ; heure d'hiver : `+01:00`. Une heure
  inconnue : ne pas l'inventer, demander ou signaler le doute. Une fin inconnue : omettre `fin`.
  Un événement sur plusieurs jours : `debut` le premier jour, `fin` le dernier.
- **Type** (`src/config/evenements.ts`) : `sortie`, `randonnee`, `course`, `bourse`,
  `atelier-reparation`, `formation`, `conference`, `fete-du-velo`, `reunion-publique`. En cas
  d'hésitation, prendre le plus précis et le signaler.
- **Pratiques** (facultatif, ADR 0034) : `route`, `gravel`, `vtt`, `cyclo-cross`, en liste
  (`[route, gravel]` si plusieurs parcours). À renseigner pour toute sortie, randonnée ou course ;
  omettre pour une bourse, un atelier ou une conférence sans pratique précise.
- **Image** (facultatif, ADR 0034) : `image: { src, alt, credit, source_url }`. Autorisé :
  l'affiche ou le bandeau officiel publié par l'organisateur sur son site, une photo sous
  licence libre, ou une image fournie par l'organisateur. Jamais une photo de reportage reprise.
  Fichier copié dans `public/evenements/<nom-de-la-fiche>.webp` (750 px de large au plus) ;
  `alt` décrit l'affiche (date, lieu, l'essentiel) ; `credit` nomme l'organisateur ;
  `source_url` est la page où l'image a été prise. Sans image, l'illustration du type s'affiche.
- **Lieu** : le nom du lieu ou l'adresse ; **commune** officielle ; **departement** déduit de la
  commune (département actif uniquement).
- **Coordonnées** : skill `geocoder-adresse` ; sous le seuil de confiance, omettre `lat`/`lon`.
- **Organisateur** : slug d'un acteur existant de `src/content/acteurs/` ; sinon omettre.
- **Tarif** : en clair (« Gratuit », « 5 € adhérents, 8 € non-adhérents ») ; omettre si inconnu.
- **Source** : `source_url` = page d'origine précise ; `source` = `agent` ou `formulaire`.
- **Statut** : `a_valider`.
- **Description** : rédigée, jamais copiée ; pas de données personnelles (un contact
  professionnel de l'organisateur peut figurer s'il est public).

## Vérification

`pnpm verify` : le test de contenu contrôle schéma, nom de fichier (date du début) et existence
de l'organisateur.
