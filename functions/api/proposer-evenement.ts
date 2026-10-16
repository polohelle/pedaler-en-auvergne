/**
 * Fonction Cloudflare Pages qui reçoit le formulaire « Proposer un événement » (ADR 0030) :
 * vérifie Turnstile, crée une issue GitHub sans donnée personnelle et transmet l'adresse de
 * l'auteur à l'administrateur par e-mail (ADR 0018). Toute la logique est dans
 * `src/lib/formulaire/`, testée ; ce fichier ne fait que brancher Cloudflare.
 *
 * Variables de la fonction (tableau de bord Cloudflare, jamais dans le dépôt) :
 * - `TURNSTILE_SECRET_KEY` : clé secrète du widget Turnstile ;
 * - `GITHUB_TOKEN` : jeton GitHub limité au dépôt, droit « Issues : lecture et écriture » ;
 * - `ADRESSE_ADMINISTRATEUR` et la liaison `send_email` nommée `COURRIEL` : facultatives ;
 *   sans elles, l'issue est créée mais l'adresse de l'auteur n'est transmise nulle part.
 */
import { EmailMessage } from 'cloudflare:email';
import { FORMULAIRES } from '../../src/config/formulaires';
import { messageTransmission } from '../../src/lib/formulaire/courriel';
import { champsTexte } from '../../src/lib/formulaire/evenement';
import { creerIssue } from '../../src/lib/formulaire/github';
import {
  pageApres,
  traiterPropositionEvenement,
  type Dependances,
} from '../../src/lib/formulaire/traitement';
import { verifierTurnstile } from '../../src/lib/formulaire/turnstile';

interface Env {
  TURNSTILE_SECRET_KEY?: string;
  GITHUB_TOKEN?: string;
  ADRESSE_ADMINISTRATEUR?: string;
  COURRIEL?: { send: (message: EmailMessage) => Promise<void> };
}

interface Contexte {
  request: Request;
  env: Env;
}

function rediriger(requete: Request, chemin: string): Response {
  return Response.redirect(new URL(chemin, requete.url).toString(), 303);
}

export async function onRequestPost({ request, env }: Contexte): Promise<Response> {
  const { TURNSTILE_SECRET_KEY: cleSecrete, GITHUB_TOKEN: jeton } = env;
  if (cleSecrete === undefined || jeton === undefined) {
    console.error('Formulaire : TURNSTILE_SECRET_KEY ou GITHUB_TOKEN manquant.');
    return rediriger(request, pageApres({ statut: 'echec' }));
  }

  let champs: Record<string, string>;
  try {
    champs = champsTexte((await request.formData()).entries());
  } catch {
    return rediriger(request, pageApres({ statut: 'invalide', erreurs: [] }));
  }

  const { ADRESSE_ADMINISTRATEUR: adresseAdmin, COURRIEL: courriel } = env;
  const ip = request.headers.get('CF-Connecting-IP') ?? undefined;
  const dependances: Dependances = {
    maintenant: new Date(),
    verifierJeton: (valeur) => verifierTurnstile(valeur, cleSecrete, ip, fetch),
    creerIssue: (issue) => creerIssue(issue, jeton, fetch),
    journaliser: (message) => {
      console.log(message);
    },
    ...(adresseAdmin !== undefined &&
      courriel !== undefined && {
        transmettreAdresse: async (issue, adresseAuteur) => {
          const brut = messageTransmission({
            de: FORMULAIRES.expediteur,
            a: adresseAdmin,
            numeroIssue: issue.numero,
            urlIssue: issue.url,
            adresseAuteur,
            date: new Date(),
          });
          await courriel.send(new EmailMessage(FORMULAIRES.expediteur, adresseAdmin, brut));
        },
      }),
  };

  const resultat = await traiterPropositionEvenement(champs, dependances);
  return rediriger(request, pageApres(resultat));
}
