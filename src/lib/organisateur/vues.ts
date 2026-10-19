/**
 * Contenu des pages de l'espace organisateur, inséré par la fonction dans le gabarit statique
 * `/organisateur/gabarit/` (mise en page et styles du site). Formulaires HTML classiques et
 * calendrier en cases à cocher : aucun JavaScript (ADR 0013, 0038).
 */
import { CODES_DEPARTEMENT, DEPARTEMENTS } from '@config/departements';
import {
  LIBELLES_PRATIQUE_EVENEMENT,
  LIBELLES_TYPE_EVENEMENT,
  PRATIQUES_EVENEMENT,
  TYPES_EVENEMENT,
} from '@config/evenements';
import { FORMULAIRES } from '@config/formulaires';
import { ORGANISATEUR } from '@config/organisateur';
import type { ErreurChamp } from '@lib/formulaire/evenement';
import { libelleDuJour, trierDates, type MoisCalendrier } from './calendrier';
import type { EvenementCompte, Organisateur } from './depot';
import type { Brouillon, Saisie } from './evenement';
import { attribut, balisage, type Html } from './html';

const { pages, longueurs } = ORGANISATEUR;
const L = FORMULAIRES.longueurs;
const departementsActifs = CODES_DEPARTEMENT.filter((code) => DEPARTEMENTS[code].actif);
const JOURS_SEMAINE = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

/** Messages affichés en tête du tableau de bord après une action (`?message=`). */
export const MESSAGES = {
  enregistre: 'Brouillon enregistré. Il n’est pas encore visible sur le site.',
  envoye:
    'Événement envoyé pour vérification. Il apparaîtra dans l’agenda une fois relu, en général sous 48 heures.',
  'envoi-impossible':
    'Brouillon enregistré, mais l’envoi pour vérification n’a pas abouti. Réessayez plus tard depuis la fiche de l’événement.',
  supprime: 'Événement supprimé de votre espace.',
  annulation: 'Demande d’annulation envoyée. L’événement sera marqué « Annulé » dans l’agenda.',
  structure: 'Nom de la structure enregistré.',
} as const;
export type CleMessage = keyof typeof MESSAGES;

export function estCleMessage(texte: string | null): texte is CleMessage {
  return texte !== null && Object.hasOwn(MESSAGES, texte);
}

const lienIssue = (numero: number) =>
  `https://github.com/${FORMULAIRES.depot.proprietaire}/${FORMULAIRES.depot.nom}/issues/${String(numero)}`;

/** « mardi 3 novembre 2026 », « du samedi 7 novembre 2026 au dimanche 8 novembre 2026 »… */
export function resumeDates(b: Pick<Brouillon, 'dates' | 'plusieurs_jours'>): string {
  const dates = trierDates(b.dates);
  const premier = dates[0];
  const dernier = dates[dates.length - 1];
  if (premier === undefined || dernier === undefined) return 'Aucune date';
  if (dates.length === 1) return libelleDuJour(premier);
  const plage = `du ${libelleDuJour(premier)} au ${libelleDuJour(dernier)}`;
  if (b.plusieurs_jours) return plage;
  if (dates.length <= 3) return dates.map(libelleDuJour).join(', ');
  return `${String(dates.length)} dates, ${plage}`;
}

export function libelleStatut(e: Pick<EvenementCompte, 'statut' | 'issue'>): string {
  switch (e.statut) {
    case 'envoye':
      return 'Envoyé pour vérification';
    case 'annulation_demandee':
      return 'Annulation demandée';
    case 'brouillon':
      return e.issue === undefined ? 'Brouillon, pas encore envoyé' : 'Modifié, à renvoyer';
  }
}

function suiviIssue(e: Pick<EvenementCompte, 'issue'>): Html {
  return e.issue === undefined
    ? balisage``
    : balisage` (<a href="${lienIssue(e.issue)}">demande n° ${e.issue}</a>)`;
}

/** Page ouverte depuis le lien reçu par e-mail : un bouton, pour que les robots qui
 * visitent les liens des messages ne consomment pas le jeton. */
export function pageConfirmer(jeton: string | undefined): Html {
  if (jeton === undefined) {
    return pageLienInvalide();
  }
  return balisage`<div class="texte">
    <p>Dernière étape : confirmez l’ouverture de votre espace organisateur sur cet appareil.</p>
    <form class="formulaire" method="post" action="${pages.confirmer}">
      <input type="hidden" name="jeton" value="${jeton}" />
      <button class="bouton" type="submit">Ouvrir mon espace</button>
    </form>
  </div>`;
}

