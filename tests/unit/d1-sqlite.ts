/**
 * Base D1 simulée sur SQLite (module `node:sqlite`), avec les migrations du dépôt : les tests
 * de l'espace organisateur exécutent le vrai SQL, sans Cloudflare.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { BaseD1, RequeteD1 } from '../../src/lib/organisateur/depot';

type ValeurSql = string | number | null;

function requete(base: DatabaseSync, sql: string, valeurs: ValeurSql[] = []): RequeteD1 {
  return {
    bind: (...nouvelles) => requete(base, sql, nouvelles),
    first: () => Promise.resolve(base.prepare(sql).get(...valeurs) ?? null),
    all: () => Promise.resolve({ results: base.prepare(sql).all(...valeurs) }),
    run: () => {
      const { changes, lastInsertRowid } = base.prepare(sql).run(...valeurs);
      return Promise.resolve({
        meta: { changes: Number(changes), last_row_id: Number(lastInsertRowid) },
      });
    },
  };
}

export function baseD1DeTest(): BaseD1 {
  const base = new DatabaseSync(':memory:');
  base.exec('PRAGMA foreign_keys = ON;');
  const dossier = new URL('../../migrations/', import.meta.url);
  for (const fichier of readdirSync(dossier)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    base.exec(readFileSync(new URL(fichier, dossier), 'utf8'));
  }
  return { prepare: (sql) => requete(base, sql) };
}
