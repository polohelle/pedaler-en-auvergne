-- Base D1 de l'espace organisateur (ADR 0038), liée au projet Pages sous le nom ORGANISATEURS.
-- Dates en ISO 8601 UTC (toISOString), comparables comme du texte.

-- Un compte par adresse e-mail. L'adresse ne quitte jamais cette base (ADR 0018).
CREATE TABLE IF NOT EXISTS organisateurs (
  id INTEGER PRIMARY KEY,
  courriel TEXT NOT NULL UNIQUE,
  structure TEXT,
  cree_le TEXT NOT NULL
);

-- Liens de connexion envoyés par e-mail : empreinte SHA-256 du jeton, à usage unique.
CREATE TABLE IF NOT EXISTS jetons_connexion (
  empreinte TEXT PRIMARY KEY,
  courriel TEXT NOT NULL,
  cree_le TEXT NOT NULL,
  expire_le TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS jetons_connexion_courriel ON jetons_connexion (courriel);

-- Sessions ouvertes : empreinte SHA-256 du cookie.
CREATE TABLE IF NOT EXISTS sessions (
  empreinte TEXT PRIMARY KEY,
  organisateur_id INTEGER NOT NULL REFERENCES organisateurs (id) ON DELETE CASCADE,
  expire_le TEXT NOT NULL
);

-- Événements des organisateurs, avant et après l'envoi pour vérification. La fiche publiée,
-- elle, vit dans le dépôt (src/content/evenements/) : la base ne publie rien.
CREATE TABLE IF NOT EXISTS evenements (
  id INTEGER PRIMARY KEY,
  organisateur_id INTEGER NOT NULL REFERENCES organisateurs (id) ON DELETE CASCADE,
  -- Saisie de l'organisateur, en JSON (src/lib/organisateur/evenement.ts, schemaBrouillon).
  donnees TEXT NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('brouillon', 'envoye', 'annulation_demandee')),
  -- Dernière issue GitHub créée pour cet événement.
  issue INTEGER,
  cree_le TEXT NOT NULL,
  modifie_le TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS evenements_organisateur ON evenements (organisateur_id);
