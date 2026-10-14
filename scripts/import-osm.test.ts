import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { analyserArguments, executer, type Dependances } from './import-osm';

const fixture = join(import.meta.dirname, '../tests/fixtures/overpass-63.json');

describe('analyserArguments', () => {
  it('prend le Puy-de-Dôme par défaut', () => {
    expect(analyserArguments([])).toEqual({
      departement: '63',
      essai: false,
      geocoder: true,
      overpass: 'https://overpass-api.de/api/interpreter',
      entree: undefined,
    });
  });

  it('lit les options', () => {
    expect(
      analyserArguments([
        '--departement',
        '03',
        '--dry-run',
        '--sans-ban',
        '--entree',
        'r.json',
        '--overpass',
        'https://miroir.example/api/interpreter',
      ]),
    ).toEqual({
      departement: '03',
      essai: true,
      geocoder: false,
      overpass: 'https://miroir.example/api/interpreter',
      entree: 'r.json',
    });
  });

  it('refuse un département non couvert', () => {
    expect(() => analyserArguments(['--departement', '75'])).toThrow(/Département inconnu/);
  });

  it('refuse une adresse Overpass invalide', () => {
    expect(() => analyserArguments(['--overpass', 'miroir'])).toThrow(/Adresse Overpass invalide/);
  });

  it('refuse une option inconnue', () => {
    expect(() => analyserArguments(['--force'])).toThrow();
  });
});

describe('executer', () => {
  let dossier: string;
  let lignes: string[];
  let deps: Dependances;

  beforeEach(async () => {
    dossier = await mkdtemp(join(tmpdir(), 'import-osm-'));
    lignes = [];
    deps = {
      interroger: async () => JSON.parse(await readFile(fixture, 'utf8')) as unknown,
      geocoderInverse: () => Promise.resolve({ features: [] }),
      lireTexte: (chemin) => readFile(chemin, 'utf8'),
      lister: (d) => readdir(d),
      creer: (chemin, contenu) => writeFile(chemin, contenu, { flag: 'wx' }),
      journal: (ligne) => lignes.push(ligne),
    };
  });

  afterEach(async () => {
    await rm(dossier, { recursive: true, force: true });
  });

  it('écrit les fiches brouillon sans toucher aux fiches existantes', async () => {
    const existante = '---\nnom: Loc Vélo\nosm_id: node/1006\n---\n\nVérifiée à la main.\n';
    await writeFile(join(dossier, 'loc-velo.md'), existante);

    const plan = await executer(
      { departement: '63', essai: false, geocoder: false, overpass: '' },
      dossier,
      deps,
    );

    expect(plan.creations).toHaveLength(3);
    expect((await readdir(dossier)).sort()).toEqual([
      'cycles-du-centre-clermont-ferrand-2.md',
      'cycles-du-centre-clermont-ferrand.md',
      'loc-velo.md',
      'sport-riom.md',
    ]);
    expect(await readFile(join(dossier, 'loc-velo.md'), 'utf8')).toBe(existante);
    expect(lignes).toContain("1 objet(s) déjà dans l'annuaire, laissé(s) intact(s).");
  });

  it('n’écrit rien en mode essai', async () => {
    await executer(
      { departement: '63', essai: true, geocoder: false, overpass: '' },
      dossier,
      deps,
    );
    expect(await readdir(dossier)).toEqual([]);
    expect(lignes[1]).toMatch(/essai, rien écrit/);
  });

  it('rejoue une réponse enregistrée sans appeler le réseau', async () => {
    const sansReseau = {
      ...deps,
      interroger: () => Promise.reject(new Error('réseau interdit')),
    };
    const plan = await executer(
      { departement: '63', essai: true, geocoder: false, overpass: '', entree: fixture },
      dossier,
      sansReseau,
    );
    expect(plan.creations).toHaveLength(4);
  });

  it('complète par la BAN la commune des objets sans adresse', async () => {
    const appels: string[] = [];
    const avecBan = {
      ...deps,
      geocoderInverse: (lat: number, lon: number) => {
        appels.push(`${String(lat)},${String(lon)}`);
        return Promise.resolve({
          features: [
            {
              geometry: { coordinates: [lon, lat] },
              properties: { city: 'Riom', postcode: '63200' },
            },
          ],
        });
      },
    };
    const plan = await executer(
      { departement: '63', essai: true, geocoder: true, overpass: '' },
      dossier,
      avecBan,
    );
    expect(appels).toContain('45.8936,3.1126');
    expect(plan.creations.map((c) => c.nomFichier)).toContain('sport-riom.md');
    expect(lignes[1]).toBe('6 commune(s) complétée(s) par la Base Adresse Nationale.');
  });

  it('refuse une réponse Overpass mal formée', async () => {
    const mauvaise = { ...deps, interroger: () => Promise.resolve({ elements: [{ id: 'x' }] }) };
    await expect(
      executer(
        { departement: '63', essai: true, geocoder: false, overpass: '' },
        dossier,
        mauvaise,
      ),
    ).rejects.toThrow();
  });
});
