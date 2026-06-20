import { NextResponse } from "next/server";

import { authenticate } from "@/lib/api/auth";
import { askExpert } from "@/lib/api/expert-service";

export const runtime = "nodejs";
export const maxDuration = 60;

// ── POST /api/v1/expert — pytanie do Eksperta ────────────────────────────────
// Body: { message: string, date?: "yyyy-MM-dd" }. Bez 'date' → tryb "wszystkie".
export async function POST(request: Request) {
  const result = await authenticate(request);
  if (!result.ok) return result.response;

  let body: { message?: string; date?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe żądanie (oczekiwano JSON)." }, { status: 400 });
  }

  const res = await askExpert(result.user.userId, body.message ?? "", body.date ?? null);
  if (res.ok) return NextResponse.json({ reply: res.reply });

  const status =
    res.code === "validation" ? 400 : res.code === "rate_limit" ? 429 : res.code === "model" ? 502 : 500;
  return NextResponse.json({ error: res.error }, { status });
}
