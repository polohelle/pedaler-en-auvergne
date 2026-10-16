import { describe, expect, it } from 'vitest';
import { enteteUtf8, messageTransmission } from './courriel';

const transmission = {
  de: 'formulaire@pedalerenauvergne.fr',
  a: 'admin@exemple.fr',
  numeroIssue: 42,
  urlIssue: 'https://github.com/polohelle/pedaler-en-auvergne/issues/42',
  adresseAuteur: 'organisatrice@exemple.fr',
  date: new Date('2026-10-16T12:05:00Z'),
};

describe('enteteUtf8', () => {
  it('laisse l’ASCII tel quel', () => {
    expect(enteteUtf8('Proposition #42')).toBe('Proposition #42');
  });

  it('encode le reste en base64 UTF-8', () => {
    expect(enteteUtf8('Pédaler')).toBe('=?UTF-8?B?UMOpZGFsZXI=?=');
  });
});

describe('messageTransmission', () => {
  it('contient le numéro de l’issue et l’adresse, et permet de répondre à l’auteur', () => {
    const message = messageTransmission(transmission);
    expect(message).toContain(
      'From: =?UTF-8?B?UMOpZGFsZXIgZW4gQXV2ZXJnbmU=?= <formulaire@pedalerenauvergne.fr>\r\n',
    );
    expect(message).toContain('To: <admin@exemple.fr>\r\n');
    expect(message).toContain('Reply-To: <organisatrice@exemple.fr>\r\n');
    expect(message).toContain('Date: Fri, 16 Oct 2026 12:05:00 GMT\r\n');
    expect(message).toContain(
      'Message-ID: <proposition-42-1792152300000@pedalerenauvergne.fr>\r\n',
    );
    expect(message).toContain(
      '\r\n\r\nIssue #42 : https://github.com/polohelle/pedaler-en-auvergne/issues/42\r\n',
    );
    expect(message).toContain("Adresse de l'auteur : organisatrice@exemple.fr\r\n");
    expect(message).toContain('trois mois');
  });

  it('refuse un saut de ligne dans une adresse', () => {
    expect(() =>
      messageTransmission({ ...transmission, adresseAuteur: 'a@b.fr\r\nBcc: x@y.fr' }),
    ).toThrow(RangeError);
  });

  it('tolère un expéditeur sans domaine', () => {
    expect(messageTransmission({ ...transmission, de: 'formulaire' })).toContain('@localhost>');
  });
});
