/**
 * Espace organisateur (ADR 0038) : toutes les adresses sous `/organisateur/`, indépendamment
 * de Cloudflare. La fonction `functions/organisateur/[[chemin]].ts` ne fait que brancher la
 * base D1, Turnstile, GitHub, le Worker d'envoi et le gabarit de page.
 */
import { ORGANISATEUR } from '@config/organisateur';
import { CHAMP_PIEGE, CHAMP_TURNSTILE, type IssueGithub } from '@lib/formulaire/evenement';
import type { IssueCreee } from '@lib/formulaire/github';
import { jourCivil } from '@lib/dates';
import { moisCalendrier } from './calendrier';
import type { Depot, EvenementCompte, Organisateur } from './depot';
import {
  issueAnnulation,
  issueEnvoi,
  lireSaisie,
  saisieDe,
  validerSaisie,
  type Brouillon,
  type Saisie,
} from './evenement';
import type { Html } from './html';
import {
  cookieEfface,
  cookieSession,
  empreinte,
  estUnJeton,
  jetonAleatoire,
  lireCookie,
  plusMinutes,
} from './jetons';
import type { DemandeLien } from './lien';
import {
  estCleMessage,
  formulaireEvenement,
  pageConfirmer,
  pageIntrouvable,
  pageLienInvalide,
  tableauDeBord,
  type CleMessage,
} from './vues';
import type { ErreurChamp } from '@lib/formulaire/evenement';

const { pages } = ORGANISATEUR;

export interface PageRendue {
  /** Titre de niveau 1 et de l'onglet. */
  titre: string;
  contenu: Html;
  statut?: number;
}

export interface Services {
  depot: Depot;
  maintenant: Date;
  verifierTurnstile: (jeton: string) => Promise<boolean>;
  /** Absent si le Worker d'envoi n'est pas relié : aucun lien ne peut partir. */
  envoyerLien?: (demande: DemandeLien) => Promise<void>;
  /** Absent sans jeton GitHub : les événements restent en brouillon. */
  creerIssue?: (issue: IssueGithub) => Promise<IssueCreee>;
  /** Insère le contenu dans le gabarit statique de l'espace. */
  rendrePage: (page: PageRendue) => Promise<Response>;
  /** Laisse passer la requête vers les pages statiques (connexion, lien envoyé…). */
  pageStatique: () => Promise<Response>;
  /** Journal sans donnée personnelle. */
  journaliser: (message: string) => void;
}

