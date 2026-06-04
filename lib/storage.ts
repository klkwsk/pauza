import type { Entry, EntryInput, Mood } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

// Wiersz tabeli public.entries (snake_case).
type EntryRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  date: string;
  mood: number | null;
  created_at: string;
  updated_at: string;
};

function rowToEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    date: row.date,
    mood: (row.mood as Mood | null) ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
  return (data as EntryRow[]).map(rowToEntry);
}

export async function getEntry(id: string): Promise<Entry | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToEntry(data as EntryRow) : null;
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
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToEntry(data as EntryRow);
}

export async function updateEntry(
  id: string,
  input: EntryInput,
): Promise<Entry | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("entries")
    .update({
      title: input.title,
      content: input.content,
      date: input.date,
      mood: input.mood,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? rowToEntry(data as EntryRow) : null;
}

export async function deleteEntry(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}
