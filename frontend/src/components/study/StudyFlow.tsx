import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import type { StudyFlowItem } from '../../types';

interface StudyFlowProps {
  flow: StudyFlowItem[];
}

export function StudyFlow({ flow }: StudyFlowProps) {
  return (
    <div className="space-y-8">
      {flow.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="space-y-4"
        >
          {/* Section Header */}
          <div className="section-header">
            <div>
              <h4 className="text-lg font-semibold text-[var(--text-primary)] font-serif">
                {item.section_heading}
              </h4>
              <p className="text-sm text-[var(--text-muted)]">
                {item.passage_section}
              </p>
            </div>
          </div>

          {/* Observation Question */}
          <QuestionCard
            type="observation"
            question={item.observation_question}
            answer={item.observation_answer}
          />

          {/* Interpretation Question */}
          <QuestionCard
            type="interpretation"
            question={item.interpretation_question}
            answer={item.interpretation_answer}
          />

          {/* Connection to next section */}
          {item.connection && (
            <div className="flex items-start gap-2 py-3 px-4 bg-[var(--bg-elevated)] rounded-lg border-l-2 border-[var(--color-accent)]">
              <ChevronRight className="h-4 w-4 text-[var(--color-accent)] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[var(--text-secondary)] italic">
                {item.connection}
              </p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
