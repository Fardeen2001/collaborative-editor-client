"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  editor: Editor | null;
};

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="toolbar-group">{children}</div>;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn("toolbar-btn", active && "toolbar-btn-active")}
    >
      {children}
    </button>
  );
}

const iconProps = { className: "toolbar-icon", strokeWidth: 2 as const };

export function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
      <ToolbarGroup>
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold {...iconProps} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic {...iconProps} />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough {...iconProps} />
        </ToolbarButton>
      </ToolbarGroup>

      <span className="toolbar-divider" aria-hidden />

      <ToolbarGroup>
        <ToolbarButton
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 {...iconProps} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 {...iconProps} />
        </ToolbarButton>
      </ToolbarGroup>

      <span className="toolbar-divider" aria-hidden />

      <ToolbarGroup>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List {...iconProps} />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered {...iconProps} />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote {...iconProps} />
        </ToolbarButton>
      </ToolbarGroup>

      <span className="toolbar-divider" aria-hidden />

      <ToolbarGroup>
        <ToolbarButton
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 {...iconProps} />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 {...iconProps} />
        </ToolbarButton>
      </ToolbarGroup>
    </div>
  );
}
