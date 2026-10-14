/** Identifiants lisibles pour les URL et les noms de fichiers : `atelier-velo-clermont`. */

const LIGATURES: Record<string, string> = { œ: 'oe', æ: 'ae', ß: 'ss' };

export function slugifier(texte: string): string {
  return texte
    .toLowerCase()
    .replace(/[œæß]/g, (lettre) => LIGATURES[lettre] ?? lettre)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Premier slug libre parmi `base`, `base-2`, `base-3`… */
export function slugLibre(base: string, pris: ReadonlySet<string>): string {
  if (!pris.has(base)) return base;
  let rang = 2;
  while (pris.has(`${base}-${String(rang)}`)) rang += 1;
  return `${base}-${String(rang)}`;
}
