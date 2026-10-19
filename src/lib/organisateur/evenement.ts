/**
 * Événement d'un organisateur : lecture du formulaire de l'espace, validation, dates
 * (plusieurs occurrences ou un seul événement sur des jours consécutifs), et issue GitHub
 * d'envoi pour vérification. Comme pour le formulaire public (ADR 0030), chaque future fiche
 * doit passer le schéma de l'agenda, et aucune donnée personnelle ne part dans l'issue.
 */
import { z } from 'astro/zod';
import { CODES_DEPARTEMENT, DEPARTEMENTS, DEPARTEMENT_PAR_DEFAUT } from '@config/departements';
import { PRATIQUES_EVENEMENT, TYPES_EVENEMENT } from '@config/evenements';
import { FORMULAIRES } from '@config/formulaires';
import { ORGANISATEUR } from '@config/organisateur';
import { dateHeureParis, formaterDate, formaterHeure } from '@lib/dates';
import { slugifier } from '@lib/slug';
import { schemaEvenement } from '@schemas/evenement';
import { schemaUrl } from '@schemas/communs';
import { contientDonneePersonnelle, contientEmail } from '@lib/formulaire/donnees-personnelles';
import { sansClotureDeCode, type ErreurChamp, type IssueGithub } from '@lib/formulaire/evenement';
import { datesConsecutives, estUnJour, libelleDuJour, trierDates } from './calendrier';

const { longueurs } = FORMULAIRES;
const departementsActifs = CODES_DEPARTEMENT.filter((code) => DEPARTEMENTS[code].actif) as [
  string,
  ...string[],
];

const OBLIGATOIRE = 'Champ obligatoire.';
const texte = (max: number) =>
  z
    .string(OBLIGATOIRE)
    .trim()
    .min(1, OBLIGATOIRE)
    .max(max, `${String(max)} caractères au plus.`);
const heure = z.string(OBLIGATOIRE).regex(/^\d{2}:\d{2}$/, 'Heure HH:MM attendue.');

/** Événement tel que l'organisateur l'a enregistré : ce qui est stocké dans D1, en JSON. */
export const schemaBrouillon = z.strictObject({
  titre: texte(longueurs.titre),
  type: z.enum(TYPES_EVENEMENT, 'Type à choisir dans la liste.'),
  pratiques: z.array(z.enum(PRATIQUES_EVENEMENT)),
  description: z
    .string(OBLIGATOIRE)
    .trim()
    .min(longueurs.descriptionMin, `${String(longueurs.descriptionMin)} caractères au moins.`)
    .max(longueurs.description, `${String(longueurs.description)} caractères au plus.`),
  dates: z
    .array(z.string().refine(estUnJour, 'Date invalide.'))
    .min(1, 'Choisissez au moins une date dans le calendrier.')
    .max(ORGANISATEUR.datesMax, `${String(ORGANISATEUR.datesMax)} dates au plus.`),
  heure_debut: heure,
  heure_fin: heure.optional(),
  plusieurs_jours: z.boolean(),
  lieu: texte(longueurs.texte),
  commune: texte(longueurs.texte),
  departement: z.enum(departementsActifs, 'Département invalide.'),
  tarif: texte(longueurs.texte).optional(),
  inscription_url: schemaUrl.optional(),
  source_url: schemaUrl,
});

export type Brouillon = z.output<typeof schemaBrouillon>;

/** Champs envoyés par le formulaire de l'espace : texte, plus les listes cochées. */
export interface Saisie {
  champs: Record<string, string>;
  dates: string[];
  pratiques: string[];
}

const CHAMPS_MULTIPLES = new Set(['dates', 'pratiques']);

/** Lit le formulaire : champs vides oubliés, espaces superflus retirés, listes gardées. */
export function lireSaisie(entrees: Iterable<[string, unknown]>): Saisie {
  const saisie: Saisie = { champs: {}, dates: [], pratiques: [] };
  for (const [nom, valeur] of entrees) {
    if (typeof valeur !== 'string' || valeur.trim() === '') continue;
    if (nom === 'dates' || nom === 'pratiques') {
      saisie[nom].push(valeur.trim());
    } else if (!CHAMPS_MULTIPLES.has(nom)) {
      saisie.champs[nom] = valeur.trim();
    }
  }
  return saisie;
}

/** Saisie qui pré-remplit le formulaire avec un événement enregistré. */
export function saisieDe(brouillon: Brouillon): Saisie {
  const { dates, pratiques, plusieurs_jours, ...reste } = brouillon;
  const champs: Record<string, string> = {};
  for (const [cle, valeur] of Object.entries(reste)) {
    if (typeof valeur === 'string') champs[cle] = valeur;
  }
  if (plusieurs_jours) champs.plusieurs_jours = 'oui';
  return { champs, dates: [...dates], pratiques: [...pratiques] };
}

