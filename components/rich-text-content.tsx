import DOMPurify from "isomorphic-dompurify";

import { cn } from "@/lib/utils";

// Renderuje zapisany HTML wpisu (z edytora Tiptap). HTML jest przepuszczany przez
// DOMPurify przed wstawieniem — nawet gdyby do bazy trafiła spreparowana treść
// (innym kanałem niż edytor), nie wykona się żaden skrypt/handler (ochrona przed XSS).
export function RichTextContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  return (
    <div
      className={cn("prose prose-sm max-w-none prose-headings:font-heading", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
