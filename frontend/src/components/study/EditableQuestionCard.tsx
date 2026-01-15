/**
 * EditableQuestionCard - Question card with editing capabilities
 *
 * Features:
 * - Drag handle for reordering
 * - Delete button
 * - Question type selector dropdown
 * - Inline editing for question and answer
 */

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  GripVertical,
  Trash2,
  Eye,
  Lightbulb,
  Heart,
  Smile,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { EditableQuestionType } from '../../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EditableQuestionCardProps {
  id: string;
  type: EditableQuestionType;
  question: string;
  answer?: string;
  onQuestionChange: (question: string) => void;
  onAnswerChange?: (answer: string) => void;
  onTypeChange: (type: EditableQuestionType) => void;
  onDelete: () => void;
  showAnswer?: boolean;
}

const typeConfig: Record<
  EditableQuestionType,
  {
    label: string;
    icon: typeof Eye;
    color: string;
    bgClass: string;
  }
> = {
  observation: {
    label: 'Observation',
    icon: Eye,
    color: 'var(--color-observation)',
    bgClass: 'question-observation',
  },
  interpretation: {
    label: 'Interpretation',
    icon: Lightbulb,
    color: 'var(--color-interpretation)',
    bgClass: 'question-interpretation',
  },
  feeling: {
    label: 'Feeling',
    icon: Smile,
    color: 'var(--color-accent)',
    bgClass: 'question-application',
  },
  application: {
    label: 'Reflect',
    icon: Heart,
    color: 'var(--text-muted)',
    bgClass: 'question-application',
  },
};

