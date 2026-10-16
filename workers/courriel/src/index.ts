/**
 * Worker d'envoi de l'e-mail de transmission (ADR 0032). Les fonctions Cloudflare Pages ne
 * proposent pas la liaison `send_email` : le formulaire appelle donc ce Worker par une
 * liaison de service. Il n'a ni adresse publique ni route (`workers_dev = false`) : seule la
 * fonction du formulaire peut l'appeler.
 *
 * Réglages du Worker (tableau de bord Cloudflare, jamais dans le dépôt) :
 * - liaison `send_email` nommée `EMAIL` (déclarée dans wrangler.toml) ;
 * - secret `ADRESSE_ADMINISTRATEUR` : adresse vérifiée dans Email Routing.
 */
import { EmailMessage } from 'cloudflare:email';
import { FORMULAIRES } from '../../../src/config/formulaires';
import { messageTransmission } from '../../../src/lib/formulaire/courriel';
import { lireDemandeTransmission } from '../../../src/lib/formulaire/transmission';

interface Env {
  EMAIL: { send: (message: EmailMessage) => Promise<void> };
  ADRESSE_ADMINISTRATEUR?: string;
}

export default {
  async fetch(requete: Request, env: Env): Promise<Response> {
    if (requete.method !== 'POST') {
      return new Response(null, { status: 405 });
    }
    const admin = env.ADRESSE_ADMINISTRATEUR;
    if (admin === undefined || admin === '') {
      console.error('Courriel : ADRESSE_ADMINISTRATEUR manquante.');
      return new Response(null, { status: 500 });
    }
    let corps: unknown;
    try {
      corps = await requete.json();
    } catch {
      return new Response(null, { status: 400 });
    }
    const demande = lireDemandeTransmission(corps);
    if (demande === undefined) {
      return new Response(null, { status: 400 });
    }
    const brut = messageTransmission({
      de: FORMULAIRES.expediteur,
      a: admin,
      numeroIssue: demande.numeroIssue,
      urlIssue: demande.urlIssue,
      adresseAuteur: demande.adresseAuteur,
      date: new Date(),
    });
    await env.EMAIL.send(new EmailMessage(FORMULAIRES.expediteur, admin, brut));
    return new Response(null, { status: 204 });
  },
};
