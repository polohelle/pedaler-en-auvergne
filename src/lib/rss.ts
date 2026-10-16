/**
 * Flux RSS 2.0 de l'agenda et des actualités, générés au build. Le flux se déclare lui-même
 * (`atom:link rel="self"`) comme le recommandent les validateurs.
 */

export interface ElementRss {
  titre: string;
  /** Adresse absolue de la page. */
  lien: string;
  /** Texte brut. */
  description: string;
  /** Date de publication ; absente pour un événement, qui n'a pas de date de parution. */
  date?: Date | undefined;
}

export interface FluxRss {
  titre: string;
  /** Adresse absolue de la page HTML correspondante. */
  lien: string;
  /** Adresse absolue du flux lui-même. */
  adresseFlux: string;
  description: string;
  langue: string;
  elements: readonly ElementRss[];
}

const ENTITES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export function echapperXml(texte: string): string {
  return texte.replace(/[&<>"']/g, (caractere) => ENTITES[caractere] ?? caractere);
}

/** Date au format RFC 822 attendu par RSS : `Fri, 16 Oct 2026 09:00:00 GMT`. */
export function dateRss(date: Date): string {
  return date.toUTCString();
}

function element(e: ElementRss): string {
  const lignes = [
    '    <item>',
    `      <title>${echapperXml(e.titre)}</title>`,
    `      <link>${echapperXml(e.lien)}</link>`,
    `      <guid isPermaLink="true">${echapperXml(e.lien)}</guid>`,
    `      <description>${echapperXml(e.description)}</description>`,
  ];
  if (e.date !== undefined) {
    lignes.push(`      <pubDate>${dateRss(e.date)}</pubDate>`);
  }
  lignes.push('    </item>');
  return lignes.join('\n');
}

export function genererFluxRss(flux: FluxRss): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${echapperXml(flux.titre)}</title>`,
    `    <link>${echapperXml(flux.lien)}</link>`,
    `    <atom:link href="${echapperXml(flux.adresseFlux)}" rel="self" type="application/rss+xml" />`,
    `    <description>${echapperXml(flux.description)}</description>`,
    `    <language>${echapperXml(flux.langue)}</language>`,
    ...flux.elements.map(element),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
