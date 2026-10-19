import { describe, expect, it } from 'vitest';
import { attribut, balisage, echapper } from './html';

describe('html', () => {
  it('échappe le texte inséré', () => {
    expect(balisage`<p>${'<script>"&\''}</p>`.toString()).toBe(
      '<p>&lt;script&gt;&quot;&amp;&#39;</p>',
    );
  });

  it('insère tel quel un fragment déjà construit, et les listes', () => {
    const items = ['a', '<b>'].map((x) => balisage`<li>${x}</li>`);
    expect(balisage`<ul>${items}</ul>`.toString()).toBe('<ul><li>a</li><li>&lt;b&gt;</li></ul>');
  });

  it('ne rend rien pour les valeurs vides ou booléennes', () => {
    expect(balisage`${undefined}${null}${false}${true}${0}`.toString()).toBe('0');
  });

  it('écrit un attribut booléen seulement s’il est présent', () => {
    expect(
      balisage`<input${attribut('checked', true)}${attribut('disabled', false)}>`.toString(),
    ).toBe('<input checked>');
  });

  it('échappe une chaîne seule', () => {
    expect(echapper('a & b')).toBe('a &amp; b');
  });
});
