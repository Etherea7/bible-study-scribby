/**
 * WorkspaceEditor - Three-column workspace layout for Bible study editing
 *
 * Features:
 * - Three-panel layout: Passage (left) | Flow (center) | Questions (right)
 * - Responsive: Side-by-side on desktop, stacked on mobile
 * - Collapsible panels with smooth animations
 * - Document-style study content
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, BookText, List, FileText } from 'lucide-react';
import { PassagePanel } from './PassagePanel';
import { FlowPanel } from './FlowPanel';
import { StudyContentPanel } from './StudyContentPanel';
import { panelSlideLeft, fadeIn, springGentle } from '../../utils/animations';
import type {
  EditableStudyFull,
  EditableQuestionType,
  EditableQuestion,
} from '../../types';

interface WorkspaceEditorProps {
  reference: string;
  passageText: string;
  editableStudy: EditableStudyFull;
  validationErrors?: { purpose?: string; context?: string };
  passageContext?: string;

  // Field updaters
  onUpdatePurpose: (value: string) => void;
  onUpdateContext: (value: string) => void;
  onUpdateSummary: (value: string) => void;
  onUpdatePrayerPrompt: (value: string) => void;

  // Theme management
  onAddTheme: (theme: string) => void;
  onUpdateTheme: (index: number, value: string) => void;
  onRemoveTheme: (index: number) => void;

  // Question management (within study flow sections)
  onAddQuestion: (sectionId: string, type: EditableQuestionType, question: string, answer?: string) => void;
  onUpdateQuestion: (sectionId: string, questionId: string, updates: Partial<EditableQuestion>) => void;
  onRemoveQuestion: (sectionId: string, questionId: string) => void;
  onReorderQuestions: (sectionId: string, fromIndex: number, toIndex: number) => void;

  // Application questions
  onAddApplicationQuestion: (question: string) => void;
  onUpdateApplicationQuestion: (id: string, updates: Partial<EditableQuestion>) => void;
  onRemoveApplicationQuestion: (id: string) => void;

  // Cross references
  onAddCrossReference: (reference: string, note: string) => void;
  onUpdateCrossReference: (id: string, updates: Partial<{ reference: string; note: string }>) => void;
  onRemoveCrossReference: (id: string) => void;

  // Section management
  onUpdateSectionHeading: (sectionId: string, heading: string) => void;
  onUpdateSectionConnection: (sectionId: string, connection: string) => void;
  onUpdateSectionPassage: (sectionId: string, passage: string) => void;
  onAddSection: (passageSection: string, heading: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onReorderSections: (fromIndex: number, toIndex: number) => void;

  // Study-level notes
  onUpdateStudyNotes: (notes: string) => void;
}

export function WorkspaceEditor({
  reference,
  passageText,
  editableStudy,
  validationErrors,
  passageContext,
  onUpdatePurpose,
  onUpdateContext,
  onUpdateSummary,
  onUpdatePrayerPrompt,
  onAddTheme,
  onUpdateTheme,
  onRemoveTheme,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  onReorderQuestions,
  onAddApplicationQuestion,
  onUpdateApplicationQuestion,
  onRemoveApplicationQuestion,
  onAddCrossReference,
  onUpdateCrossReference,
  onRemoveCrossReference,
  onUpdateSectionHeading,
  onUpdateSectionConnection,
  onUpdateSectionPassage,
  onAddSection,
  onRemoveSection,
  onReorderSections,
  onUpdateStudyNotes,
}: WorkspaceEditorProps) {
  const [isPassageCollapsed, setIsPassageCollapsed] = useState(false);
  const [isFlowCollapsed, setIsFlowCollapsed] = useState(false);
  const [isContentCollapsed, setIsContentCollapsed] = useState(false);
  const questionsRef = useRef<HTMLDivElement>(null);

  // Scroll to a specific section in the questions panel
  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Batch update for flow panel "Generate All"
  const handleBatchFlowUpdate = (updates: {
    purpose?: string;
    context?: string;
    themes?: string[];
    sections?: Array<{ passageSection: string; heading: string }>;
  }) => {
    if (updates.purpose) onUpdatePurpose(updates.purpose);
    if (updates.context) onUpdateContext(updates.context);
    if (updates.themes) {
      updates.themes.forEach((theme) => onAddTheme(theme));
    }
    if (updates.sections) {
      updates.sections.forEach((s) => onAddSection(s.passageSection, s.heading));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 relative min-h-[600px]">
      {/* Passage Panel - Left */}
      <AnimatePresence mode="wait">
        {!isPassageCollapsed && (
          <motion.div
            key="passage-panel"
            variants={panelSlideLeft}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="
              w-full
              lg:flex-1
              h-full
              will-animate
            "
          >
            <PassagePanel
              reference={reference}
              text={passageText}
              onToggleCollapse={() => setIsPassageCollapsed(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Passage Toggle */}
      {isPassageCollapsed && (
        <motion.button
          variants={fadeIn}
          initial="initial"
          animate="animate"
          onClick={() => setIsPassageCollapsed(false)}
          className="
            hidden lg:flex
            fixed left-4 top-1/2 -translate-y-1/2
            z-20
            flex-col items-center justify-center gap-2
            w-10 h-24
            bg-[var(--bg-elevated)]
            border border-[var(--border-color)]
            rounded-r-lg
            shadow-lg
            hover:bg-[var(--bg-surface)]
            transition-colors
            will-animate
          "
          title="Show passage panel"
        >
          <BookText className="h-4 w-4 text-[var(--color-accent)]" />
          <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
        </motion.button>
      )}

      {/* Flow Panel - Center */}
      <AnimatePresence mode="wait">
        {!isFlowCollapsed && (
          <motion.div
            key="flow-panel"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0, transition: springGentle }}
            exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
            className="
              w-full
              lg:flex-1
              bg-[var(--bg-elevated)]
              border border-[var(--border-color)]
              rounded-xl
              overflow-hidden
              will-animate
            "
          >
            <FlowPanel
              reference={reference}
              passageText={passageText}
              study={editableStudy}
              onToggleCollapse={() => setIsFlowCollapsed(true)}
              onUpdatePurpose={onUpdatePurpose}
              onUpdateContext={onUpdateContext}
              onUpdateStudyNotes={onUpdateStudyNotes}
              onAddTheme={onAddTheme}
              onUpdateTheme={onUpdateTheme}
              onRemoveTheme={onRemoveTheme}
              onAddSection={onAddSection}
              onRemoveSection={onRemoveSection}
              onScrollToSection={handleScrollToSection}
              onBatchUpdate={handleBatchFlowUpdate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Flow Toggle */}
      {isFlowCollapsed && (
        <motion.button
          variants={fadeIn}
          initial="initial"
          animate="animate"
          onClick={() => setIsFlowCollapsed(false)}
          className="
            hidden lg:flex
            flex-col items-center justify-center gap-2
            w-10 h-24
            bg-[var(--bg-elevated)]
            border border-[var(--border-color)]
            rounded-lg
            shadow-sm
            hover:bg-[var(--bg-surface)]
            transition-colors
            flex-shrink-0
          "
          title="Show flow panel"
        >
          <List className="h-4 w-4 text-[var(--color-interpretation)]" />
          <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
        </motion.button>
      )}

      {/* Questions Panel - Right (flex-1 to take remaining space) */}
      <AnimatePresence mode="wait">
        {!isContentCollapsed && (
          <motion.div
            key="content-panel"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0, transition: springGentle }}
            exit={{ opacity: 0, x: 10, transition: { duration: 0.15 } }}
            ref={questionsRef}
            className={`
              flex-1
              min-w-0
              will-animate
              ${isPassageCollapsed ? 'lg:ml-12' : ''}
            `}
          >
            <StudyContentPanel
              study={editableStudy}
              passageContext={passageContext}
              validationErrors={validationErrors}
              hideFlowContent={!isFlowCollapsed} // Hide purpose/context/themes when flow panel is visible
              onToggleCollapse={() => setIsContentCollapsed(true)}
              onUpdatePurpose={onUpdatePurpose}
              onUpdateContext={onUpdateContext}
              onUpdateSummary={onUpdateSummary}
              onUpdatePrayerPrompt={onUpdatePrayerPrompt}
              onAddTheme={onAddTheme}
              onUpdateTheme={onUpdateTheme}
              onRemoveTheme={onRemoveTheme}
              onAddQuestion={onAddQuestion}
              onUpdateQuestion={onUpdateQuestion}
              onRemoveQuestion={onRemoveQuestion}
              onReorderQuestions={onReorderQuestions}
              onAddApplicationQuestion={onAddApplicationQuestion}
              onUpdateApplicationQuestion={onUpdateApplicationQuestion}
              onRemoveApplicationQuestion={onRemoveApplicationQuestion}
              onAddCrossReference={onAddCrossReference}
              onUpdateCrossReference={onUpdateCrossReference}
              onRemoveCrossReference={onRemoveCrossReference}
              onUpdateSectionHeading={onUpdateSectionHeading}
              onUpdateSectionConnection={onUpdateSectionConnection}
              onUpdateSectionPassage={onUpdateSectionPassage}
              onAddSection={onAddSection}
              onRemoveSection={onRemoveSection}
              onReorderSections={onReorderSections}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Content Toggle */}
      {isContentCollapsed && (
        <motion.button
          variants={fadeIn}
          initial="initial"
          animate="animate"
          onClick={() => setIsContentCollapsed(false)}
          className="
            hidden lg:flex
            fixed right-4 top-1/2 -translate-y-1/2
            z-20
            flex-col items-center justify-center gap-2
            w-10 h-24
            bg-[var(--bg-elevated)]
            border border-[var(--border-color)]
            rounded-l-lg
            shadow-lg
            hover:bg-[var(--bg-surface)]
            transition-colors
            will-animate
          "
          title="Show study content panel"
        >
          <FileText className="h-4 w-4 text-[var(--color-observation)]" />
          <ChevronLeft className="h-4 w-4 text-[var(--text-secondary)]" />
        </motion.button>
      )}
    </div>
  );
}
