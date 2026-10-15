# 0025 — Fiches d'acteurs sans adresse publique

- Statut : acceptée
- Date : 2026-10-15
- Complète : 0010 (validation selon le statut) et 0019 (brouillons OpenStreetMap minimaux)

## Contexte

Une fiche publiée devait jusqu'ici donner une adresse et une position. Or plusieurs acteurs
vérifiés n'ont pas d'adresse d'accueil publique : atelier de réparation mobile, activité exercée
à domicile, accueil sur rendez-vous, ou local dont l'adresse n'a pu être confirmée. Publier leur
adresse exposerait parfois un domicile, ce que le cahier des charges interdit ; ne pas les
publier rendrait l'annuaire incomplet.

## Décision

- Une fiche publiée peut porter **`sans_adresse_publique: true`**. Elle donne alors sa commune et
  son code postal, et facultativement une **`zone_intervention`** et des contacts professionnels
  publics (site, réseaux).
- Le schéma **interdit** à une telle fiche `adresse`, `lat` et `lon` : l'absence d'adresse est
  garantie, pas seulement permise.
- Les exigences de publication (adresse, code postal, position, `verifie_le`) sont vérifiées
  ensemble, pour signaler tous les manques d'une fiche en une seule fois.
- La fiche affiche « Pas d'adresse d'accueil publique : contactez la structure. » ; elle n'aura
  pas de point sur la carte (phase 2), mais figure dans la liste filtrable.
- Un brouillon importé d'OpenStreetMap ne peut pas porter ce champ : il se décide lors de la
  vérification humaine.

## Conséquences

- Des acteurs sans local public figurent dans l'annuaire sans exposer de donnée personnelle.
- La carte et le futur GeoJSON excluront les fiches sans position ; la liste reste la référence
  complète, conformément à l'exigence d'accessibilité (« la carte n'est jamais le seul accès »).
- Une structure qui communique ensuite une adresse publique repasse en fiche complète en retirant
  le champ et en ajoutant adresse et position.
