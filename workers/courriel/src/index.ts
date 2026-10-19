/**
 * Worker d'envoi des e-mails du site (ADR 0032, 0038). Les fonctions Cloudflare Pages ne
 * proposent pas la liaison `send_email` : elles appellent donc ce Worker par une liaison de
 * service. Il n'a ni adresse publique ni route (`workers_dev = false`) : seules les fonctions
 * du site peuvent l'appeler. Deux envois :
 * - `POST /` : adresse de l'auteur d'une proposition, à l'administrateur (ADR 0018) ;
 * - `POST /lien-connexion` : lien de connexion à l'espace organisateur, au demandeur. Écrire
 *   à une adresse quelconque demande l'envoi d'e-mails de Cloudflare (Email Service) sur le
 *   domaine, pas seulement Email Routing.
 *
 * Réglages du Worker (tableau de bord Cloudflare, jamais dans le dépôt) :
 * - liaison `send_email` nommée `EMAIL` (déclarée dans wrangler.toml) ;
 * - secret `ADRESSE_ADMINISTRATEUR` : adresse vérifiée dans Email Routing.
 */
import { EmailMessage } from 'cloudflare:email';
import { FORMULAIRES } from '../../../src/config/formulaires';
import { messageTransmission } from '../../../src/lib/formulaire/courriel';
import { lireDemandeTransmission } from '../../../src/lib/formulaire/transmission';
import { lireDemandeLien, messageLien, type MessageLien } from '../../../src/lib/organisateur/lien';

interface Env {
  EMAIL: { send: (message: EmailMessage | MessageLien) => Promise<unknown> };
  ADRESSE_ADMINISTRATEUR?: string;
}

export default {
  async fetch(requete: Request, env: Env): Promise<Response> {
    if (requete.method !== 'POST') {
      return new Response(null, { status: 405 });
    }
    if (new URL(requete.url).pathname === '/lien-connexion') {
      return envoyerLien(requete, env);
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

async function envoyerLien(requete: Request, env: Env): Promise<Response> {
  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const demande = lireDemandeLien(corps);
  if (demande === undefined) {
    return new Response(null, { status: 400 });
  }
  await env.EMAIL.send(messageLien(demande));
  return new Response(null, { status: 204 });
}
