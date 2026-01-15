/**
 * AddQuestionButton - Button to add new questions
 *
 * Features:
 * - Dropdown to select question type
 * - Inline form for question/answer
 */

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Plus, Eye, Lightbulb, Heart, Smile, X } from 'lucide-react';
import type { EditableQuestionType } from '../../types';

interface AddQuestionButtonProps {
  onAdd: (type: EditableQuestionType, question: string, answer?: string) => void;
  allowedTypes?: EditableQuestionType[];
  compact?: boolean;
}

const typeConfig: Record<
  EditableQuestionType,
  {
    label: string;
    icon: typeof Eye;
    color: string;
    hasAnswer: boolean;
  }
> = {
  observation: {
    label: 'Observation',
    icon: Eye,
    color: 'var(--color-observation)',
    hasAnswer: true,
  },
  interpretation: {
    label: 'Interpretation',
    icon: Lightbulb,
    color: 'var(--color-interpretation)',
    hasAnswer: true,
  },
  feeling: {
    label: 'Feeling',
    icon: Smile,
    color: 'var(--color-accent)',
    hasAnswer: false,
  },
  application: {
    label: 'Reflect',
    icon: Heart,
    color: 'var(--text-muted)',
    hasAnswer: false,
  },
};

export function AddQuestionButton({
  onAdd,
  allowedTypes = ['observation', 'interpretation', 'feeling', 'application'],
  compact = false,
}: AddQuestionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EditableQuestionType | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const questionRef = useRef<HTMLTextAreaElement>(null);

  // Focus question input when type is selected
  useEffect(() => {
    if (selectedType && questionRef.current) {
      questionRef.current.focus();
    }
  }, [selectedType]);

  const handleSubmit = () => {
    if (!selectedType || !question.trim()) return;

    const config = typeConfig[selectedType];
    onAdd(selectedType, question.trim(), config.hasAnswer ? answer.trim() : undefined);

    // Reset form
    setSelectedType(null);
    setQuestion('');
    setAnswer('');
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedType(null);
    setQuestion('');
    setAnswer('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          'flex items-center gap-2 text-sm',
          'border border-dashed border-[var(--border-color)]',
          'rounded-lg px-4 py-2',
          'text-[var(--text-muted)]',
          'hover:border-[var(--color-observation)]',
          'hover:text-[var(--color-observation)]',
          'transition-colors',
          compact && 'px-3 py-1.5'
        )}
      >
        <Plus className="h-4 w-4" />
        Add Question
      </button>
    );
  }

  // Type selection
  if (!selectedType) {
    return (
      <div className="border border-[var(--border-color)] rounded-lg p-4 bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Select Question Type
          </span>
          <button
            onClick={handleCancel}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {allowedTypes.map((t) => {
            const config = typeConfig[t];
            const Icon = config.icon;
            return (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className="
                  flex items-center gap-2 px-3 py-2
                  border border-[var(--border-color)] rounded-lg
                  hover:border-[var(--color-observation)]
                  hover:bg-[var(--bg-elevated)]
                  transition-colors
                "
              >
                <Icon className="h-4 w-4" style={{ color: config.color }} />
                <span className="text-sm" style={{ color: config.color }}>
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Question entry form
  const config = typeConfig[selectedType];
  const Icon = config.icon;

  return (
    <div
      className="border border-[var(--border-color)] rounded-lg p-4 bg-[var(--bg-surface)]"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: config.color }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </div>
        <button
          onClick={handleCancel}
          className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <textarea
        ref={questionRef}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Enter your question..."
        className="
          w-full mb-3 p-2
          text-sm
          bg-[var(--bg-elevated)]
          border border-[var(--border-color)]
          rounded-lg
          focus:outline-none focus:ring-2 focus:ring-[var(--color-observation)]/30
          resize-none
        "
        rows={2}
      />

      {config.hasAnswer && (
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Sample answer (optional)..."
          className="
            w-full mb-3 p-2
            text-sm
            bg-[var(--bg-elevated)]
            border border-[var(--border-color)]
            rounded-lg
            focus:outline-none focus:ring-2 focus:ring-[var(--color-observation)]/30
            resize-none
          "
          rows={2}
        />
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={handleCancel}
          className="
            px-3 py-1.5 text-sm
            text-[var(--text-secondary)]
            hover:bg-[var(--bg-elevated)]
            rounded-lg transition-colors
          "
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!question.trim()}
          className="
            px-3 py-1.5 text-sm
            bg-[var(--color-observation)] text-white
            rounded-lg
            hover:bg-[var(--color-observation-dark)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          Add Question
        </button>
      </div>
    </div>
  );
}
