import { describe, expect, it } from 'vitest';
import {
  EVENEMENTS_PAR_CARROUSEL,
  carrouselSemaine,
  compteInstagram,
  diapositiveEvenement,
  echapperHtml,
  evenementsDeLaSemaine,
  horaire,
  legendeSemaine,
  semaineAPreparer,
  semaineDe,
  type EvenementInstagram,
  type Ressources,
} from './instagram';

const semaine = { lundi: '2026-11-09', dimanche: '2026-11-15' };
const maintenant = new Date('2026-11-08T18:00:00+01:00');

function evenement(champs: Partial<EvenementInstagram> = {}): EvenementInstagram {
  return {
    titre: 'Cyclo-cross de Cournon',
    type: 'course',
    pratiques: ['cyclo-cross'],
    debut: new Date('2026-11-14T10:30:00+01:00'),
    fin: new Date('2026-11-14T16:30:00+01:00'),
    lieu: "Plan d'eau",
    commune: "Cournon-d'Auvergne",
    departement: '63',
    organisateur: 'velo-club-cournon',
    statut: 'publie',
    ...champs,
  };
}

const ressources: Ressources = {
  policeTitres: 'file:///titres.woff2',
  policeTexte: 'file:///texte.woff2',
  logo: '<svg></svg>',
  urlImage: (chemin) => `file:///public${chemin}`,
};

describe('semaineDe', () => {
  it('va du lundi au dimanche de la semaine du jour', () => {
    expect(semaineDe('2026-11-12')).toEqual(semaine);
    expect(semaineDe('2026-11-09')).toEqual(semaine);
    expect(semaineDe('2026-11-15')).toEqual(semaine);
  });

  it('passe les changements de mois et d’année', () => {
    expect(semaineDe('2027-01-01')).toEqual({ lundi: '2026-12-28', dimanche: '2027-01-03' });
  });

  it('refuse un jour mal écrit ou impossible', () => {
    expect(() => semaineDe('12/11/2026')).toThrow(RangeError);
    expect(() => semaineDe('2026-13-40')).toThrow(RangeError);
  });
});

describe('semaineAPreparer', () => {
  it('prend la semaine en cours en semaine', () => {
    expect(semaineAPreparer(new Date('2026-11-13T09:00:00+01:00'))).toEqual(semaine);
  });

  it('prend la semaine suivante le samedi et le dimanche', () => {
    expect(semaineAPreparer(new Date('2026-11-07T09:00:00+01:00'))).toEqual(semaine);
    expect(semaineAPreparer(maintenant)).toEqual(semaine);
  });

  it('raisonne sur le jour de Paris', () => {
    // Dimanche 23 h 30 UTC = lundi 0 h 30 à Paris : semaine en cours.
    expect(semaineAPreparer(new Date('2026-11-08T23:30:00Z'))).toEqual(semaine);
  });
});

describe('evenementsDeLaSemaine', () => {
  it('garde les événements visibles de la semaine, triés par date', () => {
    const samedi = evenement({ titre: 'Samedi' });
    const mardi = evenement({ titre: 'Mardi', debut: new Date('2026-11-10T17:00:00+01:00') });
    const avant = evenement({
      titre: 'Avant',
      debut: new Date('2026-11-08T10:00:00+01:00'),
      fin: undefined,
    });
    const apres = evenement({ titre: 'Après', debut: new Date('2026-11-16T10:00:00+01:00') });
    const aValider = evenement({ titre: 'À valider', statut: 'a_valider' });
    const annule = evenement({ titre: 'Annulé', statut: 'annule' });
    const titres = evenementsDeLaSemaine(
      [samedi, avant, aValider, mardi, apres, annule],
      semaine,
      maintenant,
    ).map((e) => e.titre);
    expect(titres).toEqual(['Mardi', 'Samedi', 'Annulé']);
  });

  it('garde un événement commencé avant le lundi qui dure jusque dans la semaine', () => {
    const stage = evenement({
      debut: new Date('2026-11-07T09:00:00+01:00'),
      fin: new Date('2026-11-09T17:00:00+01:00'),
    });
    expect(evenementsDeLaSemaine([stage], semaine, maintenant)).toHaveLength(1);
  });
});

describe('compteInstagram', () => {
  it('lit le compte dans un lien de profil', () => {
    expect(compteInstagram(['https://www.instagram.com/becycles.clermont/'])).toBe(
      '@becycles.clermont',
    );
    expect(compteInstagram(['https://facebook.com/x', 'https://instagram.com/vcca63?hl=fr'])).toBe(
      '@vcca63',
    );
  });

  it('ignore les liens qui ne sont pas des profils', () => {
    expect(compteInstagram(['https://www.instagram.com/p/AbC123/'])).toBeUndefined();
    expect(compteInstagram(['https://www.instagram.com/reel/AbC123'])).toBeUndefined();
    expect(compteInstagram(['https://example.com/instagram.com/x'])).toBeUndefined();
    expect(compteInstagram(undefined)).toBeUndefined();
  });
});

