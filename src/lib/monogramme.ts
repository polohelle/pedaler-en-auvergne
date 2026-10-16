/**
 * Monogramme d'une structure sans logo (ADR 0031) : ses initiales sur une pastille de la palette,
 * pour que toutes les cartes de l'annuaire gardent la même allure.
 */

/** Mots qui ne donnent pas d'initiale : articles, prépositions, conjonctions. */
const MOTS_VIDES = new Set([
  'a',
  'au',
  'aux',
  'd',
  'de',
  'des',
  'du',
  'en',
  'et',
  'l',
  'la',
  'le',
  'les',
  'sur',
]);

/** Nombre de teintes de monogramme définies dans le composant `Vignette`. */
export const NOMBRE_TEINTES = 4;

/**
 * Une ou deux initiales en capitales : celles des deux premiers mots significatifs du nom
 * (« L'Atelier du Vélo 63 » → « AV »), ou la première lettre d'un nom d'un seul mot.
 */
export function initiales(nom: string): string {
  const mots = nom
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((mot) => mot !== '');
  const significatifs = mots.filter((mot) => !MOTS_VIDES.has(mot.toLowerCase()));
  const retenus = (significatifs.length > 0 ? significatifs : mots).slice(0, 2);
  return retenus.map((mot) => mot.charAt(0).toUpperCase()).join('');
}

/** Teinte stable, de 1 à `NOMBRE_TEINTES`, tirée du slug : une fiche garde toujours la sienne. */
export function teinte(slug: string): number {
  let somme = 0;
  for (const caractere of slug) somme = (somme * 31 + (caractere.codePointAt(0) ?? 0)) % 997;
  return (somme % NOMBRE_TEINTES) + 1;
}
