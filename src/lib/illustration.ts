import type { PratiqueEvenement } from '@config/evenements';

/** Décor et silhouette de vélo dessinés pour une pratique (ADR 0039). */
export type DecorPratique = 'route' | 'gravel' | 'vtt';

/**
 * Décor de l'illustration d'un événement d'après ses pratiques : la première listée, le
 * cyclo-cross prenant celui du gravel (vélo à cintre de route, pneus à crampons, chemins).
 * Sans pratique, l'illustration garde son vélo et ses collines génériques.
 */
export function decorDePratiques(
  pratiques: readonly PratiqueEvenement[] | undefined,
): DecorPratique | undefined {
  const premiere = pratiques?.[0];
  if (premiere === undefined) return undefined;
  return premiere === 'cyclo-cross' ? 'gravel' : premiere;
}
