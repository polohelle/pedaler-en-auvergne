/**
 * Accès à la base D1 de l'espace organisateur (`migrations/0001_espace_organisateur.sql`).
 * La base est décrite par une interface minimale, compatible avec la liaison D1 de Cloudflare,
 * pour être testée sur SQLite sans dépendre des types de Cloudflare.
 */
import { schemaBrouillon, type Brouillon } from './evenement';

type ValeurSql = string | number | null;

export interface RequeteD1 {
  bind: (...valeurs: ValeurSql[]) => RequeteD1;
  first: () => Promise<Record<string, unknown> | null>;
  all: () => Promise<{ results: Record<string, unknown>[] }>;
  run: () => Promise<{ meta: { changes: number; last_row_id: number } }>;
}

export interface BaseD1 {
  prepare: (sql: string) => RequeteD1;
}

export interface Organisateur {
  id: number;
  courriel: string;
  structure?: string;
}

export const STATUTS_EVENEMENT_COMPTE = ['brouillon', 'envoye', 'annulation_demandee'] as const;
export type StatutEvenementCompte = (typeof STATUTS_EVENEMENT_COMPTE)[number];

export interface EvenementCompte {
  id: number;
  brouillon: Brouillon;
  statut: StatutEvenementCompte;
  issue?: number;
  modifieLe: string;
}

interface LigneOrganisateur {
  id: number;
  courriel: string;
  structure: string | null;
}

interface LigneEvenement {
  id: number;
  donnees: string;
  statut: string;
  issue: number | null;
  modifie_le: string;
}

type Ligne = Record<string, unknown>;

function organisateur(brute: Ligne): Organisateur {
  // Colonnes fixées par la requête et par le schéma SQL.
  const ligne = brute as unknown as LigneOrganisateur;
  return {
    id: ligne.id,
    courriel: ligne.courriel,
    ...(ligne.structure !== null && { structure: ligne.structure }),
  };
}

function evenement(brute: Ligne): EvenementCompte | undefined {
  const ligne = brute as unknown as LigneEvenement;
  let donnees: unknown;
  try {
    donnees = JSON.parse(ligne.donnees);
  } catch {
    return undefined;
  }
  const brouillon = schemaBrouillon.safeParse(donnees);
  const statut = STATUTS_EVENEMENT_COMPTE.find((s) => s === ligne.statut);
  if (!brouillon.success || statut === undefined) return undefined;
  return {
    id: ligne.id,
    brouillon: brouillon.data,
    statut,
    ...(ligne.issue !== null && { issue: ligne.issue }),
    modifieLe: ligne.modifie_le,
  };
}

export class Depot {
  readonly #base: BaseD1;

  constructor(base: BaseD1) {
    this.#base = base;
  }

  /** Liens encore valides demandés pour cette adresse : limite les envois répétés. */
  async liensValides(courriel: string, maintenant: Date): Promise<number> {
    const ligne = await this.#base
      .prepare(
        'SELECT COUNT(*) AS nombre FROM jetons_connexion WHERE courriel = ? AND expire_le > ?',
      )
      .bind(courriel, maintenant.toISOString())
      .first();
    return Number(ligne?.nombre ?? 0);
  }

  /** Enregistre un lien de connexion, et oublie au passage les liens et sessions expirés. */
  async enregistrerLien(
    empreinte: string,
    courriel: string,
    maintenant: Date,
    expireLe: Date,
  ): Promise<void> {
    const iso = maintenant.toISOString();
    await this.#base.prepare('DELETE FROM jetons_connexion WHERE expire_le <= ?').bind(iso).run();
    await this.#base.prepare('DELETE FROM sessions WHERE expire_le <= ?').bind(iso).run();
    await this.#base
      .prepare(
        'INSERT INTO jetons_connexion (empreinte, courriel, cree_le, expire_le) VALUES (?, ?, ?, ?)',
      )
      .bind(empreinte, courriel, iso, expireLe.toISOString())
      .run();
  }

  /** Consomme un lien encore valide (usage unique) et renvoie son adresse. */
  async consommerLien(empreinte: string, maintenant: Date): Promise<string | undefined> {
    const ligne = await this.#base
      .prepare('SELECT courriel FROM jetons_connexion WHERE empreinte = ? AND expire_le > ?')
      .bind(empreinte, maintenant.toISOString())
      .first();
    const { meta } = await this.#base
      .prepare('DELETE FROM jetons_connexion WHERE empreinte = ?')
      .bind(empreinte)
      .run();
    // Deux clics simultanés : seul celui qui a effacé la ligne ouvre une session.
    const adresse = ligne?.courriel;
    return typeof adresse === 'string' && meta.changes === 1 ? adresse : undefined;
  }

