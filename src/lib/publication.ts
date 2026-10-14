/**
 * Règles de publication : ce que le site affiche. Seuls les contenus `publie` apparaissent,
 * sauf un événement `annule`, qui reste visible (barré) jusqu'à son dernier jour inclus
 * pour prévenir ceux qui l'avaient noté, avant d'être archivé.
 */
import type { StatutActeur, StatutActu, StatutEvenement } from '@config/statuts';
import { jourCivil } from './dates';

export interface Periode {
  debut: Date;
  fin?: Date | undefined;
}

export function estActeurVisible(statut: StatutActeur): boolean {
  return statut === 'publie';
}

export function estActuVisible(statut: StatutActu): boolean {
  return statut === 'publie';
}

/** Un événement est passé quand son dernier jour, à Paris, est révolu. */
export function estPasse({ debut, fin }: Periode, maintenant: Date): boolean {
  return jourCivil(fin ?? debut) < jourCivil(maintenant);
}

export function estEvenementVisible(
  evenement: Periode & { statut: StatutEvenement },
  maintenant: Date,
): boolean {
  switch (evenement.statut) {
    case 'publie':
      return true;
    case 'annule':
      return !estPasse(evenement, maintenant);
    case 'a_valider':
    case 'archive':
      return false;
  }
}
