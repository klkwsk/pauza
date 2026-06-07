"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MoodChart } from "@/components/mood-chart";
import { EventStats } from "@/components/event-stats";
import { useEntries } from "@/hooks/use-entries";

export default function StatsPage() {
  const { entries, loading } = useEntries();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-8 pb-28 sm:pt-12 lg:max-w-6xl">
      <header>
        <h1 className="font-heading text-[50px] font-medium tracking-tight uppercase">
          Podsumowanie
        </h1>
      </header>

      {/* Bento grid — kolejne sekcje dojdą obok/poniżej */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardContent>
            {loading ? (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                Ładowanie…
              </div>
            ) : (
              <MoodChart entries={entries} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent>
            {loading ? (
              <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
                Ładowanie…
              </div>
            ) : (
              <EventStats entries={entries} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
