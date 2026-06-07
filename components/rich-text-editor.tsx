"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  invalid?: boolean;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Co dziś czujesz? Co się wydarzyło?",
  invalid = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // wymagane w App Routerze (SSR) — inaczej błąd hydratacji
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none prose-headings:font-heading min-h-48 px-3 py-2 focus:outline-none",
        "aria-label": "Treść wpisu",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor?.isActive("bold") ?? false,
      isItalic: editor?.isActive("italic") ?? false,
      isStrike: editor?.isActive("strike") ?? false,
      isUnderline: editor?.isActive("underline") ?? false,
      isH1: editor?.isActive("heading", { level: 1 }) ?? false,
      isH2: editor?.isActive("heading", { level: 2 }) ?? false,
      isH3: editor?.isActive("heading", { level: 3 }) ?? false,
      isBullet: editor?.isActive("bulletList") ?? false,
      isOrdered: editor?.isActive("orderedList") ?? false,
      isTask: editor?.isActive("taskList") ?? false,
      isQuote: editor?.isActive("blockquote") ?? false,
      isCode: editor?.isActive("codeBlock") ?? false,
      canUndo: editor?.can().undo() ?? false,
      canRedo: editor?.can().redo() ?? false,
    }),
  });

  const disabled = !editor;

  return (
    <div
      style={{ borderWidth: "1px" }}
      className={cn(
        "overflow-hidden rounded-lg border border-input bg-card transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        invalid && "border-destructive ring-3 ring-destructive/20"
      )}
    >
      <div
        style={{ borderBottomWidth: "1px" }}
        className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1.5"
      >
        <ToolbarButton
          label="Pogrubienie"
          active={state?.isBold}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          label="Kursywa"
          active={state?.isItalic}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          label="Podkreślenie"
          active={state?.isUnderline}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Przekreślenie"
          active={state?.isStrike}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          label="Nagłówek 1"
          active={state?.isH1}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 />
        </ToolbarButton>
        <ToolbarButton
          label="Nagłówek 2"
          active={state?.isH2}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 />
        </ToolbarButton>
        <ToolbarButton
          label="Nagłówek 3"
          active={state?.isH3}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          label="Lista punktowana"
          active={state?.isBullet}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          label="Lista numerowana"
          active={state?.isOrdered}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolbarButton>
        <ToolbarButton
          label="Lista zadań"
          active={state?.isTask}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
        >
          <ListChecks />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          label="Cytat"
          active={state?.isQuote}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote />
        </ToolbarButton>
        <ToolbarButton
          label="Blok kodu"
          active={state?.isCode}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          <Code />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          label="Cofnij"
          disabled={disabled || !state?.canUndo}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton
          label="Ponów"
          disabled={disabled || !state?.canRedo}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarSeparator() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border" />;
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
        active && "bg-background text-primary shadow-sm"
      )}
    >
      {children}
    </button>
  );
}
