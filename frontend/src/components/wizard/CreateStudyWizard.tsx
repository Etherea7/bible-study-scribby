import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles, FileText, Wand2 } from 'lucide-react';
import { PassageSelector } from '../forms/PassageSelector';
import { PassagePreview } from '../forms/PassagePreview';
import { useStudyGeneration } from '../../hooks/useStudyGeneration';
import { useApiKeys } from '../../hooks/useApiKeys';
import { createBlankStudy } from '../../utils/blankStudy';
import { fetchPassage } from '../../api/llmClient';
import { fetchPassageFromServer } from '../../api/studyApi';
import { formatReference } from '../../utils/formatReference';
import { LoadingOverlay } from '../ui/LoadingSpinner';
import type { PassageRange } from '../../utils/bibleData';
import {
  modalOverlay,
  modalContent,
  springGentle,
} from '../../utils/animations';

interface CreateStudyWizardProps {
  onClose: () => void;
}

type WizardStep = 'select' | 'verify' | 'method';

export function CreateStudyWizard({ onClose }: CreateStudyWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>('select');
  const [selectedPassage, setSelectedPassage] = useState<{
    book: string;
    startChapter: number;
    startVerse: number;
    endChapter: number;
    endVerse: number;
  } | null>(null);
  const [contextNote, setContextNote] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMutation = useStudyGeneration();
  const { apiKeys } = useApiKeys();

  // Called by PassageSelector's onChange when selection changes
  const handlePassageChange = (
    book: string,
    startChapter: number,
    startVerse: number,
    endChapter: number,
    endVerse: number
  ) => {
    setSelectedPassage({ book, startChapter, startVerse, endChapter, endVerse });
    // Don't auto-advance - let Continue button handle navigation
  };

  const handleCreateBlank = async () => {
    if (!selectedPassage) return;

    setIsGenerating(true);

    const reference = formatReference(
      selectedPassage.book,
      selectedPassage.startChapter,
      selectedPassage.startVerse,
      selectedPassage.endChapter,
      selectedPassage.endVerse
    );

    try {
      // Fetch passage text
      let passageText = '';
      if (apiKeys.esvApiKey) {
        passageText = await fetchPassage(reference, apiKeys.esvApiKey);
      } else {
        passageText = await fetchPassageFromServer(reference);
      }

      // Create blank study
      const blank = createBlankStudy(reference);

      // Close wizard before navigation to prevent race conditions
      onClose();

      // Navigate to editor with blank study data in state
      navigate('/editor', {
        state: {
          reference,
          passageText,
          study: blank,
          provider: 'manual',
        },
      });
    } catch (error) {
      console.error('Failed to create blank study:', error);
      alert('Failed to fetch passage. Please check your reference.');
      setIsGenerating(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedPassage) return;

    setIsGenerating(true);

    try {
      const result = await generateMutation.mutateAsync({
        book: selectedPassage.book,
        chapter: selectedPassage.startChapter,
        start_verse: selectedPassage.startVerse,
        end_chapter: selectedPassage.endChapter,
        end_verse: selectedPassage.endVerse,
      });

      // Close wizard before navigation to prevent race conditions
      onClose();

      // Navigate to editor with generated study
      navigate('/editor', {
        state: {
          reference: result.reference,
          passageText: result.passage_text,
          study: result.study,
          provider: result.provider,
        },
      });
    } catch (error) {
      console.error('Failed to generate study:', error);
      alert('Failed to generate study. Please try again.');
      setIsGenerating(false);
    }
  };

  const passageRange: PassageRange | null = selectedPassage
    ? {
      book: selectedPassage.book,
      startChapter: selectedPassage.startChapter,
      startVerse: selectedPassage.startVerse,
      endChapter: selectedPassage.endChapter,
      endVerse: selectedPassage.endVerse,
    }
    : null;

  // Using optimized animations from animations.ts
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: springGentle,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -40 : 40,
      opacity: 0,
      transition: { duration: 0.2 },
    }),
  };

  const stepDirection = step === 'select' ? -1 : step === 'verify' ? 0 : 1;

  return (
    <>
      {isGenerating && <LoadingOverlay />}

      <AnimatePresence mode="wait">
        <motion.div
          key="wizard-overlay"
          variants={modalOverlay}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[var(--bg-elevated)] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden will-animate"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-observation)] to-[var(--color-interpretation)] flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-semibold text-[var(--text-primary)]">
                    Create New Study
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    {step === 'select' && 'Step 1: Select Passage'}
                    {step === 'verify' && 'Step 2: Verify & Preview'}
                    {step === 'method' && 'Step 3: Choose Method'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-surface)]">
              {(['select', 'verify', 'method'] as WizardStep[]).map((s, index) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`
                      h-1.5 rounded-full flex-1 transition-all duration-300
                      ${s === step
                        ? 'bg-[var(--color-observation)]'
                        : index < ['select', 'verify', 'method'].indexOf(step)
                          ? 'bg-[var(--color-observation)]/50'
                          : 'bg-[var(--border-color)]'
                      }
                    `}
                  />
                  {index < 2 && (
                    <div className="w-2 h-1.5 bg-[var(--border-color)] rounded-full mx-1" />
                  )}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <AnimatePresence mode="wait" custom={stepDirection}>
                {step === 'select' && (
                  <motion.div
                    key="select"
                    custom={stepDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    <PassageSelector
                      onSubmit={() => { }} // No-op, using onChange instead
                      onChange={handlePassageChange}
                      loading={false}
                      hidePreview={true}
                      hideSubmitButton={true}
                    />
                  </motion.div>
                )}

                {step === 'verify' && passageRange && (
                  <motion.div
                    key="verify"
                    custom={stepDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                        Preview Your Selection
                      </h3>
                      <PassagePreview range={passageRange} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Context or Focus (Optional)
                      </label>
                      <textarea
                        value={contextNote}
                        onChange={(e) => setContextNote(e.target.value)}
                        placeholder="E.g., 'Focus on covenant theology' or 'Study for small group discussion'"
                        rows={3}
                        className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-observation)]/50 resize-none"
                      />
                      <p className="text-xs text-[var(--text-muted)] mt-1.5">
                        Add context to help guide AI generation (not used for blank studies)
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === 'method' && (
                  <motion.div
                    key="method"
                    custom={stepDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                      How would you like to create your study?
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Blank Study Option */}
                      <button
                        onClick={handleCreateBlank}
                        disabled={isGenerating}
                        className="
                          group relative p-6 rounded-xl border-2 border-[var(--border-color)]
                          hover:border-[var(--color-observation)] hover:bg-[var(--bg-surface)]
                          transition-all duration-200 text-left
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      >
                        <div className="w-12 h-12 rounded-lg bg-[var(--color-sand)] group-hover:bg-[var(--color-observation)]/10 flex items-center justify-center mb-4 transition-colors">
                          <FileText className="h-6 w-6 text-[var(--text-primary)] group-hover:text-[var(--color-observation)] transition-colors" />
                        </div>
                        <h4 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--color-observation)] transition-colors">
                          Start Blank
                        </h4>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                          Create an empty study template to fill in manually. Perfect for personal
                          preparation without AI assistance.
                        </p>
                      </button>

                      {/* AI Generation Option */}
                      <button
                        onClick={handleGenerateAI}
                        disabled={isGenerating}
                        className="
                          group relative p-6 rounded-xl border-2 border-[var(--border-color)]
                          hover:border-[var(--color-interpretation)] hover:bg-[var(--bg-surface)]
                          transition-all duration-200 text-left
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--color-observation)]/10 to-[var(--color-interpretation)]/10 group-hover:from-[var(--color-observation)]/20 group-hover:to-[var(--color-interpretation)]/20 flex items-center justify-center mb-4 transition-colors">
                          <Wand2 className="h-6 w-6 text-[var(--color-interpretation)] transition-colors" />
                        </div>
                        <h4 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--color-interpretation)] transition-colors">
                          Generate with AI
                        </h4>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                          Let AI create observation, interpretation, and application questions with
                          sample answers to guide your study.
                        </p>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
              <button
                onClick={() => {
                  if (step === 'verify') setStep('select');
                  else if (step === 'method') setStep('verify');
                  else onClose();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {step === 'select' ? 'Cancel' : 'Back'}
              </button>

              {step !== 'method' && (
                <button
                  onClick={() => {
                    if (step === 'select' && selectedPassage) setStep('verify');
                    else if (step === 'verify') setStep('method');
                  }}
                  disabled={step === 'select' && !selectedPassage}
                  className="
                    inline-flex items-center gap-2 px-5 py-2.5
                    text-sm font-semibold text-white
                    bg-[var(--color-observation)] hover:bg-[var(--color-observation-dark)]
                    rounded-lg transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
