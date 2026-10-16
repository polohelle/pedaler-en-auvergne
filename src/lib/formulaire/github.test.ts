import { describe, expect, it, vi } from 'vitest';
import { creerIssue } from './github';

const issue = { titre: '[Événement] Balade', corps: 'Corps', etiquettes: ['proposition'] };

describe('creerIssue', () => {
  it('crée l’issue sur le dépôt du site et renvoie son numéro', async () => {
    const recuperer = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          number: 42,
          html_url: 'https://github.com/polohelle/pedaler-en-auvergne/issues/42',
        }),
        { status: 201 },
      ),
    );
    await expect(creerIssue(issue, 'jeton', recuperer)).resolves.toEqual({
      numero: 42,
      url: 'https://github.com/polohelle/pedaler-en-auvergne/issues/42',
    });
    const [url, options] = recuperer.mock.calls[0] ?? [];
    expect(url).toBe('https://api.github.com/repos/polohelle/pedaler-en-auvergne/issues');
    expect(options?.method).toBe('POST');
    expect(options?.headers).toMatchObject({ Authorization: 'Bearer jeton' });
    expect(JSON.parse(options?.body as string)).toEqual({
      title: '[Événement] Balade',
      body: 'Corps',
      labels: ['proposition'],
    });
  });

  it('échoue si GitHub refuse', async () => {
    const recuperer = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 403 }));
    await expect(creerIssue(issue, 'jeton', recuperer)).rejects.toThrow('GitHub a répondu 403.');
  });
});
