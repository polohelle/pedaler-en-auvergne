import { describe, expect, it } from 'vitest';
import {
  acteurBrouillon,
  acteurPublie,
  acteurSansAdressePublique,
  sans,
} from '../../tests/fixtures/contenus';
import { schemaActeur } from './acteur';

const valider = (donnees: Record<string, unknown>) => schemaActeur.safeParse(donnees);
const chemins = (donnees: Record<string, unknown>) =>
  valider(donnees).error?.issues.map((issue) => issue.path.join('.')) ?? [];

describe('schéma acteur — brouillon (validation souple)', () => {
  it('accepte une fiche importée sans adresse, sans description ni vérification', () => {
    expect(valider(acteurBrouillon()).success).toBe(true);
  });

  it('accepte une fiche archivée incomplète', () => {
    expect(valider({ ...acteurBrouillon(), statut: 'archive' }).success).toBe(true);
  });

  it('exige quand même les champs indispensables', () => {
    const incomplet = sans(acteurBrouillon(), 'nom', 'commune', 'categories');
    expect(chemins(incomplet)).toEqual(expect.arrayContaining(['nom', 'commune', 'categories']));
  });

  it('considère un brouillon comme non membre par défaut', () => {
    const resultat = valider(acteurBrouillon());
    expect(resultat.success && resultat.data.membre).toBe(false);
  });
});

describe('schéma acteur — brouillon importé d’OpenStreetMap (champs minimaux)', () => {
  it.each([
    ['adresse', '12 rue du Port'],
    ['code_postal', '63000'],
    ['telephone', '04 73 00 00 00'],
    ['email', 'contact@exemple.fr'],
    ['site', 'https://exemple.fr'],
    ['horaires', 'Mo-Fr 09:00-18:00'],
    ['services', ['reparation']],
  ])('refuse le champ %s', (champ, valeur) => {
    expect(chemins({ ...acteurBrouillon(), [champ]: valeur })).toContain(champ);
  });

  it('refuse des coordonnées', () => {
    expect(chemins({ ...acteurBrouillon(), lat: 45.7772, lon: 3.087 })).toEqual(
      expect.arrayContaining(['lat', 'lon']),
    );
  });

  it('exige l’identifiant OSM', () => {
    expect(chemins(sans(acteurBrouillon(), 'osm_id'))).toContain('osm_id');
  });

  it('autorise un brouillon proposé par formulaire à être plus complet', () => {
    const propose = {
      ...sans(acteurBrouillon(), 'osm_id'),
      source: 'formulaire',
      adresse: '12 rue du Port',
      code_postal: '63000',
      lat: 45.7772,
      lon: 3.087,
      site: 'https://exemple.fr',
    };
    expect(valider(propose).success).toBe(true);
  });
});

describe('schéma acteur — publié (validation stricte)', () => {
  it('accepte une fiche complète', () => {
    expect(valider(acteurPublie()).success).toBe(true);
  });

  it.each(['adresse', 'code_postal', 'lat', 'lon', 'verifie_le'])(
    'refuse une fiche publiée sans %s',
    (champ) => {
      expect(chemins(sans(acteurPublie(), champ))).toContain(champ);
    },
  );

  it('refuse le passage en publié d’un brouillon resté incomplet', () => {
    expect(valider({ ...acteurBrouillon(), statut: 'publie' }).success).toBe(false);
  });

  it('ramène un jour écrit sans guillemets (Date YAML) à sa chaîne', () => {
    const resultat = valider({ ...acteurPublie(), verifie_le: new Date('2026-10-14T00:00:00Z') });
    expect(resultat.success && resultat.data.verifie_le).toBe('2026-10-14');
  });
});

describe('schéma acteur — règles communes', () => {
  it('lie le collège au statut de membre', () => {
    expect(chemins({ ...acteurPublie(), membre: true })).toContain('college');
    expect(chemins({ ...acteurPublie(), college: 'usagers' })).toContain('college');
    expect(valider({ ...acteurPublie(), membre: true, college: 'usagers' }).success).toBe(true);
  });

  it('refuse une latitude sans longitude', () => {
    const propose = { ...sans(acteurBrouillon(), 'osm_id'), source: 'formulaire', lat: 45.7772 };
    expect(chemins(propose)).toContain('lat');
  });

  it('refuse des coordonnées hors d’Auvergne', () => {
    expect(chemins({ ...acteurPublie(), lat: 3.087, lon: 45.7772 })).toContain('lat');
  });

  it('refuse un code postal d’un autre département', () => {
    expect(chemins({ ...acteurPublie(), code_postal: '03100' })).toContain('code_postal');
  });

  it('refuse un champ inconnu (faute de frappe)', () => {
    expect(valider({ ...acteurBrouillon(), telephon: '0473000000' }).success).toBe(false);
  });

  it.each([
    ['slug', 'Cycles du Centre'],
    ['categories', []],
    ['categories', ['magasin', 'magasin']],
    ['categories', ['boulangerie']],
    ['departement', '75'],
    ['email', 'pas-un-email'],
    ['site', 'ftp://exemple.fr'],
    ['telephone', '12345'],
    ['osm_id', '123456'],
    ['statut', 'en_ligne'],
  ])('refuse %s = %j', (champ, valeur) => {
    const enErreur = chemins({ ...acteurBrouillon(), [champ]: valeur });
    expect(enErreur.some((chemin) => chemin === champ || chemin.startsWith(`${champ}.`))).toBe(
      true,
    );
  });
});

