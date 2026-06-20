import { NextResponse } from "next/server";

import { authenticate } from "@/lib/api/auth";
import {
  createEntryForUser,
  getEntriesByDate,
  todayWarsaw,
  type CreateEntryInput,
} from "@/lib/api/entries-service";

export const runtime = "nodejs";

// ── POST /api/v1/entries — dodanie wpisu na dany dzień ───────────────────────
export async function POST(request: Request) {
  const result = await authenticate(request);
  if (!result.ok) return result.response;

  let body: CreateEntryInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe żądanie (oczekiwano JSON)." }, { status: 400 });
  }

  const res = await createEntryForUser(result.user.userId, body);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.code === "validation" ? 400 : 500 });
  }
  return NextResponse.json({ entry: res.data }, { status: 201 });
}

// ── GET /api/v1/entries?date=yyyy-MM-dd — wpisy z danego dnia ─────────────────
export async function GET(request: Request) {
  const result = await authenticate(request);
  if (!result.ok) return result.response;

  const date = new URL(request.url).searchParams.get("date") ?? todayWarsaw();

  const res = await getEntriesByDate(result.user.userId, date);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.code === "validation" ? 400 : 500 });
  }
  return NextResponse.json(res.data);
}
