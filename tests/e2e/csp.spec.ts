/**
 * La CSP de public/_headers interdit scripts et styles en ligne. `astro preview` n'applique
 * pas _headers : on vérifie donc directement le HTML construit.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const dist = join(import.meta.dirname, '../../dist-e2e');
const pagesHtml = readdirSync(dist, { recursive: true, encoding: 'utf8' }).filter((f) =>
  f.endsWith('.html'),
);

test('le site construit contient des pages', () => {
  expect(pagesHtml.length).toBeGreaterThan(5);
});

for (const fichier of pagesHtml) {
  test(`${fichier} : aucun script ni style en ligne`, () => {
    const html = readFileSync(join(dist, fichier), 'utf8');
    const scriptsEnLigne = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].filter(
      ([, attributs]) => !attributs?.includes('application/ld+json'),
    );
    expect(scriptsEnLigne).toEqual([]);
    expect(html).not.toMatch(/<style[\s>]/);
    expect(html).not.toMatch(/\sstyle="/);
  });
}
