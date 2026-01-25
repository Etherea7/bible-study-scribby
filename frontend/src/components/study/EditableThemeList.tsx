/**
 * EditableThemeList - Display and edit key themes
 *
 * Features:
 * - Display themes as editable badges
 * - Click to edit, X to remove
 * - Add Theme button with inline input
 */

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { X, Plus } from 'lucide-react';

interface EditableThemeListProps {
  themes: string[];
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: (theme: string) => void;
  compact?: boolean; // Smaller layout for side panels
}

export function EditableThemeList({
  themes,
  onUpdate,
  onRemove,
  onAdd,
  compact = false,
}: EditableThemeListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTheme, setNewTheme] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  // Focus input when adding starts
  useEffect(() => {
    if (isAdding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAdding]);

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(themes[index]);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      onUpdate(editingIndex, editValue.trim());
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newTheme.trim()) {
        onAdd(newTheme.trim());
        setNewTheme('');
        // Keep adding mode open for multiple additions
      }
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTheme('');
    }
  };

  const inputClasses = compact
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm';

  const badgeClasses = compact
    ? 'text-xs px-2 py-0.5'
    : '';

  return (
    <div className={clsx('flex flex-wrap', compact ? 'gap-1.5' : 'gap-2')}>
      {themes.map((theme, index) => (
        <div key={index}>
          {editingIndex === index ? (
            <input
              ref={editInputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={handleEditKeyDown}
              className={clsx(
                inputClasses,
                `bg-[var(--bg-elevated)]
                border border-[var(--color-interpretation)]
                rounded-full
                focus:outline-none focus:ring-2 focus:ring-[var(--color-interpretation)]/30`
              )}
            />
          ) : (
            <span
              className={clsx(
                'theme-badge group cursor-pointer',
                'hover:bg-[var(--color-interpretation)]/20',
                'flex items-center gap-1',
                badgeClasses
              )}
              onClick={() => startEditing(index)}
            >
              {theme}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                aria-label={`Remove ${theme}`}
              >
                <X className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
              </button>
            </span>
          )}
        </div>
      ))}

      {/* Add Theme Button/Input */}
      {isAdding ? (
        <input
          ref={addInputRef}
          type="text"
          value={newTheme}
          onChange={(e) => setNewTheme(e.target.value)}
          onBlur={() => {
            if (newTheme.trim()) {
              onAdd(newTheme.trim());
            }
            setIsAdding(false);
            setNewTheme('');
          }}
          onKeyDown={handleAddKeyDown}
          placeholder="New theme..."
          className={clsx(
            inputClasses,
            `bg-[var(--bg-elevated)]
            border border-dashed border-[var(--border-color)]
            rounded-full
            focus:outline-none focus:ring-2 focus:ring-[var(--color-interpretation)]/30
            focus:border-[var(--color-interpretation)]`
          )}
        />
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className={clsx(
            inputClasses,
            `border border-dashed border-[var(--border-color)]
            rounded-full
            text-[var(--text-muted)]
            hover:border-[var(--color-interpretation)]
            hover:text-[var(--color-interpretation)]
            transition-colors
            flex items-center gap-1`
          )}
        >
          <Plus className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
          {compact ? 'Add' : 'Add Theme'}
        </button>
      )}
    </div>
  );
}
