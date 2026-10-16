import { describe, expect, it, vi } from 'vitest';
import { verifierTurnstile } from './turnstile';

function reponse(corps: unknown, statut = 200): Response {
  return new Response(JSON.stringify(corps), { status: statut });
}

describe('verifierTurnstile', () => {
  it('envoie jeton, clé secrète et adresse IP à Cloudflare', async () => {
    const recuperer = vi.fn<typeof fetch>().mockResolvedValue(reponse({ success: true }));
    await expect(verifierTurnstile('jeton', 'secret', '203.0.113.1', recuperer)).resolves.toBe(
      true,
    );
    const [url, options] = recuperer.mock.calls[0] ?? [];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect((options?.body as URLSearchParams).toString()).toBe(
      'secret=secret&response=jeton&remoteip=203.0.113.1',
    );
  });

  it('se passe de l’adresse IP', async () => {
    const recuperer = vi.fn<typeof fetch>().mockResolvedValue(reponse({ success: true }));
    await verifierTurnstile('jeton', 'secret', undefined, recuperer);
    expect((recuperer.mock.calls[0]?.[1]?.body as URLSearchParams).toString()).toBe(
      'secret=secret&response=jeton',
    );
  });

  it.each([
    ['un refus', reponse({ success: false })],
    ['une réponse inattendue', reponse({ ok: true })],
    ['une erreur du service', reponse({}, 500)],
  ])('renvoie faux sur %s', async (_cas, resultat) => {
    const recuperer = vi.fn<typeof fetch>().mockResolvedValue(resultat);
    await expect(verifierTurnstile('jeton', 'secret', undefined, recuperer)).resolves.toBe(false);
  });
});
