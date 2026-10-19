import { describe, expect, it } from 'vitest';
import { baseD1DeTest } from '../../../tests/unit/d1-sqlite';
import { Depot } from './depot';
import type { Brouillon } from './evenement';

const t0 = new Date('2026-10-19T10:00:00Z');
const plus = (minutes: number) => new Date(t0.getTime() + minutes * 60_000);

const brouillon: Brouillon = {
  titre: 'Sortie',
  type: 'sortie',
  pratiques: [],
  description: 'Une sortie tranquille autour du lac.',
  dates: ['2026-11-03'],
  heure_debut: '09:00',
  plusieurs_jours: false,
  lieu: 'Parking du lac',
  commune: 'Aydat',
  departement: '63',
  source_url: 'https://club.example/',
};

describe('Depot', () => {
  it('consomme un lien de connexion une seule fois, avant expiration', async () => {
    const depot = new Depot(baseD1DeTest());
    await depot.enregistrerLien('e1', 'club@example.fr', t0, plus(30));
    await depot.enregistrerLien('e2', 'club@example.fr', t0, plus(30));
    expect(await depot.liensValides('club@example.fr', t0)).toBe(2);
    expect(await depot.consommerLien('e1', plus(5))).toBe('club@example.fr');
    expect(await depot.consommerLien('e1', plus(5))).toBeUndefined();
    expect(await depot.consommerLien('e2', plus(31))).toBeUndefined();
    expect(await depot.liensValides('club@example.fr', plus(31))).toBe(0);
  });

  it('oublie les liens et sessions expirés au passage', async () => {
    const base = baseD1DeTest();
    const depot = new Depot(base);
    const compte = await depot.organisateurParCourriel('club@example.fr', t0);
    await depot.ouvrirSession('s1', compte.id, plus(10));
    await depot.enregistrerLien('e1', 'club@example.fr', t0, plus(10));
    await depot.enregistrerLien('e2', 'club@example.fr', plus(20), plus(50));
    const { results } = await base.prepare('SELECT empreinte FROM jetons_connexion').all();
    expect(results).toEqual([{ empreinte: 'e2' }]);
    expect(await base.prepare('SELECT * FROM sessions').all()).toEqual({ results: [] });
  });

  it('crée un compte une seule fois par adresse et ouvre des sessions', async () => {
    const depot = new Depot(baseD1DeTest());
    const compte = await depot.organisateurParCourriel('club@example.fr', t0);
    expect(await depot.organisateurParCourriel('club@example.fr', plus(1))).toEqual(compte);
    await depot.ouvrirSession('s1', compte.id, plus(60));
    await depot.modifierStructure(compte.id, 'Vélo Club');
    expect(await depot.organisateurDeSession('s1', plus(1))).toEqual({
      ...compte,
      structure: 'Vélo Club',
    });
    expect(await depot.organisateurDeSession('s1', plus(61))).toBeUndefined();
    await depot.fermerSession('s1');
    expect(await depot.organisateurDeSession('s1', plus(1))).toBeUndefined();
  });

  it('ne donne à un compte que ses propres événements', async () => {
    const depot = new Depot(baseD1DeTest());
    const a = await depot.organisateurParCourriel('a@example.fr', t0);
    const b = await depot.organisateurParCourriel('b@example.fr', t0);
    const id = await depot.creerEvenement(a.id, brouillon, t0);
    await depot.creerEvenement(a.id, { ...brouillon, titre: 'Autre' }, plus(1));
    expect((await depot.evenements(a.id)).map((e) => e.brouillon.titre)).toEqual([
      'Autre',
      'Sortie',
    ]);
    expect(await depot.evenement(b.id, id)).toBeUndefined();
    await depot.supprimerEvenement(b.id, id);
    expect(await depot.evenement(a.id, id)).toMatchObject({ id, statut: 'brouillon' });
  });

  it('modifie un événement en gardant sa dernière issue', async () => {
    const depot = new Depot(baseD1DeTest());
    const a = await depot.organisateurParCourriel('a@example.fr', t0);
    const id = await depot.creerEvenement(a.id, brouillon, t0);
    await depot.modifierEvenement(a.id, id, { brouillon, statut: 'envoye', issue: 12 }, plus(1));
    await depot.modifierEvenement(a.id, id, { brouillon, statut: 'brouillon' }, plus(2));
    expect(await depot.evenement(a.id, id)).toEqual({
      id,
      brouillon,
      statut: 'brouillon',
      issue: 12,
      modifieLe: plus(2).toISOString(),
    });
    await depot.supprimerEvenement(a.id, id);
    expect(await depot.evenements(a.id)).toEqual([]);
  });

  it('ignore une ligne illisible', async () => {
    const base = baseD1DeTest();
    const depot = new Depot(base);
    const a = await depot.organisateurParCourriel('a@example.fr', t0);
    const iso = t0.toISOString();
    await base
      .prepare(
        "INSERT INTO evenements (organisateur_id, donnees, statut, cree_le, modifie_le) VALUES (?, ?, 'brouillon', ?, ?)",
      )
      .bind(a.id, '{pas du json', iso, iso)
      .run();
    await base
      .prepare(
        "INSERT INTO evenements (organisateur_id, donnees, statut, cree_le, modifie_le) VALUES (?, ?, 'brouillon', ?, ?)",
      )
      .bind(a.id, '{"titre":"incomplet"}', iso, iso)
      .run();
    expect(await depot.evenements(a.id)).toEqual([]);
  });
});
