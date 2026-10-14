import { describe, expect, it } from 'vitest';
import { departementDuCodePostal, estEnAuvergne } from './geo';

describe('departementDuCodePostal', () => {
  it.each([
    ['63000', '63'],
    ['03200', '03'],
    ['15000', '15'],
    ['43000', '43'],
  ])('%s → %s', (cp, dep) => {
    expect(departementDuCodePostal(cp)).toBe(dep);
  });

  it('ne reconnaît que les départements couverts', () => {
    expect(departementDuCodePostal('75001')).toBeUndefined();
  });
});

describe('estEnAuvergne', () => {
  it.each([
    ['Clermont-Ferrand', 45.7772, 3.087],
    ['Montluçon', 46.3404, 2.6033],
    ['Aurillac', 44.9264, 2.4396],
    ['Le Puy-en-Velay', 45.0434, 3.8858],
  ])('%s est en Auvergne', (_, lat, lon) => {
    expect(estEnAuvergne(lat, lon)).toBe(true);
  });

  it('repère des coordonnées inversées', () => {
    expect(estEnAuvergne(3.087, 45.7772)).toBe(false);
  });

  it('repère un point hors région', () => {
    expect(estEnAuvergne(48.8566, 2.3522)).toBe(false);
  });
});
