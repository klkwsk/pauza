import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { Entry } from "@/lib/types";
import { formatDate, getExcerpt } from "@/lib/format";
import { MoodFace } from "@/components/mood-faces";

export function EntryCard({ entry }: { entry: Entry }) {
  const excerpt = getExcerpt(entry.content);
  const hasTitle = entry.title.trim().length > 0;
  const heading = hasTitle ? entry.title : excerpt || "Bez tytułu";

  return (
    <Link
      href={`/entry/${entry.id}/edit`}
      className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="transition-colors hover:bg-muted/40">
        <div className="flex items-start gap-3 px-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
            <h2 className="truncate font-heading text-base font-medium">{heading}</h2>
            {hasTitle && excerpt && (
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                {excerpt}
              </p>
            )}
          </div>
          {entry.mood && (
            <MoodFace mood={entry.mood} className="size-7 shrink-0 text-primary" />
          )}
        </div>
      </Card>
    </Link>
  );
}
