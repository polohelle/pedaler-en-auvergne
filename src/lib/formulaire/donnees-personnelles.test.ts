import { describe, expect, it } from 'vitest';
import {
  contientDonneePersonnelle,
  contientEmail,
  contientTelephone,
} from './donnees-personnelles';

describe('contientEmail', () => {
  it.each(['écrire à jean.dupont@exemple.fr', 'contact@club-velo.org pour réserver'])(
    'repère « %s »',
    (texte) => {
      expect(contientEmail(texte)).toBe(true);
    },
  );

  it.each(['rendez-vous @ la gare', 'suivez @velocite63', 'https://exemple.fr/agenda'])(
    'laisse passer « %s »',
    (texte) => {
      expect(contientEmail(texte)).toBe(false);
    },
  );
});

describe('contientTelephone', () => {
  it.each([
    '06 12 34 56 78',
    '06.12.34.56.78',
    '0612345678',
    'appeler le 04-73-12-34-56',
    '+33 6 12 34 56 78',
    '+33612345678',
    '0033612345678',
  ])('repère « %s »', (texte) => {
    expect(contientTelephone(texte)).toBe(true);
  });

  it.each([
    'départ à 9 h 30, 25 km',
    'tarif : 12 €, gratuit pour les moins de 12 ans',
    'parcours de 2026 mètres',
    'code postal 63000',
    'dimanche 08/11/2026',
  ])('laisse passer « %s »', (texte) => {
    expect(contientTelephone(texte)).toBe(false);
  });
});

describe('contientDonneePersonnelle', () => {
  it('repère l’un ou l’autre', () => {
    expect(contientDonneePersonnelle('tél. 06 12 34 56 78')).toBe(true);
    expect(contientDonneePersonnelle('a@b.fr')).toBe(true);
    expect(contientDonneePersonnelle('Balade familiale de 15 km.')).toBe(false);
  });
});
