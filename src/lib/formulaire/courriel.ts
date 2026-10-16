/**
 * E-mail qui transmet à l'administrateur l'adresse de l'auteur d'une proposition (ADR 0018) :
 * le numéro de l'issue et l'adresse, rien d'autre. Message MIME brut, tel que l'attend la
 * liaison `send_email` de Cloudflare.
 */

export interface Transmission {
  de: string;
  a: string;
  numeroIssue: number;
  urlIssue: string;
  adresseAuteur: string;
  date: Date;
}

/** Encodage RFC 2047 d'un en-tête qui contient des caractères non ASCII. */
export function enteteUtf8(texte: string): string {
  if (/^[\x20-\x7e]*$/.test(texte)) {
    return texte;
  }
  const octets = new TextEncoder().encode(texte);
  return `=?UTF-8?B?${btoa(String.fromCharCode(...octets))}?=`;
}

/** Les adresses viennent d'un schéma e-mail ; on refuse quand même tout saut de ligne. */
function sansSautDeLigne(valeur: string): string {
  if (/[\r\n]/.test(valeur)) {
    throw new RangeError('Saut de ligne interdit dans un en-tête.');
  }
  return valeur;
}

export function messageTransmission(t: Transmission): string {
  const domaine = t.de.split('@')[1] ?? 'localhost';
  const entetes = [
    `From: ${enteteUtf8('Pédaler en Auvergne')} <${sansSautDeLigne(t.de)}>`,
    `To: <${sansSautDeLigne(t.a)}>`,
    `Reply-To: <${sansSautDeLigne(t.adresseAuteur)}>`,
    `Subject: ${enteteUtf8(`Proposition d'événement #${String(t.numeroIssue)}`)}`,
    `Date: ${t.date.toUTCString()}`,
    `Message-ID: <proposition-${String(t.numeroIssue)}-${String(t.date.getTime())}@${domaine}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
  ];
  const corps = [
    `Issue #${String(t.numeroIssue)} : ${t.urlIssue}`,
    `Adresse de l'auteur : ${t.adresseAuteur}`,
    '',
    "Répondre à ce message écrit à l'auteur. Supprimer ce message une fois la demande traitée,",
    'au plus tard trois mois après sa réception.',
  ];
  return `${entetes.join('\r\n')}\r\n\r\n${corps.join('\r\n')}\r\n`;
}
