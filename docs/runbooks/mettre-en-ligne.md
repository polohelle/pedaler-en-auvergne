# Mettre en ligne publiquement (fin de phase 2)

Liste à cocher avant d'annoncer le site.

## Association et mentions légales

- [ ] Association déclarée : renseigner `rna`, `adresse`, `directeurPublication` et `email` dans
      `src/config/association.ts` (les pages affichent sinon une mention neutre).
- [ ] Nom de l'association dans le titulaire du copyright de `LICENSE`.
- [ ] Page HelloAsso créée : renseigner `adhesionUrl` dans `src/config/site.ts`.
- [ ] Relire la page « Mentions légales et confidentialité » (responsable de traitement,
      contact, conservation des données des formulaires — ADR 0018).

## Dépôt et hébergement

- [ ] Dépôt public, protection de `main` active ([proteger-main.md](proteger-main.md)).
- [ ] Projet Cloudflare Pages, domaine et build quotidien ([deployer.md](deployer.md)).
- [ ] Signalement privé de vulnérabilités activé (GitHub → Settings → Code security).

## Contenus

- [ ] Au moins 20 fiches d'acteurs vérifiées et publiées (critère de fin de phase 1).
- [ ] Agenda alimenté pour les semaines à venir.
- [ ] Données issues d'OSM : attribution visible (pied de page, annuaire, fiches).

## Contrôles finaux

- [ ] CI verte sur `main` (qualité, bout en bout et accessibilité, Lighthouse).
- [ ] Agents `audit-accessibilite` et `audit-performance` passés, points bloquants corrigés.
- [ ] Vérifications manuelles : navigation au clavier, lecteur d'écran sur une fiche et
      l'agenda, installation sur Android et iPhone, consultation hors connexion.
