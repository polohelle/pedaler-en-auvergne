# Vérifier et publier une fiche d'acteur

Un brouillon importé d'OpenStreetMap est minimal (ADR 0019) : nom, catégories, commune,
département et `osm_id`. Le publier, c'est le vérifier et le compléter. Durée : 5 à 10 minutes
par fiche.

1. Ouvrir l'objet sur OpenStreetMap : `https://www.openstreetmap.org/<osm_id>` (par exemple
   `https://www.openstreetmap.org/node/123456`). Vérifier sur le site de la structure, ses
   réseaux ou par téléphone qu'elle existe et exerce toujours.
2. Ne retenir que des **coordonnées professionnelles publiques**. Une structure sans local
   commercial (artisan à domicile) : pas d'adresse personnelle ; indiquer la commune et, si elle
   le souhaite, un point de rendez-vous public, ou ne pas publier la fiche.
3. Compléter le fichier `src/content/acteurs/<slug>.md` :

   ```yaml
   adresse: 12 rue du Port
   code_postal: '63000'
   lat: 45.77720 # skill geocoder-adresse, ou « Partager » sur openstreetmap.org
   lon: 3.08700
   services: [reparation-toutes-marques, vae]
   horaires: Tu-Sa 09:00-12:00,14:00-19:00
   site: https://exemple.fr
   telephone: 04 73 00 00 00
   verifie_le: 2026-10-20
   statut: publie
   ```

   puis écrire, sous le frontmatter, une description de deux à quatre phrases (activité,
   public, particularités), avec vos mots.

4. Si la structure est membre de l'association : `membre: true` et son `college`.
5. `pnpm verify` : une fiche publiée incomplète est refusée, avec la liste des champs manquants.
6. Commit `content: publie la fiche <nom>` sur une branche, pull request, vérification de
   l'aperçu, fusion.

Une fiche à ne pas publier (structure fermée, hors périmètre) : passer `statut: archive`, ou
supprimer le fichier si elle n'a jamais été publiée.
