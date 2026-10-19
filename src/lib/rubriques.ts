import { RUBRIQUES, type Rubrique } from '@config/rubriques';

/** Rubrique d'une page d'après son chemin, ou `undefined` hors rubrique (accueil, à propos…). */
export function rubriqueDe(chemin: string): Rubrique | undefined {
  return RUBRIQUES.find(({ href }) => chemin.startsWith(href))?.cle;
}
