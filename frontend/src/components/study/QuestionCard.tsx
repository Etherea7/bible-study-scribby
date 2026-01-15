import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, ChevronUp, Eye, Lightbulb, Heart, Edit2 } from 'lucide-react';
import type { QuestionType } from '../../types';

interface QuestionCardProps {
  type: QuestionType;
  question: string;
  answer?: string;
  defaultExpanded?: boolean;
  editable?: boolean;
  onQuestionChange?: (newQuestion: string) => void;
  onAnswerChange?: (newAnswer: string) => void;
}

const typeConfig: Record<QuestionType, {
  label: string;
  icon: typeof Eye;
  color: string;
  hoverColor: string;
  bgClass: string;
}> = {
  observation: {
    label: 'Observation',
    icon: Eye,
    color: 'var(--color-observation)',
    hoverColor: 'var(--color-observation-dark)',
    bgClass: 'question-observation',
  },
  interpretation: {
    label: 'Interpretation',
    icon: Lightbulb,
    color: 'var(--color-interpretation)',
    hoverColor: 'var(--color-interpretation-dark)',
    bgClass: 'question-interpretation',
  },
  application: {
    label: 'Reflect',
    icon: Heart,
    color: 'var(--text-muted)',
    hoverColor: 'var(--text-secondary)',
    bgClass: 'question-application',
  },
};

export function QuestionCard({
  type,
  question,
  answer,
  defaultExpanded = false,
  editable = false,
  onQuestionChange,
  onAnswerChange,
}: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(defaultExpanded);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [localQuestion, setLocalQuestion] = useState(question);
  const [localAnswer, setLocalAnswer] = useState(answer || '');

  const questionRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  const config = typeConfig[type];
  const Icon = config.icon;

  // Sync local state with props
  useEffect(() => {
    setLocalQuestion(question);
  }, [question]);

  useEffect(() => {
    setLocalAnswer(answer || '');
  }, [answer]);

  // Auto-focus textarea when editing starts
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
    if (!editable || localQuestion === question) return;
    const timer = setTimeout(() => {
      onQuestionChange?.(localQuestion);
    }, 500);
    return () => clearTimeout(timer);
  }, [localQuestion, question, editable, onQuestionChange]);

  // Debounced save for answer
  useEffect(() => {
    if (!editable || localAnswer === answer) return;
    const timer = setTimeout(() => {
      onAnswerChange?.(localAnswer);
    }, 500);
    return () => clearTimeout(timer);
  }, [localAnswer, answer, editable, onAnswerChange]);

  const handleQuestionClick = () => {
    if (editable) {
      setIsEditingQuestion(true);
    }
  };

  const handleAnswerClick = () => {
    if (editable && answer) {
      setIsEditingAnswer(true);
    }
  };

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
    <div className={clsx('question-card', config.bgClass)}>
      <div className="flex items-center gap-2">
        <Icon
          className="h-4 w-4"
          style={{ color: config.color }}
        />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
        {editable && (
          <Edit2 className="h-3 w-3 text-[var(--text-muted)] opacity-50" />
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
          onClick={handleQuestionClick}
          className={clsx(
            'mt-3 text-[var(--text-primary)] font-medium leading-relaxed',
            editable && 'cursor-text hover:bg-[var(--bg-elevated)]/50 rounded px-1 -mx-1 transition-colors'
          )}
        >
          {localQuestion}
        </p>
      )}

      {answer && (
        <>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="mt-4 flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{
              color: config.color,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = config.hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.color = config.color}
          >
            {showAnswer ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide Sample Answer
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show Sample Answer
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
                  onClick={handleAnswerClick}
                  className={clsx(
                    'text-[var(--text-secondary)] text-sm leading-relaxed',
                    editable && 'cursor-text hover:bg-[var(--bg-elevated)]/50 rounded px-1 -mx-1 transition-colors'
                  )}
                >
                  {localAnswer}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
