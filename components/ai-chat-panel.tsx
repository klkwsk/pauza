"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { SendIcon, SparkleIcon } from "@/components/icons";
import type { ChatMessage } from "@/components/ai-chat-sheet";
import { cn } from "@/lib/utils";

// Inline'owy panel rozmowy z „Ekspertem" (CBT) — wariant desktopowy.
// Pokazywany pod treścią wpisu lub na środku pustego ekranu.
// Logikę wiadomości dostarcza useExpertChat (przez propsy), tak jak w wariancie mobilnym.
export function AiChatPanel({
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Przewijaj do najnowszej wiadomości po każdej zmianie listy.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  }

  const canSend = value.trim().length > 0 && !sending;
  const hasMessages = messages.length > 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <SparkleIcon className="size-5 shrink-0 text-primary" />
        <h2 className="font-heading text-base font-medium">Rozmowa z Ekspertem</h2>
      </div>

      {hasMessages && (
        <div
          ref={scrollRef}
          className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1"
        >
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
      >
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={
            selectedDate ? "Zapytaj Eksperta o ten dzień…" : "Co dzisiaj czujesz?"
          }
          aria-label="Zapytaj agenta AI"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
        <Button type="submit" size="icon-sm" disabled={!canSend} aria-label="Wyślij">
          <SendIcon className="size-4" />
        </Button>
      </form>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-base md:text-sm",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted text-foreground",
          message.pending && "text-muted-foreground italic",
        )}
      >
        {message.text}
      </div>
    </div>
  );
}
