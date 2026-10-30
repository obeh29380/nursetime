import { Database } from "bun:sqlite";

const db = new Database(process.env.DB_PATH ?? "nursetime.db", { create: true });

db.exec(`
  CREATE TABLE IF NOT EXISTS feedings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    ended_at   TEXT,
    memo       TEXT,
    completed  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )
`);

export type Feeding = {
  id: number;
  started_at: string;
  ended_at: string | null;
  memo: string | null;
  completed: number;
  created_at: string;
};

export const feedings = {
  list: (): Feeding[] =>
    db.prepare("SELECT * FROM feedings ORDER BY started_at DESC").all() as Feeding[],

  get: (id: number): Feeding | null =>
    db.prepare("SELECT * FROM feedings WHERE id = ?").get(id) as Feeding | null,

  create: (started_at: string, ended_at: string | null, memo: string | null): Feeding =>
    db.prepare(
      "INSERT INTO feedings (started_at, ended_at, memo) VALUES (?, ?, ?) RETURNING *"
    ).get(started_at, ended_at, memo) as Feeding,

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
