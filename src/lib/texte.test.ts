import { describe, expect, it } from 'vitest';
import { texteBrut } from './texte';

describe('texteBrut', () => {
  it('retire le balisage simple', () => {
    expect(
      texteBrut(
        '## Programme\n\nBourse **gratuite**, _ouverte_ à tous : voir [le site](https://x.fr).',
      ),
    ).toBe('Programme\n\nBourse gratuite, ouverte à tous : voir le site.');
  });

  it('garde les listes et les paragraphes lisibles', () => {
    expect(texteBrut('Au menu :\n- dépôt\n* vente\n\n\n`9 h`   à   12 h\r\n')).toBe(
      'Au menu :\n– dépôt\n– vente\n\n9 h à 12 h',
    );
  });

  it('remplace une image par son texte alternatif', () => {
    expect(texteBrut('![Vélos alignés](photo.jpg)')).toBe('Vélos alignés');
  });

  it('renvoie une chaîne vide pour un texte vide', () => {
    expect(texteBrut(' \n\n ')).toBe('');
  });
});
