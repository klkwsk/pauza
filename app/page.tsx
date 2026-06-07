"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntryCard } from "@/components/entry-card";
import { EntryFilter } from "@/components/entry-filter";
import { WeekCalendar } from "@/components/week-calendar";
import { AiChatButton } from "@/components/ai-chat-button";
import { PencilIcon } from "@/components/icons";
import { useChat } from "@/components/chat-context";
import { useEntries } from "@/hooks/use-entries";
import { useProfile } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const { entries, loading } = useEntries();
  const { name, loading: profileLoading } = useProfile();
  // Wybrany dzień (i czat) trzyma globalny ChatProvider — trigger żyje w pasku bocznym.
  const { selectedDate, setSelectedDate } = useChat();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  function handleDateSelect(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  // Wpisy zawężone tylko wybranym dniem (bez filtrów kategorii) — baza dla liczników.
  const dateScopedEntries = useMemo(
    () => entries.filter((e) => !selectedDate || e.date === selectedDate),
    [entries, selectedDate],
  );

  // Licznik wpisów per typ zdarzenia przy aktualnym układzie (wybranym dniu).
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of dateScopedEntries) {
      for (const t of e.eventTypes) {
        counts[t] = (counts[t] ?? 0) + 1;
      }
    }
    return counts;
  }, [dateScopedEntries]);

  const visibleEntries = useMemo(
    () =>
      dateScopedEntries.filter((e) => {
        // Logika LUB: wpis pasuje, jeśli ma choć jeden z wybranych typów.
        if (
          activeFilters.length > 0 &&
          !e.eventTypes.some((t) => activeFilters.includes(t))
        )
          return false;
        return true;
      }),
    [dateScopedEntries, activeFilters],
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-8 pb-40 sm:pt-12 lg:max-w-6xl lg:pb-28">
      <header className="flex items-start justify-between gap-3">
        <h1 className="font-heading text-[50px] font-medium leading-none tracking-tight uppercase">
          {profileLoading ? "Cześć" : `Cześć ${name}`}
        </h1>
        {/* Hamburger tylko na mobile — na desktopie nawigację przejmuje pasek boczny */}
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="mt-2"
                  aria-label="Menu"
                />
              }
            >
              <MenuIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => router.push("/docs")}>
                Dokumentacja
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Wyloguj się
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mt-6">
        <WeekCalendar
          entries={entries}
          selectedDate={selectedDate}
          onSelect={handleDateSelect}
        />
      </div>

      {/* ── Widok mobilny: lista wpisów (czat jest pływający, renderowany niżej) ── */}
      <div className="mt-6 flex flex-col gap-6 lg:hidden">
        <div className="rounded-xl border bg-card p-4">
          <EntryFilter
            value={activeFilters}
            onChange={setActiveFilters}
            counts={filterCounts}
          />
        </div>

        {loading ? (
          <ListSkeleton />
        ) : visibleEntries.length === 0 && activeFilters.length > 0 ? (
          <EmptyFilterState />
        ) : visibleEntries.length === 0 && selectedDate ? (
          <EmptyDateState />
        ) : visibleEntries.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-4">
            {visibleEntries.map((entry) => (
              <li key={entry.id}>
                <EntryCard entry={entry} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Widok desktopowy: grid wpisów (czat jest pływający, renderowany niżej) ── */}
      <div className="mt-8 hidden lg:block">
        <div className="rounded-xl border bg-card p-4">
          <EntryFilter
            value={activeFilters}
            onChange={setActiveFilters}
            counts={filterCounts}
          />
        </div>

        <div className="mt-6">
          {loading ? (
            <GridSkeleton />
          ) : visibleEntries.length === 0 && activeFilters.length > 0 ? (
            <EmptyFilterState />
          ) : visibleEntries.length === 0 && selectedDate ? (
            <EmptyDateState />
          ) : visibleEntries.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="columns-3 gap-6 [&>li]:mb-6 [&>li]:break-inside-avoid">
              {visibleEntries.map((entry) => (
                <li key={entry.id}>
                  <EntryCard entry={entry} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Pływający przycisk czatu — tylko mobile; na desktopie jest w pasku bocznym */}
      <AiChatButton />
    </div>
  );
}

function EmptyDateState() {
  return (
    <Card className="items-center gap-2 px-6 py-14 text-center">
      <p className="text-base font-semibold">Brak wpisów tego dnia.</p>
      <PencilIcon className="mt-2 size-20 text-primary" />
    </Card>
  );
}

function EmptyFilterState() {
  return (
    <Card className="items-center gap-2 px-6 py-14 text-center">
      <p className="text-base font-semibold">
        Brak wpisów pasujących do filtrów.
      </p>
      <PencilIcon className="mt-2 size-20 text-primary" />
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="items-center gap-3 px-6 py-14 text-center">
      <p className="text-base font-semibold">Zacznij od pierwszego wpisu.</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Zapisz, co dziś czujesz i co się wydarzyło.
      </p>
      <EmptyStateIllustration />
    </Card>
  );
}

function EmptyStateIllustration() {
  return <PencilIcon className="mt-4 size-24 text-primary" />;
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4" aria-hidden>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
