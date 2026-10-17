# 0033 — Pages toujours fraîches après une publication

- Statut : acceptée
- Date : 2026-10-17
- Complète : 0015 (application web installable)

## Contexte

L'ADR 0015 précache l'accueil, l'annuaire, l'agenda, les actus, l'association et les mentions
légales. Workbox sert une page précachée avant toute autre règle : un visiteur qui avait déjà
ouvert le site voyait l'ancienne version de ces pages après une publication, tant que le
nouveau service worker n'avait pas pris la main (constaté le 17 octobre 2026 : les premières
brèves, en ligne, n'apparaissaient pas sans rechargement forcé).

## Décision

- Les copies précachées des pages prennent une clé suffixée (`agenda/?hors-connexion`), qui ne
  correspond à aucune adresse visitée : la règle de précache ne les sert plus directement.
- Toutes les pages passent par le cache « réseau d'abord » ; en cas d'échec du réseau, on sert
  la copie déjà vue, puis la copie précachée de la page, puis la page « hors connexion », qui
  garde sa clé d'origine.
- Écarté : ne plus précacher les pages, ce qui retirait la consultation hors connexion de
  l'agenda et de l'annuaire jamais ouverts, exigée par le cahier des charges.

## Conséquences

- Une publication est visible dès la visite suivante, sans rechargement forcé.
- La réécriture des clés remplace celle de `@vite-pwa/astro` (`manifestTransforms`) : à revoir
  si l'intégration change son format de clés. Le test `tests/e2e/pwa.spec.ts` vérifie les clés
  et le parcours hors connexion.
