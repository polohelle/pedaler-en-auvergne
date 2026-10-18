# 0036 — Itinéraires : une carte IGN de tous les parcours, traces sous licence libre

- Statut : proposée
- Date : 2026-10-18

## Contexte

L'administrateur souhaite une rubrique qui répertorie les parcours route, gravel et VTT du
secteur sur une seule carte IGN, avec des filtres pour les trier. Le cahier des charges classait
les itinéraires GPX en phase 4 et demandait d'« agréger plutôt que refaire » : renvoyer vers
les sites existants (E-Rando 63, Komoot, Openrunner) plutôt que copier leurs contenus. Une trace
GPX est une donnée protégée par le droit des bases de données et par les conditions des sites
qui la publient.

## Décision

- **Collection `itineraires`** : `src/content/itineraires/<slug>.md` (pratique, difficulté,
  forme, balisage, commune de départ, structure de l'annuaire, auteur, licence, source, statut
  `brouillon` / `publie` / `archive`) et sa trace `<slug>.gpx` à côté. Distance, dénivelé
  positif et départ sont **calculés à partir de la trace** (`src/lib/gpx.ts`), jamais recopiés.
- **Seules les traces sous licence de réutilisation** sont reprises : Licence Ouverte, ODbL,
  CC0, CC BY, CC BY-SA, ou accord écrit de l'auteur (`src/config/itineraires.ts`). Auteur,
  licence et source sont affichés sur chaque fiche, comme pour les logos (ADR 0031) et les
  photos (ADR 0034). Sans licence, on ne reprend pas la trace : la source reste un renvoi.
- **Une carte unique** sur `/itineraires/`, Leaflet sur fond **Plan IGN v2** de la
  Géoplateforme (même hôte que l'annuaire, ADR 0029, aucune clé), avec photographies aériennes
  et courbes de niveau au choix. Elle est chargée dès l'ouverture de la page, dont elle est
  l'objet. Traces simplifiées (Douglas-Peucker, 15 m) dans `/itineraires.geojson` ; trace
  d'origine téléchargeable en `/itineraires/<slug>.gpx`.
- **Filtres** : pratique, difficulté, distance, dénivelé, commune de départ, boucles et
  parcours balisés. Ils masquent les mêmes parcours sur la carte et dans la liste, et se
  reportent dans l'adresse pour partager une sélection. Logique pure dans
  `src/lib/itineraires.ts`, testée ; formulaire masqué sans JavaScript, où la liste reste
  complète.
- **Couleurs et motifs** : route plein, gravel en tirets, VTT en pointillés, couleurs fixes
  contrastées sur le fond IGN, qui reste clair en mode sombre.
- **Agent `collecte-itineraires`** et skills `importer-trace` et `rediger-itineraire` ; ils ne
  produisent que des brouillons, publiés après le oui de l'administrateur.

## Conséquences

- La rubrique part vide : elle se remplit au rythme des traces dont la licence est vérifiée. Les
  grands sites de parcours (Komoot, Strava, Openrunner, Visorando) n'autorisent pas la reprise et
  restent hors de la carte.
- Le test de contenu vérifie chaque trace (lisible, départ en Auvergne, boucle cohérente) et
  refuse une trace orpheline ; le build échoue sur une trace illisible.
- Écart assumé avec le cahier des charges (phase 4, renvoi) : à confirmer par l'administrateur.
