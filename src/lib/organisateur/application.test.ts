import { describe, expect, it } from 'vitest';
import { baseD1DeTest } from '../../../tests/unit/d1-sqlite';
import type { IssueGithub } from '@lib/formulaire/evenement';
import { repondre, type PageRendue, type Services } from './application';
import { Depot } from './depot';
import type { DemandeLien } from './lien';

const ORIGINE = 'https://pedalerenauvergne.fr';
const maintenant = new Date('2026-10-19T10:00:00+02:00');

interface Banc {
  services: Services;
  depot: Depot;
  liens: DemandeLien[];
  issues: IssueGithub[];
  journal: string[];
}

function banc(remplacements: Partial<Services> = {}): Banc {
  const depot = new Depot(baseD1DeTest());
  const liens: DemandeLien[] = [];
  const issues: IssueGithub[] = [];
  const journal: string[] = [];
  const services: Services = {
    depot,
    maintenant,
    verifierTurnstile: (jeton) => Promise.resolve(jeton === 'ok'),
    envoyerLien: (demande) => {
      liens.push(demande);
      return Promise.resolve();
    },
    creerIssue: (issue) => {
      issues.push(issue);
      const numero = 100 + issues.length;
      return Promise.resolve({ numero, url: `https://github.com/x/y/issues/${String(numero)}` });
    },
    rendrePage: (page: PageRendue) =>
      Promise.resolve(
        new Response(page.contenu.toString(), {
          status: page.statut ?? 200,
          headers: { 'X-Titre': encodeURIComponent(page.titre) },
        }),
      ),
    pageStatique: () => Promise.resolve(new Response('statique')),
    journaliser: (message) => {
      journal.push(message);
    },
    ...remplacements,
  };
  return { services, depot, liens, issues, journal };
}

function requete(
  chemin: string,
  options: {
    formulaire?: [string, string][];
    cookie?: string;
    origine?: string;
    methode?: string;
  } = {},
): Request {
  const entetes = new Headers();
  if (options.cookie !== undefined) entetes.set('Cookie', options.cookie);
  if (options.origine !== undefined) entetes.set('Origin', options.origine);
  if (options.formulaire === undefined) {
    return new Request(`${ORIGINE}${chemin}`, {
      method: options.methode ?? 'GET',
      headers: entetes,
    });
  }
  const corps = new URLSearchParams(options.formulaire);
  return new Request(`${ORIGINE}${chemin}`, { method: 'POST', headers: entetes, body: corps });
}

/** Demande un lien, le confirme, et renvoie le cookie de session. */
async function seConnecter(b: Banc, courriel = 'Club@Example.fr'): Promise<string> {
  const demande = await repondre(
    requete('/organisateur/connexion/', {
      formulaire: [
        ['courriel', courriel],
        ['cf-turnstile-response', 'ok'],
      ],
      origine: ORIGINE,
    }),
    b.services,
  );
  expect(demande.headers.get('Location')).toBe('/organisateur/lien-envoye/');
  const lien = new URL(b.liens.at(-1)?.lien ?? '');
  const jeton = lien.searchParams.get('jeton') ?? '';
  const page = await repondre(requete(`${lien.pathname}${lien.search}`), b.services);
  expect(await page.text()).toContain(`value="${jeton}"`);
  const confirmation = await repondre(
    requete('/organisateur/confirmer/', { formulaire: [['jeton', jeton]] }),
    b.services,
  );
  expect(confirmation.status).toBe(303);
  expect(confirmation.headers.get('Location')).toBe('/organisateur/');
  const cookie = confirmation.headers.get('Set-Cookie') ?? '';
  expect(cookie).toContain('HttpOnly');
  return cookie.split(';')[0] ?? '';
}

const evenement: [string, string][] = [
  ['titre', 'Sortie du mardi'],
  ['type', 'sortie'],
  ['description', 'Boucle de 40 km à allure tranquille, retour au café.'],
  ['dates', '2026-11-03'],
  ['dates', '2026-11-10'],
  ['heure_debut', '18:30'],
  ['lieu', 'Place de Jaude'],
  ['commune', 'Clermont-Ferrand'],
  ['source_url', 'https://club.example/sorties'],
];