export function pageLienInvalide(): Html {
  return balisage`<div class="texte">
    <p>
      Ce lien de connexion n’est plus valable : il a déjà servi, ou il date de plus de
      ${ORGANISATEUR.dureeLienMinutes} minutes.
    </p>
    <p><a class="bouton" href="${pages.connexion}">Recevoir un nouveau lien</a></p>
  </div>`;
}

export function pageIntrouvable(): Html {
  return balisage`<div class="texte">
    <p>Cet événement n’existe pas, ou il appartient à un autre compte.</p>
    <p><a href="${pages.tableauDeBord}">Revenir à mes événements</a></p>
  </div>`;
}

export function pageIndisponible(): Html {
  return balisage`<div class="texte">
    <p>
      L’espace organisateur n’est pas encore ouvert. En attendant, vous pouvez
      <a href="${FORMULAIRES.pageEvenement}">proposer un événement par le formulaire</a>.
    </p>
  </div>`;
}

function carteEvenement(e: EvenementCompte): Html {
  return balisage`<li class="carte evenement-compte">
    <h3><a href="/organisateur/evenements/${e.id}/">${e.brouillon.titre}</a></h3>
    <p>${resumeDates(e.brouillon)} · ${e.brouillon.commune}</p>
    <p class="discret">${libelleStatut(e)}${suiviIssue(e)}</p>
  </li>`;
}

export function tableauDeBord(
  organisateur: Organisateur,
  evenements: EvenementCompte[],
  message?: CleMessage,
): Html {
  return balisage`${
    message === undefined
      ? ''
      : balisage`<p class="message-espace" role="status">${MESSAGES[message]}</p>`
  }
    <section aria-labelledby="titre-evenements">
      <div class="tete-section">
        <h2 id="titre-evenements">Mes événements</h2>
        <a class="bouton" href="${pages.nouvelEvenement}">Créer un événement</a>
      </div>
      ${
        evenements.length === 0
          ? balisage`<p class="texte">
              Vous n’avez pas encore d’événement. Créez-en un, choisissez ses dates dans le
              calendrier, puis envoyez-le : nous le vérifions avant de l’ajouter à l’agenda.
            </p>`
          : balisage`<ul class="liste-simple grille">
              ${evenements.map(carteEvenement)}
            </ul>`
      }
    </section>
    <section aria-labelledby="titre-structure" class="texte">
      <h2 id="titre-structure">Ma structure</h2>
      <form class="formulaire" method="post" action="${pages.structure}">
        <div class="champ">
          <label for="structure">Nom du club, de l’association ou de la structure</label>
          <p id="aide-structure" class="aide">
            Affiché avec vos événements pour les relier à leur fiche de l’annuaire.
          </p>
          <input
            id="structure"
            name="structure"
            type="text"
            maxlength="${longueurs.structure}"
            autocomplete="organization"
            aria-describedby="aide-structure"
            value="${organisateur.structure ?? ''}"
          />
        </div>
        <button class="bouton" type="submit">Enregistrer</button>
      </form>
    </section>
    <section aria-labelledby="titre-compte" class="texte">
      <h2 id="titre-compte">Mon compte</h2>
      <p>
        Connecté avec l’adresse <strong>${organisateur.courriel}</strong>. Elle n’est jamais publiée
        (<a href="/mentions-legales/">données personnelles</a>).
      </p>
      <form method="post" action="${pages.deconnexion}">
        <button class="bouton bouton-secondaire" type="submit">Se déconnecter</button>
      </form>
    </section>`;
}

interface Champ {
  nom: string;
  libelle: string;
  saisie: Saisie;
  erreurs: ErreurChamp[];
  obligatoire?: boolean;
  aide?: string;
}

function erreurDe(nom: string, erreurs: ErreurChamp[]): string | undefined {
  return erreurs.find((e) => e.champ === nom)?.message;
}

