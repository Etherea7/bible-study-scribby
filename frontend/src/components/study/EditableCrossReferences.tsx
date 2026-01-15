/**
 * EditableCrossReferences - Manage cross references
 *
 * Features:
 * - Edit reference and note fields
 * - Delete button
 * - Add Reference button
 */

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import type { EditableCrossReference } from '../../types';

interface EditableCrossReferencesProps {
  references: EditableCrossReference[];
  onUpdate: (id: string, updates: Partial<EditableCrossReference>) => void;
  onRemove: (id: string) => void;
  onAdd: (reference: string, note: string) => void;
}

export function EditableCrossReferences({
  references,
  onUpdate,
  onRemove,
  onAdd,
}: EditableCrossReferencesProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReference, setEditReference] = useState('');
  const [editNote, setEditNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newReference, setNewReference] = useState('');
  const [newNote, setNewNote] = useState('');

  const editRefInput = useRef<HTMLInputElement>(null);
  const addRefInput = useRef<HTMLInputElement>(null);

  // Focus when editing starts
  useEffect(() => {
    if (editingId && editRefInput.current) {
      editRefInput.current.focus();
    }
  }, [editingId]);

  // Focus when adding starts
  useEffect(() => {
    if (isAdding && addRefInput.current) {
      addRefInput.current.focus();
    }
  }, [isAdding]);

  const startEditing = (ref: EditableCrossReference) => {
    setEditingId(ref.id);
    setEditReference(ref.reference);
    setEditNote(ref.note);
  };

  const saveEdit = () => {
    if (editingId && editReference.trim()) {
      onUpdate(editingId, {
        reference: editReference.trim(),
        note: editNote.trim(),
      });
    }
    setEditingId(null);
    setEditReference('');
    setEditNote('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditReference('');
    setEditNote('');
  };

  const handleAdd = () => {
    if (newReference.trim()) {
      onAdd(newReference.trim(), newNote.trim());
      setNewReference('');
      setNewNote('');
      setIsAdding(false);
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewReference('');
    setNewNote('');
  };

  return (
    <div className="space-y-3">
      {references.map((ref) => (
        <div key={ref.id}>
          {editingId === ref.id ? (
            <div className="border border-[var(--border-color)] rounded-lg p-3 bg-[var(--bg-elevated)]">
              <div className="flex gap-3 mb-2">
                <input
                  ref={editRefInput}
                  type="text"
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  placeholder="Reference (e.g., John 3:16)"
                  className="
                    flex-shrink-0 w-32 px-2 py-1
                    text-sm
                    bg-[var(--bg-surface)]
                    border border-[var(--border-color)]
                    rounded
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-interpretation)]/30
                  "
                />
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Note about this reference..."
                  className="
                    flex-1 px-2 py-1
                    text-sm
                    bg-[var(--bg-surface)]
                    border border-[var(--border-color)]
                    rounded
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-interpretation)]/30
                  "
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={cancelEdit}
                  className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={!editReference.trim()}
                  className="
                    px-2 py-1 text-xs
                    bg-[var(--color-interpretation)] text-white
                    rounded
                    hover:opacity-90
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 items-start group">
              <span
                onClick={() => startEditing(ref)}
                className="
                  font-semibold text-[var(--color-interpretation)] whitespace-nowrap font-serif
                  cursor-pointer hover:opacity-80
                "
              >
                {ref.reference}
              </span>
              <span
                onClick={() => startEditing(ref)}
                className="
                  text-[var(--text-secondary)] flex-1
                  cursor-pointer hover:bg-[var(--bg-elevated)]/50 rounded px-1 -mx-1
                "
              >
                {ref.note || <span className="italic text-[var(--text-muted)]">Add note...</span>}
              </span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => startEditing(ref)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--color-interpretation)]"
                  aria-label="Edit"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onRemove(ref.id)}
                  className="p-1 text-[var(--text-muted)] hover:text-red-500"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add Reference */}
      {isAdding ? (
        <div className="border border-dashed border-[var(--border-color)] rounded-lg p-3">
          <div className="flex gap-3 mb-2">
            <input
              ref={addRefInput}
              type="text"
              value={newReference}
              onChange={(e) => setNewReference(e.target.value)}
              placeholder="Reference (e.g., John 3:16)"
              className="
                flex-shrink-0 w-32 px-2 py-1
                text-sm
                bg-[var(--bg-elevated)]
                border border-[var(--border-color)]
                rounded
                focus:outline-none focus:ring-2 focus:ring-[var(--color-interpretation)]/30
              "
            />
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Note about this reference..."
              className="
                flex-1 px-2 py-1
                text-sm
                bg-[var(--bg-elevated)]
                border border-[var(--border-color)]
                rounded
                focus:outline-none focus:ring-2 focus:ring-[var(--color-interpretation)]/30
              "
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') cancelAdd();
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelAdd}
              className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newReference.trim()}
              className="
                px-2 py-1 text-xs
                bg-[var(--color-interpretation)] text-white
                rounded
                hover:opacity-90
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="
            flex items-center gap-2 text-sm
            border border-dashed border-[var(--border-color)]
            rounded-lg px-4 py-2
            text-[var(--text-muted)]
            hover:border-[var(--color-interpretation)]
            hover:text-[var(--color-interpretation)]
            transition-colors
          "
        >
          <Plus className="h-4 w-4" />
          Add Cross Reference
        </button>
      )}
    </div>
  );
}
