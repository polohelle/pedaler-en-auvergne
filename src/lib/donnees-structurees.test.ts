import { describe, expect, it } from 'vitest';
import { schemaActeur } from '@schemas/acteur';
import { schemaActu } from '@schemas/actu';
import { schemaEvenement } from '@schemas/evenement';
import {
  acteurPublie,
  acteurSansAdressePublique,
  breve,
  evenement,
} from '../../tests/fixtures/contenus';
import {
  donneesActeur,
  donneesActu,
  donneesEvenement,
  donneesSite,
  serialiserJsonLd,
  typeActeur,
} from './donnees-structurees';

const PAGE = 'https://pedalerenauvergne.fr/annuaire/cycles-du-centre-clermont-ferrand/';

describe('serialiserJsonLd', () => {
  it('neutralise une balise fermante dans un texte', () => {
    const json = serialiserJsonLd({ name: 'Atelier </script><b>' });
    expect(json).toBe('{"name":"Atelier \\u003c/script>\\u003cb>"}');
    expect(JSON.parse(json)).toEqual({ name: 'Atelier </script><b>' });
  });
});

describe('donneesSite', () => {
  it('déclare le site', () => {
    expect(
      donneesSite({ nom: 'Pédaler en Auvergne', url: 'https://p.example/', description: 'Vélo' }),
    ).toMatchObject({ '@type': 'WebSite', name: 'Pédaler en Auvergne', inLanguage: 'fr-FR' });
  });
});

describe('typeActeur', () => {
  it('choisit le type le plus précis', () => {
    expect(typeActeur(['reparateur', 'magasin'])).toBe('BikeStore');
    expect(typeActeur(['club-sportif'])).toBe('SportsClub');
    expect(typeActeur(['collectivite'])).toBe('GovernmentOrganization');
    expect(typeActeur(['atelier-participatif'])).toBe('NGO');
    expect(typeActeur(['reparateur', 'loueur'])).toBe('LocalBusiness');
  });
});

describe('donneesActeur', () => {
  it('reprend adresse, position et contact d’une fiche publiée', () => {
    const acteur = schemaActeur.parse(acteurPublie());
    const donnees = donneesActeur(acteur, {
      url: PAGE,
      description: 'Magasin',
      logo: 'https://p.example/logo.png',
    });
    expect(donnees).toMatchObject({
      '@type': 'BikeStore',
      '@id': `${PAGE}#structure`,
      name: 'Cycles du Centre',
      url: 'https://cycles-du-centre.example',
      mainEntityOfPage: PAGE,
      logo: 'https://p.example/logo.png',
      address: {
        streetAddress: '12 rue du Port',
        postalCode: '63000',
        addressLocality: 'Clermont-Ferrand',
        addressRegion: 'Puy-de-Dôme',
        addressCountry: 'FR',
      },
      geo: { latitude: 45.7772, longitude: 3.087 },
      telephone: '04 73 00 00 00',
    });
  });

  it('ne donne que la commune d’une structure sans adresse publique', () => {
    const acteur = schemaActeur.parse(acteurSansAdressePublique());
    const donnees = donneesActeur(acteur, { url: PAGE, description: 'Atelier mobile' });
    expect(donnees.address.streetAddress).toBeUndefined();
    expect(donnees.address.addressLocality).toBe('Clermont-Ferrand');
    expect(donnees.geo).toBeUndefined();
  });

  it('renvoie à la fiche quand la structure n’a pas de site', () => {
    const acteur = schemaActeur.parse({ ...acteurPublie(), site: undefined });
    expect(donneesActeur(acteur, { url: PAGE, description: '' }).url).toBe(PAGE);
  });
});

describe('donneesEvenement', () => {
  const page = { url: 'https://p.example/agenda/bourse/', description: 'Bourse' };

  it('décrit un événement programmé avec son lieu et son organisateur', () => {
    const donnees = donneesEvenement(schemaEvenement.parse(evenement()), {
      ...page,
      image: 'https://p.example/affiche.webp',
      organisateur: { nom: 'Vélo Riom', url: 'https://p.example/annuaire/velo-riom/' },
    });
    expect(donnees).toMatchObject({
      '@type': 'Event',
      name: 'Bourse aux vélos de Riom',
      startDate: '2026-11-08T08:00:00.000Z',
      endDate: '2026-11-08T16:00:00.000Z',
      eventStatus: 'https://schema.org/EventScheduled',
      location: {
        name: 'Place de la Fédération',
        address: { addressLocality: 'Riom' },
        geo: { latitude: 45.8936, longitude: 3.1126 },
      },
      image: ['https://p.example/affiche.webp'],
      organizer: { '@type': 'Organization', name: 'Vélo Riom' },
    });
    expect(donnees.isAccessibleForFree).toBeUndefined();
  });

  it('signale un événement annulé, gratuit, sans fin ni organisateur', () => {
    const donnees = donneesEvenement(
      schemaEvenement.parse({
        ...evenement(),
        fin: undefined,
        organisateur: undefined,
        statut: 'annule',
        tarif: 'Gratuit, sur inscription',
      }),
      page,
    );
    expect(donnees.eventStatus).toBe('https://schema.org/EventCancelled');
    expect(donnees.isAccessibleForFree).toBe(true);
    expect(donnees.endDate).toBeUndefined();
    expect(donnees.organizer).toBeUndefined();
    expect(donnees.image).toBeUndefined();
  });
});

describe('donneesActu', () => {
  it('décrit une actualité publiée par le site', () => {
    const site = {
      nom: 'Pédaler en Auvergne',
      url: 'https://p.example/',
      logo: 'https://p.example/l.png',
    };
    const donnees = donneesActu(
      schemaActu.parse(breve()),
      { url: 'https://p.example/actus/a/' },
      site,
    );
    expect(donnees).toMatchObject({
      '@type': 'NewsArticle',
      headline: 'Nouvelle voie verte entre Riom et Clermont',
      datePublished: '2026-10-12',
      publisher: { '@type': 'Organization', name: 'Pédaler en Auvergne' },
    });
    expect(donnees.image).toBeUndefined();
    expect(
      donneesActu(schemaActu.parse(breve()), { url: 'x', image: 'https://p.example/i.webp' }, site)
        .image,
    ).toEqual(['https://p.example/i.webp']);
  });
});