/** Libellé, aide et message d'erreur reliés au champ par `aria-describedby`. */
function enveloppe(c: Champ, controle: (decrit: string, invalide: boolean) => Html): Html {
  const erreur = erreurDe(c.nom, c.erreurs);
  const decrit = [
    c.aide === undefined ? '' : `aide-${c.nom}`,
    erreur === undefined ? '' : `erreur-${c.nom}`,
  ]
    .filter((id) => id !== '')
    .join(' ');
  return balisage`<div class="champ">
    <label for="${c.nom}"
      >${c.libelle}${c.obligatoire === true ? balisage` <span aria-hidden="true">*</span>` : ''}</label
    >
    ${c.aide === undefined ? '' : balisage`<p id="aide-${c.nom}" class="aide">${c.aide}</p>`}
    ${erreur === undefined ? '' : balisage`<p id="erreur-${c.nom}" class="erreur-champ">${erreur}</p>`}
    ${controle(decrit, erreur !== undefined)}
  </div>`;
}

function decrire(decrit: string, invalide: boolean): Html {
  return balisage`${decrit === '' ? '' : balisage` aria-describedby="${decrit}"`}${invalide ? balisage` aria-invalid="true"` : ''}`;
}

function champTexte(
  c: Champ & { type?: 'text' | 'url' | 'time'; max?: number; placeholder?: string },
): Html {
  return enveloppe(
    c,
    (decrit, invalide) =>
      balisage`<input
        id="${c.nom}"
        name="${c.nom}"
        type="${c.type ?? 'text'}"
        ${attribut('required', c.obligatoire === true)}${c.max === undefined ? '' : balisage` maxlength="${c.max}"`}${c.placeholder === undefined ? '' : balisage` placeholder="${c.placeholder}"`}
        value="${c.saisie.champs[c.nom] ?? ''}"
        ${decrire(decrit, invalide)}
      />`,
  );
}

function calendrier(mois: MoisCalendrier[], saisie: Saisie, erreurs: ErreurChamp[]): Html {
  const cochees = new Set(saisie.dates);
  const erreur = erreurDe('dates', erreurs);
  const blocMois = (m: MoisCalendrier) =>
    balisage`<fieldset class="mois">
      <legend>${m.libelle}</legend>
      <div class="jours-semaine" aria-hidden="true">
        ${JOURS_SEMAINE.map((j) => balisage`<span>${j}</span>`)}
      </div>
      <ul class="jours" role="list">
        ${m.jours.map(
          (
            j,
            rang,
          ) => balisage`<li${rang === 0 ? balisage` class="colonne-${m.colonneDuPremier}"` : ''}>
          <input type="checkbox" id="date-${j.jour}" name="dates" value="${j.jour}"${attribut('checked', cochees.has(j.jour))}${attribut('disabled', j.passe)} />
          <label for="date-${j.jour}"><span aria-hidden="true">${j.numero}</span><span class="visuellement-masque">${j.libelle}</span></label>
        </li>`,
        )}
      </ul>
    </fieldset>`;
  const ouverts = mois.slice(0, ORGANISATEUR.moisOuverts);
  const suivants = mois.slice(ORGANISATEUR.moisOuverts);
  const premierSuivant = suivants[0];
  const dernierSuivant = suivants[suivants.length - 1];
  const ouvrirSuivants = suivants.some((m) => m.jours.some((j) => cochees.has(j.jour)));
  return balisage`<fieldset
    class="calendrier"
    id="dates"
    ${erreur === undefined ? balisage` aria-describedby="aide-dates"` : balisage` aria-describedby="aide-dates erreur-dates"`}
  >
    <legend>Dates <span aria-hidden="true">*</span></legend>
    <p id="aide-dates" class="aide">
      Cochez chaque jour où l’événement a lieu : une date, plusieurs dates séparées (une sortie
      chaque mardi), ou des jours qui se suivent.
    </p>
    ${erreur === undefined ? '' : balisage`<p id="erreur-dates" class="erreur-champ">${erreur}</p>`}
    <div class="mois-liste">${ouverts.map(blocMois)}</div>
    ${
      premierSuivant === undefined || dernierSuivant === undefined
        ? ''
        : balisage`<details class="mois-suivants" ${attribut('open', ouvrirSuivants)}>
            <summary>
              Mois suivants, de ${premierSuivant.libelle} à ${dernierSuivant.libelle}
            </summary>
            <div class="mois-liste">${suivants.map(blocMois)}</div>
          </details>`
    }
    <div class="champ-case">
      <input
        type="checkbox"
        id="plusieurs_jours"
        name="plusieurs_jours"
        value="oui"
        ${attribut('checked', saisie.champs.plusieurs_jours === 'oui')}${decrire(erreurDe('plusieurs_jours', erreurs) === undefined ? 'aide-plusieurs-jours' : 'aide-plusieurs-jours erreur-plusieurs_jours', erreurDe('plusieurs_jours', erreurs) !== undefined)}
      />
      <label for="plusieurs_jours">Un seul événement sur plusieurs jours</label>
    </div>
    <p id="aide-plusieurs-jours" class="aide">
      Pour un festival ou un week-end : les jours cochés doivent se suivre ; l’événement commence le
      premier jour à l’heure de début et finit le dernier jour à l’heure de fin. Sinon, chaque jour
      coché devient une date de l’agenda, aux mêmes heures.
    </p>
    ${
      erreurDe('plusieurs_jours', erreurs) === undefined
        ? ''
        : balisage`<p id="erreur-plusieurs_jours" class="erreur-champ">
            ${erreurDe('plusieurs_jours', erreurs)}
          </p>`
    }
  </fieldset>`;
}

