/**
 * StudyContentPanel - Document-style study content editor
 *
 * Displays all study content in a flowing document layout:
 * - Purpose
 * - Context
 * - Key Themes
 * - Study Flow Sections (with questions)
 * - Summary
 * - Application Questions
 * - Cross References
 * - Prayer Prompt
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Map,
  Tag,
  BookOpen,
  Lightbulb,
  MessageCircle,
  Link2,
  Heart,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { EditableTextField } from '../ui/EditableTextField';
import { EditableThemeList } from '../study/EditableThemeList';
import { SortableQuestionList } from '../study/SortableQuestionList';
import { SortableSectionList } from '../study/SortableSectionList';
import { AddQuestionButton } from '../study/AddQuestionButton';
import { EditableQuestionCard } from '../study/EditableQuestionCard';
import { EditableCrossReferences } from '../study/EditableCrossReferences';
import { MagicDraftButton } from './MagicDraftButton';
import {
  draftObservationQuestions,
  draftInterpretationQuestions,
} from '../../api/enhanceClient';
import type {
  EditableStudyFull,
  EditableQuestionType,
  EditableQuestion,
} from '../../types';

interface StudyContentPanelProps {
  study: EditableStudyFull;
  passageContext?: string;
  validationErrors?: { purpose?: string; context?: string };
  hideFlowContent?: boolean; // Hide purpose, context, themes when Flow panel is visible
  onToggleCollapse?: () => void;

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
  onUpdateSectionHeading?: (sectionId: string, heading: string) => void;
  onUpdateSectionConnection?: (sectionId: string, connection: string) => void;
  onUpdateSectionPassage?: (sectionId: string, passage: string) => void;
  onAddSection: (passageSection: string, heading: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onReorderSections?: (fromIndex: number, toIndex: number) => void;
}

export function StudyContentPanel({
  study,
  passageContext,
  validationErrors = {},
  hideFlowContent = false,
  onToggleCollapse,
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
  onUpdateSectionHeading: _onUpdateSectionHeading,
  onUpdateSectionConnection,
  onUpdateSectionPassage: _onUpdateSectionPassage,
  onAddSection,
  onRemoveSection,
  onReorderSections,
}: StudyContentPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(study.study_flow.map((s) => s.id))
  );
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionPassage, setNewSectionPassage] = useState('');
  const [newSectionHeading, setNewSectionHeading] = useState('');

  // Generation state
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [generationType, setGenerationType] = useState<'observation' | 'interpretation' | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleAddSection = () => {
    if (newSectionPassage.trim() && newSectionHeading.trim()) {
      onAddSection(newSectionPassage.trim(), newSectionHeading.trim());
      setNewSectionPassage('');
      setNewSectionHeading('');
      setShowAddSection(false);
    }
  };

  // Generate questions for a section
  const handleDraftQuestions = async (
    sectionId: string,
    type: 'observation' | 'interpretation'
  ) => {
    const section = study.study_flow.find((s) => s.id === sectionId);
    if (!section) return;

    setGeneratingSection(sectionId);
    setGenerationType(type);

    try {
      const sectionText = passageContext || '';

      let questions: Array<{ question: string; answer: string }>;

      if (type === 'observation') {
        questions = await draftObservationQuestions(
          sectionText,
          section.section_heading,
          2
        );
      } else {
        questions = await draftInterpretationQuestions(
          sectionText,
          section.section_heading,
          2
        );
      }

      // Add generated questions to the section
      questions.forEach((q) => {
        onAddQuestion(sectionId, type, q.question, q.answer);
      });
    } catch (error) {
      console.error(`Failed to draft ${type} questions:`, error);
      alert(`Failed to generate ${type} questions. Please check your API key.`);
    } finally {
      setGeneratingSection(null);
      setGenerationType(null);
    }
  };

  const handleDraftApplications = async () => {
    // TODO: Implement AI drafting for applications
    console.log('[Dev] Draft application questions');
    alert('AI drafting coming soon!');
  };

  return (
    <div className="space-y-6">
      {/* Header with collapse toggle */}
      {onToggleCollapse && (
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--color-observation)]" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Study Content
            </span>
          </div>
          <button
            onClick={onToggleCollapse}
            className="
              hidden lg:flex
              p-1.5 rounded-lg
              hover:bg-[var(--bg-surface)]
              text-[var(--text-muted)]
              hover:text-[var(--text-primary)]
              transition-colors
            "
            title="Collapse study content panel"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Purpose - hidden when Flow panel is visible */}
      {!hideFlowContent && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[var(--color-observation)]" />
              Study Purpose
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableTextField
              value={study.purpose}
              onChange={onUpdatePurpose}
              placeholder="What is the main goal of this study?"
              multiline
              required
              error={validationErrors.purpose}
              context={passageContext}
            />
            {!study.purpose && (
              <div className="mt-3">
                <MagicDraftButton
                  label="Draft Purpose Statement"
                  variant="secondary"
                  onDraft={async () => {
                    // TODO: Implement AI drafting
                    console.log('[Dev] Draft purpose');
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Context - hidden when Flow panel is visible */}
      {!hideFlowContent && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-[var(--color-interpretation)]" />
              Historical Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableTextField
              value={study.context}
              onChange={onUpdateContext}
              placeholder="Background and setting for this passage..."
              multiline
              required
              error={validationErrors.context}
              context={passageContext}
            />
            {!study.context && (
              <div className="mt-3">
                <MagicDraftButton
                  label="Draft Context"
                  variant="secondary"
                  onDraft={async () => {
                    // TODO: Implement AI drafting
                    console.log('[Dev] Draft context');
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Themes - hidden when Flow panel is visible */}
      {!hideFlowContent && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-[var(--color-accent)]" />
              Key Themes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableThemeList
              themes={study.key_themes}
              onUpdate={onUpdateTheme}
              onRemove={onRemoveTheme}
              onAdd={onAddTheme}
            />
          </CardContent>
        </Card>
      )}

      {/* Study Flow Sections */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--color-observation)]" />
            Study Sections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Render section content - extracted for reuse */}
          {(() => {
            const renderSectionContent = (section: typeof study.study_flow[0], index: number) => {
              const isExpanded = expandedSections.has(section.id);
              const hasObservations = section.questions.some((q) => q.type === 'observation');
              const hasInterpretations = section.questions.some((q) => q.type === 'interpretation');

              return (
                <motion.div
                  key={section.id}
                  id={`section-${section.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="
                    border border-[var(--border-color)]
                    rounded-lg
                    overflow-hidden
                    bg-[var(--bg-surface)]
                    scroll-mt-4
                  "
                >
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="
                      w-full
                      flex items-center justify-between
                      p-4
                      text-left
                      hover:bg-[var(--bg-elevated)]
                      transition-colors
                    "
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[var(--text-muted)]">
                          {section.passage_section}
                        </span>
                        {study.study_flow.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Remove this section?')) {
                                onRemoveSection(section.id);
                              }
                            }}
                            className="
                              p-1 rounded
                              text-[var(--text-muted)]
                              hover:text-red-500
                              hover:bg-red-500/10
                              transition-colors
                            "
                            title="Remove section"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {section.section_heading}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-[var(--text-muted)]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-[var(--text-muted)]" />
                    )}
                  </button>

                  {/* Section Content */}
                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-4 border-t border-[var(--border-color)]">
                      {/* Questions */}
                      <SortableQuestionList
                        questions={section.questions}
                        sectionId={section.id}
                        passageContext={passageContext}
                        onQuestionChange={(questionId, question) =>
                          onUpdateQuestion(section.id, questionId, { question })
                        }
                        onAnswerChange={(questionId, answer) =>
                          onUpdateQuestion(section.id, questionId, { answer })
                        }
                        onTypeChange={(questionId, type) =>
                          onUpdateQuestion(section.id, questionId, { type })
                        }
                        onDelete={(questionId) => onRemoveQuestion(section.id, questionId)}
                        onReorder={(fromIndex, toIndex) =>
                          onReorderQuestions(section.id, fromIndex, toIndex)
                        }
                      />

                      {/* Magic Draft Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {!hasObservations && (
                          <button
                            onClick={() => handleDraftQuestions(section.id, 'observation')}
                            disabled={generatingSection === section.id}
                            className="
                              inline-flex items-center gap-1.5
                              px-3 py-1.5 text-sm font-medium
                              text-[var(--color-observation)]
                              bg-[var(--color-observation)]/10
                              hover:bg-[var(--color-observation)]/20
                              border border-[var(--color-observation)]/30
                              rounded-lg transition-colors
                              disabled:opacity-50
                            "
                          >
                            {generatingSection === section.id && generationType === 'observation' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            Draft Observations
                          </button>
                        )}
                        {!hasInterpretations && (
                          <button
                            onClick={() => handleDraftQuestions(section.id, 'interpretation')}
                            disabled={generatingSection === section.id}
                            className="
                              inline-flex items-center gap-1.5
                              px-3 py-1.5 text-sm font-medium
                              text-[var(--color-interpretation)]
                              bg-[var(--color-interpretation)]/10
                              hover:bg-[var(--color-interpretation)]/20
                              border border-[var(--color-interpretation)]/30
                              rounded-lg transition-colors
                              disabled:opacity-50
                            "
                          >
                            {generatingSection === section.id && generationType === 'interpretation' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            Draft Interpretations
                          </button>
                        )}
                      </div>

                      {/* Add Question Button */}
                      <AddQuestionButton
                        onAdd={(type, question, answer) =>
                          onAddQuestion(section.id, type, question, answer)
                        }
                      />

                      {/* Connection */}
                      {section.connection && onUpdateSectionConnection && (
                        <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                          <EditableTextField
                            value={section.connection}
                            onChange={(value) => onUpdateSectionConnection(section.id, value)}
                            placeholder="Connection to next section..."
                            multiline={false}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            };

            // If reorder handler is provided, use sortable list
            if (onReorderSections) {
              return (
                <SortableSectionList
                  sections={study.study_flow}
                  onReorder={onReorderSections}
                  renderSection={renderSectionContent}
                />
              );
            }

            // Otherwise, render sections without drag-drop
            return study.study_flow.map(renderSectionContent);
          })()}

          {/* Add Section Button */}
          {showAddSection ? (
            <div className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--bg-surface)] space-y-3">
              <input
                type="text"
                value={newSectionPassage}
                onChange={(e) => setNewSectionPassage(e.target.value)}
                placeholder="Passage reference (e.g., John 1:1-3)"
                className="
                  w-full px-3 py-2
                  bg-[var(--bg-elevated)]
                  border border-[var(--border-color)]
                  rounded-lg
                  text-sm
                  text-[var(--text-primary)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50
                "
              />
              <input
                type="text"
                value={newSectionHeading}
                onChange={(e) => setNewSectionHeading(e.target.value)}
                placeholder="Section heading"
                className="
                  w-full px-3 py-2
                  bg-[var(--bg-elevated)]
                  border border-[var(--border-color)]
                  rounded-lg
                  text-sm
                  text-[var(--text-primary)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50
                "
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSection();
                  if (e.key === 'Escape') setShowAddSection(false);
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddSection}
                  disabled={!newSectionPassage.trim() || !newSectionHeading.trim()}
                  className="
                    px-3 py-1.5 text-sm font-medium
                    text-white bg-[var(--color-observation)]
                    hover:bg-[var(--color-observation-dark)]
                    rounded-lg
                    disabled:opacity-50
                    transition-colors
                  "
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddSection(false)}
                  className="
                    px-3 py-1.5 text-sm
                    text-[var(--text-secondary)]
                    hover:text-[var(--text-primary)]
                    transition-colors
                  "
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddSection(true)}
              className="
                w-full
                flex items-center justify-center gap-2
                px-4 py-3
                text-sm font-medium
                text-[var(--text-secondary)]
                hover:text-[var(--text-primary)]
                bg-[var(--bg-surface)]
                hover:bg-[var(--bg-elevated)]
                border border-dashed border-[var(--border-color)]
                hover:border-[var(--color-accent)]
                rounded-lg
                transition-colors
              "
            >
              <Plus className="h-4 w-4" />
              Add Section
            </button>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[var(--color-accent)]" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditableTextField
            value={study.summary}
            onChange={onUpdateSummary}
            placeholder="Main takeaway from this passage..."
            multiline
            context={passageContext}
          />
        </CardContent>
      </Card>

      {/* Application Questions */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[var(--color-application)]" />
            Application Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {study.application_questions.length === 0 && (
            <MagicDraftButton
              label="Draft Application Questions"
              variant="secondary"
              onDraft={handleDraftApplications}
            />
          )}

          {study.application_questions.map((q) => (
            <EditableQuestionCard
              key={q.id}
              id={q.id}
              type={q.type}
              question={q.question}
              answer={q.answer}
              passageContext={passageContext}
              onQuestionChange={(question) => onUpdateApplicationQuestion(q.id, { question })}
              onAnswerChange={q.answer ? (answer) => onUpdateApplicationQuestion(q.id, { answer }) : undefined}
              onTypeChange={(type) => onUpdateApplicationQuestion(q.id, { type })}
              onDelete={() => onRemoveApplicationQuestion(q.id)}
              showAnswer={false}
            />
          ))}

          <AddQuestionButton
            onAdd={(_type, question) => onAddApplicationQuestion(question)}
            allowedTypes={['application']}
          />
        </CardContent>
      </Card>

      {/* Cross References */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[var(--color-accent)]" />
            Cross References
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditableCrossReferences
            references={study.cross_references}
            onUpdate={onUpdateCrossReference}
            onRemove={onRemoveCrossReference}
            onAdd={onAddCrossReference}
          />
        </CardContent>
      </Card>

      {/* Prayer Prompt */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Prayer Prompt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditableTextField
            value={study.prayer_prompt}
            onChange={onUpdatePrayerPrompt}
            placeholder="How should we pray in response to this passage?"
            multiline
            context={passageContext}
          />
        </CardContent>
      </Card>
    </div>
  );
}
