/**
 * SortableQuestionList - Drag-drop sortable list of questions
 *
 * Uses @dnd-kit for drag-and-drop reordering within a section
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
import { EditableQuestionCard } from './EditableQuestionCard';
import type { EditableQuestion, EditableQuestionType } from '../../types';

interface SortableQuestionListProps {
  sectionId?: string;  // Optional - kept for interface compatibility
  questions: EditableQuestion[];
  passageContext?: string;  // For AI enhancement
  onQuestionChange: (questionId: string, question: string) => void;
  onAnswerChange: (questionId: string, answer: string) => void;
  onTypeChange: (questionId: string, type: EditableQuestionType) => void;
  onDelete: (questionId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function SortableQuestionList({
  sectionId: _sectionId,  // Unused but kept for interface
  questions,
  passageContext,
  onQuestionChange,
  onAnswerChange,
  onTypeChange,
  onDelete,
  onReorder,
}: SortableQuestionListProps) {
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
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
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
        items={questions.map((q) => q.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {questions.map((question) => (
            <EditableQuestionCard
              key={question.id}
              id={question.id}
              type={question.type}
              question={question.question}
              answer={question.answer}
              passageContext={passageContext}
              onQuestionChange={(q) => onQuestionChange(question.id, q)}
              onAnswerChange={(a) => onAnswerChange(question.id, a)}
              onTypeChange={(t) => onTypeChange(question.id, t)}
              onDelete={() => onDelete(question.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