export function EditableQuestionCard({
  id,
  type,
  question,
  answer,
  onQuestionChange,
  onAnswerChange,
  onTypeChange,
  onDelete,
  showAnswer: initialShowAnswer = false,
}: EditableQuestionCardProps) {
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [localQuestion, setLocalQuestion] = useState(question);
  const [localAnswer, setLocalAnswer] = useState(answer || '');
  const [showAnswer, setShowAnswer] = useState(initialShowAnswer);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const questionRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  // Sortable hook
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

  const config = typeConfig[type];
  const Icon = config.icon;

  // Sync local state with props
  useEffect(() => {
    setLocalQuestion(question);
  }, [question]);

  useEffect(() => {
    setLocalAnswer(answer || '');
  }, [answer]);

  // Auto-focus when editing
  useEffect(() => {
    if (isEditingQuestion && questionRef.current) {
      questionRef.current.focus();
      questionRef.current.select();
    }
  }, [isEditingQuestion]);

  useEffect(() => {
    if (isEditingAnswer && answerRef.current) {
      answerRef.current.focus();
      answerRef.current.select();
    }
  }, [isEditingAnswer]);

  // Debounced save for question
  useEffect(() => {
    if (localQuestion === question) return;
    const timer = setTimeout(() => {
      onQuestionChange(localQuestion);
    }, 500);
    return () => clearTimeout(timer);
  }, [localQuestion, question, onQuestionChange]);

  // Debounced save for answer
  useEffect(() => {
    if (!onAnswerChange || localAnswer === answer) return;
    const timer = setTimeout(() => {
      onAnswerChange(localAnswer);
    }, 500);
    return () => clearTimeout(timer);
  }, [localAnswer, answer, onAnswerChange]);

  const handleQuestionBlur = () => {
    setIsEditingQuestion(false);
  };

  const handleAnswerBlur = () => {
    setIsEditingAnswer(false);
  };

  const handleQuestionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditingQuestion(false);
      setLocalQuestion(question);
    }
  };

  const handleAnswerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditingAnswer(false);
      setLocalAnswer(answer || '');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'question-card relative group',
        config.bgClass,
        isDragging && 'opacity-50 z-50'
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="
          absolute -left-2 top-1/2 -translate-y-1/2
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          cursor-grab active:cursor-grabbing
          p-1 rounded
          bg-[var(--bg-elevated)] border border-[var(--border-color)]
          hover:bg-[var(--bg-surface)]
        "
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3 w-3 text-[var(--text-muted)]" />
      </button>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="
          absolute -right-2 top-2
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          p-1 rounded
          bg-red-50 border border-red-200
          hover:bg-red-100
          text-red-500
        "
        aria-label="Delete question"
      >
        <Trash2 className="h-3 w-3" />
      </button>

      {/* Type Badge with Dropdown */}
      <div className="flex items-center gap-2 relative">
        <button
          onClick={() => setShowTypeDropdown(!showTypeDropdown)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Icon className="h-4 w-4" style={{ color: config.color }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
          <ChevronDown className="h-3 w-3 text-[var(--text-muted)]" />
        </button>

        {/* Type Dropdown */}
        {showTypeDropdown && (
          <div className="absolute top-full left-0 mt-1 z-20 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-lg py-1">
            {(Object.keys(typeConfig) as EditableQuestionType[]).map((t) => {
              const c = typeConfig[t];
              const TypeIcon = c.icon;
              return (
                <button
                  key={t}
                  onClick={() => {
                    onTypeChange(t);
                    setShowTypeDropdown(false);
                  }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 w-full text-left',
                    'hover:bg-[var(--bg-elevated)]',
                    type === t && 'bg-[var(--bg-elevated)]'
                  )}
                >
                  <TypeIcon className="h-4 w-4" style={{ color: c.color }} />
                  <span className="text-sm" style={{ color: c.color }}>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Question - Editable */}
      {isEditingQuestion ? (
        <textarea
          ref={questionRef}
          value={localQuestion}
          onChange={(e) => setLocalQuestion(e.target.value)}
          onBlur={handleQuestionBlur}
          onKeyDown={handleQuestionKeyDown}
          className="
            mt-3 w-full
            text-[var(--text-primary)] font-medium leading-relaxed
            bg-transparent
            border-b-2 border-[var(--color-observation)]
            focus:outline-none focus:border-[var(--color-observation-dark)]
            resize-none
          "
          rows={2}
        />
      ) : (
        <p
          onClick={() => setIsEditingQuestion(true)}
          className="
            mt-3 text-[var(--text-primary)] font-medium leading-relaxed
            cursor-text hover:bg-[var(--bg-elevated)]/50 rounded px-1 -mx-1 transition-colors
          "
        >
          {localQuestion || 'Click to add question...'}
        </p>
      )}

      {/* Answer Section (optional) */}
      {(answer !== undefined || type === 'observation' || type === 'interpretation') && (
        <>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="mt-4 flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: config.color }}
          >
            {showAnswer ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide Sample Answer
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                {answer ? 'Show Sample Answer' : 'Add Sample Answer'}
              </>
            )}
          </button>

          {showAnswer && (
            <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
              {isEditingAnswer ? (
                <textarea
                  ref={answerRef}
                  value={localAnswer}
                  onChange={(e) => setLocalAnswer(e.target.value)}
                  onBlur={handleAnswerBlur}
                  onKeyDown={handleAnswerKeyDown}
                  placeholder="Enter sample answer..."
                  className="
                    w-full
                    text-[var(--text-secondary)] text-sm leading-relaxed
                    bg-transparent
                    border-b-2 border-[var(--color-observation)]
                    focus:outline-none focus:border-[var(--color-observation-dark)]
                    resize-none
                  "
                  rows={3}
                />
              ) : (
                <p
                  onClick={() => setIsEditingAnswer(true)}
                  className={clsx(
                    'text-[var(--text-secondary)] text-sm leading-relaxed',
                    'cursor-text hover:bg-[var(--bg-elevated)]/50 rounded px-1 -mx-1 transition-colors',
                    !localAnswer && 'text-[var(--text-muted)] italic'
                  )}
                >
                  {localAnswer || 'Click to add sample answer...'}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
