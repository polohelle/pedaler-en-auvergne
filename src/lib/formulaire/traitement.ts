/**
 * Traitement d'une proposition d'événement, indépendant de Cloudflare : la fonction
 * `functions/api/proposer-evenement.ts` ne fait que brancher les dépendances réelles.
 */
import { FORMULAIRES } from '@config/formulaires';
import {
  CHAMP_TURNSTILE,
  estUnRobot,
  issueEvenement,
  lirePropositionEvenement,
  type ErreurChamp,
  type IssueGithub,
} from './evenement';
import type { IssueCreee } from './github';

export interface Dependances {
  maintenant: Date;
  verifierJeton: (jeton: string) => Promise<boolean>;
  creerIssue: (issue: IssueGithub) => Promise<IssueCreee>;
  /** Absente si aucun canal de transmission n'est configuré. */
  transmettreAdresse?: (issue: IssueCreee, adresse: string) => Promise<void>;
  /** Journal sans donnée personnelle. */
  journaliser: (message: string) => void;
}

export type Resultat =
  | { statut: 'envoyee'; numero: number }
  | { statut: 'piege' }
  | { statut: 'verification' }
  | { statut: 'invalide'; erreurs: ErreurChamp[] }
  | { statut: 'echec' };

export async function traiterPropositionEvenement(
  champs: Record<string, string>,
  dependances: Dependances,
): Promise<Resultat> {
  if (estUnRobot(champs)) {
    return { statut: 'piege' };
  }
  const jeton = champs[CHAMP_TURNSTILE];
  if (jeton === undefined || !(await dependances.verifierJeton(jeton))) {
    return { statut: 'verification' };
  }
  const lecture = lirePropositionEvenement(champs, dependances.maintenant);
  if (!lecture.ok) {
    // Seuls les noms de champs sont journalisés, jamais leur contenu.
    dependances.journaliser(
      `Proposition refusée : ${lecture.erreurs.map((e) => e.champ).join(', ')}.`,
    );
    return { statut: 'invalide', erreurs: lecture.erreurs };
  }
  let issue: IssueCreee;
  try {
    issue = await dependances.creerIssue(
      issueEvenement(lecture.proposition, dependances.maintenant),
    );
  } catch (erreur) {
    dependances.journaliser(
      `Création de l'issue impossible : ${erreur instanceof Error ? erreur.message : 'erreur inconnue'}`,
    );
    return { statut: 'echec' };
  }
  const { courriel } = lecture.proposition;
  if (courriel !== undefined) {
    if (dependances.transmettreAdresse === undefined) {
      dependances.journaliser(
        `Issue #${String(issue.numero)} : aucun canal pour transmettre l'adresse.`,
      );
    } else {
      try {
        await dependances.transmettreAdresse(issue, courriel);
      } catch {
        dependances.journaliser(
          `Issue #${String(issue.numero)} : transmission de l'adresse impossible.`,
        );
      }
    }
  }
  return { statut: 'envoyee', numero: issue.numero };
}

/** Page vers laquelle renvoyer le navigateur après l'envoi. */
export function pageApres(resultat: Resultat): string {
  switch (resultat.statut) {
    case 'envoyee':
    case 'piege':
      // Le robot reçoit la même réponse qu'un humain : rien ne lui indique le piège.
      return FORMULAIRES.pageMerci;
    case 'verification':
      return `${FORMULAIRES.pageErreur}#verification`;
    case 'invalide':
      return `${FORMULAIRES.pageErreur}#saisie`;
    case 'echec':
      return `${FORMULAIRES.pageErreur}#indisponible`;
  }
}
