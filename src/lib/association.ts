import type { College } from '@config/acteurs';
import { COLLEGES_ASSOCIATION, type CollegeAssociation } from '@config/association';

/** Ce qu'il faut savoir d'une fiche de l'annuaire pour la ranger par collège. */
interface FicheMembre {
  data: { membre: boolean; college?: College | undefined };
}

export interface MembresDuCollege<T> {
  college: CollegeAssociation;
  membres: T[];
}

/**
 * Range les fiches membres par collège, dans l'ordre des statuts, en conservant l'ordre des
 * fiches reçues. Chaque collège figure, même vide ; le collège Cyclistes l'est toujours, car
 * les particuliers n'ont pas de fiche dans l'annuaire.
 */
export function membresParCollege<T extends FicheMembre>(
  fiches: readonly T[],
): MembresDuCollege<T>[] {
  return COLLEGES_ASSOCIATION.map((college) => ({
    college,
    membres: fiches.filter(({ data }) => data.membre && data.college === college),
  }));
}

const PREFIXE_HELLOASSO = 'https://www.helloasso.com/associations/';

/**
 * Vérifie une adresse de campagne HelloAsso configurée. Une adresse qui ne mène pas à
 * HelloAsso fait échouer le build plutôt que d'envoyer un paiement ailleurs.
 */
export function lienHelloAsso(adresse: string | null): string | null {
  if (adresse === null) return null;
  if (!adresse.startsWith(PREFIXE_HELLOASSO) || adresse.length === PREFIXE_HELLOASSO.length) {
    throw new Error(`Adresse HelloAsso inattendue : ${adresse} (attendu : ${PREFIXE_HELLOASSO}…).`);
  }
  return adresse;
}

const euros = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/** Montant entier en euros, à la française : « 120 € ». */
export function formaterMontant(montant: number): string {
  return euros.format(montant);
}
