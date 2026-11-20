import { describe, expect, it } from 'vitest';
import { cheminPhoto, srcsetPhoto } from './photos';

describe('photos', () => {
  it('donne le chemin public d’une largeur', () => {
    expect(cheminPhoto('velo-test', 640)).toBe('/photos/velo-test-640.webp');
  });

  it('liste toutes les largeurs dans le srcset', () => {
    expect(srcsetPhoto('velo-test')).toBe(
      '/photos/velo-test-640.webp 640w, /photos/velo-test-1200.webp 1200w',
    );
  });
});
