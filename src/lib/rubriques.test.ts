import { describe, expect, it } from 'vitest';
import { rubriqueDe } from './rubriques';

describe('rubriqueDe', () => {
  it.each([
    ['/annuaire/', 'annuaire'],
    ['/annuaire/velo-test-riom/', 'annuaire'],
    ['/agenda/2099-06-14-bourse-test-riom/', 'agenda'],
    ['/agenda/proposer/', 'agenda'],
    ['/itineraires/', 'itineraires'],
    ['/actus/2026-10-01-article-test/', 'actus'],
    ['/', undefined],
    ['/a-propos/', undefined],
    ['/communes/riom/', undefined],
    ['/agenda.ics', undefined],
  ])('%s → %s', (chemin, attendu) => {
    expect(rubriqueDe(chemin)).toBe(attendu);
  });
});