export interface FormulaireEvenement {
  saisie: Saisie;
  erreurs: ErreurChamp[];
  mois: MoisCalendrier[];
  /** Absent pour un nouvel événement. */
  evenement?: Pick<EvenementCompte, 'id' | 'statut' | 'issue'>;
}

function resumeErreurs(erreurs: ErreurChamp[]): Html {
  if (erreurs.length === 0) return balisage``;
  return balisage`<div class="resume-erreurs" role="alert" aria-labelledby="titre-erreurs">
    <h2 id="titre-erreurs">
      L’événement n’est pas enregistré :
      ${erreurs.length === 1 ? 'un point est' : `${String(erreurs.length)} points sont`} à corriger
    </h2>
    <ul>
      ${erreurs.map((e) => balisage`<li><a href="#${e.champ}">${e.message}</a></li>`)}
    </ul>
  </div>`;
}

export function formulaireEvenement(f: FormulaireEvenement): Html {
  const { saisie, erreurs } = f;
  const c = (nom: string, libelle: string, extra: Partial<Champ> = {}): Champ => ({
    nom,
    libelle,
    saisie,
    erreurs,
    ...extra,
  });
  const action =
    f.evenement === undefined
      ? pages.nouvelEvenement
      : `/organisateur/evenements/${String(f.evenement.id)}/`;
  const pratiques = new Set(saisie.pratiques);
  const type = saisie.champs.type;
  const departement = saisie.champs.departement;
  return balisage`${
    f.evenement === undefined
      ? ''
      : balisage`<p class="discret">
            État : ${libelleStatut(f.evenement)}${suiviIssue(f.evenement)}.
          </p>`
  }
    ${resumeErreurs(erreurs)}
    <form
      class="formulaire"
      method="post"
      action="${action}"
      aria-describedby="champs-obligatoires"
    >
      <p id="champs-obligatoires" class="discret">
        Les champs marqués d’un astérisque (<span aria-hidden="true">*</span>) sont obligatoires. Ce
        que vous écrivez ici sera public : pas d’adresse e-mail ni de numéro de téléphone.
      </p>
      <fieldset>
        <legend>L’événement</legend>
        ${champTexte({ ...c('titre', 'Titre', { obligatoire: true }), max: L.titre })}
        ${enveloppe(
          c('type', 'Type', { obligatoire: true }),
          (decrit, invalide) =>
            balisage`<select id="type" name="type" required${decrire(decrit, invalide)}>
              <option value="">Choisir un type</option>
              ${TYPES_EVENEMENT.map(
                (t) =>
                  balisage`<option value="${t}" ${attribut('selected', type === t)}>
                    ${LIBELLES_TYPE_EVENEMENT[t]}
                  </option>`,
              )}
            </select>`,
        )}
        <fieldset class="cases" id="pratiques">
          <legend>Pratiques</legend>
          ${PRATIQUES_EVENEMENT.map(
            (p) =>
              balisage`<div class="champ-case">
                <input
                  type="checkbox"
                  id="pratique-${p}"
                  name="pratiques"
                  value="${p}"
                  ${attribut('checked', pratiques.has(p))}
                />
                <label for="pratique-${p}">${LIBELLES_PRATIQUE_EVENEMENT[p]}</label>
              </div>`,
          )}
        </fieldset>
        ${enveloppe(
          c('description', 'Description', {
            obligatoire: true,
            aide: 'Quelques phrases écrites par vous : parcours, public, niveau, matériel.',
          }),
          (decrit, invalide) =>
            balisage`<textarea
              id="description"
              name="description"
              rows="6"
              required
              minlength="${L.descriptionMin}"
              maxlength="${L.description}"
              ${decrire(decrit, invalide)}
            >
${saisie.champs.description ?? ''}</textarea>`,
        )}
      </fieldset>

      ${calendrier(f.mois, saisie, erreurs)}

      <fieldset>
        <legend>Horaires</legend>
        <div class="ligne">
          ${champTexte({ ...c('heure_debut', 'Heure de début', { obligatoire: true }), type: 'time' })}
          ${champTexte({ ...c('heure_fin', 'Heure de fin'), type: 'time' })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Lieu</legend>
        ${champTexte({
          ...c('lieu', 'Lieu de rendez-vous', {
            obligatoire: true,
            aide: 'Une adresse publique : place, salle, parking, gare.',
          }),
          max: L.texte,
        })}
        ${champTexte({ ...c('commune', 'Commune', { obligatoire: true }), max: L.texte })}
        ${
          departementsActifs.length > 1
            ? enveloppe(
                c('departement', 'Département'),
                (decrit, invalide) =>
                  balisage`<select id="departement" name="departement" ${decrire(decrit, invalide)}>
                    ${departementsActifs.map(
                      (code) =>
                        balisage`<option value="${code}" ${attribut('selected', departement === code)}>
                          ${DEPARTEMENTS[code].nom}
                        </option>`,
                    )}
                  </select>`,
              )
            : ''
        }
      </fieldset>

      <fieldset>
        <legend>Informations pratiques</legend>
        ${champTexte({ ...c('tarif', 'Tarif'), max: L.texte, placeholder: 'Gratuit, 5 €…' })}
        ${champTexte({ ...c('inscription_url', 'Lien d’inscription'), type: 'url', placeholder: 'https://' })}
        ${champTexte({
          ...c('source_url', 'Page de référence', {
            obligatoire: true,
            aide: 'Page de votre site ou de votre réseau social qui annonce l’événement.',
          }),
          type: 'url',
          placeholder: 'https://',
        })}
      </fieldset>

      <div class="boutons">
        <button class="bouton" type="submit" name="action" value="envoyer">
          Envoyer pour publication
        </button>
        <button class="bouton bouton-secondaire" type="submit" name="action" value="enregistrer">
          Enregistrer le brouillon
        </button>
      </div>
    </form>
    ${f.evenement === undefined ? '' : zoneSuppression(f.evenement)}
    <p><a href="${pages.tableauDeBord}">Revenir à mes événements</a></p>`;
}

