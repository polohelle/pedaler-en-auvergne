/**
 * Demande de transmission entre la fonction du formulaire (Pages) et le Worker d'envoi
 * `workers/courriel` (ADR 0032) : le numéro de l'issue, son adresse et celle de l'auteur.
 * Sans dépendance, pour que le Worker se construise sans les modules du site.
 */
// Import relatif : le Worker se construit sans la configuration TypeScript du site.
import { FORMULAIRES } from '../../config/formulaires';

export interface DemandeTransmission {
  numeroIssue: number;
  urlIssue: string;
  adresseAuteur: string;
}

const PREFIXE_ISSUES = `https://github.com/${FORMULAIRES.depot.proprietaire}/${FORMULAIRES.depot.nom}/issues/`;
const ADRESSE = /^[^\s@<>()"]+@[^\s@<>()"]+\.[a-z]{2,}$/i;

/** Valide le corps reçu par le Worker ; refuse tout ce qui ne vient pas du formulaire. */
export function lireDemandeTransmission(corps: unknown): DemandeTransmission | undefined {
  if (typeof corps !== 'object' || corps === null) {
    return undefined;
  }
  const { numeroIssue, urlIssue, adresseAuteur } = corps as Record<string, unknown>;
  if (
    typeof numeroIssue !== 'number' ||
    !Number.isInteger(numeroIssue) ||
    numeroIssue <= 0 ||
    urlIssue !== `${PREFIXE_ISSUES}${String(numeroIssue)}` ||
    typeof adresseAuteur !== 'string' ||
    adresseAuteur.length > 254 ||
    !ADRESSE.test(adresseAuteur)
  ) {
    return undefined;
  }
  return { numeroIssue, urlIssue, adresseAuteur };
}
