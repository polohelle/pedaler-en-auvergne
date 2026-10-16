import { describe, expect, it } from 'vitest';
import { texteAnneau } from './tampon';

describe('texteAnneau', () => {
  it('répète un texte court pour remplir l’anneau', () => {
    expect(texteAnneau('Membre ★ Usagers').texte).toBe('MEMBRE ★ USAGERS ★ MEMBRE ★ USAGERS ★');
  });

  it('garde un texte assez long tel quel, avec une seule étoile finale', () => {
    expect(texteAnneau('Pédaler à Clermont ★ Puy-de-Dôme ★')).toEqual({
      texte: 'PÉDALER À CLERMONT ★ PUY-DE-DÔME ★',
      taille: 9.5,
    });
  });

  it('garde la taille par défaut quand le texte tient', () => {
    expect(texteAnneau('Membre ★ Entreprises à vélo').taille).toBe(10.5);
  });

  it('réduit la taille d’un texte long, sans descendre sous le plancher', () => {
    expect(texteAnneau('Membre ★ Commerce et réparation').taille).toBeLessThan(10.5);
    expect(texteAnneau('x'.repeat(200)).taille).toBe(7);
  });
});
