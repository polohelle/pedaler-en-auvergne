import { describe, expect, it } from 'vitest';
import {
  champsTexte,
  estUnRobot,
  issueEvenement,
  lirePropositionEvenement,
  type PropositionEvenement,
} from './evenement';

const maintenant = new Date('2026-10-16T12:00:00+02:00');

const champsValides = {
  titre: 'Balade des feuilles mortes',
  type: 'sortie',
  jour_debut: '2026-11-08',
  heure_debut: '09:30',
  lieu: 'Place de Jaude',
  commune: 'Clermont-Ferrand',
  description: 'Balade tranquille de 20 km le long de l’Artière, ouverte à tous.',
  source_url: 'https://exemple.fr/balade',
};

function lire(champs: Record<string, string>) {
  return lirePropositionEvenement(champs, maintenant);
}

function champsEnErreur(champs: Record<string, string>): string[] {
  const lecture = lire(champs);
  return lecture.ok ? [] : lecture.erreurs.map((e) => e.champ);
}

describe('champsTexte', () => {
  it('garde les textes non vides, sans espaces autour', () => {
    const fichier = new Blob(['x']);
    expect(
      champsTexte([
        ['titre', '  Balade  '],
        ['tarif', '   '],
        ['piece', fichier],
      ]),
    ).toEqual({ titre: 'Balade' });
  });
});

describe('estUnRobot', () => {
  it('repère le champ piège rempli', () => {
    expect(estUnRobot({ site_web: 'https://spam.example' })).toBe(true);
    expect(estUnRobot({ titre: 'Balade' })).toBe(false);
  });
});

describe('lirePropositionEvenement', () => {
  it('accepte une proposition minimale et ajoute le fuseau de Paris', () => {
    const lecture = lire(champsValides);
    expect(lecture).toEqual({
      ok: true,
      proposition: {
        titre: 'Balade des feuilles mortes',
        type: 'sortie',
        debut: '2026-11-08T09:30:00+01:00',
        lieu: 'Place de Jaude',
        commune: 'Clermont-Ferrand',
        departement: '63',
        description: champsValides.description,
        source_url: 'https://exemple.fr/balade',
      },
    });
  });

  it('garde les champs facultatifs, dont l’adresse pour répondre', () => {
    const lecture = lire({
      ...champsValides,
      heure_fin: '12:00',
      organisateur: 'Vélocité 63',
      tarif: 'Gratuit',
      inscription_url: 'https://exemple.fr/inscription',
      courriel: 'organisatrice@exemple.fr',
    });
    expect(lecture.ok && lecture.proposition).toMatchObject({
      fin: '2026-11-08T12:00:00+01:00',
      organisateur: 'Vélocité 63',
      tarif: 'Gratuit',
      inscription_url: 'https://exemple.fr/inscription',
      courriel: 'organisatrice@exemple.fr',
    });
  });

  it('accepte une fin un autre jour', () => {
    const lecture = lire({ ...champsValides, jour_fin: '2026-11-09', heure_fin: '18:00' });
    expect(lecture.ok && lecture.proposition.fin).toBe('2026-11-09T18:00:00+01:00');
  });

  it('ramène les sauts de ligne du titre à des espaces', () => {
    const lecture = lire({ ...champsValides, titre: 'Balade\n  du dimanche' });
    expect(lecture.ok && lecture.proposition.titre).toBe('Balade du dimanche');
  });

  it('exige les champs obligatoires', () => {
    expect(champsEnErreur({})).toEqual(
      expect.arrayContaining([
        'titre',
        'type',
        'jour_debut',
        'heure_debut',
        'lieu',
        'commune',
        'description',
        'source_url',
      ]),
    );
  });

  it('refuse un type inconnu, un lien non web et une description trop courte', () => {
    expect(
      champsEnErreur({
        ...champsValides,
        type: 'pique-nique',
        source_url: 'ftp://exemple.fr',
        description: 'Trop court.',
      }),
    ).toEqual(expect.arrayContaining(['type', 'source_url', 'description']));
  });

  it('refuse un département qui n’est pas encore ouvert', () => {
    expect(champsEnErreur({ ...champsValides, departement: '15' })).toEqual(['departement']);
  });

  it('refuse une adresse de réponse invalide', () => {
    expect(champsEnErreur({ ...champsValides, courriel: 'pas-une-adresse' })).toEqual(['courriel']);
  });

  it('refuse une donnée personnelle dans les champs publiés', () => {
    expect(
      champsEnErreur({
        ...champsValides,
        description: 'Inscriptions par SMS au 06 12 34 56 78, merci de prévenir.',
        organisateur: 'jean.dupont@exemple.fr',
        source_url: 'https://exemple.fr/?contact=jean@exemple.fr',
      }),
    ).toEqual(['organisateur', 'description', 'source_url']);
  });

  it('refuse une date impossible, une fin sans heure et une fin avant le début', () => {
    expect(champsEnErreur({ ...champsValides, jour_debut: '2026-02-30' })).toEqual(['jour_debut']);
    expect(champsEnErreur({ ...champsValides, jour_fin: '2026-11-09' })).toEqual(['heure_fin']);
    expect(champsEnErreur({ ...champsValides, heure_fin: '08:00' })).toEqual(['jour_fin']);
    expect(champsEnErreur({ ...champsValides, heure_fin: '25:00' })).toEqual(['jour_fin']);
  });

  it('refuse un événement déjà passé', () => {
    expect(champsEnErreur({ ...champsValides, jour_debut: '2026-10-01' })).toEqual(['jour_debut']);
  });

  it('applique le schéma de l’agenda à la future fiche', () => {
    expect(champsEnErreur({ ...champsValides, titre: ' ' })).toEqual(['titre']);
  });
});

