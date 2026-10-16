/**
 * Repérage des données personnelles dans un texte destiné à une issue publique (ADR 0018) :
 * une adresse e-mail ou un numéro de téléphone n'y ont jamais leur place.
 */

const EMAIL = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/i;
// 06 12 34 56 78, 06.12.34.56.78, 0612345678, +33 6 12 34 56 78, 0033612345678.
const TELEPHONE = /(?:(?:\+|00)33\s?|\b0)[1-9](?:[\s.-]?\d{2}){4}\b/;

export function contientEmail(texte: string): boolean {
  return EMAIL.test(texte);
}

export function contientTelephone(texte: string): boolean {
  return TELEPHONE.test(texte);
}

export function contientDonneePersonnelle(texte: string): boolean {
  return contientEmail(texte) || contientTelephone(texte);
}
