/** Chemins et crédit des photos de `src/config/photos.ts` (ADR 0046). */

/** Largeurs disponibles pour chaque photo, de la plus petite à la plus grande. */
export const LARGEURS_PHOTO = [640, 1200] as const;

/** Chemin public d'une photo à une largeur donnée. */
export function cheminPhoto(id: string, largeur: (typeof LARGEURS_PHOTO)[number]): string {
  return `/photos/${id}-${String(largeur)}.webp`;
}

/** Attribut `srcset` d'une photo : toutes les largeurs disponibles. */
export function srcsetPhoto(id: string): string {
  return LARGEURS_PHOTO.map((l) => `${cheminPhoto(id, l)} ${String(l)}w`).join(', ');
}
