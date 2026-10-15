import { describe, expect, it } from 'vitest';
import { COLLEGES_ASSOCIATION } from '@config/association';
import { formaterMontant, lienHelloAsso, membresParCollege } from './association';

const fiche = (nom: string, membre: boolean, college?: 'usagers' | 'sport-loisir') => ({
  nom,
  data: { membre, college },
});

describe('membresParCollege', () => {
  it('range les membres par collège, dans l’ordre des statuts, sans les non-membres', () => {
    const resultat = membresParCollege([
      fiche('Club B', true, 'sport-loisir'),
      fiche('Atelier A', true, 'usagers'),
      fiche('Magasin non membre', false),
      fiche('Club A', true, 'sport-loisir'),
    ]);
    expect(resultat.map(({ college }) => college)).toEqual([...COLLEGES_ASSOCIATION]);
    const parCollege = Object.fromEntries(
      resultat.map(({ college, membres }) => [college, membres.map(({ nom }) => nom)]),
    );
    expect(parCollege['sport-loisir']).toEqual(['Club B', 'Club A']);
    expect(parCollege.usagers).toEqual(['Atelier A']);
    expect(parCollege.cyclistes).toEqual([]);
    expect(parCollege['commerce-reparation']).toEqual([]);
  });

  it('renvoie tous les collèges, vides, sans membre', () => {
    expect(membresParCollege([]).every(({ membres }) => membres.length === 0)).toBe(true);
  });
});

describe('lienHelloAsso', () => {
  it('laisse passer null et une campagne HelloAsso', () => {
    expect(lienHelloAsso(null)).toBeNull();
    const adresse = 'https://www.helloasso.com/associations/pedaler-en-auvergne/adhesions/2027';
    expect(lienHelloAsso(adresse)).toBe(adresse);
  });

  it.each([
    'https://www.helloasso.com/associations/',
    'http://www.helloasso.com/associations/pedaler-en-auvergne',
    'https://www.helloasso.com.exemple.org/associations/pedaler-en-auvergne',
    'https://exemple.org/associations/pedaler-en-auvergne',
  ])('refuse %s', (adresse) => {
    expect(() => lienHelloAsso(adresse)).toThrow(/HelloAsso/);
  });
});

describe('formaterMontant', () => {
  it('écrit le montant en euros, à la française', () => {
    expect(formaterMontant(120).replace(/\s/gu, ' ')).toBe('120 €');
  });
});
