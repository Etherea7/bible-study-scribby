/**
 * SortableFlowComponent - Wrapper for making FlowPanel cards drag-sortable
 *
 * Uses @dnd-kit/sortable to provide drag-and-drop functionality
 * Shows a drag handle on hover
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableFlowComponentProps {
  id: string;
  children: React.ReactNode;
}

export function SortableFlowComponent({
  id,
  children,
}: SortableFlowComponentProps) {
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
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      {/* Drag Handle - visible on hover */}
      <button
        {...attributes}
        {...listeners}
        className="
          absolute -left-6 top-3
          p-1 rounded
          text-[var(--text-muted)]
          hover:text-[var(--text-primary)]
          hover:bg-[var(--bg-surface)]
          opacity-0 group-hover:opacity-100
          focus:opacity-100
          transition-opacity
          cursor-grab active:cursor-grabbing
          touch-none
          z-10
        "
        title="Drag to reorder"
        type="button"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      {children}
    </div>
  );
}
