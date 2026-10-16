import { describe, expect, it } from 'vitest';
import { dateRss, echapperXml, genererFluxRss } from './rss';

describe('echapperXml', () => {
  it('échappe les caractères spéciaux', () => {
    expect(echapperXml(`Vélo & co <"l'atelier">`)).toBe(
      'Vélo &amp; co &lt;&quot;l&apos;atelier&quot;&gt;',
    );
  });
});

describe('dateRss', () => {
  it('écrit la date au format RFC 822', () => {
    expect(dateRss(new Date('2026-10-16T09:00:00Z'))).toBe('Fri, 16 Oct 2026 09:00:00 GMT');
  });
});

describe('genererFluxRss', () => {
  const xml = genererFluxRss({
    titre: 'Actualités — Pédaler en Auvergne',
    lien: 'https://pedalerenauvergne.fr/actus/',
    adresseFlux: 'https://pedalerenauvergne.fr/actus/rss.xml',
    description: 'Le vélo & ses acteurs',
    langue: 'fr',
    elements: [
      {
        titre: 'Nouvelle piste',
        lien: 'https://pedalerenauvergne.fr/actus/2026-10-01-piste/',
        description: 'Ouverture <prochaine>.',
        date: new Date('2026-10-01T12:00:00Z'),
      },
      {
        titre: 'Bourse aux vélos',
        lien: 'https://pedalerenauvergne.fr/agenda/2026-11-08-bourse/',
        description: 'Dimanche.',
      },
    ],
  });

  it('déclare le flux et sa propre adresse', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain(
      '<atom:link href="https://pedalerenauvergne.fr/actus/rss.xml" rel="self" type="application/rss+xml" />',
    );
    expect(xml).toContain('<description>Le vélo &amp; ses acteurs</description>');
    expect(xml).toContain('<language>fr</language>');
  });

  it('liste les éléments, avec une date seulement quand elle existe', () => {
    expect(xml.match(/<item>/g)).toHaveLength(2);
    expect(xml).toContain('<description>Ouverture &lt;prochaine&gt;.</description>');
    expect(xml.match(/<pubDate>/g)).toHaveLength(1);
    expect(xml).toContain('<pubDate>Thu, 01 Oct 2026 12:00:00 GMT</pubDate>');
    expect(xml).toContain(
      '<guid isPermaLink="true">https://pedalerenauvergne.fr/agenda/2026-11-08-bourse/</guid>',
    );
  });
});