describe('connexion', () => {
  it('envoie un lien, puis ouvre une session avec un lien à usage unique', async () => {
    const b = banc();
    const cookie = await seConnecter(b);
    expect(b.liens[0]?.courriel).toBe('club@example.fr');
    expect(b.liens[0]?.lien).toMatch(
      /^https:\/\/pedalerenauvergne\.fr\/organisateur\/confirmer\/\?jeton=/,
    );
    const tableau = await repondre(requete('/organisateur/', { cookie }), b.services);
    expect(await tableau.text()).toContain('club@example.fr');

    const jeton = new URL(b.liens[0]?.lien ?? '').searchParams.get('jeton') ?? '';
    const deuxieme = await repondre(
      requete('/organisateur/confirmer/', { formulaire: [['jeton', jeton]] }),
      b.services,
    );
    expect(deuxieme.status).toBe(400);
  });

  it('refuse sans vérification anti-robot ou avec une adresse invalide', async () => {
    const b = banc();
    const sansJeton = await repondre(
      requete('/organisateur/connexion/', { formulaire: [['courriel', 'club@example.fr']] }),
      b.services,
    );
    expect(sansJeton.headers.get('Location')).toBe('/organisateur/connexion/#verification');
    const adresse = await repondre(
      requete('/organisateur/connexion/', {
        formulaire: [
          ['courriel', 'pas une adresse'],
          ['cf-turnstile-response', 'ok'],
        ],
      }),
      b.services,
    );
    expect(adresse.headers.get('Location')).toBe('/organisateur/connexion/#adresse');
    expect(b.liens).toEqual([]);
  });

  it('répond comme d’habitude au robot pris au piège, sans rien envoyer', async () => {
    const b = banc();
    const reponse = await repondre(
      requete('/organisateur/connexion/', {
        formulaire: [
          ['courriel', 'club@example.fr'],
          ['site_web', 'spam'],
        ],
      }),
      b.services,
    );
    expect(reponse.headers.get('Location')).toBe('/organisateur/lien-envoye/');
    expect(b.liens).toEqual([]);
  });

  it('limite les liens demandés pour une même adresse', async () => {
    const b = banc();
    for (let rang = 0; rang < 4; rang += 1) {
      await repondre(
        requete('/organisateur/connexion/', {
          formulaire: [
            ['courriel', 'club@example.fr'],
            ['cf-turnstile-response', 'ok'],
          ],
        }),
        b.services,
      );
    }
    expect(b.liens).toHaveLength(3);
    expect(b.journal).toContain(
      'Espace organisateur : trop de liens demandés pour une même adresse.',
    );
  });

  it('signale un envoi impossible', async () => {
    const formulaire: [string, string][] = [
      ['courriel', 'club@example.fr'],
      ['cf-turnstile-response', 'ok'],
    ];
    const sansEnvoi = { ...banc().services };
    delete sansEnvoi.envoyerLien;
    const absent = await repondre(requete('/organisateur/connexion/', { formulaire }), sansEnvoi);
    expect(absent.headers.get('Location')).toBe('/organisateur/connexion/#indisponible');
    const enPanne = banc({ envoyerLien: () => Promise.reject(new Error('panne')) });
    const reponse = await repondre(
      requete('/organisateur/connexion/', { formulaire }),
      enPanne.services,
    );
    expect(reponse.headers.get('Location')).toBe('/organisateur/connexion/#indisponible');
    expect(enPanne.journal[0]).toContain('panne');
  });

  it('affiche un lien invalide sans bouton', async () => {
    const reponse = await repondre(
      requete('/organisateur/confirmer/?jeton=court'),
      banc().services,
    );
    expect(await reponse.text()).toContain('Recevoir un nouveau lien');
  });

  it('ferme la session à la déconnexion', async () => {
    const b = banc();
    const cookie = await seConnecter(b);
    const sortie = await repondre(
      requete('/organisateur/deconnexion/', { formulaire: [], cookie }),
      b.services,
    );
    expect(sortie.headers.get('Set-Cookie')).toContain('Max-Age=0');
    const apres = await repondre(requete('/organisateur/', { cookie }), b.services);
    expect(apres.headers.get('Location')).toBe('/organisateur/connexion/');
  });
});

