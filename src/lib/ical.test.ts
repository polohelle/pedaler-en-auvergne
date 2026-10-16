import { describe, expect, it } from 'vitest';
import {
  echapperTexte,
  genererCalendrier,
  horodatageUtc,
  plierLigne,
  type Calendrier,
  type EvenementCalendrier,
} from './ical';

const encodeur = new TextEncoder();

const bourse: EvenementCalendrier = {
  id: '2026-11-08-bourse-riom',
  titre: 'Bourse aux vélos, édition d’automne',
  debut: new Date('2026-11-08T09:00:00+01:00'),
  fin: new Date('2026-11-08T17:00:00+01:00'),
  lieu: 'Salle des fêtes',
  commune: 'Riom',
  description: 'Dépôt le matin; vente l’après-midi.',
  url: 'https://pedalerenauvergne.fr/agenda/2026-11-08-bourse-riom/',
  annule: false,
  lat: 45.89,
  lon: 3.11,
};

const calendrier: Calendrier = {
  nom: 'Agenda — Pédaler en Auvergne',
  domaine: 'pedalerenauvergne.fr',
  genereLe: new Date('2026-10-16T10:00:00Z'),
  evenements: [bourse],
};

describe('echapperTexte', () => {
  it('échappe les caractères réservés et les sauts de ligne', () => {
    expect(echapperTexte('a\\b; c, d\ne\r\nf')).toBe('a\\\\b\\; c\\, d\\ne\\nf');
  });
});

describe('horodatageUtc', () => {
  it('écrit la date en UTC compacte', () => {
    expect(horodatageUtc(new Date('2026-11-08T09:30:00+01:00'))).toBe('20261108T083000Z');
  });
});

describe('plierLigne', () => {
  it('laisse intacte une ligne courte', () => {
    expect(plierLigne('SUMMARY:Bourse')).toBe('SUMMARY:Bourse');
  });

  it('plie à 75 octets sans couper un caractère accentué', () => {
    const ligne = `DESCRIPTION:${'é'.repeat(100)}`;
    const morceaux = plierLigne(ligne).split('\r\n');
    expect(morceaux.length).toBeGreaterThan(1);
    for (const morceau of morceaux) {
      expect(encodeur.encode(morceau).length).toBeLessThanOrEqual(75);
    }
    expect(morceaux.slice(1).every((m) => m.startsWith(' '))).toBe(true);
    expect(morceaux.map((m, i) => (i === 0 ? m : m.slice(1))).join('')).toBe(ligne);
  });
});

describe('genererCalendrier', () => {
  const ics = genererCalendrier(calendrier);
  const lignes = ics.replace(/\r\n /g, '').split('\r\n');

  it('produit un calendrier valide terminé par CRLF', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it('décrit l’événement en UTC avec un UID stable', () => {
    expect(lignes).toContain('UID:2026-11-08-bourse-riom@pedalerenauvergne.fr');
    expect(lignes).toContain('DTSTAMP:20261016T100000Z');
    expect(lignes).toContain('DTSTART:20261108T080000Z');
    expect(lignes).toContain('DTEND:20261108T160000Z');
    expect(lignes).toContain('SUMMARY:Bourse aux vélos\\, édition d’automne');
    expect(lignes).toContain('LOCATION:Salle des fêtes\\, Riom');
    expect(lignes).toContain('GEO:45.89;3.11');
    expect(lignes).toContain('STATUS:CONFIRMED');
    expect(lignes).toContain(
      'DESCRIPTION:Dépôt le matin\\; vente l’après-midi.\\n\\nhttps://pedalerenauvergne.fr/agenda/2026-11-08-bourse-riom/',
    );
  });

  it('signale un événement annulé et omet ce qui manque', () => {
    const annule = genererCalendrier({
      ...calendrier,
      evenements: [{ ...bourse, annule: true, fin: undefined, lat: undefined, lon: undefined }],
    });
    expect(annule).toContain('STATUS:CANCELLED');
    expect(annule).toContain('SUMMARY:[Annulé] Bourse');
    expect(annule).not.toContain('DTEND:');
    expect(annule).not.toContain('GEO:');
  });

  it('accepte un calendrier vide', () => {
    expect(genererCalendrier({ ...calendrier, evenements: [] })).not.toContain('BEGIN:VEVENT');
  });
});
