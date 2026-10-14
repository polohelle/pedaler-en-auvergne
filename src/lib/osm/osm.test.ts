import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lireMarkdown } from '../frontmatter';
import { validerFichier } from '../validation';
import { categoriesOsm, slugActeur, versActeur, type ElementOsm } from './correspondance';
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

describe('categoriesOsm', () => {
  it('déduit les catégories des tags vélo', () => {
    expect(categoriesOsm({ shop: 'bicycle', 'service:bicycle:repair': 'yes' })).toEqual([
      'magasin',
      'reparateur',
    ]);
  });

  it('classe un loueur à guichet', () => {
    expect(categoriesOsm({ amenity: 'bicycle_rental', bicycle_rental: 'shop' })).toEqual([
      'loueur',
    ]);
  });

  it('classe en magasin un revendeur d’occasion seul', () => {
    expect(categoriesOsm({ shop: 'second_hand', 'service:bicycle:second_hand': 'only' })).toEqual([
      'magasin',
    ]);
  });
});

describe('slugActeur', () => {
  it.each([
    ['Cycles du Centre', 'Clermont-Ferrand', 'cycles-du-centre-clermont-ferrand'],
    ['Sport Riom', 'Riom', 'sport-riom'],
    ['Riomois Cycles', 'Riom', 'riomois-cycles-riom'],
  ])('%s à %s → %s', (nom, commune, attendu) => {
    expect(slugActeur(nom, commune)).toBe(attendu);
  });
});

describe('versActeur', () => {
  it('produit un brouillon minimal, même à partir d’un objet très renseigné', () => {
    expect(versActeur(element(1001), '63')).toEqual({
      ok: true,
      acteur: {
        nom: 'Cycles du Centre',
        slug: 'cycles-du-centre-clermont-ferrand',
        categories: ['magasin', 'reparateur'],
        commune: 'Clermont-Ferrand',
        departement: '63',
        source: 'osm',
        osm_id: 'node/1001',
        statut: 'brouillon',
      },
    });
  });

  it('ne reprend ni adresse, ni coordonnées, ni contacts', () => {
    const resultat = versActeur(element(1001), '63');
    const champs = resultat.ok ? Object.keys(resultat.acteur) : [];
    for (const champ of ['adresse', 'code_postal', 'lat', 'lon', 'telephone', 'email', 'site']) {
      expect(champs).not.toContain(champ);
    }
  });

  it('ignore un objet dont la fiche serait invalide (nom sans lettre ni chiffre)', () => {
    const symboles: ElementOsm = {
      type: 'node',
      id: 42,
      tags: { shop: 'bicycle', name: '★★★', 'addr:city': 'Riom' },
    };
    const resultat = versActeur(symboles, '63');
    expect(!resultat.ok && resultat.motif).toMatch(/^node\/42 \(★★★\) : Slug attendu/);
  });

  it.each([
    [1003, /n'est pas un acteur/],
    [1004, /sans nom/],
    [1007, /aucune activité vélo/],
    [2002, /commune introuvable/],
    [3008, /commune introuvable/],
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
    ]);
    expect(plan.dejaPresents).toEqual(['node/1006']);
    expect(plan.ignores).toHaveLength(6);
    for (const { nomFichier, contenu } of plan.creations) {
      expect(validerFichier('acteurs', nomFichier, contenu)).toEqual([]);
    }
  });

  it('écrit un frontmatter minimal, dans l’ordre du cahier des charges', () => {
    const [premiere] = planifierImport(
      [element(1001)],
      { slugs: new Set(), osmIds: new Set() },
      '63',
    ).creations;
    expect(Object.keys(lireMarkdown(premiere?.contenu ?? '').donnees as object)).toEqual([
      'nom',
      'slug',
      'categories',
      'commune',
      'departement',
      'source',
      'osm_id',
      'statut',
    ]);
  });
});

describe('géocodage inverse', () => {
  const vide = { slugs: new Set<string>(), osmIds: new Set<string>() };

  it('ne soumet que les objets sans commune, positionnés et pas encore importés', () => {
    expect(
      aGeocoder(elements, { ...vide, osmIds: new Set(['node/1004']) }).map((e) => e.osmId),
    ).toEqual(['way/2002', 'node/1003', 'node/1006', 'node/1007', 'node/1009']);
  });

  it('complète la commune manquante, sans écraser celle d’OSM ni sortir du département', () => {
    const communes = new Map([
      ['way/2002', { commune: 'Riom', code_postal: '63200' }],
      ['node/1001', { commune: 'Autre', code_postal: '63100' }],
      ['node/1006', { commune: 'Moulins', code_postal: '03000' }],
    ]);
    const plan = planifierImport(
      [element(1001), element(2002), element(1006)],
      vide,
      '63',
      communes,
    );
    expect(plan.creations.map((c) => c.nomFichier)).toEqual([
      'cycles-du-centre-clermont-ferrand.md',
      'sport-riom.md',
    ]);
    expect(plan.ignores).toEqual([expect.stringMatching(/^node\/1006 .*commune introuvable/)]);
  });
});
