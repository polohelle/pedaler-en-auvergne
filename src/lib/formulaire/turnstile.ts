/** Vérification côté serveur du jeton Cloudflare Turnstile (anti-robot sans cookie). */
import { z } from 'astro/zod';
import { FORMULAIRES } from '@config/formulaires';

const schemaReponse = z.object({ success: z.boolean() });

export async function verifierTurnstile(
  jeton: string,
  cleSecrete: string,
  ip: string | undefined,
  recuperer: typeof fetch,
): Promise<boolean> {
  const donnees = new URLSearchParams({ secret: cleSecrete, response: jeton });
  if (ip !== undefined) {
    donnees.set('remoteip', ip);
  }
  const reponse = await recuperer(FORMULAIRES.urlVerificationTurnstile, {
    method: 'POST',
    body: donnees,
  });
  if (!reponse.ok) {
    return false;
  }
  const resultat = schemaReponse.safeParse(await reponse.json());
  return resultat.success && resultat.data.success;
}
