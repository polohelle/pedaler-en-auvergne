/** Mise en page du texte gravé sur l'anneau d'un tampon (composant `Tampon.astro`). */

/** Longueur du tracé du texte sur l'anneau, en unités du viewBox (100 × 100). */
export const LONGUEUR_ANNEAU = 226;
/** Taille de police par défaut et plancher, en unités du viewBox. */
const TAILLE_MAX = 10.5;
const TAILLE_MIN = 7;
/** Largeur moyenne d'un caractère en capitales grasses, rapportée à la taille de police. */
const CHASSE = 0.7;
/** En dessous de ce nombre de caractères, les lettres s'espaceraient trop : on répète. */
const LONGUEUR_MIN = 24;

export interface TexteAnneau {
  texte: string;
  taille: number;
}

/**
 * Prépare le texte de l'anneau : en capitales, terminé par une étoile, répété s'il est court
 * pour que les lettres ne s'étirent pas, et avec une taille réduite s'il est long pour qu'elles
 * ne se chevauchent pas.
 */
export function texteAnneau(brut: string): TexteAnneau {
  const motif = `${brut
    .trim()
    .toUpperCase()
    .replace(/\s*★\s*$/, '')} ★ `;
  let texte = motif;
  while (texte.length < LONGUEUR_MIN) texte += motif;
  texte = texte.trimEnd();
  const tailleQuiTient = LONGUEUR_ANNEAU / (texte.length * CHASSE);
  const taille = Math.max(TAILLE_MIN, Math.min(TAILLE_MAX, tailleQuiTient));
  return { texte, taille: Math.round(taille * 10) / 10 };
}
