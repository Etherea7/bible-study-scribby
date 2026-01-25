/**
 * PassagePanel - Displays Bible passage text with selection actions
 *
 * Features:
 * - Sticky positioning on scroll
 * - Text selection triggers floating toolbar
 * - Collapsible on desktop
 * - Clean, readable typography
 * - AI-powered explain and cross-reference features
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookText, ChevronLeft, X, Loader2, BookOpen, Link2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { FloatingToolbar } from '../ui/FloatingToolbar';
import { explainPassage, findCrossReferences } from '../../api/enhanceClient';
import { floatingToolbar } from '../../utils/animations';

interface PassagePanelProps {
  reference: string;
  text: string;
  onToggleCollapse?: () => void;
}

export function PassagePanel({
  reference,
  text,
  onToggleCollapse,
}: PassagePanelProps) {
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [showToolbar, setShowToolbar] = useState(false);
  const passageRef = useRef<HTMLDivElement>(null);

  // AI results state
  const [isLoading, setIsLoading] = useState(false);
  const [resultType, setResultType] = useState<'explain' | 'crossref' | null>(null);
  const [explainResult, setExplainResult] = useState<string | null>(null);
  const [crossRefResults, setCrossRefResults] = useState<Array<{ reference: string; note: string }> | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Process verse numbers in the text
  const processedText = text.replace(/(\d+)\s/g, '<sup>$1</sup> ');

  // Handle text selection
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowToolbar(false);
      setSelectedText('');
      return;
    }

    const text = selection.toString().trim();

    // Only show toolbar for meaningful selections (10+ chars)
    if (text.length < 10) {
      setShowToolbar(false);
      setSelectedText('');
      return;
    }

    // Check if selection is within the passage panel
    if (passageRef.current && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (passageRef.current.contains(range.commonAncestorContainer)) {
        const rect = range.getBoundingClientRect();

        // Position toolbar above the selection
        setToolbarPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10, // 10px above selection
        });

        setSelectedText(text);
        setShowToolbar(true);
      }
    }
  }, []);

  // Listen for selection changes
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection);
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, [handleSelection]);

  // Handle toolbar actions
  const handleExplainText = async () => {
    console.log('[Dev] Explain text action:', selectedText);
    setShowToolbar(false);
    setIsLoading(true);
    setResultType('explain');
    setExplainResult(null);
    setCrossRefResults(null);
    setAiError(null);

    try {
      const explanation = await explainPassage(selectedText, text);
      setExplainResult(explanation);
    } catch (error) {
      console.error('Failed to explain text:', error);
      setAiError(error instanceof Error ? error.message : 'Failed to get explanation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindCrossReference = async () => {
    console.log('[Dev] Find cross-reference action:', selectedText);
    setShowToolbar(false);
    setIsLoading(true);
    setResultType('crossref');
    setExplainResult(null);
    setCrossRefResults(null);
    setAiError(null);

    try {
      const refs = await findCrossReferences(selectedText, reference);
      setCrossRefResults(refs);
    } catch (error) {
      console.error('Failed to find cross-references:', error);
      setAiError(error instanceof Error ? error.message : 'Failed to find cross-references');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseToolbar = () => {
    setShowToolbar(false);
    window.getSelection()?.removeAllRanges();
  };

  const handleCloseResults = () => {
    setResultType(null);
    setExplainResult(null);
    setCrossRefResults(null);
    setAiError(null);
  };

  return (
    <div className="relative">
      <Card
        className="lg:sticky lg:top-24 h-full overflow-y-auto"
        variant="elevated"
      >
        <CardHeader className="border-b-0 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--color-accent)]">
              <BookText className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-widest">
                Scripture
              </span>
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="
                  hidden lg:flex
                  p-1.5
                  rounded-lg
                  hover:bg-[var(--bg-surface)]
                  text-[var(--text-muted)]
                  hover:text-[var(--text-primary)]
                  transition-colors
                "
                title="Collapse passage panel"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>
          <CardTitle as="h2" className="mt-1">
            {reference}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div
            ref={passageRef}
            className="passage-text select-text"
            dangerouslySetInnerHTML={{ __html: processedText }}
          />
        </CardContent>
      </Card>

      {/* Floating Toolbar for Text Selection */}
      {showToolbar && selectedText && (
        <FloatingToolbar
          selectedText={selectedText}
          position={toolbarPosition}
          context={text}
          mode="passage"
          onExplain={handleExplainText}
          onFindCrossReference={handleFindCrossReference}
          onReplace={(newText) => {
            console.log('[Dev] Replace text:', newText);
            // Note: Passage text is read-only, so this is primarily for rephrase/shorten
            // which we might not want to support for the Bible text itself
          }}
          onClose={handleCloseToolbar}
        />
      )}

      {/* AI Results Panel */}
      <AnimatePresence>
        {(isLoading || resultType) && (
          <motion.div
            variants={floatingToolbar}
            initial="initial"
            animate="animate"
            exit="exit"
            className="
              mt-4 p-4
              bg-[var(--bg-elevated)]
              border border-[var(--border-color)]
              rounded-xl
              shadow-lg
            "
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {resultType === 'explain' ? (
                  <BookOpen className="h-4 w-4 text-[var(--color-observation)]" />
                ) : (
                  <Link2 className="h-4 w-4 text-[var(--color-interpretation)]" />
                )}
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {resultType === 'explain' ? 'Explanation' : 'Cross References'}
                </span>
              </div>
              <button
                onClick={handleCloseResults}
                className="p-1 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  {resultType === 'explain' ? 'Getting explanation...' : 'Finding cross-references...'}
                </span>
              </div>
            )}

            {aiError && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                {aiError}
              </div>
            )}

            {explainResult && (
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                {explainResult}
              </p>
            )}

            {crossRefResults && crossRefResults.length > 0 && (
              <ul className="space-y-2">
                {crossRefResults.map((ref, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-medium text-sm text-[var(--color-accent)] whitespace-nowrap">
                      {ref.reference}
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {ref.note}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {crossRefResults && crossRefResults.length === 0 && !isLoading && (
              <p className="text-sm text-[var(--text-muted)] italic">
                No cross-references found.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