function rediriger(chemin: string, cookie?: string): Response {
  const entetes = new Headers({ Location: chemin, 'Cache-Control': 'no-store' });
  if (cookie !== undefined) entetes.set('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers: entetes });
}

const versTableau = (message: CleMessage) => rediriger(`${pages.tableauDeBord}?message=${message}`);

async function lireFormulaire(requete: Request): Promise<[string, unknown][] | undefined> {
  try {
    return [...(await requete.formData()).entries()];
  } catch {
    return undefined;
  }
}

/** Point d'entrée : une réponse pour toute requête sous `/organisateur/`. */
export async function repondre(requete: Request, s: Services): Promise<Response> {
  const url = new URL(requete.url);
  const chemin = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  const post = requete.method === 'POST';
  if (!post && requete.method !== 'GET' && requete.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, POST' } });
  }
  // Un formulaire posté depuis un autre site est refusé (en plus du cookie SameSite=Lax).
  const origine = requete.headers.get('Origin');
  if (post && origine !== null && origine !== url.origin) {
    return new Response('Origine refusée.', { status: 403 });
  }
  if (chemin !== url.pathname && !post) {
    return rediriger(`${chemin}${url.search}`);
  }

  if (chemin === pages.connexion) {
    return post ? demanderLien(requete, url, s) : s.pageStatique();
  }
  if (chemin === pages.confirmer) {
    if (post) return confirmer(requete, s);
    const jeton = url.searchParams.get('jeton');
    return s.rendrePage({
      titre: 'Connexion à l’espace organisateur',
      contenu: pageConfirmer(estUnJeton(jeton) ? jeton : undefined),
    });
  }
  if (chemin === pages.deconnexion && post) {
    const jeton = lireCookie(requete.headers.get('Cookie'), ORGANISATEUR.cookie);
    if (jeton !== undefined) await s.depot.fermerSession(await empreinte(jeton));
    return rediriger(pages.connexion, cookieEfface());
  }

  const espace =
    chemin === pages.tableauDeBord ||
    chemin === pages.structure ||
    chemin.startsWith('/organisateur/evenements/');
  if (!espace) return s.pageStatique();

  const organisateur = await organisateurConnecte(requete, s);
  if (organisateur === undefined) return rediriger(pages.connexion);

  if (chemin === pages.tableauDeBord) {
    const message = url.searchParams.get('message');
    return s.rendrePage({
      titre: 'Espace organisateur',
      contenu: tableauDeBord(
        organisateur,
        await s.depot.evenements(organisateur.id),
        estCleMessage(message) ? message : undefined,
      ),
    });
  }
  if (chemin === pages.structure && post) {
    const entrees = await lireFormulaire(requete);
    const structure = entrees?.find(([cle]) => cle === 'structure')?.[1];
    const nom =
      typeof structure === 'string' && structure.trim() !== ''
        ? structure.trim().slice(0, ORGANISATEUR.longueurs.structure)
        : undefined;
    await s.depot.modifierStructure(organisateur.id, nom);
    return versTableau('structure');
  }
  if (chemin === pages.nouvelEvenement) {
    return post
      ? enregistrer(requete, organisateur, undefined, s)
      : afficherFormulaire({ champs: {}, dates: [], pratiques: [] }, [], undefined, s);
  }
  const numero = /^\/organisateur\/evenements\/(\d{1,9})\/$/.exec(chemin)?.[1];
  const evenement =
    numero === undefined ? undefined : await s.depot.evenement(organisateur.id, Number(numero));
  if (evenement === undefined) {
    return s.rendrePage({
      titre: 'Événement introuvable',
      contenu: pageIntrouvable(),
      statut: 404,
    });
  }
  return post
    ? enregistrer(requete, organisateur, evenement, s)
    : afficherFormulaire(saisieDe(evenement.brouillon), [], evenement, s);
}

async function organisateurConnecte(
  requete: Request,
  s: Services,
): Promise<Organisateur | undefined> {
  const jeton = lireCookie(requete.headers.get('Cookie'), ORGANISATEUR.cookie);
  if (!estUnJeton(jeton)) return undefined;
  return s.depot.organisateurDeSession(await empreinte(jeton), s.maintenant);
}

/** Envoi du lien de connexion. La réponse ne dit jamais si l'adresse a déjà un compte. */
async function demanderLien(requete: Request, url: URL, s: Services): Promise<Response> {
  const champs = Object.fromEntries(
    ((await lireFormulaire(requete)) ?? [])
      .filter(
        (entree): entree is [string, string] =>
          typeof entree[1] === 'string' && entree[1].trim() !== '',
      )
      .map(([cle, valeur]) => [cle, valeur.trim()]),
  );
  if (champs[CHAMP_PIEGE] !== undefined) return rediriger(pages.lienEnvoye);
  const jetonTurnstile = champs[CHAMP_TURNSTILE];
  if (jetonTurnstile === undefined || !(await s.verifierTurnstile(jetonTurnstile))) {
    return rediriger(`${pages.connexion}#verification`);
  }
  const courriel = champs.courriel?.toLowerCase();
  if (
    courriel === undefined ||
    courriel.length > 254 ||
    !/^[^\s@<>()"]+@[^\s@<>()"]+\.[a-z]{2,}$/.test(courriel)
  ) {
    return rediriger(`${pages.connexion}#adresse`);
  }
  if (s.envoyerLien === undefined) {
    s.journaliser('Espace organisateur : Worker d’envoi non relié, aucun lien envoyé.');
    return rediriger(`${pages.connexion}#indisponible`);
  }
  if ((await s.depot.liensValides(courriel, s.maintenant)) >= ORGANISATEUR.liensMaxParAdresse) {
    s.journaliser('Espace organisateur : trop de liens demandés pour une même adresse.');
    return rediriger(pages.lienEnvoye);
  }
  const jeton = jetonAleatoire();
  await s.depot.enregistrerLien(
    await empreinte(jeton),
    courriel,
    s.maintenant,
    plusMinutes(s.maintenant, ORGANISATEUR.dureeLienMinutes),
  );
  const lien = new URL(pages.confirmer, url.origin);
  lien.searchParams.set('jeton', jeton);
  try {
    await s.envoyerLien({ courriel, lien: lien.toString() });
  } catch (erreur) {
    s.journaliser(
      `Espace organisateur : envoi du lien impossible (${erreur instanceof Error ? erreur.message : 'erreur inconnue'}).`,
    );
    return rediriger(`${pages.connexion}#indisponible`);
  }
  return rediriger(pages.lienEnvoye);
}

async function confirmer(requete: Request, s: Services): Promise<Response> {
  const jeton = (await lireFormulaire(requete))?.find(([cle]) => cle === 'jeton')?.[1];
  const courriel = estUnJeton(typeof jeton === 'string' ? jeton : undefined)
    ? await s.depot.consommerLien(await empreinte(jeton as string), s.maintenant)
    : undefined;
  if (courriel === undefined) {
    return s.rendrePage({
      titre: 'Lien expiré',
      contenu: pageLienInvalide(),
      statut: 400,
    });
  }
  const organisateur = await s.depot.organisateurParCourriel(courriel, s.maintenant);
  const session = jetonAleatoire();
  await s.depot.ouvrirSession(
    await empreinte(session),
    organisateur.id,
    plusMinutes(s.maintenant, ORGANISATEUR.dureeSessionJours * 24 * 60),
  );
  return rediriger(pages.tableauDeBord, cookieSession(session));
}

function afficherFormulaire(
  saisie: Saisie,
  erreurs: ErreurChamp[],
  evenement: EvenementCompte | undefined,
  s: Services,
): Promise<Response> {
  return s.rendrePage({
    titre: evenement === undefined ? 'Nouvel événement' : evenement.brouillon.titre,
    contenu: formulaireEvenement({
      saisie,
      erreurs,
      mois: moisCalendrier(jourCivil(s.maintenant), ORGANISATEUR.moisCalendrier),
      ...(evenement !== undefined && { evenement }),
    }),
    ...(erreurs.length > 0 && { statut: 422 }),
  });
}

async function enregistrer(
  requete: Request,
  organisateur: Organisateur,
  evenement: EvenementCompte | undefined,
  s: Services,
): Promise<Response> {
  const entrees = (await lireFormulaire(requete)) ?? [];
  const saisie = lireSaisie(entrees);
  const action = saisie.champs.action;

  if (evenement !== undefined && (action === 'supprimer' || action === 'annuler')) {
    if (saisie.champs.confirmer !== 'oui') {
      return afficherFormulaire(saisieDe(evenement.brouillon), [], evenement, s);
    }
    if (action === 'supprimer') {
      await s.depot.supprimerEvenement(organisateur.id, evenement.id);
      return versTableau('supprime');
    }
    return demanderAnnulation(organisateur, evenement, s);
  }

  const validation = validerSaisie(saisie, s.maintenant);
  if (!validation.ok) {
    return afficherFormulaire(saisie, validation.erreurs, evenement, s);
  }
  const { brouillon } = validation;
  let id: number;
  if (evenement === undefined) {
    id = await s.depot.creerEvenement(organisateur.id, brouillon, s.maintenant);
  } else {
    id = evenement.id;
    await s.depot.modifierEvenement(
      organisateur.id,
      id,
      { brouillon, statut: 'brouillon' },
      s.maintenant,
    );
  }
  if (action !== 'envoyer') return versTableau('enregistre');
  return envoyer(organisateur, id, brouillon, evenement?.issue, s);
}

async function envoyer(
  organisateur: Organisateur,
  id: number,
  brouillon: Brouillon,
  precedente: number | undefined,
  s: Services,
): Promise<Response> {
  const issue = await creer(
    s,
    issueEnvoi(brouillon, {
      compte: organisateur.id,
      recueLe: s.maintenant,
      ...(organisateur.structure !== undefined && { structure: organisateur.structure }),
      ...(precedente !== undefined && { precedente }),
    }),
  );
  if (issue === undefined) return versTableau('envoi-impossible');
  await s.depot.modifierEvenement(
    organisateur.id,
    id,
    { brouillon, statut: 'envoye', issue: issue.numero },
    s.maintenant,
  );
  s.journaliser(
    `Espace organisateur : compte ${String(organisateur.id)}, issue #${String(issue.numero)}.`,
  );
  return versTableau('envoye');
}

async function demanderAnnulation(
  organisateur: Organisateur,
  evenement: EvenementCompte,
  s: Services,
): Promise<Response> {
  const issue = await creer(
    s,
    issueAnnulation(evenement.brouillon, {
      compte: organisateur.id,
      recueLe: s.maintenant,
      ...(organisateur.structure !== undefined && { structure: organisateur.structure }),
      ...(evenement.issue !== undefined && { precedente: evenement.issue }),
    }),
  );
  if (issue === undefined) return versTableau('envoi-impossible');
  await s.depot.modifierEvenement(
    organisateur.id,
    evenement.id,
    { brouillon: evenement.brouillon, statut: 'annulation_demandee', issue: issue.numero },
    s.maintenant,
  );
  return versTableau('annulation');
}

async function creer(s: Services, issue: IssueGithub): Promise<IssueCreee | undefined> {
  if (s.creerIssue === undefined) {
    s.journaliser('Espace organisateur : GITHUB_TOKEN manquant, rien n’est envoyé.');
    return undefined;
  }
  try {
    return await s.creerIssue(issue);
  } catch (erreur) {
    s.journaliser(
      `Espace organisateur : création de l’issue impossible (${erreur instanceof Error ? erreur.message : 'erreur inconnue'}).`,
    );
    return undefined;
  }
}
