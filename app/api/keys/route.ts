import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/api/keys";

export const runtime = "nodejs";

// Zarządzanie kluczami API — uwierzytelnianie SESJĄ (cookie), nie kluczem API.
// Operacje idą zwykłym klientem pod RLS, więc user widzi/zmienia tylko swoje klucze.

// GET /api/keys — lista aktywnych kluczy bieżącego użytkownika (bez plaintextu).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nie zalogowano." }, { status: 401 });

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, key_prefix, name, created_at, last_used_at")
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Nie udało się pobrać kluczy." }, { status: 500 });
  }
  return NextResponse.json({ keys: data });
}

// POST /api/keys — wygenerowanie nowego klucza. Plaintext zwracany TYLKO TERAZ.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nie zalogowano." }, { status: 401 });

  let name: string | null = null;
  try {
    const body = (await request.json()) as { name?: string };
    name = body?.name?.trim() || null;
  } catch {
    // body opcjonalne — brak nazwy jest OK
  }

  const { plaintext, hash, prefix } = generateApiKey();
  const { data, error } = await supabase
    .from("api_keys")
    .insert({ user_id: user.id, key_hash: hash, key_prefix: prefix, name })
    .select("id, key_prefix, name, created_at, last_used_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Nie udało się utworzyć klucza." }, { status: 500 });
  }

  // key: pełny klucz — pokazany użytkownikowi jednorazowo.
  return NextResponse.json({ key: plaintext, meta: data }, { status: 201 });
}

// DELETE /api/keys?id=<uuid> — odwołanie klucza (revoked_at = now()).
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nie zalogowano." }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Brak parametru 'id'." }, { status: 400 });

  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id); // RLS dodatkowo zawęża do właściciela

  if (error) {
    return NextResponse.json({ error: "Nie udało się odwołać klucza." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