describe('issueEvenement', () => {
  const proposition: PropositionEvenement = {
    titre: 'Balade des feuilles mortes',
    type: 'sortie',
    debut: '2026-11-08T09:30:00+01:00',
    lieu: 'Place de Jaude',
    commune: 'Clermont-Ferrand',
    departement: '63',
    organisateur: 'Vélocité 63',
    description: 'Balade de 20 km.\n\n```\n@quelqu-un [lien](https://piege.example)',
    source_url: 'https://exemple.fr/balade',
    courriel: 'organisatrice@exemple.fr',
  };
  const recueLe = new Date('2026-10-16T14:05:00+02:00');

  it('titre et étiquettes reprennent le modèle d’issue', () => {
    const issue = issueEvenement(proposition, recueLe);
    expect(issue.titre).toBe('[Événement] Balade des feuilles mortes');
    expect(issue.etiquettes).toEqual(['proposition', 'evenement']);
  });

  it('donne les champs de la fiche en YAML, à valider', () => {
    const { corps } = issueEvenement(proposition, recueLe);
    expect(corps).toContain('le vendredi 16 octobre 2026 à 14 h 05');
    expect(corps).toContain(
      [
        '```yaml',
        'titre: "Balade des feuilles mortes"',
        'type: sortie',
        'debut: "2026-11-08T09:30:00+01:00"',
        'lieu: "Place de Jaude"',
        'commune: "Clermont-Ferrand"',
        'departement: "63"',
        'source_url: "https://exemple.fr/balade"',
        'source: formulaire',
        'statut: a_valider',
        "# Organisateur indiqué, à relier à sa fiche de l'annuaire (slug) :",
        '# "Vélocité 63"',
        '```',
      ].join('\n'),
    );
  });

  it('cite la description dans un bloc de code qu’elle ne peut pas refermer', () => {
    const { corps } = issueEvenement(proposition, recueLe);
    expect(corps).toContain("```text\nBalade de 20 km.\n\n'''\n@quelqu-un");
    expect(corps.match(/```/g)).toHaveLength(4);
  });

  it('ne contient jamais l’adresse de l’auteur', () => {
    const { corps } = issueEvenement(proposition, recueLe);
    expect(corps).not.toContain('organisatrice@exemple.fr');
    expect(corps).toContain('envoyée à part à l’administrateur');
    const sansCourriel: PropositionEvenement = { ...proposition };
    delete sansCourriel.courriel;
    const sansAdresse = issueEvenement(sansCourriel, recueLe);
    expect(sansAdresse.corps).toContain('n’a pas laissé d’adresse');
  });

  it('ajoute fin, tarif et lien d’inscription quand ils existent', () => {
    const { corps } = issueEvenement(
      {
        ...proposition,
        fin: '2026-11-08T12:00:00+01:00',
        tarif: 'Gratuit',
        inscription_url: 'https://exemple.fr/inscription',
      },
      recueLe,
    );
    expect(corps).toContain('fin: "2026-11-08T12:00:00+01:00"');
    expect(corps).toContain('tarif: "Gratuit"');
    expect(corps).toContain('inscription_url: "https://exemple.fr/inscription"');
  });
});
