import { describe, expect, it } from 'vitest';
import {
  acteurBrouillon,
  acteurPublie,
  breve,
  evenement,
  sans,
} from '../../tests/fixtures/contenus';
import { ecrireMarkdown } from './frontmatter';
import { validerFichier } from './validation';

const description = 'Magasin et atelier de réparation au centre-ville.';

describe('validerFichier — acteurs', () => {
  const nom = 'cycles-du-centre-clermont-ferrand.md';

  it('accepte un brouillon sans description', () => {
    expect(validerFichier('acteurs', nom, ecrireMarkdown(acteurBrouillon(), ''))).toEqual([]);
  });

  it('accepte une fiche publiée complète', () => {
    expect(validerFichier('acteurs', nom, ecrireMarkdown(acteurPublie(), description))).toEqual([]);
  });

  it('bloque une fiche publiée sans description', () => {
    expect(validerFichier('acteurs', nom, ecrireMarkdown(acteurPublie(), ''))).toEqual([
      'Description manquante : le corps du fichier est vide.',
    ]);
  });

  it('bloque une fiche publiée incomplète et nomme les champs manquants', () => {
    const incomplet = sans(acteurPublie(), 'adresse', 'verifie_le');
    const erreurs = validerFichier('acteurs', nom, ecrireMarkdown(incomplet, description));
    expect(erreurs).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^adresse/),
        expect.stringMatching(/^verifie_le/),
      ]),
    );
  });

  it('exige que le nom du fichier soit le slug', () => {
    expect(validerFichier('acteurs', 'autre.md', ecrireMarkdown(acteurBrouillon(), ''))).toEqual([
      'Nom de fichier attendu : cycles-du-centre-clermont-ferrand.md',
    ]);
  });

  it('signale un frontmatter illisible', () => {
    expect(validerFichier('acteurs', nom, 'pas de frontmatter')[0]).toMatch(/Frontmatter/);
  });
});

describe('validerFichier — événements', () => {
  it('accepte un fichier daté du jour de début à Paris', () => {
    expect(
      validerFichier(
        'evenements',
        '2026-11-08-bourse-riom.md',
        ecrireMarkdown(evenement(), 'Texte.'),
      ),
    ).toEqual([]);
  });

  it('exige une description', () => {
    expect(
      validerFichier('evenements', '2026-11-08-bourse-riom.md', ecrireMarkdown(evenement(), '')),
    ).toEqual(['Description manquante : le corps du fichier est vide.']);
  });

  it('refuse une date de fichier différente du début', () => {
    expect(
      validerFichier('evenements', '2026-11-09-bourse-riom.md', ecrireMarkdown(evenement(), 'T.')),
    ).toEqual(['Le nom de fichier doit commencer par la date 2026-11-08.']);
  });

  it('refuse un nom de fichier sans date', () => {
    expect(
      validerFichier('evenements', 'bourse-riom.md', ecrireMarkdown(evenement(), 'T.')),
    ).toEqual(['Nom de fichier attendu : 2026-11-08-<slug>.md']);
  });

  it('remonte les erreurs de schéma', () => {
    expect(
      validerFichier(
        'evenements',
        '2026-11-08-a.md',
        ecrireMarkdown({ ...evenement(), type: 'x' }, 'T.'),
      ),
    ).toHaveLength(1);
  });
});

describe('validerFichier — actus', () => {
  it('accepte une brève sans corps', () => {
    expect(
      validerFichier('actus', '2026-10-12-voie-verte.md', ecrireMarkdown(breve(), '')),
    ).toEqual([]);
  });

  it('exige le corps d’un article', () => {
    expect(
      validerFichier(
        'actus',
        '2026-10-12-voie-verte.md',
        ecrireMarkdown({ ...breve(), type: 'article' }, ''),
      ),
    ).toEqual(['Description manquante : le corps du fichier est vide.']);
  });

  it('remonte les erreurs de schéma', () => {
    expect(
      validerFichier(
        'actus',
        '2026-10-12-a.md',
        ecrireMarkdown({ ...breve(), portee: 'monde' }, ''),
      ),
    ).toHaveLength(1);
  });
});
