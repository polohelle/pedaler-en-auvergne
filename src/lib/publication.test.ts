import { describe, expect, it } from 'vitest';
import {
  estActeurVisible,
  estActuVisible,
  estEvenementVisible,
  estItineraireVisible,
  estPasse,
} from './publication';

const maintenant = new Date('2026-11-10T12:00:00+01:00');
const veille = { debut: new Date('2026-11-09T20:00:00+01:00') };
const jourMeme = { debut: new Date('2026-11-10T08:00:00+01:00') };
const demain = { debut: new Date('2026-11-11T09:00:00+01:00') };

describe('acteurs, actus et itinéraires', () => {
  it('ne montrent que le statut publie', () => {
    expect(estActeurVisible('publie')).toBe(true);
    expect(estActeurVisible('brouillon')).toBe(false);
    expect(estActeurVisible('archive')).toBe(false);
    expect(estActuVisible('publie')).toBe(true);
    expect(estActuVisible('brouillon')).toBe(false);
    expect(estActuVisible('archive')).toBe(false);
    expect(estItineraireVisible('publie')).toBe(true);
    expect(estItineraireVisible('brouillon')).toBe(false);
    expect(estItineraireVisible('archive')).toBe(false);
  });
});

describe('estPasse', () => {
  it('considère un événement du jour comme non passé, même terminé', () => {
    expect(estPasse(jourMeme, maintenant)).toBe(false);
  });

  it('considère passé un événement de la veille', () => {
    expect(estPasse(veille, maintenant)).toBe(true);
  });

  it('se fonde sur la fin d’un événement de plusieurs jours', () => {
    expect(estPasse({ ...veille, fin: new Date('2026-11-10T18:00:00+01:00') }, maintenant)).toBe(
      false,
    );
  });

  it('raisonne en jours de Paris, pas en jours UTC', () => {
    // 23 h 30 à Paris le 9 = 22 h 30 UTC le 9 ; à 0 h 30 le 10 à Paris, c'est passé.
    const tard = { debut: new Date('2026-11-09T23:30:00+01:00') };
    expect(estPasse(tard, new Date('2026-11-09T23:45:00Z'))).toBe(true);
  });
});

describe('estEvenementVisible', () => {
  it('montre un événement publié, passé ou à venir', () => {
    expect(estEvenementVisible({ ...demain, statut: 'publie' }, maintenant)).toBe(true);
    expect(estEvenementVisible({ ...veille, statut: 'publie' }, maintenant)).toBe(true);
  });

  it('montre un événement annulé jusqu’à son dernier jour inclus', () => {
    expect(estEvenementVisible({ ...demain, statut: 'annule' }, maintenant)).toBe(true);
    expect(estEvenementVisible({ ...jourMeme, statut: 'annule' }, maintenant)).toBe(true);
  });

  it('masque un événement annulé une fois sa date passée', () => {
    expect(estEvenementVisible({ ...veille, statut: 'annule' }, maintenant)).toBe(false);
  });

  it('masque les événements à valider et archivés', () => {
    expect(estEvenementVisible({ ...demain, statut: 'a_valider' }, maintenant)).toBe(false);
    expect(estEvenementVisible({ ...demain, statut: 'archive' }, maintenant)).toBe(false);
  });
});
