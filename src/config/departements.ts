/**
 * Départements couverts. Le Puy-de-Dôme est ouvert au lancement ; l'Allier, le Cantal et
 * la Haute-Loire sont ouverts depuis le 13 novembre 2026 (ADR 0044).
 * Ouvrir un département : passer `actif` à `true` et ajouter ses sources de veille.
 */
export const CODES_DEPARTEMENT = ['63', '03', '15', '43'] as const;
export type CodeDepartement = (typeof CODES_DEPARTEMENT)[number];

/** Type élargi (`actif: boolean`) : les filtres sur `actif` restent valides quand tous sont ouverts. */
export const DEPARTEMENTS: Readonly<
  Record<CodeDepartement, { readonly nom: string; readonly actif: boolean }>
> = {
  '63': { nom: 'Puy-de-Dôme', actif: true },
  '03': { nom: 'Allier', actif: true },
  '15': { nom: 'Cantal', actif: true },
  '43': { nom: 'Haute-Loire', actif: true },
};

export const DEPARTEMENT_PAR_DEFAUT: CodeDepartement = '63';
