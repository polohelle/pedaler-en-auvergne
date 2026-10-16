import { describe, expect, it } from 'vitest';
import { schemaActu } from '@schemas/actu';
import { schemaEvenement } from '@schemas/evenement';
import { breve, evenement } from '../../tests/fixtures/contenus';
import { elementRssActu, elementRssEvenement, evenementCalendrier } from './flux';

const SITE = 'https://pedalerenauvergne.fr';
const bourse = schemaEvenement.parse(evenement());

describe('evenementCalendrier', () => {
  it('reprend la fiche avec une adresse absolue et une description en texte brut', () => {
    const resultat = evenementCalendrier(
      { id: '2026-11-08-bourse-riom', data: bourse, body: 'Bourse **gratuite**.' },
      SITE,
    );
    expect(resultat).toMatchObject({
      id: '2026-11-08-bourse-riom',
      titre: 'Bourse aux vélos de Riom',
      lieu: 'Place de la Fédération',
      commune: 'Riom',
      description: 'Bourse gratuite.',
      url: 'https://pedalerenauvergne.fr/agenda/2026-11-08-bourse-riom/',
      annule: false,
      lat: 45.8936,
      lon: 3.1126,
    });
  });

  it('signale l’annulation et accepte une fiche sans corps', () => {
    const resultat = evenementCalendrier({ id: 'x', data: { ...bourse, statut: 'annule' } }, SITE);
    expect(resultat.annule).toBe(true);
    expect(resultat.description).toBe('');
  });
});

describe('elementRssEvenement', () => {
  it('met la date et le lieu dans le titre et la description, sans date de parution', () => {
    const element = elementRssEvenement({ id: 'b', data: bourse }, SITE);
    expect(element.titre).toBe('Bourse aux vélos de Riom — Riom');
    expect(element.description).toBe(
      'Bourse aux vélos, dimanche 8 novembre 2026 de 9 h à 17 h, Place de la Fédération, Riom.',
    );
    expect(element.date).toBeUndefined();
    expect(element.lien).toBe('https://pedalerenauvergne.fr/agenda/b/');
  });

  it('signale un événement annulé', () => {
    const element = elementRssEvenement({ id: 'b', data: { ...bourse, statut: 'annule' } }, SITE);
    expect(element.titre).toBe('Bourse aux vélos de Riom (annulé) — Riom');
  });
});

describe('elementRssActu', () => {
  it('date l’actualité à midi UTC et reprend son résumé', () => {
    const element = elementRssActu(
      { id: '2026-10-12-voie', data: schemaActu.parse(breve()) },
      SITE,
    );
    expect(element).toEqual({
      titre: 'Nouvelle voie verte entre Riom et Clermont',
      lien: 'https://pedalerenauvergne.fr/actus/2026-10-12-voie/',
      description: 'La métropole annonce l’ouverture d’une voie verte.',
      date: new Date('2026-10-12T12:00:00Z'),
    });
  });
});
