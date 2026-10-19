import { describe, expect, it } from 'vitest';
import { decorDePratiques } from './illustration';

describe('decorDePratiques', () => {
  it.each([
    [undefined, undefined],
    [[], undefined],
    [['route'], 'route'],
    [['gravel'], 'gravel'],
    [['vtt'], 'vtt'],
    [['cyclo-cross'], 'gravel'],
    [['route', 'gravel'], 'route'],
    [['vtt', 'route'], 'vtt'],
  ] as const)('%j → %s', (pratiques, attendu) => {
    expect(decorDePratiques(pratiques)).toBe(attendu);
  });
});
