import DOMPurify from "isomorphic-dompurify";

import { markdownToHtml } from "@/lib/markdown";
import { cn } from "@/lib/utils";

// Renderuje odpowiedź Eksperta zapisaną w Markdownie (nagłówki, listy, pogrubienia).
// Markdown zamieniamy na HTML, a następnie czyścimy DOMPurify przed wstawieniem —
// ta sama warstwa ochrony co w <RichTextContent> (zabezpieczenie przed XSS).
export function ChatMarkdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const clean = DOMPurify.sanitize(markdownToHtml(text), {
    USE_PROFILES: { html: true },
  });
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none prose-headings:font-heading [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
