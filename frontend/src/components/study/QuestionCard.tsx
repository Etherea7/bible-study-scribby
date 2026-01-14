import { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, ChevronUp, Eye, Lightbulb, Heart } from 'lucide-react';
import type { QuestionType } from '../../types';

interface QuestionCardProps {
  type: QuestionType;
  question: string;
  answer?: string;
  defaultExpanded?: boolean;
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
}: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(defaultExpanded);
  const config = typeConfig[type];
  const Icon = config.icon;

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
      </div>

      <p className="mt-3 text-[var(--text-primary)] font-medium leading-relaxed">
        {question}
      </p>

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
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {answer}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