describe('horaire', () => {
  it('donne les heures sur une journée', () => {
    expect(horaire(evenement())).toBe('10 h 30 – 16 h 30');
    expect(horaire({ debut: new Date('2026-11-15T09:00:00+01:00') })).toBe('9 h');
  });

  it('donne la plage complète sur plusieurs jours', () => {
    expect(
      horaire({
        debut: new Date('2026-11-14T14:00:00+01:00'),
        fin: new Date('2026-11-15T18:00:00+01:00'),
      }),
    ).toBe('du samedi 14 novembre 2026 à 14 h au dimanche 15 novembre 2026 à 18 h');
  });
});

describe('legendeSemaine', () => {
  it('liste les événements, tague les organisateurs et finit par les hashtags', () => {
    const legende = legendeSemaine(
      [
        evenement(),
        evenement({
          titre: 'Coupe de BMX',
          departement: '03',
          commune: 'Yzeure',
          organisateur: undefined,
          pratiques: undefined,
          statut: 'annule',
          debut: new Date('2026-11-15T09:00:00+01:00'),
          fin: undefined,
        }),
      ],
      semaine,
      new Map([['velo-club-cournon', '@vcca63']]),
    );
    expect(legende).toBe(
      [
        "Cette semaine à vélo dans le Puy-de-Dôme et dans l'Allier, du lundi 9 au dimanche 15 novembre 2026 :",
        '',
        "• sam. 14 nov. · Cyclo-cross de Cournon, Cournon-d'Auvergne @vcca63",
        '• ANNULÉ · dim. 15 nov. · Coupe de BMX, Yzeure',
        '',
        'Horaires, tarifs et inscriptions sur le site : lien en bio.',
        'Un événement à ajouter ? Proposez-le sur pedalerenauvergne.fr.',
        '',
        '#Velo #PuyDeDome #Auvergne #CycloCross',
      ].join('\n'),
    );
  });

  it('dit « en Haute-Loire »', () => {
    expect(legendeSemaine([evenement({ departement: '43' })], semaine, new Map())).toMatch(
      /^Cette semaine à vélo en Haute-Loire,/,
    );
  });

  it('refuse une semaine vide', () => {
    expect(() => legendeSemaine([], semaine, new Map())).toThrow(RangeError);
  });
});

describe('echapperHtml', () => {
  it('échappe les caractères du balisage', () => {
    expect(echapperHtml(`<b>"Vélo" & l'atelier</b>`)).toBe(
      '&lt;b&gt;&quot;Vélo&quot; &amp; l&#39;atelier&lt;/b&gt;',
    );
  });
});

describe('diapositiveEvenement', () => {
  it('affiche type, pratiques, date, lieu, horaire, tarif et position', () => {
    const html = diapositiveEvenement(
      evenement({ tarif: 'Gratuit' }),
      { rang: 2, total: 4 },
      ressources,
    );
    expect(html).toContain('>Course</span>');
    expect(html).toContain('>Cyclo-cross</span>');
    expect(html).toContain('Samedi 14 novembre');
    expect(html).toContain('Plan d&#39;eau, Cournon-d&#39;Auvergne');
    expect(html).toContain('10 h 30 – 16 h 30 · Gratuit');
    expect(html).toContain('<span>2/4</span>');
    expect(html).not.toContain('<img');
  });

  it("montre l'affiche avec son crédit, et barre un événement annulé", () => {
    const html = diapositiveEvenement(
      evenement({
        statut: 'annule',
        titre: 'Un titre vraiment très long pour un événement vélo du Puy-de-Dôme',
        image: { src: '/evenements/affiche.webp', alt: 'Affiche', credit: 'VCCA' },
      }),
      { rang: 3, total: 4 },
      ressources,
    );
    expect(html).toContain('src="file:///public/evenements/affiche.webp" alt="Affiche"');
    expect(html).toContain('Image : VCCA');
    expect(html).toContain('class="titre long barre"');
    expect(html).toContain('etiquette annule');
  });

  it('écrit la bourse en texte sombre sur genêt', () => {
    expect(
      diapositiveEvenement(evenement({ type: 'bourse' }), { rang: 2, total: 2 }, ressources),
    ).toContain('background:#e8b04a;color:#22303a');
  });
});

describe('carrouselSemaine', () => {
  it('commence par la couverture puis une diapositive par événement', () => {
    const diapositives = carrouselSemaine([evenement(), evenement()], semaine, ressources);
    expect(diapositives).toHaveLength(3);
    expect(diapositives[0]).toContain('Cette semaine à vélo');
    expect(diapositives[0]).toContain('Du lundi 9 au dimanche 15 novembre 2026');
    expect(diapositives[0]).toContain('2 rendez-vous dans le Puy-de-Dôme');
    expect(diapositives[2]).toContain('<span>3/3</span>');
  });

  it('s’arrête à 9 événements et renvoie les autres au site', () => {
    const evenements = Array.from({ length: EVENEMENTS_PAR_CARROUSEL + 2 }, () => evenement());
    const diapositives = carrouselSemaine(evenements, semaine, ressources);
    expect(diapositives).toHaveLength(EVENEMENTS_PAR_CARROUSEL + 1);
    expect(diapositives[0]).toContain(
      '11 rendez-vous dans le Puy-de-Dôme, dont 2 à retrouver sur le site',
    );
  });

  it('refuse une semaine vide', () => {
    expect(() => carrouselSemaine([], semaine, ressources)).toThrow(RangeError);
  });
});
