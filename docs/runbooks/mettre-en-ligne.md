# Mettre en ligne publiquement (fin de phase 2)

Liste à cocher avant d'annoncer le site.

## Éditeur et mentions légales

Le site est porté par un éditeur particulier (ADR 0035) : son identité est communiquée à
l'hébergeur, pas publiée. Les pages affichent une mention neutre tant que `email` vaut `null`
dans `src/config/editeur.ts`.

- [ ] Vérifier que le compte Cloudflare (hébergeur) porte bien le nom et l'adresse de l'éditeur.
- [ ] Créer l'adresse `contact@pedalerenauvergne.fr` : Cloudflare → domaine → **Email → Email
      Routing** → règle de transfert vers la boîte de l'administrateur (adresse de destination à
      vérifier). La même boîte reçoit les e-mails des auteurs de formulaires (ADR 0018).
- [ ] Renseigner `email: 'contact@pedalerenauvergne.fr'` dans `src/config/editeur.ts`.
- [ ] Relire la page « Mentions légales et confidentialité » (responsable de traitement,
      contact, conservation des données des formulaires — ADR 0018) et la page « À propos ».

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
