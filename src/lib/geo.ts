/** Contrôles géographiques simples, sans service externe. */
import { CODES_DEPARTEMENT, type CodeDepartement } from '@config/departements';

/** Département d'un code postal, s'il fait partie des départements couverts. */
export function departementDuCodePostal(codePostal: string): CodeDepartement | undefined {
  const prefixe = codePostal.slice(0, 2);
  return CODES_DEPARTEMENT.find((code) => code === prefixe);
}

/**
 * Rectangle englobant l'Auvergne (Allier, Cantal, Haute-Loire, Puy-de-Dôme), avec une marge :
 * il sert à repérer une inversion latitude/longitude ou un géocodage parti ailleurs.
 */
export const BORNES_AUVERGNE = { sud: 44.0, nord: 47.0, ouest: 1.8, est: 4.6 } as const;

export function estEnAuvergne(lat: number, lon: number): boolean {
  const { sud, nord, ouest, est } = BORNES_AUVERGNE;
  return lat >= sud && lat <= nord && lon >= ouest && lon <= est;
}