export interface Occurrence {
  /** ISO 8601 avec le fuseau de Paris. */
  debut: string;
  fin?: string;
}

/**
 * Dates de l'agenda : une occurrence par jour coché, aux mêmes heures ; ou, pour un événement
 * sur plusieurs jours, une seule du premier jour (heure de début) au dernier (heure de fin).
 */
export function occurrences(b: Brouillon): Occurrence[] {
  const dates = trierDates(b.dates);
  const premier = dates[0];
  const dernier = dates[dates.length - 1];
  if (premier === undefined || dernier === undefined) return [];
  if (b.plusieurs_jours) {
    return [
      {
        debut: dateHeureParis(premier, b.heure_debut),
        ...(b.heure_fin !== undefined && { fin: dateHeureParis(dernier, b.heure_fin) }),
      },
    ];
  }
  return dates.map((jour) => ({
    debut: dateHeureParis(jour, b.heure_debut),
    ...(b.heure_fin !== undefined && { fin: dateHeureParis(jour, b.heure_fin) }),
  }));
}

/** Champs de la future fiche `src/content/evenements/` d'une occurrence, avant relecture. */
function fiche(b: Brouillon, o: Occurrence): Record<string, unknown> {
  return {
    titre: b.titre,
    type: b.type,
    ...(b.pratiques.length > 0 && { pratiques: b.pratiques }),
    debut: o.debut,
    ...(o.fin !== undefined && { fin: o.fin }),
    lieu: b.lieu,
    commune: b.commune,
    departement: b.departement,
    ...(b.tarif !== undefined && { tarif: b.tarif }),
    ...(b.inscription_url !== undefined && { inscription_url: b.inscription_url }),
    source_url: b.source_url,
    source: 'formulaire',
    statut: 'a_valider',
  };
}

export type Validation = { ok: true; brouillon: Brouillon } | { ok: false; erreurs: ErreurChamp[] };

const CHAMPS_PUBLICS = ['titre', 'lieu', 'commune', 'tarif', 'description'] as const;
const URLS_PUBLIQUES = ['inscription_url', 'source_url'] as const;

function erreursZod(erreur: z.ZodError): ErreurChamp[] {
  return erreur.issues.map((issue) => ({
    champ: String(issue.path[0] ?? 'formulaire'),
    message: issue.message,
  }));
}

/** Valide la saisie : schéma, données personnelles, dates à venir, et fiches de l'agenda. */
export function validerSaisie(saisie: Saisie, maintenant: Date): Validation {
  const { champs } = saisie;
  const lecture = schemaBrouillon.safeParse({
    ...Object.fromEntries(
      Object.entries(champs).filter(
        ([cle]) => cle !== 'plusieurs_jours' && cle in schemaBrouillon.shape,
      ),
    ),
    departement: champs.departement ?? DEPARTEMENT_PAR_DEFAUT,
    dates: trierDates(saisie.dates),
    pratiques: [...new Set(saisie.pratiques)],
    plusieurs_jours: champs.plusieurs_jours === 'oui',
  });
  if (!lecture.success) {
    return { ok: false, erreurs: erreursZod(lecture.error) };
  }
  const b = lecture.data;
  const erreurs: ErreurChamp[] = [];
  for (const champ of CHAMPS_PUBLICS) {
    const valeur = b[champ];
    if (valeur !== undefined && contientDonneePersonnelle(valeur)) {
      erreurs.push({ champ, message: 'Pas d’adresse e-mail ni de numéro de téléphone ici.' });
    }
  }
  for (const champ of URLS_PUBLIQUES) {
    const valeur = b[champ];
    if (valeur !== undefined && contientEmail(valeur)) {
      erreurs.push({ champ, message: 'Pas d’adresse e-mail dans un lien.' });
    }
  }
  if (b.plusieurs_jours) {
    if (!datesConsecutives(b.dates)) {
      erreurs.push({
        champ: 'plusieurs_jours',
        message: 'Un événement sur plusieurs jours demande au moins deux jours qui se suivent.',
      });
    }
    if (b.heure_fin === undefined) {
      erreurs.push({
        champ: 'heure_fin',
        message: 'Indiquez l’heure de fin du dernier jour.',
      });
    }
  } else if (b.heure_fin !== undefined && b.heure_fin < b.heure_debut) {
    erreurs.push({ champ: 'heure_fin', message: 'La fin précède le début.' });
  }
  if (erreurs.length > 0) return { ok: false, erreurs };

  let dates: Occurrence[];
  try {
    dates = occurrences(b);
  } catch {
    return {
      ok: false,
      erreurs: [{ champ: 'heure_debut', message: 'Heure impossible ce jour-là.' }],
    };
  }
  if (dates.some((o) => new Date(o.debut) < maintenant)) {
    return { ok: false, erreurs: [{ champ: 'dates', message: 'Une des dates est déjà passée.' }] };
  }
  for (const o of dates) {
    const controle = schemaEvenement.safeParse(fiche(b, o));
    if (!controle.success) return { ok: false, erreurs: erreursZod(controle.error) };
  }
  return { ok: true, brouillon: b };
}

