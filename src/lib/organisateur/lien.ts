/**
 * Lien de connexion de l'espace organisateur, envoyé par le Worker `workers/courriel`
 * (ADR 0032, 0038) : la demande transmise par la fonction, sa validation, et le message.
 * Imports relatifs seulement : le Worker se construit sans la configuration du site.
 */
import { FORMULAIRES } from '../../config/formulaires';
import { ORGANISATEUR } from '../../config/organisateur';

export interface DemandeLien {
  courriel: string;
  lien: string;
}

const ADRESSE = /^[^\s@<>()"]+@[^\s@<>()"]+\.[a-z]{2,}$/i;

/** Valide le corps reçu par le Worker : une adresse, et un lien vers la page de confirmation. */
export function lireDemandeLien(corps: unknown): DemandeLien | undefined {
  if (typeof corps !== 'object' || corps === null) return undefined;
  const { courriel, lien } = corps as Record<string, unknown>;
  if (
    typeof courriel !== 'string' ||
    courriel.length > 254 ||
    !ADRESSE.test(courriel) ||
    typeof lien !== 'string'
  ) {
    return undefined;
  }
  let url: URL;
  try {
    url = new URL(lien);
  } catch {
    return undefined;
  }
  const jeton = url.searchParams.get('jeton');
  if (
    url.protocol !== 'https:' ||
    url.pathname !== ORGANISATEUR.pages.confirmer ||
    [...url.searchParams.keys()].length !== 1 ||
    jeton === null ||
    !/^[A-Za-z0-9_-]{43}$/.test(jeton)
  ) {
    return undefined;
  }
  return { courriel, lien: url.toString() };
}

export interface MessageLien {
  to: string;
  from: { email: string; name: string };
  subject: string;
  text: string;
}

/** Message au format de l'envoi d'e-mails de Cloudflare (Email Service). */
export function messageLien(demande: DemandeLien): MessageLien {
  return {
    to: demande.courriel,
    from: { email: FORMULAIRES.expediteur, name: 'Pédaler en Auvergne' },
    subject: 'Votre lien de connexion à l’espace organisateur',
    text: [
      'Bonjour,',
      '',
      'Pour ouvrir votre espace organisateur sur Pédaler en Auvergne, suivez ce lien :',
      '',
      demande.lien,
      '',
      `Il est valable ${String(ORGANISATEUR.dureeLienMinutes)} minutes et ne sert qu’une fois.`,
      'Si vous n’avez rien demandé, ignorez ce message : aucun compte ne s’ouvre sans ce lien.',
      '',
      'Pédaler en Auvergne',
    ].join('\n'),
  };
}

/** Adresse de l'API d'envoi transactionnel de Brevo. */
export const URL_BREVO = 'https://api.brevo.com/v3/smtp/email';

/**
 * Envoie le lien par Brevo (offre gratuite, 300 e-mails par jour), sans passer par le Worker :
 * la fonction appelle l'API avec la clé secrète `BREVO_API_KEY`. L'expéditeur doit être une
 * adresse du domaine authentifié dans Brevo.
 */
export async function envoyerParBrevo(
  demande: DemandeLien,
  cle: string,
  recuperer: typeof fetch,
): Promise<void> {
  const message = messageLien(demande);
  const reponse = await recuperer(URL_BREVO, {
    method: 'POST',
    headers: { 'api-key': cle, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: message.from,
      to: [{ email: message.to }],
      subject: message.subject,
      textContent: message.text,
    }),
  });
  if (!reponse.ok) {
    throw new Error(`Brevo a répondu ${String(reponse.status)}.`);
  }
}
