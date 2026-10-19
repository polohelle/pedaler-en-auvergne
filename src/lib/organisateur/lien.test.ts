import { describe, expect, it } from 'vitest';
import { envoyerParBrevo, lireDemandeLien, messageLien, URL_BREVO } from './lien';

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

describe('envoyerParBrevo', () => {
  it('appelle l’API de Brevo avec la clé et le message', async () => {
    const appels: { url: string; init: RequestInit }[] = [];
    const recuperer = ((url: string, init: RequestInit) => {
      appels.push({ url, init });
      return Promise.resolve(new Response('{}', { status: 201 }));
    }) as typeof fetch;
    await envoyerParBrevo({ courriel: 'club@example.fr', lien }, 'cle-secrete', recuperer);
    expect(appels[0]?.url).toBe(URL_BREVO);
    expect(new Headers(appels[0]?.init.headers).get('api-key')).toBe('cle-secrete');
    const brut = appels[0]?.init.body;
    const corps = JSON.parse(typeof brut === 'string' ? brut : '{}') as Record<string, unknown>;
    expect(corps).toMatchObject({
      sender: { email: 'formulaire@pedalerenauvergne.fr' },
      to: [{ email: 'club@example.fr' }],
    });
    expect(corps.textContent).toContain(lien);
  });

  it('signale un refus de Brevo', async () => {
    const recuperer = (() => Promise.resolve(new Response('', { status: 401 }))) as typeof fetch;
    await expect(
      envoyerParBrevo({ courriel: 'club@example.fr', lien }, 'mauvaise', recuperer),
    ).rejects.toThrow('Brevo a répondu 401.');
  });
});
