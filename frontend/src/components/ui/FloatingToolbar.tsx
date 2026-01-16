/**
 * FloatingToolbar - AI-powered text enhancement toolbar
 *
 * Appears when text is selected in editable fields.
 * Provides quick actions to rephrase or shorten selected text using AI.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Minimize2, Loader2, X } from 'lucide-react';
import { rephraseText, shortenText } from '../../api/enhanceClient';

interface FloatingToolbarProps {
  selectedText: string;
  position: { x: number; y: number };
  context?: string;
  onReplace: (newText: string) => void;
  onClose: () => void;
}

export function FloatingToolbar({
  selectedText,
  position,
  context,
  onReplace,
  onClose,
}: FloatingToolbarProps) {
  const [isLoading, setIsLoading] = useState<'rephrase' | 'shorten' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRephrase = async () => {
    if (isLoading || !selectedText.trim()) return;

    setIsLoading('rephrase');
    setError(null);

    try {
      const result = await rephraseText(selectedText, context);
      console.log('[Dev] Text rephrased successfully');
      onReplace(result);
      onClose();
    } catch (err) {
      console.error('[Dev] Failed to rephrase text:', err);
      setError(err instanceof Error ? err.message : 'Failed to rephrase');
    } finally {
      setIsLoading(null);
    }
  };

  const handleShorten = async () => {
    if (isLoading || !selectedText.trim()) return;

    setIsLoading('shorten');
    setError(null);

    try {
      const result = await shortenText(selectedText, context);
      console.log('[Dev] Text shortened successfully');
      onReplace(result);
      onClose();
    } catch (err) {
      console.error('[Dev] Failed to shorten text:', err);
      setError(err instanceof Error ? err.message : 'Failed to shorten');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 5, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 5, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[100] flex flex-col items-center"
        style={{
          left: Math.max(10, Math.min(position.x, window.innerWidth - 180)),
          top: Math.max(10, position.y),
        }}
      >
        {/* Main toolbar */}
        <div className="flex items-center gap-1 px-2 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg shadow-lg">
          <button
            onClick={handleRephrase}
            disabled={!!isLoading}
            className="
              flex items-center gap-1.5 px-2.5 py-1.5
              text-xs font-medium
              text-[var(--text-secondary)]
              hover:text-[var(--text-primary)]
              hover:bg-[var(--bg-surface)]
              rounded-md
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
            title="Rephrase selected text with AI"
          >
            {isLoading === 'rephrase' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Rephrase
          </button>

          <div className="w-px h-4 bg-[var(--border-color)]" />

          <button
            onClick={handleShorten}
            disabled={!!isLoading}
            className="
              flex items-center gap-1.5 px-2.5 py-1.5
              text-xs font-medium
              text-[var(--text-secondary)]
              hover:text-[var(--text-primary)]
              hover:bg-[var(--bg-surface)]
              rounded-md
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
            title="Shorten selected text with AI"
          >
            {isLoading === 'shorten' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
            Shorten
          </button>

          <div className="w-px h-4 bg-[var(--border-color)]" />

          <button
            onClick={onClose}
            disabled={!!isLoading}
            className="
              p-1.5
              text-[var(--text-muted)]
              hover:text-[var(--text-primary)]
              hover:bg-[var(--bg-surface)]
              rounded-md
              disabled:opacity-50
              transition-colors
            "
            title="Close toolbar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 px-2 py-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded border border-red-200 dark:border-red-800 max-w-[200px]"
          >
            {error}
          </motion.div>
        )}

        {/* Pointer arrow */}
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[var(--bg-elevated)] border-t border-l border-[var(--border-color)]"
          style={{ display: 'none' }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
