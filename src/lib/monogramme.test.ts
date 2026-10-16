import { describe, expect, it } from 'vitest';
import { initiales, NOMBRE_TEINTES, teinte } from './monogramme';

describe('initiales', () => {
  it.each([
    ['Be Cycles', 'BC'],
    ['Agence C.Vélo', 'AC'],
    ["L'Atelier du Vélo 63", 'AV'],
    ['Les Bicyclettes du Grenier', 'BG'],
    ['Cyclo&Co', 'CC'],
    ['Materiel-velo.com', 'MV'],
    ['Bouticycle', 'B'],
    ['Écocycle', 'E'],
    ['Le Vélodrome', 'V'],
    ['La', 'L'],
    ['', ''],
  ])('%j → %j', (nom, attendu) => {
    expect(initiales(nom)).toBe(attendu);
  });
});

describe('teinte', () => {
  it('est stable pour un même slug', () => {
    expect(teinte('be-cycles-clermont-ferrand')).toBe(teinte('be-cycles-clermont-ferrand'));
  });

  it('reste entre 1 et le nombre de teintes', () => {
    const slugs = ['a', 'be-cycles', 'decathlon-clermont-ferrand', 'velo-test-riom', ''];
    for (const slug of slugs) {
      expect(teinte(slug)).toBeGreaterThanOrEqual(1);
      expect(teinte(slug)).toBeLessThanOrEqual(NOMBRE_TEINTES);
    }
  });

  it('varie selon les fiches', () => {
    const teintes = new Set(
      ['be-cycles', 'cycles-gozh-riom', 'la-roue-verte-aydat', 'takamaka', 'velocaz', 'giant'].map(
        teinte,
      ),
    );
    expect(teintes.size).toBeGreaterThan(1);
  });
});
