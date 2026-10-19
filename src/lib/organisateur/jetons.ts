/**
 * Jetons de l'espace organisateur : lien de connexion et session. Seule leur empreinte
 * SHA-256 est enregistrée dans la base : une fuite de la base ne donne accès à aucun compte.
 * Web Crypto, disponible chez Cloudflare comme dans Node.
 */
import { ORGANISATEUR } from '@config/organisateur';

/** 32 octets aléatoires en base64url : 256 bits, impossibles à deviner. */
export function jetonAleatoire(): string {
  const octets = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...octets))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function empreinte(jeton: string): Promise<string> {
  const condensat = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(jeton));
  return [...new Uint8Array(condensat)].map((o) => o.toString(16).padStart(2, '0')).join('');
}

/** Forme d'un jeton reçu, avant toute requête en base. */
export function estUnJeton(texte: string | null | undefined): texte is string {
  return typeof texte === 'string' && /^[A-Za-z0-9_-]{43}$/.test(texte);
}

/** Valeur d'un cookie de l'en-tête `Cookie`. */
export function lireCookie(entete: string | null, nom: string): string | undefined {
  if (entete === null) return undefined;
  for (const morceau of entete.split(';')) {
    const [cle, ...valeur] = morceau.trim().split('=');
    if (cle === nom) return valeur.join('=');
  }
  return undefined;
}

/** Cookie de session : inaccessible au JavaScript, HTTPS seulement, jamais envoyé par un autre site en POST. */
export function cookieSession(jeton: string): string {
  const age = ORGANISATEUR.dureeSessionJours * 86_400;
  return `${ORGANISATEUR.cookie}=${jeton}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${String(age)}`;
}

export function cookieEfface(): string {
  return `${ORGANISATEUR.cookie}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function plusMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}
