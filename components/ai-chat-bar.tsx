"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SendIcon, SparkleIcon } from "@/components/icons";
import { AiChatSheet, type ChatMessage } from "@/components/ai-chat-sheet";
import { cn } from "@/lib/utils";

// Pasek rozmowy z agentem „Ekspert" (CBT) (wariant mobilny: pasek + wysuwany sheet).
// Stan rozmowy pochodzi z useExpertChat na stronie (współdzielony z panelem desktopowym).
export function AiChatBar({
  selectedDate,
  messages,
  onSend,
  sending,
  className,
}: {
  selectedDate: string | null;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  sending: boolean;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
    setOpen(true);
  }

  const canSend = value.trim().length > 0 && !sending;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center gap-2 rounded-2xl border border-input bg-card px-3 py-2 shadow-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          className,
        )}
      >
        <SparkleIcon className="size-5 shrink-0 text-primary" />
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={selectedDate ? "Zapytaj Eksperta o ten dzień…" : "Co dzisiaj czujesz?"}
          aria-label="Zapytaj agenta AI"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
        <Button type="submit" size="icon-sm" disabled={!canSend} aria-label="Wyślij">
          <SendIcon className="size-4" />
        </Button>
      </form>

      <AiChatSheet
        open={open}
        onOpenChange={setOpen}
        messages={messages}
        onSend={onSend}
      />
    </>
  );
}
