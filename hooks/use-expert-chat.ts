"use client";

import { useCallback, useEffect, useState } from "react";

import type { ChatMessage } from "@/components/ai-chat-sheet";
import { createClient } from "@/lib/supabase/client";

// Wspólna logika rozmowy z agentem „Ekspert" (CBT).
// Tryb wynika z `selectedDate`: dzień → rozmowa trwała (z bazy), brak → rozmowa ogólna (ulotna).
// Wykorzystywana przez pływający przycisk czatu (AiChatButton) i warstwę rozmowy (AiChatSheet).
export function useExpertChat(selectedDate: string | null) {
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
    // Wyczyść poprzednią historię, by UI (np. auto-otwieranie czatu) nie reagowało
    // na nieaktualne wiadomości w oknie między zmianą dnia a pobraniem nowych.
    setDayMessages([]);
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
        const reply = res.ok
          ? data.reply
          : data.error ?? "Coś poszło nie tak. Spróbuj ponownie.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentId ? { ...m, text: reply, pending: false } : m,
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

  return { messages, sendMessage, sending };
}
