/**
 * Validation complète d'un fichier de contenu : frontmatter conforme au schéma, description
 * présente quand elle est requise, nom de fichier conforme. Les tests de contenu l'appliquent
 * à tout `src/content/`, ce qui bloque en CI toute fiche publiée incomplète.
 */
import type { ZodError } from 'astro/zod';
import { schemaActeur, type Acteur } from '@schemas/acteur';
import { schemaActu, type Actu } from '@schemas/actu';
import { schemaEvenement } from '@schemas/evenement';
import { jourCivil } from './dates';
import { lireMarkdown } from './frontmatter';

export const COLLECTIONS = ['acteurs', 'evenements', 'actus'] as const;
export type NomCollection = (typeof COLLECTIONS)[number];

/** Corps Markdown obligatoire : description d'un acteur publié, de tout événement, d'un article. */
export const descriptionRequise = {
  acteurs: (acteur: Pick<Acteur, 'statut'>) => acteur.statut === 'publie',
  evenements: () => true,
  actus: (actu: Pick<Actu, 'type'>) => actu.type === 'article',
} as const;

const NOM_DATE = /^(\d{4}-\d{2}-\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

function erreursZod(erreur: ZodError): string[] {
  return erreur.issues.map((issue) => {
    const chemin = issue.path.map(String).join('.');
    return chemin === '' ? issue.message : `${chemin} : ${issue.message}`;
  });
}

function verifierNomDate(nomFichier: string, jour: string): string[] {
  const prefixe = NOM_DATE.exec(nomFichier)?.[1];
  if (prefixe === undefined) {
    return [`Nom de fichier attendu : ${jour}-<slug>.md`];
  }
  return prefixe === jour ? [] : [`Le nom de fichier doit commencer par la date ${jour}.`];
}

export function validerFichier(
  collection: NomCollection,
  nomFichier: string,
  source: string,
): string[] {
  let fichier;
  try {
    fichier = lireMarkdown(source);
  } catch (erreur) {
    return [erreur instanceof Error ? erreur.message : String(erreur)];
  }
  const corpsVide = fichier.corps.trim() === '';
  const manqueDescription = 'Description manquante : le corps du fichier est vide.';

  switch (collection) {
    case 'acteurs': {
      const resultat = schemaActeur.safeParse(fichier.donnees);
      if (!resultat.success) return erreursZod(resultat.error);
      const erreurs: string[] = [];
      if (nomFichier !== `${resultat.data.slug}.md`) {
        erreurs.push(`Nom de fichier attendu : ${resultat.data.slug}.md`);
      }
      if (descriptionRequise.acteurs(resultat.data) && corpsVide) erreurs.push(manqueDescription);
      return erreurs;
    }
    case 'evenements': {
      const resultat = schemaEvenement.safeParse(fichier.donnees);
      if (!resultat.success) return erreursZod(resultat.error);
      const erreurs = verifierNomDate(nomFichier, jourCivil(resultat.data.debut));
      if (descriptionRequise.evenements() && corpsVide) erreurs.push(manqueDescription);
      return erreurs;
    }
    case 'actus': {
      const resultat = schemaActu.safeParse(fichier.donnees);
      if (!resultat.success) return erreursZod(resultat.error);
      const erreurs = verifierNomDate(nomFichier, resultat.data.date);
      if (descriptionRequise.actus(resultat.data) && corpsVide) erreurs.push(manqueDescription);
      return erreurs;
    }
  }
}
