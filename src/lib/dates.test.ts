import { describe, expect, it } from 'vitest';
import {
  dateHeureParis,
  formaterDate,
  formaterHeure,
  formaterPlage,
  jourCivil,
  pastilleDate,
} from './dates';

describe('formaterDate', () => {
  it('écrit le jour en toutes lettres', () => {
    expect(formaterDate(new Date('2026-11-08T09:30:00+01:00'))).toBe('dimanche 8 novembre 2026');
  });

  it('écrit « 1er » pour le premier jour du mois', () => {
    expect(formaterDate(new Date('2026-05-01T10:00:00+02:00'))).toBe('vendredi 1er mai 2026');
  });

  it('ne touche pas aux jours qui contiennent un 1', () => {
    expect(formaterDate(new Date('2026-05-11T10:00:00+02:00'))).toBe('lundi 11 mai 2026');
  });

  it('affiche le jour de Paris, pas celui du fuseau de stockage', () => {
    // 23 h 30 UTC le 7 = 0 h 30 le 8 à Paris en hiver.
    expect(formaterDate(new Date('2026-11-07T23:30:00Z'))).toBe('dimanche 8 novembre 2026');
  });
});

describe('formaterHeure', () => {
  it('sépare heures et minutes par « h »', () => {
    expect(formaterHeure(new Date('2026-11-08T09:30:00+01:00'))).toBe('9 h 30');
  });

  it('omet les minutes nulles', () => {
    expect(formaterHeure(new Date('2026-11-08T12:00:00+01:00'))).toBe('12 h');
  });

  it('affiche minuit en « 0 h »', () => {
    expect(formaterHeure(new Date('2026-11-08T00:00:00+01:00'))).toBe('0 h');
  });

  it("suit l'heure d'été", () => {
    expect(formaterHeure(new Date('2026-07-14T08:00:00Z'))).toBe('10 h');
  });
});

describe('jourCivil', () => {
  it('donne le jour à Paris au format AAAA-MM-JJ', () => {
    expect(jourCivil(new Date('2026-11-07T23:30:00Z'))).toBe('2026-11-08');
    expect(jourCivil(new Date('2026-03-02T08:00:00+01:00'))).toBe('2026-03-02');
  });
});

describe('pastilleDate', () => {
  it('abrège le jour de la semaine et le mois', () => {
    expect(pastilleDate(new Date('2026-11-08T09:30:00+01:00'))).toEqual({
      jourSemaine: 'dim.',
      jour: '8',
      mois: 'nov.',
    });
  });

  it('garde les mois courts entiers', () => {
    expect(pastilleDate(new Date('2099-06-14T09:00:00+02:00')).mois).toBe('juin');
  });

  it('donne le jour de Paris', () => {
    expect(pastilleDate(new Date('2026-11-07T23:30:00Z')).jour).toBe('8');
  });
});

describe('formaterPlage', () => {
  const debut = new Date('2026-11-08T09:30:00+01:00');

  it('sans fin : date et heure de début', () => {
    expect(formaterPlage(debut)).toBe('dimanche 8 novembre 2026 à 9 h 30');
  });

  it('sur un même jour : une date, deux heures', () => {
    expect(formaterPlage(debut, new Date('2026-11-08T12:00:00+01:00'))).toBe(
      'dimanche 8 novembre 2026 de 9 h 30 à 12 h',
    );
  });

  it('sur plusieurs jours : deux dates complètes', () => {
    expect(
      formaterPlage(new Date('2026-11-07T14:00:00+01:00'), new Date('2026-11-08T18:00:00+01:00')),
    ).toBe('du samedi 7 novembre 2026 à 14 h au dimanche 8 novembre 2026 à 18 h');
  });

  it('refuse une fin antérieure au début', () => {
    expect(() => formaterPlage(debut, new Date('2026-11-08T08:00:00+01:00'))).toThrow(RangeError);
  });
});

describe('dateHeureParis', () => {
  it('ajoute le décalage de l’heure d’hiver', () => {
    expect(dateHeureParis('2026-11-08', '09:30')).toBe('2026-11-08T09:30:00+01:00');
  });

  it('ajoute le décalage de l’heure d’été', () => {
    expect(dateHeureParis('2026-06-14', '14:00')).toBe('2026-06-14T14:00:00+02:00');
  });

  it('gère le jour du passage à l’heure d’hiver', () => {
    expect(dateHeureParis('2026-10-25', '10:00')).toBe('2026-10-25T10:00:00+01:00');
    expect(dateHeureParis('2026-10-25', '01:00')).toBe('2026-10-25T01:00:00+02:00');
  });

  it('gère minuit', () => {
    expect(dateHeureParis('2026-11-08', '00:00')).toBe('2026-11-08T00:00:00+01:00');
  });

  it('refuse une heure sautée au passage à l’heure d’été', () => {
    expect(() => dateHeureParis('2026-03-29', '02:30')).toThrow(RangeError);
  });

  it('refuse un jour impossible ou un format inattendu', () => {
    expect(() => dateHeureParis('2026-02-30', '10:00')).toThrow(RangeError);
    expect(() => dateHeureParis('2026-13-01', '10:00')).toThrow(RangeError);
    expect(() => dateHeureParis('8/11/2026', '10:00')).toThrow(RangeError);
    expect(() => dateHeureParis('2026-11-08', '9h30')).toThrow(RangeError);
  });
});
