import { cn } from "@/lib/utils";

// Renderuje zapisany HTML wpisu (z edytora Tiptap). Treść pochodzi wyłącznie
// od lokalnej użytkowniczki i nie opuszcza przeglądarki (MVP bez backendu).
export function RichTextContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn("prose prose-sm max-w-none prose-headings:font-heading", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
