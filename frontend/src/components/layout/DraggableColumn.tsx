/**
 * DraggableColumn - A sortable wrapper for dashboard columns
 *
 * Uses @dnd-kit/sortable for drag-and-drop reordering.
 * Shows a grip handle on hover for dragging.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

interface DraggableColumnProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function DraggableColumn({ id, children, className = '' }: DraggableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${className} ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="
          absolute -left-3 top-4 z-10
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          cursor-grab active:cursor-grabbing
          p-1.5 rounded-lg
          bg-[var(--bg-elevated)] border border-[var(--border-color)]
          hover:bg-[var(--bg-surface)] hover:border-[var(--color-observation)]
          shadow-sm
        "
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-[var(--text-muted)]" />
      </button>

      {/* Column Content */}
      {children}
    </div>
  );
}
