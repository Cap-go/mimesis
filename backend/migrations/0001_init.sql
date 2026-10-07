-- Mimesis catalog and game history, migrated from Supabase Postgres.

CREATE TABLE IF NOT EXISTS langs (
  id INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  name TEXT NOT NULL,
  locale TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS modes (
  id INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  name TEXT NOT NULL,
  icon TEXT,
  active INTEGER NOT NULL DEFAULT 0,
  id_ios TEXT,
  id_android TEXT,
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'paid', 'locked'))
);

CREATE TABLE IF NOT EXISTS guesses (
  id INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  lang INTEGER NOT NULL REFERENCES langs(id),
  mode INTEGER REFERENCES modes(id),
  author TEXT,
  cover TEXT,
  title TEXT NOT NULL,
  type TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  games INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  user_id TEXT REFERENCES users(id),
  lang INTEGER NOT NULL REFERENCES langs(id),
  mode INTEGER REFERENCES modes(id),
  teams TEXT NOT NULL,
  found_guess TEXT NOT NULL DEFAULT '[]',
  skip_guess TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_guesses_lang_mode ON guesses(lang, mode);
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_mode ON games(mode);
