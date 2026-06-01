import type { Entry, EntryInput } from "@/lib/types";

export const STORAGE_KEY = "pauza:entries";
export const PROFILE_KEY = "pauza:profile";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function read(): Entry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Entry[];
  } catch {
    return [];
  }
}

function write(entries: Entry[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// Najnowsze na górze: malejąco po dacie wpisu, a przy remisie po czasie utworzenia.
function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

export function getEntries(): Entry[] {
  return sortEntries(read());
}

export function getEntry(id: string): Entry | null {
  return read().find((e) => e.id === id) ?? null;
}

export function createEntry(input: EntryInput): Entry {
  const now = new Date().toISOString();
  const entry: Entry = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  write([entry, ...read()]);
  return entry;
}

export function updateEntry(id: string, input: EntryInput): Entry | null {
  const entries = read();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const updated: Entry = {
    ...entries[idx],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  entries[idx] = updated;
  write(entries);
  return updated;
}

export function deleteEntry(id: string): void {
  write(read().filter((e) => e.id !== id));
}

// Profil użytkowniczki (na razie tylko imię). Pusty string = nie podano.
export function getName(): string {
  if (!isBrowser()) return "";
  try {
    return window.localStorage.getItem(PROFILE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setName(name: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(PROFILE_KEY, name);
}
