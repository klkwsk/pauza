"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SendIcon, SparkleIcon } from "@/components/icons";
import { AiChatSheet, type ChatMessage } from "@/components/ai-chat-sheet";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Pasek rozmowy z agentem „Freud".
// Tryb wynika z `selectedDate`: dzień → rozmowa trwała (z bazy), brak → rozmowa ogólna (ulotna).
export function AiChatBar({
  selectedDate,
  className,
}: {
  selectedDate: string | null;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Osobne wątki: dzienny (przeładowywany przy zmianie dnia) i ogólny (ulotny).
  const [dayMessages, setDayMessages] = useState<ChatMessage[]>([]);
  const [generalMessages, setGeneralMessages] = useState<ChatMessage[]>([]);

  const messages = selectedDate ? dayMessages : generalMessages;
  const setMessages = selectedDate ? setDayMessages : setGeneralMessages;

  // Wczytanie historii rozmowy dla wybranego dnia (z Supabase, RLS = tylko swoje).
  useEffect(() => {
    if (!selectedDate) return;
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("date", selectedDate)
        .order("created_at", { ascending: true });
      if (!active) return;
      setDayMessages(
        (data ?? []).map((m, i) => ({
          id: `${selectedDate}-${i}`,
          role: m.role === "assistant" ? "agent" : "user",
          text: m.content,
        })),
      );
    })();
    return () => {
      active = false;
    };
  }, [selectedDate]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      setSending(true);

      const agentId = crypto.randomUUID();
      // Historia (bez nowej wiadomości) do wysłania na serwer.
      const history = messages
        .filter((m) => !m.pending)
        .map((m) => ({
          role: m.role === "agent" ? ("assistant" as const) : ("user" as const),
          content: m.text,
        }));

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", text: trimmed },
        { id: agentId, role: "agent", text: "piszę…", pending: true },
      ]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, date: selectedDate, history }),
        });
        const data = await res.json();
        const text = res.ok
          ? data.reply
          : data.error ?? "Coś poszło nie tak. Spróbuj ponownie.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentId ? { ...m, text, pending: false } : m,
          ),
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentId
              ? { ...m, text: "Brak połączenia. Spróbuj ponownie.", pending: false }
              : m,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [messages, sending, selectedDate, setMessages],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    sendMessage(text);
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
          placeholder={selectedDate ? "Zapytaj Freuda o ten dzień…" : "Co dzisiaj czujesz?"}
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
        onSend={sendMessage}
      />
    </>
  );
}
