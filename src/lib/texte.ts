/**
 * Conversion du Markdown des fiches en texte brut, pour les formats qui n'acceptent pas de
 * balisage (calendrier iCal, résumé de flux RSS). Couvre le Markdown simple des descriptions :
 * paragraphes, titres, listes, gras, italique, code et liens.
 */
export function texteBrut(markdown: string): string {
  return markdown
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((bloc) =>
      bloc
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '– ')
        .replace(/(\*\*|__)(.+?)\1/g, '$2')
        .replace(/(\*|_)(.+?)\1/g, '$2')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[ \t]+/g, ' ')
        .replace(/ ?\n ?/g, '\n')
        .trim(),
    )
    .filter((bloc) => bloc !== '')
    .join('\n\n');
}
