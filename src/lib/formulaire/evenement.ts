/**
 * Formulaire public « Proposer un événement » : lecture et validation des champs envoyés,
 * puis rédaction de l'issue GitHub. L'issue ne contient jamais l'adresse e-mail de l'auteur
 * ni aucune donnée personnelle (ADR 0018).
 */
import { z } from 'astro/zod';
import { CODES_DEPARTEMENT, DEPARTEMENTS, DEPARTEMENT_PAR_DEFAUT } from '@config/departements';
import { TYPES_EVENEMENT } from '@config/evenements';
import { FORMULAIRES } from '@config/formulaires';
import { dateHeureParis, formaterDate, formaterHeure } from '@lib/dates';
import { schemaEvenement } from '@schemas/evenement';
import { schemaUrl } from '@schemas/communs';
import { contientDonneePersonnelle, contientEmail } from './donnees-personnelles';

const { longueurs } = FORMULAIRES;

/** Nom du champ piège : invisible, un humain le laisse vide. */
export const CHAMP_PIEGE = 'site_web';
/** Nom du champ où le widget Turnstile dépose son jeton. */
export const CHAMP_TURNSTILE = 'cf-turnstile-response';

const departementsActifs = CODES_DEPARTEMENT.filter((code) => DEPARTEMENTS[code].actif);

const texte = (max: number) => z.string().max(max, `${String(max)} caractères au plus.`);

const schemaChamps = z.object({
  titre: texte(longueurs.titre),
  type: z.enum(TYPES_EVENEMENT),
  jour_debut: z.string(),
  heure_debut: z.string(),
  jour_fin: z.string().optional(),
  heure_fin: z.string().optional(),
  lieu: texte(longueurs.texte),
  commune: texte(longueurs.texte),
  departement: z.enum(departementsActifs as [string, ...string[]]).default(DEPARTEMENT_PAR_DEFAUT),
  organisateur: texte(longueurs.texte).optional(),
  tarif: texte(longueurs.texte).optional(),
  description: z
    .string()
    .min(longueurs.descriptionMin, `${String(longueurs.descriptionMin)} caractères au moins.`)
    .max(longueurs.description, `${String(longueurs.description)} caractères au plus.`),
  inscription_url: schemaUrl.optional(),
  source_url: schemaUrl,
  courriel: z.email('Adresse e-mail invalide.').max(254).optional(),
});

/** Champs dont le texte part dans l'issue publique : aucune donnée personnelle. */
const CHAMPS_PUBLICS = [
  'titre',
  'lieu',
  'commune',
  'organisateur',
  'tarif',
  'description',
] as const;
const URLS_PUBLIQUES = ['inscription_url', 'source_url'] as const;

export interface PropositionEvenement {
  titre: string;
  type: (typeof TYPES_EVENEMENT)[number];
  /** ISO 8601 avec le fuseau de Paris. */
  debut: string;
  fin?: string;
  lieu: string;
  commune: string;
  departement: string;
  /** Nom de la structure organisatrice, tel que saisi (pas encore relié à l'annuaire). */
  organisateur?: string;
  tarif?: string;
  description: string;
  inscription_url?: string;
  source_url: string;
  /** Adresse pour répondre à l'auteur : jamais dans l'issue. */
  courriel?: string;
}

export interface ErreurChamp {
  champ: string;
  message: string;
}

export type LectureProposition =
  { ok: true; proposition: PropositionEvenement } | { ok: false; erreurs: ErreurChamp[] };

/**
 * Garde les champs texte d'un formulaire, sans espaces superflus, et oublie les champs vides :
 * un champ facultatif laissé vide équivaut à un champ absent.
 */
export function champsTexte(entrees: Iterable<[string, unknown]>): Record<string, string> {
  const champs: Record<string, string> = {};
  for (const [nom, valeur] of entrees) {
    if (typeof valeur === 'string' && valeur.trim() !== '') {
      champs[nom] = valeur.trim();
    }
  }
  return champs;
}

export function estUnRobot(champs: Record<string, string>): boolean {
  return champs[CHAMP_PIEGE] !== undefined;
}

function dateOuErreur(
  jour: string,
  heure: string,
  champ: string,
  erreurs: ErreurChamp[],
): string | undefined {
  try {
    return dateHeureParis(jour, heure);
  } catch {
    erreurs.push({ champ, message: 'Date ou heure invalide.' });
    return undefined;
  }
}

