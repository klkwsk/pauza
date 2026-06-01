"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { EntryCard } from "@/components/entry-card";
import { WeekCalendar } from "@/components/week-calendar";
import { PencilIcon } from "@/components/icons";
import { useEntries } from "@/hooks/use-entries";
import { useProfile } from "@/hooks/use-profile";

export default function HomePage() {
  const router = useRouter();
  const { entries, loading } = useEntries();
  const { name, loading: profileLoading } = useProfile();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Pierwsze wejście (brak imienia) → onboarding.
  useEffect(() => {
    if (!profileLoading && !name) router.replace("/welcome");
  }, [profileLoading, name, router]);

  function handleDateSelect(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  const visibleEntries = selectedDate
    ? entries.filter((e) => e.date === selectedDate)
    : entries;

  // Dopóki nie wiemy, czy imię jest podane, nie pokazuj nic (uniknij mignięcia).
  if (profileLoading || !name) return null;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-[40px] font-semibold tracking-tight">
          Cześć {name}
        </h1>
      </header>

      <WeekCalendar
        entries={entries}
        selectedDate={selectedDate}
        onSelect={handleDateSelect}
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
