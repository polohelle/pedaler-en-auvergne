/**
 * Sections de l'annuaire : « Commerces et services » d'un côté, « Associations et clubs » de
 * l'autre, ces dernières réparties par catégorie (clubs, associations d'usagers, ateliers,
 * vélo-écoles).
 */
import {
  CATEGORIES_ASSOCIATIVES,
  type CategorieActeur,
  type CategorieAssociative,
} from '@config/acteurs';

const ASSOCIATIVES = new Set<CategorieActeur>(CATEGORIES_ASSOCIATIVES);

export interface GroupeAssociatif<T> {
  categorie: CategorieAssociative;
  acteurs: T[];
}

export interface SectionsAnnuaire<T> {
  commerces: T[];
  associations: GroupeAssociatif<T>[];
  /** Nombre de structures de la section « Associations et clubs ». */
  nombreAssociations: number;
}

/**
 * Range chaque acteur dans une seule section, dans l'ordre reçu, pour qu'aucune fiche ne soit
 * répétée sur la page : un acteur qui a au moins une catégorie associative rejoint
 * « Associations et clubs », sous la première de ses catégories associatives dans l'ordre de sa
 * fiche ; les autres forment « Commerces et services ». Les groupes vides sont omis.
 */
export function sectionsAnnuaire<T>(
  acteurs: Iterable<T>,
  categoriesDe: (acteur: T) => readonly CategorieActeur[],
): SectionsAnnuaire<T> {
  const commerces: T[] = [];
  const parCategorie = new Map<CategorieAssociative, T[]>();
  let nombreAssociations = 0;
  for (const acteur of acteurs) {
    const categorie = categoriesDe(acteur).find((c): c is CategorieAssociative =>
      ASSOCIATIVES.has(c),
    );
    if (categorie === undefined) {
      commerces.push(acteur);
      continue;
    }
    nombreAssociations += 1;
    const groupe = parCategorie.get(categorie);
    if (groupe === undefined) parCategorie.set(categorie, [acteur]);
    else groupe.push(acteur);
  }
  const associations = CATEGORIES_ASSOCIATIVES.flatMap((categorie) => {
    const groupe = parCategorie.get(categorie);
    return groupe === undefined ? [] : [{ categorie, acteurs: groupe }];
  });
  return { commerces, associations, nombreAssociations };
}
