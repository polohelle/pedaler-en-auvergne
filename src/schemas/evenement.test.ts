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

  it('exige la source d’origine', () => {
    const sansSource = sans(evenement(), 'source_url');
    expect(chemins(sansSource)).toContain('source_url');
  });

  it('accepte les quatre statuts du cahier des charges', () => {
    for (const statut of ['a_valider', 'publie', 'annule', 'archive']) {
      expect(valider({ ...evenement(), statut }).success).toBe(true);
    }
  });
});
