/**
 * Départements couverts. Le Puy-de-Dôme est ouvert au lancement ; l'Allier, le Cantal et
 * la Haute-Loire sont déclarés pour que filtres, carte et URL les gèrent déjà.
 * Ouvrir un département : passer `actif` à `true` et ajouter ses sources de veille.
 */
export const CODES_DEPARTEMENT = ['63', '03', '15', '43'] as const;
export type CodeDepartement = (typeof CODES_DEPARTEMENT)[number];

export const DEPARTEMENTS = {
  '63': { nom: 'Puy-de-Dôme', actif: true },
  '03': { nom: 'Allier', actif: false },
  '15': { nom: 'Cantal', actif: false },
  '43': { nom: 'Haute-Loire', actif: false },
} as const satisfies Record<CodeDepartement, { nom: string; actif: boolean }>;

export const DEPARTEMENT_PAR_DEFAUT: CodeDepartement = '63';
