# Vérifier et publier une fiche d'acteur

Un brouillon importé d'OpenStreetMap est minimal (ADR 0019) : nom, catégories, commune,
département et `osm_id`. Le publier, c'est le vérifier et le compléter. Durée : 5 à 10 minutes
par fiche.

**Neutralité** : l'annuaire est exhaustif et non commercial. Toute structure qui exerce une
activité vélo dans le périmètre y a sa fiche, qu'il s'agisse d'un indépendant, d'une franchise
ou d'une chaîne nationale (Decathlon, Giant…), avec les mêmes champs et le même traitement.
Aucune fiche n'est mise en avant ni écartée pour sa taille ou son enseigne ; seul le badge
« membre » distingue les adhérents de l'association.

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

## Structure sans adresse d'accueil publique

Atelier mobile, activité à domicile, accueil sur rendez-vous, ou adresse impossible à confirmer :
ne publiez pas l'adresse (ADR 0025). Remplacez adresse et coordonnées par :

```yaml
code_postal: '63000'
sans_adresse_publique: true
zone_intervention: Clermont-Ferrand et sa métropole # facultatif
site: https://exemple.fr # contacts professionnels publics
verifie_le: 2026-10-20
statut: publie
```

La fiche affiche la commune et invite à contacter la structure ; elle n'apparaît pas sur la carte.

Une fiche à ne pas publier (structure fermée, hors périmètre — jamais au motif qu'il s'agit
d'une chaîne) : passer `statut: archive`, ou
supprimer le fichier si elle n'a jamais été publiée.

## Logo de la structure

Facultatif (ADR 0031). Reprendre le logo sur le site ou les réseaux de la structure (ou utiliser
celui qu'elle a fourni), le déposer dans `public/logos/<slug>.svg` (ou `.png`, `.webp`, carré de
160 px au moins), puis :

```yaml
logo:
  fichier: <slug>.svg
  source_url: https://exemple.fr/ # page où le logo a été pris
  origine: site-structure # ou fourni-structure, licence-libre
```

Sans logo, la carte affiche les initiales de la structure. Une structure qui demande le retrait
de son logo l'obtient : supprimer le fichier et le champ `logo`.
