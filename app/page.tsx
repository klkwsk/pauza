"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EntryCard } from "@/components/entry-card";
import { WeekCalendar } from "@/components/week-calendar";
import { AiChatBar } from "@/components/ai-chat-bar";
import { PencilIcon } from "@/components/icons";
import { useEntries } from "@/hooks/use-entries";
import { useProfile } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const { entries, loading } = useEntries();
  const { name, loading: profileLoading } = useProfile();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function handleDateSelect(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const visibleEntries = selectedDate
    ? entries.filter((e) => e.date === selectedDate)
    : entries;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <h1 className="font-heading text-[40px] font-semibold tracking-tight">
          {profileLoading ? "Cześć" : `Cześć ${name}`}
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          aria-label="Wyloguj"
          className="mt-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <WeekCalendar
        entries={entries}
        selectedDate={selectedDate}
        onSelect={handleDateSelect}
      />

      <AiChatBar selectedDate={selectedDate} />

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
