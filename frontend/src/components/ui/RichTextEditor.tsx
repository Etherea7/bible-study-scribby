/**
 * RichTextEditor - TipTap-based rich text editor with formatting toolbar
 *
 * Features:
 * - Bold, Italic, Underline
 * - Bullet List, Ordered List
 * - Horizontal Rule
 * - Keyboard shortcuts (Ctrl+B/I/U)
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Minus,
} from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your notes...',
  minHeight = '100px',
}: RichTextEditorProps) {
  // Memoize extensions to prevent duplicate registration on re-renders
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: value,
    editorProps: {
      attributes: {
        class: 'rich-text-editor-content prose prose-sm max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const MenuButton = useCallback(
    ({
      isActive,
      onClick,
      title,
      children,
    }: {
      isActive?: boolean;
      onClick: () => void;
      title: string;
      children: React.ReactNode;
    }) => (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`
          p-1.5 rounded
          transition-colors
          ${
            isActive
              ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
          }
        `}
      >
        {children}
      </button>
    ),
    []
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--bg-surface)]">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </MenuButton>
      </div>

      {/* Editor */}
      <div
        className="px-3 py-2"
        style={{ minHeight }}
      >
        <EditorContent
          editor={editor}
          className="text-sm text-[var(--text-primary)]"
        />
        {editor.isEmpty && (
          <p className="text-sm text-[var(--text-muted)] pointer-events-none absolute top-2 left-3 hidden first:block">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Utility function to strip HTML tags from rich text content
 * Use this when sending notes to AI prompts
 */
export function stripHtmlTags(html: string): string {
  // Create a temporary element to parse HTML
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Convert list items to dashes for readability
  doc.querySelectorAll('li').forEach((li) => {
    li.textContent = '- ' + li.textContent;
  });

  // Get text content and clean up whitespace
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
}
