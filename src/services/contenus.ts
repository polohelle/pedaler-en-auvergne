/**
 * Seul point d'accès aux collections (règle ESLint `no-restricted-imports`) : les pages
 * ne reçoivent que des contenus visibles, triés. Une description obligatoire manquante
 * fait échouer le build plutôt que de publier une fiche vide.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { estActeurVisible, estActuVisible, estEvenementVisible, estPasse } from '@lib/publication';
import { descriptionRequise } from '@lib/validation';
import type { Acteur } from '@schemas/acteur';

/** Fiche publiée : le schéma garantit adresse, code postal, commune et vérification. */
export type EntreeActeurPublie = CollectionEntry<'acteurs'> & {
  data: Extract<Acteur, { statut: 'publie' }>;
};

function exigerDescription(entree: { id: string; collection: string; body?: string | undefined }) {
  if ((entree.body ?? '').trim() === '') {
    throw new Error(`${entree.collection}/${entree.id} : description manquante.`);
  }
}

export async function acteursPublies(): Promise<EntreeActeurPublie[]> {
  const acteurs = await getCollection('acteurs', (acteur): acteur is EntreeActeurPublie =>
    estActeurVisible(acteur.data.statut),
  );
  for (const acteur of acteurs) {
    if (descriptionRequise.acteurs(acteur.data)) exigerDescription(acteur);
  }
  return acteurs.sort((a, b) => a.data.nom.localeCompare(b.data.nom, 'fr'));
}

/** Événements affichables (y compris passés non archivés), du plus proche au plus lointain. */
export async function evenementsVisibles(
  maintenant: Date = new Date(),
): Promise<CollectionEntry<'evenements'>[]> {
  const evenements = await getCollection('evenements', ({ data }) =>
    estEvenementVisible(data, maintenant),
  );
  for (const evenement of evenements) exigerDescription(evenement);
  return evenements.sort((a, b) => a.data.debut.getTime() - b.data.debut.getTime());
}

export async function evenementsAVenir(
  maintenant: Date = new Date(),
): Promise<CollectionEntry<'evenements'>[]> {
  return (await evenementsVisibles(maintenant)).filter(({ data }) => !estPasse(data, maintenant));
}

/** Actualités publiées, de la plus récente à la plus ancienne. */
export async function actusPubliees(): Promise<CollectionEntry<'actus'>[]> {
  const actus = await getCollection('actus', ({ data }) => estActuVisible(data.statut));
  for (const actu of actus) {
    if (descriptionRequise.actus(actu.data)) exigerDescription(actu);
  }
  return actus.sort((a, b) => b.data.date.localeCompare(a.data.date));
}
