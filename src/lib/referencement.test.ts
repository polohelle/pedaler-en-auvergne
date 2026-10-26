import { describe, expect, it } from 'vitest';
import { estIndexable, genererPlanDuSite, urlAbsolue } from './referencement';

const SITE = 'https://pedalerenauvergne.fr';

describe('estIndexable', () => {
  it('indexe les pages de contenu', () => {
    for (const chemin of ['/', '/agenda/', '/annuaire/velo-riom/', '/agenda/proposer/']) {
      expect(estIndexable(chemin)).toBe(true);
    }
  });

  it('écarte les retours de formulaire, l’espace organisateur et les pages de secours', () => {
    for (const chemin of [
      '/organisateur/connexion/',
      '/hors-ligne/',
      '/agenda/proposer/merci/',
      '/agenda/proposer/erreur/',
    ]) {
      expect(estIndexable(chemin)).toBe(false);
    }
  });
});

describe('urlAbsolue', () => {
  it('rend absolu un chemin et garde une adresse déjà absolue', () => {
    expect(urlAbsolue('/logos/a.png', SITE)).toBe('https://pedalerenauvergne.fr/logos/a.png');
    expect(urlAbsolue('https://cdn.example/a.png', SITE)).toBe('https://cdn.example/a.png');
  });
});

describe('genererPlanDuSite', () => {
  const xml = genererPlanDuSite(
    ['agenda/', '', 'organisateur/connexion/', 'agenda/', 'annuaire/l-atelier-&-co/', '404/'],
    SITE,
  );

  it('liste les pages indexables, triées et sans doublon', () => {
    expect(xml).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url><loc>https://pedalerenauvergne.fr/</loc></url>',
        '  <url><loc>https://pedalerenauvergne.fr/agenda/</loc></url>',
        '  <url><loc>https://pedalerenauvergne.fr/annuaire/l-atelier-&amp;-co/</loc></url>',
        '</urlset>',
        '',
      ].join('\n'),
    );
  });
});
