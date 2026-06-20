// Dołącza zdjęcia z lokalnego folderu do wpisów demo z ostatnich 30 dni.
// Wgrywa pliki do Supabase Storage (bucket entry-photos, ścieżka {user_id}/{uuid}.{ext})
// i ustawia entries.photo_path. Mapowanie 1:1 po dacie: najstarsze zdjęcie → najstarszy wpis.
//
// Uruchomienie (z katalogu pauza/):
//   node --env-file=.env.local scripts/attach-photos.mjs
//
// Idempotentny w sensie "tylko wpisy bez zdjęcia": pomija wpisy, które już mają photo_path.

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const PHOTO_DIR =
  process.env.PHOTO_DIR ??
  "/Users/katssuperphone/Documents/PROJEKTY/Week-1/seed-photos";
const BUCKET = "entry-photos";
const USER = process.env.DEMO_USER_ID ?? "c3e97813-7c67-414b-8b2b-1116ff65f888";
const DAYS = Number(process.env.PHOTO_DAYS ?? 30);
const TODAY = process.env.PHOTO_TODAY ?? "2026-06-15";

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SK = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!BASE || !SK) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SECRET_KEY.");
  process.exit(1);
}
const H = { apikey: SK, Authorization: `Bearer ${SK}` };

const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
};

async function main() {
  // 1. Bucket istnieje?
  const b = await fetch(`${BASE}/storage/v1/bucket/${BUCKET}`, { headers: H });
  if (!b.ok) {
    console.error(`Bucket '${BUCKET}' niedostępny (${b.status}): ${await b.text()}`);
    process.exit(1);
  }

  // 2. Lokalne zdjęcia (sortowane po nazwie → chronologicznie wg zrzutu).
  const files = fs
    .readdirSync(PHOTO_DIR)
    .filter((f) => MIME[path.extname(f).toLowerCase()])
    .sort();
  if (files.length === 0) {
    console.error(`Brak obrazów w ${PHOTO_DIR}.`);
    process.exit(1);
  }

  // 3. Wpisy demo z ostatnich DAYS dni, bez zdjęcia, rosnąco wg daty.
  const from = new Date(`${TODAY}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - DAYS);
  const fromStr = from.toISOString().slice(0, 10);
  const url =
    `${BASE}/rest/v1/entries?user_id=eq.${USER}` +
    `&date=gte.${fromStr}&date=lte.${TODAY}&photo_path=is.null` +
    `&select=id,date,title&order=date.asc,created_at.asc`;
  const r = await fetch(url, { headers: H });
  if (!r.ok) {
    console.error(`Błąd pobrania wpisów (${r.status}): ${await r.text()}`);
    process.exit(1);
  }
  const entries = await r.json();
  if (entries.length === 0) {
    console.log("Brak wpisów bez zdjęcia w oknie — nic do zrobienia.");
    return;
  }

  const n = Math.min(files.length, entries.length);
  console.log(`Zdjęć: ${files.length}, wpisów (bez foto): ${entries.length}. Dopinam ${n}.`);

  for (let i = 0; i < n; i++) {
    const file = files[i];
    const entry = entries[i];
    const ext = path.extname(file).toLowerCase();
    const buf = fs.readFileSync(path.join(PHOTO_DIR, file));
    const objectPath = `${USER}/${randomUUID()}${ext}`;

    // Upload do Storage (x-upsert: true — bezpieczne przy ponownym uruchomieniu).
    const up = await fetch(`${BASE}/storage/v1/object/${BUCKET}/${objectPath}`, {
      method: "POST",
      headers: { ...H, "Content-Type": MIME[ext], "x-upsert": "true" },
      body: buf,
    });
    if (!up.ok) {
      console.error(`Upload '${file}' nieudany (${up.status}): ${await up.text()}`);
      process.exit(1);
    }

    // Ustaw photo_path na wpisie.
    const patch = await fetch(`${BASE}/rest/v1/entries?id=eq.${entry.id}`, {
      method: "PATCH",
      headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ photo_path: objectPath }),
    });
    if (!patch.ok) {
      console.error(`PATCH wpisu ${entry.id} nieudany (${patch.status}): ${await patch.text()}`);
      process.exit(1);
    }

    console.log(`✓ ${entry.date}  "${entry.title || "(bez tytułu)"}"  ←  ${file}`);
  }

  console.log(`Gotowe. Dopięto ${n} zdjęć.`);
}

main().catch((e) => {
  console.error("Błąd krytyczny:", e);
  process.exit(1);
});
