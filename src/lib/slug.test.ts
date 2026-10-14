import { describe, expect, it } from 'vitest';
import { slugifier, slugLibre } from './slug';

describe('slugifier', () => {
  it.each([
    ['Atelier Vélo Clermont', 'atelier-velo-clermont'],
    ["L'Œuf à vélo", 'l-oeuf-a-velo'],
    ['  Cycles & Co — Riom ', 'cycles-co-riom'],
    ['Saint-Pourçain-sur-Sioule', 'saint-pourcain-sur-sioule'],
    ['Vélo 2000', 'velo-2000'],
    ['!!!', ''],
  ])('%j → %j', (texte, attendu) => {
    expect(slugifier(texte)).toBe(attendu);
  });
});

describe('slugLibre', () => {
  it('garde la base si elle est libre', () => {
    expect(slugLibre('cycles', new Set())).toBe('cycles');
  });

  it('numérote à partir de 2', () => {
    expect(slugLibre('cycles', new Set(['cycles', 'cycles-2']))).toBe('cycles-3');
  });
});
