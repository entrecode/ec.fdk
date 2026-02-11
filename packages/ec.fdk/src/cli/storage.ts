import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { StorageAdapter } from "../types";

const DIR = join(homedir(), ".ec-fdk");
const FILE = join(DIR, "auth.json");

function readStore(): Record<string, string> {
  try {
    if (!existsSync(FILE)) return {};
    return JSON.parse(readFileSync(FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, string>): void {
  if (!existsSync(DIR)) {
    mkdirSync(DIR, { recursive: true, mode: 0o700 });
  }
  writeFileSync(FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

export const fileStorageAdapter: StorageAdapter = {
  get(key: string) {
    return readStore()[key];
  },
  set(key: string, token: string) {
    const data = readStore();
    data[key] = token;
    writeStore(data);
  },
  remove(key: string) {
    const data = readStore();
    delete data[key];
    writeStore(data);
  },
};