describe('protections', () => {
  it('renvoie vers la connexion sans session', async () => {
    const b = banc();
    for (const chemin of [
      '/organisateur/',
      '/organisateur/evenements/nouveau/',
      '/organisateur/evenements/1/',
    ]) {
      const reponse = await repondre(
        requete(chemin, { cookie: '__Host-organisateur=inconnu' }),
        b.services,
      );
      expect(reponse.headers.get('Location')).toBe('/organisateur/connexion/');
    }
  });

  it('refuse un formulaire posté depuis un autre site', async () => {
    const reponse = await repondre(
      requete('/organisateur/connexion/', { formulaire: [], origine: 'https://ailleurs.example' }),
      banc().services,
    );
    expect(reponse.status).toBe(403);
  });

  it('laisse passer les pages statiques et ajoute la barre finale', async () => {
    const b = banc();
    expect(await (await repondre(requete('/organisateur/connexion/'), b.services)).text()).toBe(
      'statique',
    );
    expect(await (await repondre(requete('/organisateur/gabarit/'), b.services)).text()).toBe(
      'statique',
    );
    const sansBarre = await repondre(requete('/organisateur?x=1'), b.services);
    expect(sansBarre.headers.get('Location')).toBe('/organisateur/?x=1');
    expect(
      (await repondre(requete('/organisateur/', { methode: 'DELETE' }), b.services)).status,
    ).toBe(405);
  });
});

