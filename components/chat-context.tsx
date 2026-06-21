"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { useExpertChat } from "@/hooks/use-expert-chat";
import { AiChatSheet, type ChatMessage } from "@/components/ai-chat-sheet";
import { DeskChatDock } from "@/components/desk-chat-dock";

// Globalny stan rozmowy z Ekspertem. Wyniesiony ponad strony i pasek boczny,
// bo trigger („Porozmawiaj") żyje w pasku bocznym, a wybrany dzień — na stronie głównej.
type ChatContextValue = {
  selectedDate: string | null;
  setSelectedDate: Dispatch<SetStateAction<string | null>>;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  sending: boolean;
  openChat: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat musi być użyte wewnątrz <ChatProvider>");
  return ctx;
}

export function ChatProvider({
  children,
  // Desktopowy dok pokazujemy tylko tam, gdzie jest reszta chrome (nie na logowaniu
  // ani w formularzu wpisu). Mobilny arkusz i tak nie ma jak się otworzyć bez triggera.
  showDock = true,
}: {
  children: React.ReactNode;
  showDock?: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // `open` steruje wyłącznie mobilnym arkuszem (< lg).
  const [open, setOpen] = useState(false);
  // Sygnał dla desktopowego doka — bumpowany przy „Porozmawiaj"; rozwija historię
  // i przejmuje focus na polu. Dok jest zawsze widoczny, więc nie ma stanu „otwarty".
  const [expandSignal, setExpandSignal] = useState(0);
  const { messages, sendMessage, sending } = useExpertChat(selectedDate);

  return (
    <ChatContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        messages,
        sendMessage,
        sending,
        openChat: () => {
          setOpen(true);
          setExpandSignal((s) => s + 1);
        },
      }}
    >
      {children}
      <AiChatSheet
        open={open}
        onOpenChange={setOpen}
        messages={messages}
        onSend={sendMessage}
      />
      {showDock && (
        <DeskChatDock
          messages={messages}
          onSend={sendMessage}
          expandSignal={expandSignal}
        />
      )}
    </ChatContext.Provider>
  );
}
