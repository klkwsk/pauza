"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoodPicker } from "@/components/mood-picker";
import { RichTextEditor } from "@/components/rich-text-editor";
import { DeleteEntryDialog } from "@/components/delete-entry-dialog";
import { createEntry, deleteEntry, updateEntry } from "@/lib/storage";
import { formatDate, isContentEmpty, todayISODate } from "@/lib/format";
import type { Entry, Mood } from "@/lib/types";

export function EntryForm({
  entry,
  onSaved,
  onCancel,
  onDeleted,
}: {
  entry?: Entry;
  // Callbacki dla wariantu inline (desktop). Gdy nie podane → nawigacja na „/".
  onSaved?: (saved: Entry) => void;
  onCancel?: () => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(entry);

  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [date, setDate] = useState(entry?.date ?? todayISODate());
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [contentError, setContentError] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isContentEmpty(content)) {
      setContentError(true);
      toast.error("Dodaj treść wpisu.");
      return;
    }
    const input = { title: title.trim(), content, date, mood };
    setSubmitting(true);
    try {
      let saved: Entry;
      if (isEdit && entry) {
        saved = (await updateEntry(entry.id, input)) ?? { ...entry, ...input };
        toast.success("Zapisano zmiany.");
      } else {
        saved = await createEntry(input);
        toast.success("Wpis zapisany.");
      }
      if (onSaved) {
        onSaved(saved);
        setSubmitting(false);
      } else {
        router.push("/");
      }
    } catch {
      setSubmitting(false);
      toast.error("Nie udało się zapisać wpisu.");
    }
  }

  async function handleDelete() {
    if (!entry) return;
    try {
      await deleteEntry(entry.id);
      toast.success("Wpis usunięty.");
      if (onDeleted) onDeleted();
      else router.push("/");
    } catch {
      toast.error("Nie udało się usunąć wpisu.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-xl bg-card p-6 sm:p-8"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Tytuł</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nadaj wpisowi nazwę…"
          className="h-10"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Nastrój</Label>
        <MoodPicker value={mood} onChange={setMood} />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="gap-1">
          Treść<span className="text-primary">*</span>
        </Label>
        <RichTextEditor
          value={content}
          onChange={(html) => {
            setContent(html);
            if (contentError) setContentError(false);
          }}
          invalid={contentError}
        />
        {contentError && (
          <p className="text-sm text-destructive">Treść jest wymagana.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="gap-1">
          Data<span className="text-primary">*</span>
        </Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="h-10 w-56 justify-start bg-card font-normal"
              />
            }
          >
            <CalendarIcon className="text-muted-foreground" />
            {formatDate(date)}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={parseISO(date)}
              defaultMonth={parseISO(date)}
              onSelect={(d) => {
                if (d) {
                  setDate(format(d, "yyyy-MM-dd"));
                  setCalendarOpen(false);
                }
              }}
              locale={pl}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center justify-between gap-3 border-t pt-6">
        <div>{isEdit && <DeleteEntryDialog onConfirm={handleDelete} />}</div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            className="h-10"
            onClick={() => (onCancel ? onCancel() : router.push("/"))}
          >
            Anuluj
          </Button>
          <Button type="submit" className="h-10" disabled={submitting}>
            {submitting ? "Zapisywanie…" : "Zapisz"}
          </Button>
        </div>
      </div>
    </form>
  );
}