describe('événements', () => {
  it('crée un brouillon avec plusieurs dates, puis l’envoie pour vérification', async () => {
    const b = banc();
    const cookie = await seConnecter(b);
    const formulaire = await repondre(
      requete('/organisateur/evenements/nouveau/', { cookie }),
      b.services,
    );
    const html = await formulaire.text();
    expect(html).toContain('name="dates" value="2026-11-03"');
    expect(html).toContain('id="date-2026-10-18" name="dates" value="2026-10-18" disabled');

    const brouillon = await repondre(
      requete('/organisateur/evenements/nouveau/', {
        formulaire: [...evenement, ['action', 'enregistrer']],
        cookie,
      }),
      b.services,
    );
    expect(brouillon.headers.get('Location')).toBe('/organisateur/?message=enregistre');
    expect(b.issues).toEqual([]);

    const tableau = await (
      await repondre(requete('/organisateur/?message=enregistre', { cookie }), b.services)
    ).text();
    expect(tableau).toContain('Brouillon enregistré');
    expect(tableau).toContain('mardi 3 novembre 2026, mardi 10 novembre 2026');
    const id = /evenements\/(\d+)\//.exec(tableau)?.[1] ?? '';

    const fiche = await (
      await repondre(requete(`/organisateur/evenements/${id}/`, { cookie }), b.services)
    ).text();
    expect(fiche).toContain('value="2026-11-03" checked');
    expect(fiche).toContain('Supprimer l’événement');

    const envoi = await repondre(
      requete(`/organisateur/evenements/${id}/`, {
        formulaire: [...evenement, ['action', 'envoyer']],
        cookie,
      }),
      b.services,
    );
    expect(envoi.headers.get('Location')).toBe('/organisateur/?message=envoye');
    expect(b.issues[0]?.titre).toBe('[Événement] Sortie du mardi');
    expect(b.issues[0]?.corps).toContain('2 fiches proposées');
    expect(b.issues[0]?.corps).not.toContain('club@example.fr');
    expect(await b.depot.evenements(1)).toMatchObject([{ statut: 'envoye', issue: 101 }]);
  });

  it('renvoie une modification, puis demande l’annulation', async () => {
    const b = banc();
    const cookie = await seConnecter(b);
    await repondre(
      requete('/organisateur/structure/', { formulaire: [['structure', '  Vélo Club  ']], cookie }),
      b.services,
    );
    await repondre(
      requete('/organisateur/evenements/nouveau/', {
        formulaire: [...evenement, ['action', 'envoyer']],
        cookie,
      }),
      b.services,
    );
    expect(b.issues[0]?.corps).toContain('Vélo Club');
    await repondre(
      requete('/organisateur/evenements/1/', {
        formulaire: [...evenement, ['action', 'envoyer']],
        cookie,
      }),
      b.services,
    );
    expect(b.issues[1]?.titre).toBe('[Modification] Sortie du mardi');
    expect(b.issues[1]?.corps).toContain('Remplace la demande #101');

    const fiche = await (
      await repondre(requete('/organisateur/evenements/1/', { cookie }), b.services)
    ).text();
    expect(fiche).toContain('Demander l’annulation');
    const sansConfirmation = await repondre(
      requete('/organisateur/evenements/1/', { formulaire: [['action', 'annuler']], cookie }),
      b.services,
    );
    expect(sansConfirmation.status).toBe(200);
    expect(b.issues).toHaveLength(2);
    const annulation = await repondre(
      requete('/organisateur/evenements/1/', {
        formulaire: [
          ['action', 'annuler'],
          ['confirmer', 'oui'],
        ],
        cookie,
      }),
      b.services,
    );
    expect(annulation.headers.get('Location')).toBe('/organisateur/?message=annulation');
    expect(b.issues[2]?.titre).toBe('[Annulation] Sortie du mardi');
    expect(await b.depot.evenements(1)).toMatchObject([
      { statut: 'annulation_demandee', issue: 103 },
    ]);
  });

  it('réaffiche le formulaire avec les erreurs et la saisie', async () => {
    const b = banc();
    const cookie = await seConnecter(b);
    const reponse = await repondre(
      requete('/organisateur/evenements/nouveau/', {
        formulaire: [
          ['titre', 'Sans date'],
          ['action', 'envoyer'],
        ],
        cookie,
      }),
      b.services,
    );
    expect(reponse.status).toBe(422);
    const html = await reponse.text();
    expect(html).toContain('role="alert"');
    expect(html).toContain('href="#dates"');
    expect(html).toContain('value="Sans date"');
    expect(b.issues).toEqual([]);
  });

  it('garde le brouillon quand l’envoi échoue', async () => {
    const b = banc({ creerIssue: () => Promise.reject(new Error('GitHub a répondu 500.')) });
    const cookie = await seConnecter(b);
    const reponse = await repondre(
      requete('/organisateur/evenements/nouveau/', {
        formulaire: [...evenement, ['action', 'envoyer']],
        cookie,
      }),
      b.services,
    );
    expect(reponse.headers.get('Location')).toBe('/organisateur/?message=envoi-impossible');
    expect(await b.depot.evenements(1)).toMatchObject([{ statut: 'brouillon' }]);
    expect(b.journal.at(-1)).toContain('GitHub a répondu 500.');

    const sansGithub = { ...b.services };
    delete sansGithub.creerIssue;
    await repondre(
      requete('/organisateur/evenements/1/', {
        formulaire: [...evenement, ['action', 'envoyer']],
        cookie,
      }),
      sansGithub,
    );
    expect(b.journal.at(-1)).toContain('GITHUB_TOKEN manquant');
  });

  it('supprime un brouillon après confirmation, et cache les événements des autres', async () => {
    const b = banc();
    const cookie = await seConnecter(b);
    await repondre(
      requete('/organisateur/evenements/nouveau/', {
        formulaire: [...evenement, ['action', 'enregistrer']],
        cookie,
      }),
      b.services,
    );
    const autre = await seConnecter(b, 'autre@example.fr');
    const intrus = await repondre(
      requete('/organisateur/evenements/1/', { cookie: autre }),
      b.services,
    );
    expect(intrus.status).toBe(404);

    const suppression = await repondre(
      requete('/organisateur/evenements/1/', {
        formulaire: [
          ['action', 'supprimer'],
          ['confirmer', 'oui'],
        ],
        cookie,
      }),
      b.services,
    );
    expect(suppression.headers.get('Location')).toBe('/organisateur/?message=supprime');
    expect(await b.depot.evenements(1)).toEqual([]);
  });
});