/** Annuler ou supprimer : une case à cocher confirme, sans JavaScript. */
function zoneSuppression(e: Pick<EvenementCompte, 'id' | 'statut' | 'issue'>): Html {
  const action = `/organisateur/evenements/${String(e.id)}/`;
  const envoye = e.issue !== undefined && e.statut !== 'annulation_demandee';
  return balisage`<section class="texte zone-suppression" aria-labelledby="titre-suppression">
    <h2 id="titre-suppression">${envoye ? 'Annuler l’événement' : 'Supprimer l’événement'}</h2>
    ${
      envoye
        ? balisage`<p>
              L’événement a été envoyé : s’il n’a plus lieu, demandez son annulation. Il restera
              visible, marqué « Annulé », jusqu’à sa date.
            </p>
            <form method="post" action="${action}">
              <div class="champ-case">
                <input
                  type="checkbox"
                  id="confirmer-annulation"
                  name="confirmer"
                  value="oui"
                  required
                />
                <label for="confirmer-annulation">Je confirme que l’événement est annulé</label>
              </div>
              <button class="bouton bouton-secondaire" type="submit" name="action" value="annuler">
                Demander l’annulation
              </button>
            </form>`
        : balisage`<p>Le brouillon sera effacé de votre espace.</p>
            <form method="post" action="${action}">
              <div class="champ-case">
                <input
                  type="checkbox"
                  id="confirmer-suppression"
                  name="confirmer"
                  value="oui"
                  required
                />
                <label for="confirmer-suppression">Je confirme la suppression</label>
              </div>
              <button
                class="bouton bouton-secondaire"
                type="submit"
                name="action"
                value="supprimer"
              >
                Supprimer
              </button>
            </form>`
    }
  </section>`;
}
