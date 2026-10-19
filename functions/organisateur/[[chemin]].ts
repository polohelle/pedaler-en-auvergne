/**
 * Fonction Cloudflare Pages de l'espace organisateur (ADR 0038) : toutes les adresses sous
 * `/organisateur/`. Toute la logique est dans `src/lib/organisateur/`, testée ; ce fichier ne
 * fait que brancher Cloudflare.
 *
 * Liaisons et variables du projet Pages (tableau de bord Cloudflare, jamais dans le dépôt) :
 * - base D1 `ORGANISATEURS` (schéma : `migrations/`) ; sans elle, l'espace est fermé ;
 * - `TURNSTILE_SECRET_KEY` et `GITHUB_TOKEN`, partagés avec le formulaire (ADR 0030) ;
 * - envoi des liens de connexion : secret `BREVO_API_KEY` (Brevo, prioritaire) ou, à défaut,
 *   liaison de service `COURRIEL` vers le Worker `pedaler-courriel` (Cloudflare Email Service).
 */
import { ORGANISATEUR } from '../../src/config/organisateur';
import { creerIssue } from '../../src/lib/formulaire/github';
import { verifierTurnstile } from '../../src/lib/formulaire/turnstile';
import { repondre, type PageRendue } from '../../src/lib/organisateur/application';
import { Depot, type BaseD1 } from '../../src/lib/organisateur/depot';
import { envoyerParBrevo, type DemandeLien } from '../../src/lib/organisateur/lien';
import { pageIndisponible } from '../../src/lib/organisateur/vues';
import { SITE } from '../../src/config/site';

interface Env {
  ORGANISATEURS?: BaseD1;
  TURNSTILE_SECRET_KEY?: string;
  GITHUB_TOKEN?: string;
  BREVO_API_KEY?: string;
  COURRIEL?: { fetch: (url: string, init: RequestInit) => Promise<Response> };
  ASSETS: { fetch: (requete: Request | string) => Promise<Response> };
}

interface Contexte {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}

/** Insère le titre et le contenu dans la page statique `/organisateur/gabarit/`. */
async function rendrePage(requete: Request, env: Env, page: PageRendue): Promise<Response> {
  const gabarit = await env.ASSETS.fetch(
    new URL(ORGANISATEUR.pages.gabarit, requete.url).toString(),
  );
  const transformee = new HTMLRewriter()
    .on('title', {
      element: (element) => {
        element.setInnerContent(`${page.titre} — ${SITE.nom}`);
      },
    })
    .on('[data-titre-organisateur]', {
      element: (element) => {
        element.setInnerContent(page.titre);
      },
    })
    .on('[data-contenu-organisateur]', {
      element: (element) => {
        element.setInnerContent(page.contenu.toString(), { html: true });
      },
    })
    .transform(gabarit);
  const entetes = new Headers(transformee.headers);
  // Pages personnelles : ni cache partagé, ni copie hors connexion.
  entetes.set('Cache-Control', 'no-store');
  entetes.set('X-Robots-Tag', 'noindex');
  return new Response(transformee.body, { status: page.statut ?? 200, headers: entetes });
}

/** Brevo si sa clé est configurée, sinon le Worker d'envoi s'il est relié, sinon rien. */
function envoyeur(
  cleBrevo: string | undefined,
  courriel: Env['COURRIEL'],
): ((demande: DemandeLien) => Promise<void>) | undefined {
  if (cleBrevo !== undefined && cleBrevo !== '') {
    return (demande) => envoyerParBrevo(demande, cleBrevo, fetch);
  }
  if (courriel === undefined) return undefined;
  return async (demande) => {
    // L'adresse de l'URL est ignorée : la liaison de service mène toujours au Worker.
    const reponse = await courriel.fetch('https://courriel.interne/lien-connexion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(demande),
    });
    if (!reponse.ok) throw new Error(`Worker d'envoi : ${String(reponse.status)}`);
  };
}

export async function onRequest({ request, env, next }: Contexte): Promise<Response> {
  const {
    ORGANISATEURS: base,
    TURNSTILE_SECRET_KEY: cleSecrete,
    GITHUB_TOKEN: jeton,
    BREVO_API_KEY: cleBrevo,
    COURRIEL: courriel,
  } = env;
  if (base === undefined || cleSecrete === undefined) {
    const chemin = new URL(request.url).pathname;
    if (chemin === ORGANISATEUR.pages.gabarit) return next();
    console.error('Espace organisateur : base ORGANISATEURS ou TURNSTILE_SECRET_KEY manquante.');
    return rendrePage(request, env, {
      titre: 'Espace organisateur',
      contenu: pageIndisponible(),
      statut: 503,
    });
  }
  const ip = request.headers.get('CF-Connecting-IP') ?? undefined;
  const envoyerLien = envoyeur(cleBrevo, courriel);
  return repondre(request, {
    depot: new Depot(base),
    maintenant: new Date(),
    verifierTurnstile: (valeur) => verifierTurnstile(valeur, cleSecrete, ip, fetch),
    ...(envoyerLien !== undefined && { envoyerLien }),
    ...(jeton !== undefined && { creerIssue: (issue) => creerIssue(issue, jeton, fetch) }),
    rendrePage: (page) => rendrePage(request, env, page),
    pageStatique: next,
    journaliser: (message) => {
      console.log(message);
    },
  });
}
