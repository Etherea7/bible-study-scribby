/**
 * EditableStudyGuide - Wrapper component for editable study content
 *
 * Structure:
 * - EditableTextField (Purpose) [required]
 * - EditableTextField (Context) [required]
 * - EditableThemeList
 * - Study Flow Sections
 *   - Section Header (editable)
 *   - SortableQuestionList (drag-drop reorderable)
 *   - AddQuestionButton
 * - EditableTextField (Summary)
 * - Application Questions
 *   - EditableQuestionCard (for each)
 *   - AddQuestionButton (type=application)
 * - EditableCrossReferences
 * - EditableTextField (Prayer Prompt)
 */

import { motion } from 'framer-motion';
import {
  Target,
  Map,
  Compass,
  Heart,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { EditableTextField } from '../ui/EditableTextField';
import { SortableQuestionList } from './SortableQuestionList';
import { AddQuestionButton } from './AddQuestionButton';
import { EditableQuestionCard } from './EditableQuestionCard';
import type {
  EditableStudyFull,
  EditableQuestionType,
  EditableQuestion,
} from '../../types';

interface EditableStudyGuideProps {
  study: EditableStudyFull;
  provider?: string;
  passageContext?: string;  // For AI enhancement
  validationErrors?: { purpose?: string; context?: string };

  // Field updaters
  onUpdatePurpose: (value: string) => void;
  onUpdateContext: (value: string) => void;
  onUpdatePrayerPrompt: (value: string) => void;

  // Question management (within study flow sections)
  onAddQuestion: (sectionId: string, type: EditableQuestionType, question: string, answer?: string) => void;
  onUpdateQuestion: (sectionId: string, questionId: string, updates: Partial<EditableQuestion>) => void;
  onRemoveQuestion: (sectionId: string, questionId: string) => void;
  onReorderQuestions: (sectionId: string, fromIndex: number, toIndex: number) => void;

  // Application questions
  onAddApplicationQuestion: (question: string) => void;
  onUpdateApplicationQuestion: (id: string, updates: Partial<EditableQuestion>) => void;
  onRemoveApplicationQuestion: (id: string) => void;

  // Section management
  onUpdateSectionHeading: (sectionId: string, heading: string) => void;
  onUpdateSectionConnection: (sectionId: string, connection: string) => void;
  onAddSection?: (passageSection: string, heading: string) => void;
  onRemoveSection?: (sectionId: string) => void;
  onUpdateSectionPassage?: (sectionId: string, passage: string) => void;
}

export function EditableStudyGuide({
  study,
  // provider prop removed as it was unused in the body after badge removal
  passageContext,
  validationErrors = {},
  onUpdatePurpose,
  onUpdateContext,
  onUpdatePrayerPrompt,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  onReorderQuestions,
  onAddApplicationQuestion,
  onUpdateApplicationQuestion,
  onRemoveApplicationQuestion,
  onUpdateSectionHeading,
  onUpdateSectionConnection,
  onAddSection,
  onRemoveSection,
  onUpdateSectionPassage,
}: EditableStudyGuideProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(study.study_flow.map((s) => s.id))
  );
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionPassage, setNewSectionPassage] = useState('');
  const [newSectionHeading, setNewSectionHeading] = useState('');

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleAddSection = () => {
    if (onAddSection && newSectionPassage.trim() && newSectionHeading.trim()) {
      onAddSection(newSectionPassage.trim(), newSectionHeading.trim());
      setNewSectionPassage('');
      setNewSectionHeading('');
      setShowAddSection(false);
    }
  };

  const handleRemoveSection = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveSection && study.study_flow.length > 1) {
      if (window.confirm('Are you sure you want to remove this section?')) {
        onRemoveSection(sectionId);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Purpose */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Target className="h-5 w-5 text-[var(--color-observation)]" />
            <CardTitle>Purpose</CardTitle>
          </CardHeader>
          <CardContent>
            <EditableTextField
              value={study.purpose}
              onChange={onUpdatePurpose}
              required
              error={validationErrors.purpose}
              multiline
              displayClassName="text-lg font-medium text-[var(--text-primary)] font-serif"
              placeholder="Enter the purpose of this study..."
              enableAiToolbar
              context={passageContext}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Context */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Map className="h-5 w-5 text-[var(--color-accent)]" />
            <CardTitle>Context</CardTitle>
          </CardHeader>
          <CardContent>
            <EditableTextField
              value={study.context}
              onChange={onUpdateContext}
              required
              error={validationErrors.context}
              multiline
              displayClassName="text-[var(--text-secondary)] leading-relaxed"
              placeholder="Enter the historical and literary context..."
              enableAiToolbar
              context={passageContext}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Study Flow - Editable Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Compass className="h-5 w-5 text-[var(--color-observation)]" />
            <CardTitle>Study Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {study.study_flow.map((section, index) => {
                const isExpanded = expandedSections.has(section.id);
                return (
                  <div
                    key={section.id}
                    className="border border-[var(--border-color)] rounded-lg overflow-hidden"
                  >
                    {/* Section Header */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleSection(section.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleSection(section.id);
                        }
                      }}
                      className="
                        w-full flex items-center justify-between
                        px-4 py-3
                        bg-[var(--bg-elevated)]
                        hover:bg-[var(--bg-surface)]
                        transition-colors
                        text-left
                        cursor-pointer
                      "
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                        )}
                        <div>
                          <span className="text-xs font-medium text-[var(--color-interpretation)] uppercase tracking-wide">
                            {section.passage_section}
                          </span>
                          <p className="font-medium text-[var(--text-primary)] font-serif">
                            {section.section_heading}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-main)] px-2 py-1 rounded">
                          {section.questions.length} questions
                        </span>
                        {onRemoveSection && study.study_flow.length > 1 && (
                          <button
                            onClick={(e) => handleRemoveSection(section.id, e)}
                            className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Remove section"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Section Content */}
                    {isExpanded && (
                      <div className="px-4 py-4 border-t border-[var(--border-color)]">
                        {/* Passage Section Edit */}
                        {onUpdateSectionPassage && (
                          <div className="mb-4">
                            <EditableTextField
                              label="Passage Reference"
                              value={section.passage_section}
                              onChange={(value) => onUpdateSectionPassage(section.id, value)}
                              displayClassName="text-xs font-medium text-[var(--color-interpretation)] uppercase tracking-wide"
                              placeholder="e.g., Romans 8:1-4"
                            />
                          </div>
                        )}

                        {/* Section Heading Edit */}
                        <div className="mb-4">
                          <EditableTextField
                            label="Section Heading"
                            value={section.section_heading}
                            onChange={(value) => onUpdateSectionHeading(section.id, value)}
                            displayClassName="font-medium text-[var(--text-primary)]"
                          />
                        </div>

                        {/* Questions */}
                        <div className="mb-4">
                          <SortableQuestionList
                            sectionId={section.id}
                            questions={section.questions}
                            passageContext={passageContext}
                            onQuestionChange={(qId, question) =>
                              onUpdateQuestion(section.id, qId, { question })
                            }
                            onAnswerChange={(qId, answer) =>
                              onUpdateQuestion(section.id, qId, { answer })
                            }
                            onTypeChange={(qId, type) =>
                              onUpdateQuestion(section.id, qId, { type })
                            }
                            onDelete={(qId) => onRemoveQuestion(section.id, qId)}
                            onReorder={(from, to) => onReorderQuestions(section.id, from, to)}
                          />
                        </div>

                        {/* Add Question */}
                        <AddQuestionButton
                          onAdd={(type, question, answer) =>
                            onAddQuestion(section.id, type, question, answer)
                          }
                          compact
                        />

                        {/* Connection */}
                        {index < study.study_flow.length - 1 && (
                          <div className="mt-4 pt-4 border-t border-[var(--border-color)]/50">
                            <EditableTextField
                              label="Connection to Next Section"
                              value={section.connection || ''}
                              onChange={(value) => onUpdateSectionConnection(section.id, value)}
                              multiline
                              displayClassName="text-sm text-[var(--text-muted)] italic"
                              placeholder="How does this section connect to the next..."
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Section Button & Form */}
              {onAddSection && (
                <div className="mt-4">
                  {showAddSection ? (
                    <div className="border border-[var(--border-color)] rounded-lg p-4 bg-[var(--bg-surface)]">
                      <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                        Add New Section
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                            Passage Reference
                          </label>
                          <input
                            type="text"
                            value={newSectionPassage}
                            onChange={(e) => setNewSectionPassage(e.target.value)}
                            placeholder="e.g., Romans 8:5-8"
                            className="w-full px-3 py-2 text-sm bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                            Section Heading
                          </label>
                          <input
                            type="text"
                            value={newSectionHeading}
                            onChange={(e) => setNewSectionHeading(e.target.value)}
                            placeholder="e.g., Walking in the Spirit"
                            className="w-full px-3 py-2 text-sm bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setShowAddSection(false);
                              setNewSectionPassage('');
                              setNewSectionHeading('');
                            }}
                            className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddSection}
                            disabled={!newSectionPassage.trim() || !newSectionHeading.trim()}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-observation)] hover:bg-[var(--color-observation-dark)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add Section
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddSection(true)}
                      className="w-full py-3 border-2 border-dashed border-[var(--border-color)] rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--color-accent)] transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Section
                    </button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Application Questions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            <CardTitle>Personal Application</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              {study.application_questions.map((question) => (
                <EditableQuestionCard
                  key={question.id}
                  id={question.id}
                  type={question.type}
                  question={question.question}
                  passageContext={passageContext}
                  onQuestionChange={(q) =>
                    onUpdateApplicationQuestion(question.id, { question: q })
                  }
                  onTypeChange={(t) =>
                    onUpdateApplicationQuestion(question.id, { type: t })
                  }
                  onDelete={() => onRemoveApplicationQuestion(question.id)}
                />
              ))}
            </div>
            <AddQuestionButton
              onAdd={(_type, q) => onAddApplicationQuestion(q)}
              allowedTypes={['application', 'feeling']}
              compact
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Prayer Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-[var(--color-interpretation-light)] to-[var(--bg-elevated)] border-[var(--color-interpretation)]/20">
          <CardHeader className="flex flex-row items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[var(--color-interpretation)]" />
            <CardTitle>Prayer Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <EditableTextField
              value={study.prayer_prompt}
              onChange={onUpdatePrayerPrompt}
              multiline
              displayClassName="text-[var(--text-secondary)] italic leading-relaxed font-serif"
              placeholder="Enter a prayer focus for this passage..."
              enableAiToolbar
              context={passageContext}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
