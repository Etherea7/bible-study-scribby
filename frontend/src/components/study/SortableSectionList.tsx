/**
 * SortableSectionList - Drag-drop sortable list of study sections
 *
 * Uses @dnd-kit for drag-and-drop reordering of sections
 */

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableSectionWrapper } from './SortableSectionWrapper';
import type { EditableStudyFlowSection } from '../../types';

interface SortableSectionListProps {
  sections: EditableStudyFlowSection[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  renderSection: (section: EditableStudyFlowSection, index: number) => React.ReactNode;
}

export function SortableSectionList({
  sections,
  onReorder,
  renderSection,
}: SortableSectionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4 pl-8">
          {sections.map((section, index) => (
            <SortableSectionWrapper key={section.id} id={section.id}>
              {renderSection(section, index)}
            </SortableSectionWrapper>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
