import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { buildSeed, CURRENT_SCHEMA_VERSION } from "./seed";
import type { DBShape } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

let cache: DBShape | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

async function persist(next: DBShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(next, null, 2), "utf-8");
}

async function ensureFile(): Promise<DBShape> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DBShape>;
    if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      throw new Error("schema-mismatch");
    }
    const db = parsed as DBShape;
    db.employees = db.employees.map((e) => {
      const salonIds = Array.from(new Set([...(e.salonIds ?? []), e.salonId].filter(Boolean)));
      return { ...e, salonIds, salonId: salonIds[0] ?? e.salonId };
    });
    return db;
  } catch {
    const seed = buildSeed();
    await persist(seed);
    return seed;
  }
}

export async function readDB(): Promise<DBShape> {
  if (cache) return cache;
  cache = await ensureFile();
  return cache;
}

async function writeDB(next: DBShape): Promise<void> {
  cache = next;
  writeChain = writeChain.then(() => persist(next));
  await writeChain;
}

export async function mutate(updater: (db: DBShape) => DBShape | Promise<DBShape>): Promise<DBShape> {
  const current = await readDB();
  const next = await updater(structuredClone(current));
  await writeDB(next);
  return next;
}

export async function resetDB(): Promise<DBShape> {
  cache = null;
  try {
    await fs.unlink(DB_PATH);
  } catch {
    /* ignore */
  }
  return readDB();
}

export function genId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}-${time}${rand}`;
}