  async organisateurParCourriel(courriel: string, maintenant: Date): Promise<Organisateur> {
    await this.#base
      .prepare(
        'INSERT INTO organisateurs (courriel, cree_le) VALUES (?, ?) ON CONFLICT (courriel) DO NOTHING',
      )
      .bind(courriel, maintenant.toISOString())
      .run();
    const ligne = await this.#base
      .prepare('SELECT id, courriel, structure FROM organisateurs WHERE courriel = ?')
      .bind(courriel)
      .first();
    if (ligne === null) throw new Error('Compte introuvable après création.');
    return organisateur(ligne);
  }

  async ouvrirSession(empreinte: string, organisateurId: number, expireLe: Date): Promise<void> {
    await this.#base
      .prepare('INSERT INTO sessions (empreinte, organisateur_id, expire_le) VALUES (?, ?, ?)')
      .bind(empreinte, organisateurId, expireLe.toISOString())
      .run();
  }

  async organisateurDeSession(
    empreinte: string,
    maintenant: Date,
  ): Promise<Organisateur | undefined> {
    const ligne = await this.#base
      .prepare(
        `SELECT o.id, o.courriel, o.structure FROM sessions s
         JOIN organisateurs o ON o.id = s.organisateur_id
         WHERE s.empreinte = ? AND s.expire_le > ?`,
      )
      .bind(empreinte, maintenant.toISOString())
      .first();
    return ligne === null ? undefined : organisateur(ligne);
  }

  async fermerSession(empreinte: string): Promise<void> {
    await this.#base.prepare('DELETE FROM sessions WHERE empreinte = ?').bind(empreinte).run();
  }

  async modifierStructure(organisateurId: number, structure: string | undefined): Promise<void> {
    await this.#base
      .prepare('UPDATE organisateurs SET structure = ? WHERE id = ?')
      .bind(structure ?? null, organisateurId)
      .run();
  }

  /** Événements du compte, les plus récemment modifiés d'abord. */
  async evenements(organisateurId: number): Promise<EvenementCompte[]> {
    const { results } = await this.#base
      .prepare(
        'SELECT id, donnees, statut, issue, modifie_le FROM evenements WHERE organisateur_id = ? ORDER BY modifie_le DESC, id DESC',
      )
      .bind(organisateurId)
      .all();
    return results.map(evenement).filter((e) => e !== undefined);
  }

  /** Un événement, seulement s'il appartient au compte. */
  async evenement(organisateurId: number, id: number): Promise<EvenementCompte | undefined> {
    const ligne = await this.#base
      .prepare(
        'SELECT id, donnees, statut, issue, modifie_le FROM evenements WHERE organisateur_id = ? AND id = ?',
      )
      .bind(organisateurId, id)
      .first();
    return ligne === null ? undefined : evenement(ligne);
  }

  async creerEvenement(
    organisateurId: number,
    brouillon: Brouillon,
    maintenant: Date,
  ): Promise<number> {
    const iso = maintenant.toISOString();
    const { meta } = await this.#base
      .prepare(
        "INSERT INTO evenements (organisateur_id, donnees, statut, cree_le, modifie_le) VALUES (?, ?, 'brouillon', ?, ?)",
      )
      .bind(organisateurId, JSON.stringify(brouillon), iso, iso)
      .run();
    return meta.last_row_id;
  }

  async modifierEvenement(
    organisateurId: number,
    id: number,
    modification: { brouillon: Brouillon; statut: StatutEvenementCompte; issue?: number },
    maintenant: Date,
  ): Promise<void> {
    await this.#base
      .prepare(
        'UPDATE evenements SET donnees = ?, statut = ?, issue = COALESCE(?, issue), modifie_le = ? WHERE organisateur_id = ? AND id = ?',
      )
      .bind(
        JSON.stringify(modification.brouillon),
        modification.statut,
        modification.issue ?? null,
        maintenant.toISOString(),
        organisateurId,
        id,
      )
      .run();
  }

  async supprimerEvenement(organisateurId: number, id: number): Promise<void> {
    await this.#base
      .prepare('DELETE FROM evenements WHERE organisateur_id = ? AND id = ?')
      .bind(organisateurId, id)
      .run();
  }
}
