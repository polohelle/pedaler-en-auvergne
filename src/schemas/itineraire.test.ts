import { describe, expect, it } from 'vitest';
import { itineraire, sans } from '../../tests/fixtures/contenus';
import { schemaItineraire } from './itineraire';

const valider = (donnees: Record<string, unknown>) => schemaItineraire.safeParse(donnees);
const chemins = (donnees: Record<string, unknown>) =>
  valider(donnees).error?.issues.map((issue) => issue.path.join('.')) ?? [];

describe('schéma itinéraire', () => {
  it('accepte un itinéraire publié complet', () => {
    expect(valider(itineraire()).success).toBe(true);
  });

  it('accepte un brouillon sans vérification, départ, acteur ni adresse de trace', () => {
    const brouillon = {
      ...sans(itineraire(), 'verifie_le', 'depart', 'acteur', 'trace_url'),
      source: 'agent',
      statut: 'brouillon',
    };
    expect(valider(brouillon).success).toBe(true);
  });

  it('exige la date de vérification d’un itinéraire publié', () => {
    expect(chemins(sans(itineraire(), 'verifie_le'))).toContain('verifie_le');
  });

  it('exige la source, l’auteur et une licence de réutilisation', () => {
    const incomplet = sans(itineraire(), 'source_url', 'auteur', 'licence');
    expect(chemins(incomplet)).toEqual(expect.arrayContaining(['source_url', 'auteur', 'licence']));
    expect(chemins({ ...itineraire(), licence: 'tous-droits-reserves' })).toContain('licence');
  });

  it('refuse une pratique, une difficulté ou une forme inconnues', () => {
    expect(chemins({ ...itineraire(), pratique: 'cyclo-cross' })).toContain('pratique');
    expect(chemins({ ...itineraire(), difficulte: 'extreme' })).toContain('difficulte');
    expect(chemins({ ...itineraire(), forme: 'etoile' })).toContain('forme');
  });

  it('exige de dire si le parcours est balisé', () => {
    expect(chemins(sans(itineraire(), 'balise'))).toContain('balise');
  });

  it('refuse un champ inconnu', () => {
    expect(valider({ ...itineraire(), distance: 42 }).success).toBe(false);
  });
});
