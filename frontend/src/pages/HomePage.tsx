import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { BookOpen, Sparkles, Info, Save, AlertCircle, RotateCcw, PenLine, X, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PassageSelector } from '../components/forms/PassageSelector';
import { WorkspaceEditor } from '../components/editor';
import { LoadingOverlay } from '../components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useStudyGeneration } from '../hooks/useStudyGeneration';
import { useEditableStudy } from '../hooks/useEditableStudy';
import { useBeforeUnload } from '../hooks/useBeforeUnload';
import { useSaveStudy } from '../hooks/useSavedStudies';
import { useApiKeys } from '../hooks/useApiKeys';
import { getCachedStudy, getCachedPassage, getSavedStudy } from '../db';
import { createBlankStudy } from '../utils/blankStudy';
import { exportStudyToWord } from '../utils/wordExport';
import { formatReference } from '../utils/formatReference';
import { fetchPassage } from '../api/llmClient';
import { fetchPassageFromServer } from '../api/studyApi';
import type { Study } from '../types';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [currentStudy, setCurrentStudy] = useState<{
    reference: string;
    passage_text: string;
    study: Study;
    provider: string;
  } | null>(null);

  // Blank study modal state
  const [showBlankStudyModal, setShowBlankStudyModal] = useState(false);
  const [blankStudyLoading, setBlankStudyLoading] = useState(false);
  const [blankStudyError, setBlankStudyError] = useState<string | null>(null);
  const [blankStudyPassage, setBlankStudyPassage] = useState<{
    book: string;
    startChapter: number;
    startVerse: number;
    endChapter: number;
    endVerse: number;
  } | null>(null);

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

  // Load study from location state (when coming from wizard)
  useEffect(() => {
    if (location.state && typeof location.state === 'object') {
      const state = location.state as any;
      if (state.reference && state.passageText && state.study) {
        console.log(`[Dev] Loading study from wizard: ${state.reference} (provider: ${state.provider})`);
        setCurrentStudy({
          reference: state.reference,
          passage_text: state.passageText,
          study: state.study,
          provider: state.provider || 'unknown',
        });
        // Initialize editable study
        editableStudy.setBlankStudy(state.study);

        // Clear location state to prevent re-triggering on re-render
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

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

  const handleGenerateStudy = async (
    book: string,
    startChapter: number,
    startVerse: number,
    endChapter: number,
    endVerse: number
  ) => {
    const result = await generateMutation.mutateAsync({
      book,
      chapter: startChapter,
      start_verse: startVerse,
      end_chapter: endChapter,
      end_verse: endVerse,
    });

    console.log(`[Dev] Study generated: ${result.reference} (provider: ${result.provider})`);
    setCurrentStudy({
      reference: result.reference,
      passage_text: result.passage_text,
      study: result.study,
      provider: result.provider,
    });
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
    if (!blankStudyPassage) return;

    const { book, startChapter, startVerse, endChapter, endVerse } = blankStudyPassage;
    const reference = formatReference(book, startChapter, startVerse, endChapter, endVerse);
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
    setBlankStudyPassage(null);
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

  const hasValidationErrors = Object.keys(editableStudy.validationErrors).length > 0;

  return (
    <div className="min-h-full">
      {generateMutation.isPending && <LoadingOverlay />}

      <div className="max-w-[1600px] mx-auto">
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
              hidePreview={!!currentStudy}
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
                  {/* Passage Selector */}
                  <PassageSelector
                    onSubmit={() => {}}
                    onChange={(book, startChapter, startVerse, endChapter, endVerse) => {
                      setBlankStudyPassage({ book, startChapter, startVerse, endChapter, endVerse });
                      setBlankStudyError(null);
                    }}
                    loading={false}
                    hidePreview={true}
                    hideSubmitButton={true}
                  />

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
                        setBlankStudyPassage(null);
                      }}
                      disabled={blankStudyLoading}
                      className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateBlankStudy}
                      disabled={!blankStudyPassage || blankStudyLoading}
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

        {/* Workspace Editor - Split View Layout */}
        {currentStudy && editableStudy.study && (
          <WorkspaceEditor
            reference={currentStudy.reference}
            passageText={currentStudy.passage_text}
            editableStudy={editableStudy.study}
            validationErrors={editableStudy.validationErrors}
            passageContext={currentStudy.passage_text}
            onUpdatePurpose={editableStudy.updatePurpose}
            onUpdateContext={editableStudy.updateContext}
            onUpdateSummary={editableStudy.updateSummary}
            onUpdatePrayerPrompt={editableStudy.updatePrayerPrompt}
            onAddTheme={editableStudy.addTheme}
            onUpdateTheme={editableStudy.updateTheme}
            onRemoveTheme={editableStudy.removeTheme}
            onAddQuestion={editableStudy.addQuestion}
            onUpdateQuestion={editableStudy.updateQuestion}
            onRemoveQuestion={editableStudy.removeQuestion}
            onReorderQuestions={editableStudy.reorderQuestions}
            onAddApplicationQuestion={editableStudy.addApplicationQuestion}
            onUpdateApplicationQuestion={editableStudy.updateApplicationQuestion}
            onRemoveApplicationQuestion={editableStudy.removeApplicationQuestion}
            onAddCrossReference={editableStudy.addCrossReference}
            onUpdateCrossReference={editableStudy.updateCrossReference}
            onRemoveCrossReference={editableStudy.removeCrossReference}
            onUpdateSectionHeading={editableStudy.updateSectionHeading}
            onUpdateSectionConnection={editableStudy.updateSectionConnection}
            onUpdateSectionPassage={editableStudy.updateSectionPassage}
            onAddSection={editableStudy.addSection}
            onRemoveSection={editableStudy.removeSection}
            onReorderSections={editableStudy.reorderSections}
            onUpdateStudyNotes={editableStudy.updateStudyNotes}
          />
        )}

        {/* Provider Badge - Below workspace */}
        {currentStudy?.provider && (
          <div className="flex justify-end mt-6 mb-2">
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
