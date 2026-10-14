/**
 * Lecture et écriture des fichiers Markdown à frontmatter YAML, avec les mêmes options
 * que le chargeur de contenu d'Astro (`yaml`, schéma core, balise timestamp) : un fichier
 * validé ici est lu à l'identique par le build. Utilisé par les tests de contenu et les scripts.
 */
import {
  parseDocument,
  stringify,
  type DocumentOptions,
  type ParseOptions,
  type SchemaOptions,
} from 'yaml';

const OPTIONS_YAML: ParseOptions & DocumentOptions & SchemaOptions = {
  customTags: ['timestamp'],
  schema: 'core',
  merge: true,
};
const FRONTMATTER = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n?---[ \t]*(?:\r?\n|$)([\s\S]*)$/;

export interface FichierMarkdown {
  donnees: unknown;
  corps: string;
}

export function lireMarkdown(source: string): FichierMarkdown {
  const correspondance = FRONTMATTER.exec(source);
  if (correspondance === null) {
    throw new SyntaxError('Frontmatter YAML absent : le fichier doit commencer par « --- ».');
  }
  const [, yaml = '', corps = ''] = correspondance;
  const document = parseDocument(yaml, OPTIONS_YAML);
  const [erreur] = document.errors;
  if (erreur !== undefined) {
    throw new SyntaxError(`Frontmatter YAML invalide : ${erreur.message}`);
  }
  return { donnees: document.toJS() as unknown, corps };
}

/**
 * Sérialise un fichier Markdown. Les chaînes qui ressemblent à des dates sont mises entre
 * guillemets, pour qu'Astro ne les convertisse pas en objets `Date`.
 */
export function ecrireMarkdown(donnees: Record<string, unknown>, corps: string): string {
  const yaml = stringify(donnees, { customTags: ['timestamp'], lineWidth: 0 });
  const texte = corps.trim();
  return `---\n${yaml}---\n${texte === '' ? '' : `\n${texte}\n`}`;
}