/** Contexte d'une demande envoyée depuis l'espace : jamais l'adresse de l'organisateur. */
export interface ContexteDemande {
  /** Numéro du compte organisateur, pour le retrouver dans la base. */
  compte: number;
  /** Nom de la structure, saisi par l'organisateur. */
  structure?: string;
  recueLe: Date;
  /** Demande précédente pour le même événement. */
  precedente?: number;
}

function yaml(champs: Record<string, unknown>): string {
  return Object.entries(champs)
    .map(([cle, valeur]) =>
      cle === 'source' || cle === 'statut' || cle === 'type'
        ? `${cle}: ${String(valeur)}`
        : `${cle}: ${JSON.stringify(valeur)}`,
    )
    .join('\n');
}

function entete(c: ContexteDemande, action: string): string[] {
  return [
    `${action} depuis l'espace organisateur du site le ${formaterDate(c.recueLe)} à ${formaterHeure(c.recueLe)}. À vérifier avant publication.`,
    '',
    `Compte organisateur n° ${String(c.compte)}. Structure indiquée, à relier à sa fiche de l'annuaire (slug) :`,
    '',
    '```text',
    sansClotureDeCode(c.structure ?? '(non renseignée)'),
    '```',
    ...(c.precedente === undefined
      ? []
      : ['', `Remplace la demande #${String(c.precedente)} pour le même événement.`]),
  ];
}

/**
 * Issue d'envoi pour vérification : une fiche par occurrence, avec son nom de fichier, en YAML
 * (chaînes JSON, donc YAML valide) ; la description citée dans un bloc de code.
 */
export function issueEnvoi(b: Brouillon, c: ContexteDemande): IssueGithub {
  const liste = occurrences(b);
  const fiches = liste.flatMap((o) => [
    '',
    `\`src/content/evenements/${jourDe(o.debut)}-${slugifier(b.titre)}.md\``,
    '',
    '```yaml',
    sansClotureDeCode(yaml(fiche(b, o))),
    '```',
  ]);
  const corps = [
    ...entete(c, c.precedente === undefined ? 'Événement envoyé' : 'Événement modifié'),
    '',
    liste.length === 1
      ? 'Fiche proposée :'
      : `${String(liste.length)} fiches proposées, une par date :`,
    ...fiches,
    '',
    'Description de l’organisateur, à reformuler :',
    '',
    '```text',
    sansClotureDeCode(b.description),
    '```',
    '',
    'L’adresse e-mail du compte n’apparaît pas ici (ADR 0018) ; l’administrateur la retrouve dans la base de l’espace organisateur.',
  ].join('\n');
  return {
    titre: `${c.precedente === undefined ? '[Événement]' : '[Modification]'} ${b.titre}`,
    corps,
    etiquettes: [...FORMULAIRES.etiquettesEvenement],
  };
}

/** Issue de demande d'annulation d'un événement déjà envoyé. */
export function issueAnnulation(b: Brouillon, c: ContexteDemande): IssueGithub {
  const jours = trierDates(b.dates).map((jour) => `- ${libelleDuJour(jour)}`);
  const corps = [
    ...entete(c, 'Annulation demandée'),
    '',
    'L’organisateur annonce l’annulation de cet événement. Passer les fiches publiées en `statut: annule` (elles restent visibles, barrées, jusqu’à leur date), ou retirer celles qui ne sont pas encore publiées.',
    '',
    '```text',
    sansClotureDeCode(b.titre),
    '```',
    '',
    'Dates concernées :',
    '',
    ...jours,
  ].join('\n');
  return {
    titre: `[Annulation] ${b.titre}`,
    corps,
    etiquettes: [...FORMULAIRES.etiquettesEvenement],
  };
}

function jourDe(iso: string): string {
  return iso.slice(0, 10);
}
