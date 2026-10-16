# 0029 — Carte de l'annuaire : Leaflet à la demande, fond Plan IGN

- Statut : proposée
- Date : 2026-10-16

## Contexte

Le cahier des charges prévoit une carte Leaflet de l'annuaire, avec regroupement des points, sur
un fond OpenStreetMap servi par « un fournisseur de tuiles qui autorise ce trafic ». Les tuiles
d'openstreetmap.org sont réservées à un usage modéré et interdisent l'usage intensif ; la plupart
des fournisseurs OSM gratuits demandent une clé et plafonnent le trafic. Le site vise Lighthouse
≥ 90 sur mobile et une CSP stricte (ADR 0013).

## Décision

- **Leaflet 1.9 et Leaflet.markercluster 1.5**, chargés seulement quand le visiteur clique sur
  « Afficher la carte » : la page de l'annuaire reste légère et sans JavaScript tant que la carte
  n'est pas ouverte.
- **Fond Plan IGN v2 de la Géoplateforme** (`data.geopf.fr`, WMTS) : gratuit, sans clé ni
  inscription, sous Licence ouverte, prévu pour les sites publics, et précis pour la France.
  Seul l'hôte `https://data.geopf.fr` est ajouté à `img-src` dans `public/_headers`.
- **Points** : `/annuaire.geojson`, généré au build à partir des fiches publiées
  (`src/lib/geojson.ts`) ; une fiche sans adresse publique (ADR 0025) n'a pas de point.
- **Marqueurs** dessinés en CSS (aucune image), focalisables au clavier et nommés ; infobulle
  construite sans `innerHTML`.
- **La liste reste l'accès complet** : la carte en est une autre vue, jamais le seul accès.
- Attribution affichée sur la carte : IGN pour le fond, contributeurs OpenStreetMap (ODbL) et
  Pédaler en Auvergne pour les données.

Alternative écartée : un fond OpenStreetMap via un fournisseur gratuit avec clé (MapTiler,
Stadia, Thunderforest). Il imposerait une clé visible dans le code public, un quota et un compte à
gérer. Elle reste possible si l'association préfère le rendu OSM : seul `src/config/carte.ts` et
la CSP changent.

## Conséquences

- La carte demande une connexion ; hors connexion, un message l'indique et la liste reste
  consultable.
- Le fond n'est pas OpenStreetMap, contrairement à la lettre du cahier des charges : choix à
  confirmer par l'administrateur.
- Les filtres synchronisés entre la carte et la liste viendront dans une étape suivante.
