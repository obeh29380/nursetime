import { Database } from "bun:sqlite";

const db = new Database(process.env.DB_PATH ?? "nursetime.db", { create: true });

db.exec(`
  CREATE TABLE IF NOT EXISTS feedings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    ended_at   TEXT,
    memo       TEXT,
    user       TEXT,
    completed  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )
`);

// 既存 DB への user カラム追加マイグレーション
const feedingCols = db.prepare("PRAGMA table_info(feedings)").all() as { name: string }[];
if (!feedingCols.some(c => c.name === "user")) {
  db.exec("ALTER TABLE feedings ADD COLUMN user TEXT");
}

export type Feeding = {
  id: number;
  started_at: string;
  ended_at: string | null;
  memo: string | null;
  user: string | null;
  completed: number;
  created_at: string;
};

export const feedings = {
  list: (): Feeding[] =>
    db.prepare("SELECT * FROM feedings ORDER BY started_at DESC").all() as Feeding[],

  get: (id: number): Feeding | null =>
    db.prepare("SELECT * FROM feedings WHERE id = ?").get(id) as Feeding | null,

  create: (started_at: string, ended_at: string | null, memo: string | null, user: string | null): Feeding =>
    db.prepare(
      "INSERT INTO feedings (started_at, ended_at, memo, user) VALUES (?, ?, ?, ?) RETURNING *"
    ).get(started_at, ended_at, memo, user) as Feeding,

  update: (id: number, started_at: string, ended_at: string | null, memo: string | null): Feeding | null =>
    db.prepare(
      "UPDATE feedings SET started_at=?, ended_at=?, memo=? WHERE id=? RETURNING *"
    ).get(started_at, ended_at, memo, id) as Feeding | null,

  delete: (id: number): void => {
    db.run("DELETE FROM feedings WHERE id = ?", [id]);
  },

  toggleComplete: (id: number): Feeding | null =>
    db.prepare(
      "UPDATE feedings SET completed = 1 - completed WHERE id = ? RETURNING *"
    ).get(id) as Feeding | null,
};

db.exec(`
  CREATE TABLE IF NOT EXISTS diapers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    changed_at TEXT NOT NULL,
    type       TEXT NOT NULL,
    user       TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )
`);

const diaperCols = db.prepare("PRAGMA table_info(diapers)").all() as { name: string }[];
if (!diaperCols.some(c => c.name === "user")) {
  db.exec("ALTER TABLE diapers ADD COLUMN user TEXT");
}

export type Diaper = {
  id: number;
  changed_at: string;
  type: string;
  user: string | null;
  created_at: string;
};

export const diapers = {
  list: (): Diaper[] =>
    db.prepare("SELECT * FROM diapers ORDER BY changed_at DESC").all() as Diaper[],

  get: (id: number): Diaper | null =>
    db.prepare("SELECT * FROM diapers WHERE id = ?").get(id) as Diaper | null,

  create: (changed_at: string, type: string, user: string | null): Diaper =>
    db.prepare(
      "INSERT INTO diapers (changed_at, type, user) VALUES (?, ?, ?) RETURNING *"
    ).get(changed_at, type, user) as Diaper,

  update: (id: number, changed_at: string, type: string): Diaper | null =>
    db.prepare(
      "UPDATE diapers SET changed_at=?, type=? WHERE id=? RETURNING *"
    ).get(changed_at, type, id) as Diaper | null,

  delete: (id: number): void => {
    db.run("DELETE FROM diapers WHERE id = ?", [id]);
  },
};
