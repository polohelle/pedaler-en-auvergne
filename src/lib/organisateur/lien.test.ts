import { describe, expect, it } from 'vitest';
import { lireDemandeLien, messageLien } from './lien';

const jeton = 'a'.repeat(43);
const lien = `https://pedalerenauvergne.fr/organisateur/confirmer/?jeton=${jeton}`;

describe('lireDemandeLien', () => {
  it('accepte une adresse et un lien vers la page de confirmation', () => {
    expect(lireDemandeLien({ courriel: 'club@example.fr', lien })).toEqual({
      courriel: 'club@example.fr',
      lien,
    });
  });

  it.each([
    null,
    'texte',
    { courriel: 'pas-une-adresse', lien },
    { courriel: 'club@example.fr', lien: 'pas une url' },
    { courriel: 'club@example.fr', lien: lien.replace('https', 'http') },
    { courriel: 'club@example.fr', lien: lien.replace('confirmer', 'autre') },
    { courriel: 'club@example.fr', lien: `${lien}&suite=1` },
    { courriel: 'club@example.fr', lien: lien.replace(jeton, 'court') },
    { courriel: 'club@example.fr', lien: 42 },
  ])('refuse %j', (corps) => {
    expect(lireDemandeLien(corps)).toBeUndefined();
  });
});

describe('messageLien', () => {
  it('écrit au demandeur, depuis l’adresse du site, avec le lien et sa durée', () => {
    const message = messageLien({ courriel: 'club@example.fr', lien });
    expect(message.to).toBe('club@example.fr');
    expect(message.from.email).toBe('formulaire@pedalerenauvergne.fr');
    expect(message.text).toContain(lien);
    expect(message.text).toContain('30 minutes');
  });
});