describe('schéma acteur — publié sans adresse publique', () => {
  it('accepte une fiche avec commune, zone et contact, sans adresse ni position', () => {
    expect(valider(acteurSansAdressePublique()).success).toBe(true);
  });

  it.each([
    ['adresse', '12 rue du Port'],
    ['lat', 45.7772],
    ['lon', 3.087],
  ])('refuse le champ %s', (champ, valeur) => {
    const avec = { ...acteurSansAdressePublique(), [champ]: valeur };
    if (champ === 'lat') Object.assign(avec, { lon: 3.087 });
    if (champ === 'lon') Object.assign(avec, { lat: 45.7772 });
    expect(chemins(avec)).toContain(champ);
  });

  it('exige quand même la vérification et le code postal', () => {
    expect(chemins(sans(acteurSansAdressePublique(), 'verifie_le', 'code_postal'))).toEqual(
      expect.arrayContaining(['verifie_le', 'code_postal']),
    );
  });

  it('signale tous les manques d’une fiche publiée en une fois', () => {
    const incomplete = sans(acteurPublie(), 'adresse', 'lat', 'lon', 'verifie_le');
    expect(chemins(incomplete)).toEqual(
      expect.arrayContaining(['adresse', 'lat', 'lon', 'verifie_le']),
    );
  });

  it('reste interdit dans un brouillon importé d’OpenStreetMap', () => {
    expect(chemins({ ...acteurBrouillon(), sans_adresse_publique: true })).toContain(
      'sans_adresse_publique',
    );
  });
});

describe('schéma acteur — logo', () => {
  const logo = {
    fichier: 'cycles-du-centre-clermont-ferrand.svg',
    source_url: 'https://cycles-du-centre.example/presse',
    origine: 'site-structure',
  };

  it('accepte un logo sourcé, au nom de la fiche', () => {
    expect(valider({ ...acteurPublie(), logo }).success).toBe(true);
  });

  it.each([
    ['logo.fichier', { ...logo, fichier: 'Logo Final.jpg' }],
    ['logo.fichier', { ...logo, fichier: 'autre-boutique.svg' }],
    ['logo.source_url', sans(logo, 'source_url')],
    ['logo.origine', { ...logo, origine: 'trouve-sur-internet' }],
  ])('refuse %s invalide ou manquant', (chemin, valeur) => {
    expect(chemins({ ...acteurPublie(), logo: valeur })).toContain(chemin);
  });

  it('reste interdit dans un brouillon importé d’OpenStreetMap', () => {
    expect(chemins({ ...acteurBrouillon(), logo })).toContain('logo');
  });
});

describe('schéma acteur — club et source', () => {
  const club = () => ({
    ...acteurSansAdressePublique(),
    categories: ['club-sportif'],
    disciplines: ['route', 'vtt'],
    source: 'agent',
    source_url: 'https://federation.example/clubs/cycles-du-centre',
  });

  it('accepte un club avec ses disciplines et sa source', () => {
    expect(valider(club()).success).toBe(true);
  });

  it.each([
    ['disciplines', []],
    ['disciplines', ['route', 'route']],
    ['disciplines', ['velo-couche']],
    ['source_url', 'pas-une-url'],
  ])('refuse %s = %j', (champ, valeur) => {
    const enErreur = chemins({ ...club(), [champ]: valeur });
    expect(enErreur.some((chemin) => chemin === champ || chemin.startsWith(`${champ}.`))).toBe(
      true,
    );
  });

  it('exige la source d’une fiche établie par un agent', () => {
    expect(chemins(sans(club(), 'source_url'))).toContain('source_url');
  });

  it('reste interdit dans un brouillon importé d’OpenStreetMap', () => {
    expect(chemins({ ...acteurBrouillon(), disciplines: ['bmx'] })).toContain('disciplines');
  });
});
