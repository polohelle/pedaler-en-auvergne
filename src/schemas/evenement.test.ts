import { describe, expect, it } from 'vitest';
import { evenement, sans } from '../../tests/fixtures/contenus';
import { schemaEvenement } from './evenement';

const valider = (donnees: Record<string, unknown>) => schemaEvenement.safeParse(donnees);
const chemins = (donnees: Record<string, unknown>) =>
  valider(donnees).error?.issues.map((issue) => issue.path.join('.')) ?? [];

describe('schéma événement', () => {
  it('accepte un événement complet et convertit les dates', () => {
    const resultat = valider(evenement());
    expect(resultat.success).toBe(true);
    expect(resultat.data?.debut).toEqual(new Date('2026-11-08T08:00:00Z'));
  });

  it('accepte un événement sans fin, sans coordonnées ni organisateur', () => {
    const minimal = sans(evenement(), 'fin', 'lat', 'lon', 'organisateur');
    expect(valider(minimal).success).toBe(true);
  });

  it('refuse une date-heure sans fuseau', () => {
    expect(chemins({ ...evenement(), debut: '2026-11-08T09:00:00' })).toContain('debut');
  });

  it('refuse une date-heure convertie par YAML faute de guillemets', () => {
    expect(chemins({ ...evenement(), debut: new Date('2026-11-08T08:00:00Z') })).toContain('debut');
  });

  it('refuse une fin antérieure au début', () => {
    expect(chemins({ ...evenement(), fin: '2026-11-08T08:00:00+01:00' })).toContain('fin');
  });

  it('refuse une latitude sans longitude', () => {
    const sansLon = sans(evenement(), 'lon');
    expect(chemins(sansLon)).toContain('lat');
  });

  it('refuse des coordonnées hors d’Auvergne', () => {
    expect(chemins({ ...evenement(), lat: 48.85, lon: 2.35 })).toContain('lat');
  });

  it('exige la source d’origine', () => {
    const sansSource = sans(evenement(), 'source_url');
    expect(chemins(sansSource)).toContain('source_url');
  });

  it('accepte une ou plusieurs pratiques', () => {
    expect(valider({ ...evenement(), pratiques: ['vtt'] }).success).toBe(true);
    expect(valider({ ...evenement(), pratiques: ['route', 'gravel'] }).success).toBe(true);
  });

  it('refuse une pratique inconnue, une liste vide ou une pratique en double', () => {
    expect(chemins({ ...evenement(), pratiques: ['bmx'] })).toContain('pratiques.0');
    expect(chemins({ ...evenement(), pratiques: [] })).toContain('pratiques');
    expect(chemins({ ...evenement(), pratiques: ['vtt', 'vtt'] })).toContain('pratiques');
  });

  it('accepte une image avec texte alternatif et crédit', () => {
    const image = { src: '/evenements/bourse.jpg', alt: 'Vélos alignés', credit: 'Club test' };
    expect(valider({ ...evenement(), image }).success).toBe(true);
    expect(chemins({ ...evenement(), image: { src: '/a.jpg', alt: '' } })).toEqual(
      expect.arrayContaining(['image.alt', 'image.credit']),
    );
  });

  it('accepte les quatre statuts du cahier des charges', () => {
    for (const statut of ['a_valider', 'publie', 'annule', 'archive']) {
      expect(valider({ ...evenement(), statut }).success).toBe(true);
    }
  });
});
