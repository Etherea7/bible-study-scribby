import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Sparkles, Info, Save, AlertCircle, RotateCcw, PenLine, X, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PassageSelector } from '../components/forms/PassageSelector';
import { PassageDisplay } from '../components/study/PassageDisplay';
import { StudyFlowEditor } from '../components/study/StudyFlowEditor';
import { EditableStudyGuide } from '../components/study/EditableStudyGuide';
import { DraggableColumn } from '../components/layout/DraggableColumn';
import { LoadingOverlay } from '../components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useStudyGeneration } from '../hooks/useStudyGeneration';
import { useEditableStudy } from '../hooks/useEditableStudy';
import { useBeforeUnload } from '../hooks/useBeforeUnload';
import { useSaveStudy } from '../hooks/useSavedStudies';
import { useApiKeys } from '../hooks/useApiKeys';
import { getColumnOrder, setColumnOrder, getCachedStudy, getCachedPassage, getSavedStudy } from '../db';
import { createBlankStudy } from '../utils/blankStudy';
import { exportStudyToWord } from '../utils/wordExport';
import { fetchPassage } from '../api/llmClient';
import { fetchPassageFromServer } from '../api/studyApi';
import type { Study, ColumnId, StudyFlowContext } from '../types';

// Column labels for display
const COLUMN_LABELS: Record<ColumnId, string> = {
  scripture: 'Scripture',
  flow: 'Study Flow',
  guide: 'Study Guide',
};

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentStudy, setCurrentStudy] = useState<{
    reference: string;
    passage_text: string;
    study: Study;
    provider: string;
  } | null>(null);

  // Column order state (persisted to Dexie)
  const [columnOrder, setColumnOrderState] = useState<ColumnId[]>([
    'scripture',
    'flow',
    'guide',
  ]);

  // Flow context for AI generation (future use)
  const [flowContext, setFlowContext] = useState<StudyFlowContext | undefined>();

  // Blank study modal state
  const [showBlankStudyModal, setShowBlankStudyModal] = useState(false);
  const [blankStudyReference, setBlankStudyReference] = useState('');
  const [blankStudyLoading, setBlankStudyLoading] = useState(false);
  const [blankStudyError, setBlankStudyError] = useState<string | null>(null);

  const generateMutation = useStudyGeneration();
  const saveStudyMutation = useSaveStudy();
  const { apiKeys } = useApiKeys();

  // Editable study hook
  const editableStudy = useEditableStudy(currentStudy?.study || null);

  // Warn user before leaving with unsaved changes
  useBeforeUnload(editableStudy.isDirty);

  // Ctrl+S keyboard shortcut to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Allow save if there's a study and it's either not saved yet or has changes
        const canSave = currentStudy && editableStudy.study &&
          (!editableStudy.study.isSaved || editableStudy.isDirty);
        if (canSave) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editableStudy.isDirty, editableStudy.study, currentStudy]);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Load saved column order on mount
  useEffect(() => {
    getColumnOrder().then(setColumnOrderState);
  }, []);

  // Load study from URL parameter (when coming from history or saved page)
  useEffect(() => {
    const ref = searchParams.get('ref');
    const savedId = searchParams.get('saved');

    if (savedId) {
      // Load from saved studies
      const loadFromSaved = async () => {
        const savedStudy = await getSavedStudy(savedId);
        if (savedStudy) {
          console.log(`[Dev] Loading saved study: ${savedStudy.reference} (provider: ${savedStudy.provider})`);
          setCurrentStudy({
            reference: savedStudy.reference,
            passage_text: savedStudy.passageText,
            study: savedStudy.study as unknown as Study,
            provider: savedStudy.provider || 'saved',
          });
          // Initialize editable study with the saved study data
          editableStudy.setBlankStudy(savedStudy.study);
          // Clear the URL param after loading
          setSearchParams({}, { replace: true });
        } else {
          console.warn(`[Dev] Saved study not found: ${savedId}`);
        }
      };
      loadFromSaved();
    } else if (ref) {
      // Load from history/cache
      const loadFromHistory = async () => {
        const cachedStudy = await getCachedStudy(ref);
        const cachedPassage = await getCachedPassage(ref);
        if (cachedStudy && cachedPassage) {
          console.log(`[Dev] Loading study from history: ${ref} (provider: ${cachedStudy.provider})`);
          setCurrentStudy({
            reference: ref,
            passage_text: cachedPassage.text,
            study: cachedStudy.studyJson,
            provider: cachedStudy.provider,
          });
          // Clear the URL param after loading
          setSearchParams({}, { replace: true });
        } else {
          console.warn(`[Dev] Study not found in cache: ${ref}`);
        }
      };
      loadFromHistory();
    }
  }, [searchParams, setSearchParams]);

  // Handle drag end - reorder columns
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumnOrderState((prev) => {
        const oldIndex = prev.indexOf(active.id as ColumnId);
        const newIndex = prev.indexOf(over.id as ColumnId);
        const newOrder = arrayMove(prev, oldIndex, newIndex);
        // Persist to Dexie
        setColumnOrder(newOrder);
        return newOrder;
      });
    }
  }, []);

  const handleGenerateStudy = async (
    book: string,
    chapter: number,
    startVerse?: number,
    endVerse?: number
  ) => {
    const result = await generateMutation.mutateAsync({
      book,
      chapter,
      start_verse: startVerse,
      end_verse: endVerse,
    });

    console.log(`[Dev] Study generated: ${result.reference} (provider: ${result.provider})`);
    setCurrentStudy({
      reference: result.reference,
      passage_text: result.passage_text,
      study: result.study,
      provider: result.provider,
    });

    // Initialize flow context from generated study
    if (result.study.study_flow) {
      setFlowContext({
        sectionPurposes: result.study.study_flow.map((item) => ({
          passageSection: item.passage_section,
          purpose: `Study ${item.section_heading}`,
        })),
      });
    }
  };

  const handleSave = async () => {
    if (!currentStudy || !editableStudy.study) return;

    try {
      await saveStudyMutation.mutateAsync({
        reference: currentStudy.reference,
        passageText: currentStudy.passage_text,
        study: editableStudy.study,
        provider: currentStudy.provider,
      });
      // Mark as saved in editable study state
      editableStudy.markAsSaved();
      console.log(`[Dev] Study saved to Saved Studies: ${currentStudy.reference}`);
    } catch (error) {
      console.error('Failed to save study:', error);
    }
  };

  const handleDiscard = () => {
    if (
      window.confirm(
        'Are you sure you want to discard your changes? This cannot be undone.'
      )
    ) {
      editableStudy.discardChanges();
    }
  };

  const handleCreateBlankStudy = async () => {
    if (!blankStudyReference.trim()) return;

    const reference = blankStudyReference.trim();
    console.log(`[Dev] Creating blank study for: ${reference}`);

    setBlankStudyLoading(true);
    setBlankStudyError(null);

    let passageText = '';

    // Try to fetch passage text - first with user's key, then fallback to server
    try {
      if (apiKeys.esvApiKey) {
        // Use user's ESV API key (direct client-side call)
        passageText = await fetchPassage(reference, apiKeys.esvApiKey);
        console.log(`[Dev] ESV passage fetched for blank study (client-side)`);
      } else {
        // Fall back to server's ESV API
        passageText = await fetchPassageFromServer(reference);
        console.log(`[Dev] ESV passage fetched for blank study (server)`);
      }
    } catch (error) {
      console.warn(`[Dev] Failed to fetch passage for blank study:`, error);
      setBlankStudyError(
        error instanceof Error ? error.message : 'Failed to fetch passage. Check your reference format.'
      );
      setBlankStudyLoading(false);
      return;
    }

    const blank = createBlankStudy(reference);
    editableStudy.setBlankStudy(blank);

    // Set a minimal currentStudy for the UI to show
    setCurrentStudy({
      reference,
      passage_text: passageText,
      study: {
        purpose: '',
        context: '',
        key_themes: [],
        study_flow: [],
        summary: '',
        application_questions: [],
        cross_references: [],
        prayer_prompt: '',
      },
      provider: 'manual',
    });

    // Reset modal state
    setBlankStudyLoading(false);
    setShowBlankStudyModal(false);
    setBlankStudyReference('');
  };

  const handleExportToWord = async () => {
    if (!currentStudy || !editableStudy.study) return;

    try {
      console.log('[Dev] Exporting study to Word document');
      await exportStudyToWord(
        editableStudy.study,
        currentStudy.reference,
        currentStudy.passage_text
      );
    } catch (error) {
      console.error('Failed to export to Word:', error);
    }
  };

  // Render a column by its ID
  const renderColumn = (columnId: ColumnId) => {
    if (!currentStudy) return null;

    switch (columnId) {
      case 'scripture':
        return (
          <PassageDisplay
            reference={currentStudy.reference}
            text={currentStudy.passage_text}
          />
        );
      case 'flow':
        return (
          <StudyFlowEditor
            studyFlow={editableStudy.study?.study_flow || currentStudy.study.study_flow}
            flowContext={flowContext}
            onFlowContextChange={setFlowContext}
            editable={true}
            keyThemes={editableStudy.study?.key_themes}
            summary={editableStudy.study?.summary}
            crossReferences={editableStudy.study?.cross_references}
            passageContext={currentStudy.passage_text}
            onUpdateSummary={editableStudy.updateSummary}
            onAddTheme={editableStudy.addTheme}
            onUpdateTheme={editableStudy.updateTheme}
            onRemoveTheme={editableStudy.removeTheme}
            onAddCrossReference={editableStudy.addCrossReference}
            onUpdateCrossReference={editableStudy.updateCrossReference}
            onRemoveCrossReference={editableStudy.removeCrossReference}
          />
        );
      case 'guide':
        return editableStudy.study ? (
          <EditableStudyGuide
            study={editableStudy.study}
            passageContext={currentStudy.passage_text}
            validationErrors={editableStudy.validationErrors}
            onUpdatePurpose={editableStudy.updatePurpose}
            onUpdateContext={editableStudy.updateContext}
            onUpdatePrayerPrompt={editableStudy.updatePrayerPrompt}
            onAddQuestion={editableStudy.addQuestion}
            onUpdateQuestion={editableStudy.updateQuestion}
            onRemoveQuestion={editableStudy.removeQuestion}
            onReorderQuestions={editableStudy.reorderQuestions}
            onAddApplicationQuestion={editableStudy.addApplicationQuestion}
            onUpdateApplicationQuestion={editableStudy.updateApplicationQuestion}
            onRemoveApplicationQuestion={editableStudy.removeApplicationQuestion}
            onUpdateSectionHeading={editableStudy.updateSectionHeading}
            onUpdateSectionConnection={editableStudy.updateSectionConnection}
            onAddSection={editableStudy.addSection}
            onRemoveSection={editableStudy.removeSection}
            onUpdateSectionPassage={editableStudy.updateSectionPassage}
          />
        ) : null;
      default:
        return null;
    }
  };

  const hasValidationErrors = Object.keys(editableStudy.validationErrors).length > 0;

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      {generateMutation.isPending && <LoadingOverlay />}

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Discernment Disclaimer */}
        <div className="disclaimer-card flex items-start gap-3">
          <Info className="h-5 w-5 text-[var(--color-accent)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">
                Expository Bible Study Guide
              </span>
              {' '}&mdash; This tool generates AI-assisted study materials to help you
              explore Scripture. Please pray for discernment and verify all content
              against Scripture itself. AI-generated content should supplement, not
              replace, careful personal study and sound teaching.
            </p>
          </div>
        </div>

        {/* Passage Selector */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle as="h2" className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[var(--color-observation)]" />
                Select a Passage
              </CardTitle>
              <button
                onClick={() => setShowBlankStudyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-lg transition-colors"
              >
                <PenLine className="h-4 w-4" />
                New Blank Study
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <PassageSelector
              onSubmit={handleGenerateStudy}
              loading={generateMutation.isPending}
            />
          </CardContent>
        </Card>

        {/* Blank Study Modal */}
        <AnimatePresence>
          {showBlankStudyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowBlankStudyModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-[var(--bg-elevated)] rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <PenLine className="h-5 w-5 text-[var(--color-accent)]" />
                    Create Blank Study
                  </h3>
                  <button
                    onClick={() => setShowBlankStudyModal(false)}
                    className="p-1 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Create a blank study template to fill in manually without AI generation.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                      Passage Reference
                    </label>
                    <input
                      type="text"
                      value={blankStudyReference}
                      onChange={(e) => {
                        setBlankStudyReference(e.target.value);
                        setBlankStudyError(null);
                      }}
                      placeholder="e.g., Romans 8:1-4"
                      disabled={blankStudyLoading}
                      className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:opacity-50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && blankStudyReference.trim() && !blankStudyLoading) {
                          handleCreateBlankStudy();
                        }
                      }}
                      autoFocus
                    />
                  </div>

                  {/* ESV API key status */}
                  <div className={`text-xs px-3 py-2 rounded-lg ${apiKeys.esvApiKey
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                      : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                    }`}>
                    {apiKeys.esvApiKey
                      ? 'ESV API key configured - passage text will be fetched via your key'
                      : 'Passage text will be fetched via server'}
                  </div>

                  {/* Error display */}
                  {blankStudyError && (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                      {blankStudyError}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowBlankStudyModal(false);
                        setBlankStudyError(null);
                      }}
                      disabled={blankStudyLoading}
                      className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateBlankStudy}
                      disabled={!blankStudyReference.trim() || blankStudyLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {blankStudyLoading ? 'Fetching passage...' : 'Create Study'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {generateMutation.isError && (
          <Card className="mb-8 border-red-300 bg-red-50">
            <CardContent>
              <p className="text-red-700">
                {generateMutation.error?.message ||
                  'An error occurred while generating the study.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Study Display - 3 Column Drag-Drop Layout */}
        {currentStudy && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="mb-4 text-sm text-[var(--text-muted)] flex items-center gap-2">
              <span>Drag columns to reorder</span>
              <span className="text-xs">
                ({columnOrder.map((id) => COLUMN_LABELS[id]).join(' | ')})
              </span>
            </div>
            <SortableContext
              items={columnOrder}
              strategy={horizontalListSortingStrategy}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {columnOrder.map((columnId) => (
                  <DraggableColumn key={columnId} id={columnId}>
                    {renderColumn(columnId)}
                  </DraggableColumn>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Provider Badge - Below columns */}
        {currentStudy?.provider && (
          <div className="flex justify-end mt-4 mb-2">
            <span className="text-[var(--text-muted)] flex items-center gap-1.5 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Generated by {currentStudy.provider}
            </span>
          </div>
        )}

        {/* Save Bar - At bottom */}
        {currentStudy && (
          <div className="mt-6 flex items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              {editableStudy.isDirty && (
                <span className="text-amber-600 flex items-center gap-1.5 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Unsaved changes
                </span>
              )}
              {editableStudy.study?.isSaved && !editableStudy.isDirty && (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1.5 text-sm">
                  <Save className="h-4 w-4" />
                  Saved
                </span>
              )}
              {hasValidationErrors && (
                <span className="text-red-500 flex items-center gap-1.5 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Fix validation errors before saving
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportToWord}
                disabled={!editableStudy.study}
                className="
                  flex items-center gap-1.5 px-4 py-2
                  text-sm font-medium
                  text-[var(--text-secondary)]
                  hover:text-[var(--text-primary)]
                  hover:bg-[var(--bg-surface)]
                  rounded-lg
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                <FileDown className="h-4 w-4" />
                Export to Word
              </button>
              <button
                onClick={handleDiscard}
                disabled={!editableStudy.isDirty}
                className="
                  flex items-center gap-1.5 px-4 py-2
                  text-sm font-medium
                  text-[var(--text-secondary)]
                  hover:text-[var(--text-primary)]
                  hover:bg-[var(--bg-surface)]
                  rounded-lg
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                <RotateCcw className="h-4 w-4" />
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={
                  !editableStudy.study ||
                  hasValidationErrors ||
                  saveStudyMutation.isPending ||
                  (editableStudy.study?.isSaved && !editableStudy.isDirty)
                }
                className="
                  flex items-center gap-1.5 px-4 py-2
                  text-sm font-medium
                  bg-[var(--color-observation)] text-white
                  hover:bg-[var(--color-observation-dark)]
                  rounded-lg
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                <Save className="h-4 w-4" />
                {saveStudyMutation.isPending ? 'Saving...' : 'Save Study'}
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!currentStudy && !generateMutation.isPending && (
          <Card variant="elevated" className="text-center">
            <CardContent className="py-16">
              <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-observation)]/10 flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-[var(--color-observation)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] font-serif mb-2">
                Begin Your Study
              </h3>
              <p className="text-[var(--text-muted)] max-w-md mx-auto">
                Select a Bible passage above to generate an AI-powered study guide
                with observation, interpretation, and application questions.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
