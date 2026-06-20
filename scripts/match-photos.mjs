// Dopasowuje zdjęcia do wpisów TEMATYCZNIE (jawne mapowanie plik → wpis), w oknie 100 dni.
// Najpierw czyści wcześniejsze przypięcia w tym oknie (kasuje obiekty w Storage + photo_path=null),
// potem wgrywa pliki na nowo do właściwych wpisów.
//
// Uruchomienie (z katalogu pauza/):
//   node --env-file=.env.local scripts/match-photos.mjs

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const PHOTO_DIR =
  process.env.PHOTO_DIR ??
  "/Users/katssuperphone/Documents/PROJEKTY/Week-1/seed-photos";
const BUCKET = "entry-photos";
const USER = process.env.DEMO_USER_ID ?? "c3e97813-7c67-414b-8b2b-1116ff65f888";
const TODAY = process.env.PHOTO_TODAY ?? "2026-06-15";
const WINDOW_DAYS = 100;

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SK = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!BASE || !SK) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SECRET_KEY.");
  process.exit(1);
}
const H = { apikey: SK, Authorization: `Bearer ${SK}` };
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

// Jawne mapowanie tematyczne: plik → id wpisu (dobrane z treści wpisów).
const MAPPING = [
  { file: "Zrzut ekranu 2026-06-7 o 20.12.34.png", entryId: "74c6df0c-a5a2-41d6-a2bd-c322bdedf290", why: "ramen → khao soi (gotowanie)" },
  { file: "Zrzut ekranu 2026-06-7 o 19.58.25.png", entryId: "b2748e93-6c2c-4e5b-8adb-3a57518bad53", why: "tęcza nad wodą → staw w Łazienkach" },
  { file: "Zrzut ekranu 2026-06-7 o 19.57.27.png", entryId: "5ca454b6-1901-4d95-9dda-299ea0f475d6", why: "szampan → wieczór u Marty" },
  { file: "Zrzut ekranu 2026-06-7 o 20.09.17.png", entryId: "1b2bd01d-9531-448a-8125-af9d120e4b59", why: "galeria → MuCEM w Marsylii" },
  { file: "Zrzut ekranu 2026-06-7 o 19.54.49.png", entryId: "3e5abb86-3852-4ccc-8711-5a7f449df00e", why: "jazz → koncert w Reducie" },
  { file: "Zrzut ekranu 2026-06-7 o 19.55.52.png", entryId: "3bf4d0b2-def2-483b-9c8f-480fb24b6e28", why: "corgi → poranek z Kormą" },
  { file: "Zrzut ekranu 2026-06-7 o 20.08.34.png", entryId: "40f98990-83ae-43ae-8c69-2bba630f8901", why: "plakat/design → przełom w designie" },
  { file: "Zrzut ekranu 2026-06-7 o 19.53.16.png", entryId: "d81d2eb2-3114-4e81-a5d4-9803d8733eab", why: "street-style → dobry, pewny dzień" },
];

async function main() {
  // 0. Bucket istnieje?
  const b = await fetch(`${BASE}/storage/v1/bucket/${BUCKET}`, { headers: H });
  if (!b.ok) { console.error(`Bucket '${BUCKET}' niedostępny (${b.status}).`); process.exit(1); }

  // 1. Wyczyść poprzednie przypięcia w oknie 100 dni (kasuj obiekty + photo_path=null).
  const from = new Date(`${TODAY}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - WINDOW_DAYS);
  const fromStr = from.toISOString().slice(0, 10);
  const curUrl =
    `${BASE}/rest/v1/entries?user_id=eq.${USER}` +
    `&date=gte.${fromStr}&date=lte.${TODAY}&photo_path=not.is.null&select=id,photo_path`;
  const cur = await fetch(curUrl, { headers: H });
  if (!cur.ok) { console.error(`Pobranie istniejących zdjęć (${cur.status}): ${await cur.text()}`); process.exit(1); }
  const existing = await cur.json();
  for (const e of existing) {
    await fetch(`${BASE}/storage/v1/object/${BUCKET}/${e.photo_path}`, { method: "DELETE", headers: H });
    await fetch(`${BASE}/rest/v1/entries?id=eq.${e.id}`, {
      method: "PATCH",
      headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ photo_path: null }),
    });
  }
  console.log(`Wyczyszczono ${existing.length} poprzednich przypięć.`);

  // 2. Przypnij na nowo wg mapowania tematycznego.
  for (const m of MAPPING) {
    const ext = path.extname(m.file).toLowerCase();
    const buf = fs.readFileSync(path.join(PHOTO_DIR, m.file));
    const objectPath = `${USER}/${randomUUID()}${ext}`;

    const up = await fetch(`${BASE}/storage/v1/object/${BUCKET}/${objectPath}`, {
      method: "POST",
      headers: { ...H, "Content-Type": MIME[ext], "x-upsert": "true" },
      body: buf,
    });
    if (!up.ok) { console.error(`Upload '${m.file}' (${up.status}): ${await up.text()}`); process.exit(1); }

    const patch = await fetch(`${BASE}/rest/v1/entries?id=eq.${m.entryId}`, {
      method: "PATCH",
      headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ photo_path: objectPath }),
    });
    if (!patch.ok) { console.error(`PATCH ${m.entryId} (${patch.status}): ${await patch.text()}`); process.exit(1); }

    console.log(`✓ ${m.why}`);
  }
  console.log(`Gotowe. Przypięto ${MAPPING.length} zdjęć tematycznie.`);
}

main().catch((e) => { console.error("Błąd krytyczny:", e); process.exit(1); });
