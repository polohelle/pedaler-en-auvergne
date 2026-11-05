# 0042 — Compte Instagram : carrousels générés, publication manuelle

- Statut : acceptée
- Date : 2026-11-05
- Applique : cahier des charges, « Référencement » (partage sur les réseaux sociaux)

## Contexte

Le site ouvre un compte Instagram pour relayer l'agenda, les itinéraires, les acteurs et les
actus. Refaire chaque visuel à la main ne tiendrait pas dans la durée, et l'agenda change
chaque semaine. Les règles du dépôt s'appliquent : aucun agent ne publie, seuls les contenus
publiés sont relayés, et les images reprises le sont avec crédit (ADR 0034).

## Décision

- `pnpm instagram` prépare en local le carrousel « Cette semaine à vélo » : une couverture
  puis une diapositive par événement visible de la semaine (9 au plus), en PNG de
  1080 × 1350 px, et la légende dans `legende.txt`. Le dossier `instagram/` n'est pas versionné.
- La logique (choix des événements, légende, gabarits HTML) est dans `src/lib/instagram.ts` ;
  le script ne fait que lire les contenus et capturer les diapositives avec Playwright, déjà
  présent pour les tests. Les gabarits reprennent polices, logo et couleurs des types
  (ADR 0024, 0039) ; l'affiche d'un événement y figure avec son crédit.
- L'organisateur est tagué quand sa fiche donne un lien Instagram dans `reseaux`.
- La publication reste manuelle : l'administrateur relit le lot et le programme dans Meta
  Business Suite. Écarté pour l'instant : la publication par l'API Instagram Graph, qui
  demande une application Meta et un jeton en secret ; à reconsidérer si le volume le justifie.
- Le lien du compte est dans `SITE.instagram` (`src/config/site.ts`), affiché en pied de page
  et sur la page « À propos ».

## Conséquences

- Un nouveau format (itinéraire de la semaine, actu, portrait d'acteur) s'ajoute comme une
  fonction de `src/lib/instagram.ts`, avec ses tests.
- Les couleurs des types sont recopiées de `src/styles/tokens.css` : une nouvelle couleur de
  type se reporte aux deux endroits.