/** Valide les champs envoyés et construit la proposition, ou liste les erreurs par champ. */
export function lirePropositionEvenement(
  champs: Record<string, string>,
  maintenant: Date,
): LectureProposition {
  const lecture = schemaChamps.safeParse(champs);
  if (!lecture.success) {
    return {
      ok: false,
      erreurs: lecture.error.issues.map((issue) => ({
        champ: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }
  const saisie = lecture.data;
  const erreurs: ErreurChamp[] = [];

  for (const champ of CHAMPS_PUBLICS) {
    const valeur = saisie[champ];
    if (valeur !== undefined && contientDonneePersonnelle(valeur)) {
      erreurs.push({ champ, message: 'Pas d’adresse e-mail ni de numéro de téléphone ici.' });
    }
  }
  for (const champ of URLS_PUBLIQUES) {
    const valeur = saisie[champ];
    if (valeur !== undefined && contientEmail(valeur)) {
      erreurs.push({ champ, message: 'Pas d’adresse e-mail dans un lien.' });
    }
  }

  const debut = dateOuErreur(saisie.jour_debut, saisie.heure_debut, 'jour_debut', erreurs);
  let fin: string | undefined;
  if (saisie.jour_fin !== undefined || saisie.heure_fin !== undefined) {
    if (saisie.heure_fin === undefined) {
      erreurs.push({ champ: 'heure_fin', message: 'Heure de fin manquante.' });
    } else {
      fin = dateOuErreur(
        saisie.jour_fin ?? saisie.jour_debut,
        saisie.heure_fin,
        'jour_fin',
        erreurs,
      );
    }
  }
  if (debut !== undefined && new Date(debut) < maintenant) {
    erreurs.push({ champ: 'jour_debut', message: 'L’événement est déjà passé.' });
  }
  if (debut !== undefined && fin !== undefined && new Date(fin) < new Date(debut)) {
    erreurs.push({ champ: 'jour_fin', message: 'La fin précède le début.' });
  }
  if (erreurs.length > 0 || debut === undefined) {
    return { ok: false, erreurs };
  }

  const proposition: PropositionEvenement = {
    titre: saisie.titre.replace(/\s+/g, ' '),
    type: saisie.type,
    debut,
    lieu: saisie.lieu,
    commune: saisie.commune,
    departement: saisie.departement,
    description: saisie.description,
    source_url: saisie.source_url,
    ...(fin !== undefined && { fin }),
    ...(saisie.organisateur !== undefined && { organisateur: saisie.organisateur }),
    ...(saisie.tarif !== undefined && { tarif: saisie.tarif }),
    ...(saisie.inscription_url !== undefined && { inscription_url: saisie.inscription_url }),
    ...(saisie.courriel !== undefined && { courriel: saisie.courriel }),
  };

  // Une seule source de vérité : la future fiche doit passer le schéma de l'agenda.
  const fiche = schemaEvenement.safeParse(ficheProposee(proposition));
  if (!fiche.success) {
    return {
      ok: false,
      erreurs: fiche.error.issues.map((issue) => ({
        champ: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }
  return { ok: true, proposition };
}

/** Champs de la future fiche `src/content/evenements/`, avant relecture. */
function ficheProposee(p: PropositionEvenement): Record<string, string> {
  return {
    titre: p.titre,
    type: p.type,
    debut: p.debut,
    ...(p.fin !== undefined && { fin: p.fin }),
    lieu: p.lieu,
    commune: p.commune,
    departement: p.departement,
    ...(p.tarif !== undefined && { tarif: p.tarif }),
    ...(p.inscription_url !== undefined && { inscription_url: p.inscription_url }),
    source_url: p.source_url,
    source: 'formulaire',
    statut: 'a_valider',
  };
}

/** Empêche un texte de refermer le bloc de code où il est cité. */
function sansClotureDeCode(texte: string): string {
  return texte.replace(/`{3,}/g, (cloture) => "'".repeat(cloture.length));
}

export interface IssueGithub {
  titre: string;
  corps: string;
  etiquettes: string[];
}

/**
 * Issue GitHub d'une proposition : les champs de la future fiche en YAML (chaînes JSON, donc
 * YAML valide), la description citée telle quelle dans un bloc de code, pour qu'aucun texte
 * saisi ne soit interprété (liens, mentions, HTML). Jamais l'adresse e-mail de l'auteur.
 */
export function issueEvenement(p: PropositionEvenement, recueLe: Date): IssueGithub {
  const fiche = ficheProposee(p);
  const yaml = Object.entries(fiche).map(([cle, valeur]) =>
    cle === 'source' || cle === 'statut' || cle === 'type'
      ? `${cle}: ${valeur}`
      : `${cle}: ${JSON.stringify(valeur)}`,
  );
  if (p.organisateur !== undefined) {
    yaml.push(`# Organisateur indiqué, à relier à sa fiche de l'annuaire (slug) :`);
    yaml.push(`# ${JSON.stringify(p.organisateur)}`);
  }
  const corps = [
    `Proposition reçue par le formulaire du site le ${formaterDate(recueLe)} à ${formaterHeure(recueLe)}. À vérifier avant publication.`,
    '',
    'Champs proposés pour la fiche :',
    '',
    '```yaml',
    sansClotureDeCode(yaml.join('\n')),
    '```',
    '',
    'Description de l’auteur, à reformuler :',
    '',
    '```text',
    sansClotureDeCode(p.description),
    '```',
    '',
    p.courriel === undefined
      ? 'L’auteur n’a pas laissé d’adresse pour être recontacté.'
      : 'L’auteur a laissé une adresse pour être recontacté : elle est envoyée à part à l’administrateur et n’apparaît pas ici (ADR 0018).',
  ].join('\n');
  return {
    titre: `[Événement] ${p.titre}`,
    corps,
    etiquettes: [...FORMULAIRES.etiquettesEvenement],
  };
}
