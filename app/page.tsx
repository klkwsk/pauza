"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EntryCard } from "@/components/entry-card";
import { WeekCalendar } from "@/components/week-calendar";
import { AiChatBar } from "@/components/ai-chat-bar";
import { AiChatPanel } from "@/components/ai-chat-panel";
import { EntryForm } from "@/components/entry-form";
import { MoodFace } from "@/components/mood-faces";
import { PencilIcon } from "@/components/icons";
import { useEntries } from "@/hooks/use-entries";
import { useProfile } from "@/hooks/use-profile";
import { useExpertChat } from "@/hooks/use-expert-chat";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getExcerpt } from "@/lib/format";
import type { Entry } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const { entries, loading, refresh } = useEntries();
  const { name, loading: profileLoading } = useProfile();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Stan kolumny głównej na desktopie: który wpis pokazać (null = najnowszy widoczny).
  const [activeId, setActiveId] = useState<string | null>(null);

  // Współdzielony stan rozmowy z Ekspertem (mobilny pasek + desktopowy panel).
  const chat = useExpertChat(selectedDate);

  function handleDateSelect(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
    setActiveId(null);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const visibleEntries = useMemo(
    () =>
      selectedDate ? entries.filter((e) => e.date === selectedDate) : entries,
    [entries, selectedDate],
  );

  // Wpis pokazywany w panelu głównym: wybrany z listy albo najnowszy widoczny.
  // Brak zaznaczenia (activeId === null) → tylko wyśrodkowany czat. To stan domyślny.
  const activeEntry = activeId
    ? visibleEntries.find((e) => e.id === activeId)
    : undefined;

  function handleSelectEntry(id: string) {
    // Ponowne kliknięcie aktywnego wpisu odznacza go.
    setActiveId((prev) => (prev === id ? null : id));
  }

  async function handleSaved(saved: Entry) {
    await refresh();
    setActiveId(saved.id);
  }

  async function handleDeleted() {
    await refresh();
    setActiveId(null);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-8 pb-28 sm:pt-12 lg:max-w-6xl">
      <header className="flex items-start justify-between gap-3">
        <h1 className="font-heading text-[40px] font-semibold tracking-tight">
          {profileLoading ? "Cześć" : `Cześć ${name}`}
        </h1>
        <Button
          type="button"
          variant="secondary"
          onClick={handleSignOut}
          className="mt-2"
        >
          Wyloguj się
        </Button>
      </header>

      <div className="mt-6">
        <WeekCalendar
          entries={entries}
          selectedDate={selectedDate}
          onSelect={handleDateSelect}
        />
      </div>

      {/* ── Widok mobilny (bez zmian): pasek czatu + lista ── */}
      <div className="mt-6 flex flex-col gap-6 lg:hidden">
        <AiChatBar
          selectedDate={selectedDate}
          messages={chat.messages}
          onSend={chat.sendMessage}
          sending={chat.sending}
        />

        {loading ? (
          <ListSkeleton />
        ) : visibleEntries.length === 0 && selectedDate ? (
          <EmptyDateState />
        ) : visibleEntries.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-3">
            {visibleEntries.map((entry) => (
              <li key={entry.id}>
                <EntryCard entry={entry} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Widok desktopowy: lista po lewej, podgląd + czat w panelu głównym ── */}
      <div className="mt-8 hidden gap-8 lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          {loading ? (
            <ListSkeleton />
          ) : visibleEntries.length === 0 ? (
            <p className="px-1 py-4 text-sm text-muted-foreground">
              {selectedDate ? "Brak wpisów tego dnia." : "Brak wpisów."}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visibleEntries.map((entry) => (
                <li key={entry.id}>
                  <EntryListItem
                    entry={entry}
                    active={entry.id === activeEntry?.id}
                    onSelect={() => handleSelectEntry(entry.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex min-w-0 flex-col gap-6">
          {activeEntry ? (
            // Zaznaczony wpis: edytor + czat pod treścią.
            <>
              <EntryForm
                key={activeEntry.id}
                entry={activeEntry}
                onSaved={handleSaved}
                onDeleted={handleDeleted}
              />
              <AiChatPanel
                selectedDate={selectedDate}
                messages={chat.messages}
                onSend={chat.sendMessage}
                sending={chat.sending}
              />
            </>
          ) : (
            // Stan domyślny / nic nie zaznaczone: tylko czat, wyrównany do góry.
            <div className="flex justify-center">
              <AiChatPanel
                className="w-full max-w-xl"
                selectedDate={selectedDate}
                messages={chat.messages}
                onSend={chat.sendMessage}
                sending={chat.sending}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Pozycja listy na desktopie — przyciskowy odpowiednik EntryCard (zaznacza, nie nawiguje).
function EntryListItem({
  entry,
  active,
  onSelect,
}: {
  entry: Entry;
  active: boolean;
  onSelect: () => void;
}) {
  const excerpt = getExcerpt(entry.content);
  const hasTitle = entry.title.trim().length > 0;
  const heading = hasTitle ? entry.title : excerpt || "Bez tytułu";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-muted/40"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
        <span className="block truncate font-heading text-base font-medium">
          {heading}
        </span>
      </div>
      {entry.mood && (
        <MoodFace mood={entry.mood} className="size-6 shrink-0 text-primary" />
      )}
    </button>
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
