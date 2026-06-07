import type { Entry, EntryInput, Mood } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const PHOTO_BUCKET = "entry-photos";
const SIGNED_URL_TTL = 60 * 60; // 1h — lista i tak generuje świeże URL-e przy każdym odczycie

// Wiersz tabeli public.entries (snake_case).
type EntryRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  date: string;
  mood: number | null;
  event_types: string[] | null;
  event_note: string | null;
  event_favorite: boolean | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
};

function rowToEntry(row: EntryRow, photoUrl: string | null = null): Entry {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    date: row.date,
    mood: (row.mood as Mood | null) ?? null,
    eventTypes: row.event_types ?? [],
    eventNote: row.event_note ?? "",
    eventFavorite: row.event_favorite ?? false,
    photoPath: row.photo_path ?? null,
    photoUrl,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type SupabaseClient = ReturnType<typeof createClient>;

// Podpisany URL do pojedynczego zdjęcia (lub null gdy brak/błąd).
async function signPhoto(
  supabase: SupabaseClient,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

export async function getEntries(): Promise<Entry[]> {
  const supabase = createClient();
  // RLS ogranicza do właściciela; sortowanie: najnowsze na górze.
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data as EntryRow[];
  // Batchowe podpisywanie URL-i dla wszystkich zdjęć naraz.
  const paths = rows.map((r) => r.photo_path).filter((p): p is string => !!p);
  const urlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl);
    }
  }
  return rows.map((row) =>
    rowToEntry(row, row.photo_path ? urlByPath.get(row.photo_path) ?? null : null),
  );
}

export async function getEntry(id: string): Promise<Entry | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as EntryRow;
  return rowToEntry(row, await signPhoto(supabase, row.photo_path));
}

// Wgrywa zdjęcie do bucketu pod folderem usera ({user_id}/{uuid}.{ext}) i zwraca jego ścieżkę.
export async function uploadEntryPhoto(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak zalogowanego użytkownika.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

// Usuwa plik zdjęcia z bucketu (best-effort — błędy ignorowane).
async function removePhoto(
  supabase: SupabaseClient,
  path: string | null,
): Promise<void> {
  if (!path) return;
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}

export async function createEntry(input: EntryInput): Promise<Entry> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak zalogowanego użytkownika.");

  const { data, error } = await supabase
    .from("entries")
    .insert({
      user_id: user.id,
      title: input.title,
      content: input.content,
      date: input.date,
      mood: input.mood,
      event_types: input.eventTypes,
      event_note: input.eventNote,
      event_favorite: input.eventFavorite,
      photo_path: input.photoPath,
    })
    .select("*")
    .single();
  if (error) throw error;
  const row = data as EntryRow;
  return rowToEntry(row, await signPhoto(supabase, row.photo_path));
}

export async function updateEntry(
  id: string,
  input: EntryInput,
): Promise<Entry | null> {
  const supabase = createClient();

  // Sprzątanie poprzedniego pliku, gdy zdjęcie zmieniono lub usunięto.
  const { data: prev } = await supabase
    .from("entries")
    .select("photo_path")
    .eq("id", id)
    .maybeSingle();
  const prevPath = (prev as { photo_path: string | null } | null)?.photo_path ?? null;

  const { data, error } = await supabase
    .from("entries")
    .update({
      title: input.title,
      content: input.content,
      date: input.date,
      mood: input.mood,
      event_types: input.eventTypes,
      event_note: input.eventNote,
      event_favorite: input.eventFavorite,
      photo_path: input.photoPath,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as EntryRow;
  if (prevPath && prevPath !== row.photo_path) {
    await removePhoto(supabase, prevPath);
  }
  return rowToEntry(row, await signPhoto(supabase, row.photo_path));
}

export async function deleteEntry(id: string): Promise<void> {
  const supabase = createClient();
  // Pobierz ścieżkę zdjęcia przed usunięciem wiersza, by posprzątać plik.
  const { data: prev } = await supabase
    .from("entries")
    .select("photo_path")
    .eq("id", id)
    .maybeSingle();
  const prevPath = (prev as { photo_path: string | null } | null)?.photo_path ?? null;

  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
  await removePhoto(supabase, prevPath);
}
