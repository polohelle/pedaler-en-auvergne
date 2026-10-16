import { describe, expect, it } from 'vitest';
import { lireDemandeTransmission } from './transmission';

const demande = {
  numeroIssue: 42,
  urlIssue: 'https://github.com/polohelle/pedaler-en-auvergne/issues/42',
  adresseAuteur: 'auteur@exemple.fr',
};

describe('lireDemandeTransmission', () => {
  it('accepte une demande du formulaire', () => {
    expect(lireDemandeTransmission({ ...demande, autre: 'ignoré' })).toEqual(demande);
  });

  it.each([
    ['un corps vide', null],
    ['un texte', 'bonjour'],
    ['un numéro non entier', { ...demande, numeroIssue: 4.2 }],
    [
      'un numéro nul',
      { ...demande, numeroIssue: 0, urlIssue: demande.urlIssue.replace('42', '0') },
    ],
    ['un numéro en texte', { ...demande, numeroIssue: '42' }],
    ['une issue d’un autre dépôt', { ...demande, urlIssue: 'https://github.com/x/y/issues/42' }],
    ['une issue qui ne correspond pas au numéro', { ...demande, numeroIssue: 43 }],
    ['une adresse invalide', { ...demande, adresseAuteur: 'pas-une-adresse' }],
    ['une adresse avec saut de ligne', { ...demande, adresseAuteur: 'a@b.fr\r\nBcc: c@d.fr' }],
    ['une adresse trop longue', { ...demande, adresseAuteur: `${'a'.repeat(250)}@b.fr` }],
    ['une adresse absente', { numeroIssue: 42, urlIssue: demande.urlIssue }],
  ])('refuse %s', (_cas, corps) => {
    expect(lireDemandeTransmission(corps)).toBeUndefined();
  });
});
