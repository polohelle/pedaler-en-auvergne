import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lireMarkdown } from '../frontmatter';
import { validerFichier } from '../validation';
import { categoriesEtServices, slugActeur, versActeur, type ElementOsm } from './correspondance';
import { aGeocoder, planifierImport } from './import';
import { requeteOverpass } from './requete';

const { elements } = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../../tests/fixtures/overpass-63.json'), 'utf8'),
) as { elements: ElementOsm[] };

function element(id: number): ElementOsm {
  const trouve = elements.find((e) => e.id === id);
  if (trouve === undefined) throw new Error(`Élément ${String(id)} absent de la fixture`);
  return trouve;
}

describe('requeteOverpass', () => {
  it('cible le département et les commerces vélo', () => {
    const requete = requeteOverpass('63');
    expect(requete).toContain('area["ISO3166-2"="FR-63"]["admin_level"="6"]');
    expect(requete).toContain('nwr["shop"="bicycle"](area.departement);');
    expect(requete).toContain('["amenity"="bicycle_rental"]["bicycle_rental"="shop"]');
    expect(requete).toContain('out center tags;');
  });
});

describe('categoriesEtServices', () => {
  it('déduit catégories et services des tags', () => {
    expect(
      categoriesEtServices({
        shop: 'bicycle',
        'service:bicycle:repair': 'yes',
        'service:bicycle:diy': 'yes',
      }),
    ).toEqual({
      categories: ['magasin', 'reparateur'],
      services: ['reparation', 'auto-reparation'],
    });
  });

  it('classe un loueur à guichet', () => {
    expect(categoriesEtServices({ amenity: 'bicycle_rental', bicycle_rental: 'shop' })).toEqual({
      categories: ['loueur'],
      services: ['location'],
    });
  });

  it('classe en magasin un revendeur d’occasion seul', () => {
    expect(
      categoriesEtServices({ shop: 'second_hand', 'service:bicycle:second_hand': 'only' }),
    ).toEqual({ categories: ['magasin'], services: ['occasion'] });
  });
});

describe('slugActeur', () => {
  it.each([
    ['Cycles du Centre', 'Clermont-Ferrand', 'cycles-du-centre-clermont-ferrand'],
    ['Sport Riom', 'Riom', 'sport-riom'],
    ['Riomois Cycles', 'Riom', 'riomois-cycles-riom'],
    ['Giant', undefined, 'giant'],
  ])('%s à %s → %s', (nom, commune, attendu) => {
    expect(slugActeur(nom, commune)).toBe(attendu);
  });
});

describe('versActeur', () => {
  it('produit un brouillon complet à partir d’un commerce bien renseigné', () => {
    const resultat = versActeur(element(1001), '63');
    expect(resultat).toEqual({
      ok: true,
      manques: ['description', 'verifie_le'],
      acteur: {
        nom: 'Cycles du Centre',
        slug: 'cycles-du-centre-clermont-ferrand',
        categories: ['magasin', 'reparateur'],
        membre: false,
        adresse: '12 Rue du Port',
        code_postal: '63000',
        commune: 'Clermont-Ferrand',
        departement: '63',
        lat: 45.7772,
        lon: 3.087,
        services: ['vente-neuf', 'occasion', 'reparation'],
        horaires: 'Tu-Sa 09:00-12:00,14:00-19:00',
        site: 'https://cycles-du-centre.example',
        email: 'contact@cycles-du-centre.example',
        telephone: '+33 4 73 00 00 00',
        reseaux: ['https://www.facebook.com/cyclesducentre'],
        source: 'osm',
        osm_id: 'node/1001',
        statut: 'brouillon',
      },
    });
  });

  it('prend le centre d’un bâtiment et signale l’adresse manquante', () => {
    const resultat = versActeur(element(2002), '63');
    expect(resultat.ok && resultat.acteur).toMatchObject({
      slug: 'sport-riom',
      categories: ['loueur'],
      lat: 45.8936,
      osm_id: 'way/2002',
    });
    expect(resultat.ok && resultat.manques).toEqual([
      'adresse',
      'code_postal',
      'commune',
      'description',
      'verifie_le',
    ]);
  });

  it('écarte les valeurs invalides plutôt que la fiche', () => {
    const resultat = versActeur(element(1005), '63');
    expect(resultat.ok).toBe(true);
    if (!resultat.ok) return;
    expect(resultat.acteur.code_postal).toBeUndefined();
    expect(resultat.acteur.site).toBeUndefined();
    expect(resultat.acteur.telephone).toBeUndefined();
  });

  it.each([
    [1003, /n'est pas un acteur/],
    [1004, /sans nom/],
    [1007, /aucune activité vélo/],
    [3008, /sans coordonnées/],
    [1009, /hors d’Auvergne/],
  ])('ignore l’élément %i', (id, motif) => {
    const resultat = versActeur(element(id), '63');
    expect(resultat.ok).toBe(false);
    expect(!resultat.ok && resultat.motif).toMatch(motif);
  });
});

describe('planifierImport', () => {
  it('crée des fiches valides, numérote les homonymes et ignore les objets déjà importés', () => {
    const plan = planifierImport(
      elements,
      { slugs: new Set(['sport-riom']), osmIds: new Set(['node/1006']) },
      '63',
    );
    expect(plan.creations.map((c) => c.nomFichier)).toEqual([
      'cycles-du-centre-clermont-ferrand.md',
      'cycles-du-centre-clermont-ferrand-2.md',
      'sport-riom-2.md',
    ]);
    expect(plan.dejaPresents).toEqual(['node/1006']);
    expect(plan.ignores).toHaveLength(5);
    for (const { nomFichier, contenu } of plan.creations) {
      expect(validerFichier('acteurs', nomFichier, contenu)).toEqual([]);
    }
  });

  it('écrit les champs dans l’ordre du cahier des charges, en brouillon', () => {
    const [premiere] = planifierImport(
      [element(1001)],
      { slugs: new Set(), osmIds: new Set() },
      '63',
    ).creations;
    const cles = Object.keys(lireMarkdown(premiere?.contenu ?? '').donnees as object);
    expect(cles[0]).toBe('nom');
    expect(cles.at(-1)).toBe('statut');
    expect(cles.indexOf('osm_id')).toBeGreaterThan(cles.indexOf('source'));
  });
});

describe('géocodage inverse', () => {
  const vide = { slugs: new Set<string>(), osmIds: new Set<string>() };

  it('ne soumet que les objets sans adresse, positionnés et pas encore importés', () => {
    expect(
      aGeocoder(elements, { ...vide, osmIds: new Set(['node/1004']) }).map((e) => e.osmId),
    ).toEqual(['way/2002', 'node/1003', 'node/1006', 'node/1007', 'node/1009']);
  });

  it('complète commune et code postal manquants, sans écraser ceux d’OSM', () => {
    const communes = new Map([
      ['way/2002', { commune: 'Riom', code_postal: '63200' }],
      ['node/1001', { commune: 'Autre', code_postal: '63100' }],
    ]);
    const plan = planifierImport([element(1001), element(2002)], vide, '63', communes);
    expect(plan.creations.map((c) => c.nomFichier)).toEqual([
      'cycles-du-centre-clermont-ferrand.md',
      'sport-riom.md',
    ]);
    expect(plan.creations[1]?.manques).toEqual(['adresse', 'description', 'verifie_le']);
  });
});
