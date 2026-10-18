import { describe, expect, it } from 'vitest';
import { verifierIntegrite, type ActeurIndexe } from './integrite';

const acteurs: ActeurIndexe[] = [
  { slug: 'velo-riom', statut: 'publie', osm_id: 'node/1' },
  { slug: 'cycles-thiers', statut: 'brouillon', osm_id: 'node/2' },
];

describe('verifierIntegrite', () => {
  it('accepte des contenus cohérents', () => {
    expect(
      verifierIntegrite(acteurs, [
        { id: '2026-11-08-bourse', statut: 'publie', organisateur: 'velo-riom' },
        { id: '2026-11-09-sortie', statut: 'publie' },
        { id: '2026-11-10-atelier', statut: 'a_valider', organisateur: 'cycles-thiers' },
      ]),
    ).toEqual([]);
  });

  it('signale un organisateur inconnu', () => {
    expect(
      verifierIntegrite(acteurs, [{ id: 'e', statut: 'a_valider', organisateur: 'inconnu' }]),
    ).toEqual(["e : l'organisateur « inconnu » n'existe pas dans l'annuaire."]);
  });

  it('signale un événement visible dont l’organisateur n’est pas publié', () => {
    for (const statut of ['publie', 'annule'] as const) {
      expect(
        verifierIntegrite(acteurs, [{ id: 'e', statut, organisateur: 'cycles-thiers' }]),
      ).toEqual(["e : l'organisateur « cycles-thiers » n'est pas publié."]);
    }
  });

  it('signale un objet OSM importé deux fois', () => {
    expect(
      verifierIntegrite(
        [...acteurs, { slug: 'doublon', statut: 'brouillon', osm_id: 'node/1' }],
        [],
      ),
    ).toEqual(['node/1 est importé plusieurs fois : velo-riom, doublon.']);
  });

  it('signale la structure inconnue ou non publiée d’un itinéraire publié', () => {
    expect(
      verifierIntegrite(
        acteurs,
        [],
        [
          { id: 'a', statut: 'publie', acteur: 'velo-riom' },
          { id: 'b', statut: 'brouillon', acteur: 'cycles-thiers' },
          { id: 'c', statut: 'publie' },
          { id: 'd', statut: 'brouillon', acteur: 'inconnu' },
          { id: 'e', statut: 'publie', acteur: 'cycles-thiers' },
        ],
      ),
    ).toEqual([
      "d : la structure « inconnu » n'existe pas dans l'annuaire.",
      "e : la structure « cycles-thiers » n'est pas publiée.",
    ]);
  });
});
