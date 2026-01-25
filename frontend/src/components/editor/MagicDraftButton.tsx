/**
 * MagicDraftButton - AI-powered content drafting button
 *
 * Appears when a section has no content or minimal content.
 * Uses AI to generate draft questions, context, or other content.
 */

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface MagicDraftButtonProps {
  label: string;
  disabled?: boolean;
  onDraft: () => Promise<void>;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
  isLoading?: boolean; // External loading state (overrides internal)
}

export function MagicDraftButton({
  label,
  disabled = false,
  onDraft,
  variant = 'secondary',
  size = 'md',
  isLoading: externalLoading,
}: MagicDraftButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  const handleClick = async () => {
    if (disabled || isLoading) return;

    // Only use internal loading if external is not controlled
    if (externalLoading === undefined) {
      setInternalLoading(true);
    }
    try {
      await onDraft();
      console.log(`[Dev] ${label} completed successfully`);
    } catch (error) {
      console.error(`[Dev] ${label} failed:`, error);
    } finally {
      if (externalLoading === undefined) {
        setInternalLoading(false);
      }
    }
  };

  const isPrimary = variant === 'primary';
  const isSmall = size === 'sm';

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        relative
        flex items-center justify-center gap-1.5
        ${isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'}
        font-medium
        rounded-lg
        transition-all duration-200
        ${
          isPrimary
            ? `
              bg-gradient-to-r from-purple-500 to-blue-500
              text-white
              hover:from-purple-600 hover:to-blue-600
              shadow-md hover:shadow-lg
            `
            : `
              bg-[var(--bg-surface)]
              text-[var(--text-secondary)]
              hover:text-[var(--text-primary)]
              hover:bg-[var(--bg-elevated)]
              border border-[var(--border-color)]
              hover:border-[var(--color-accent)]
            `
        }
        disabled:opacity-50
        disabled:cursor-not-allowed
        group
      `}
    >
      {isLoading ? (
        <Loader2 className={`${isSmall ? 'h-3 w-3' : 'h-4 w-4'} animate-spin`} />
      ) : (
        <Sparkles
          className={`
            ${isSmall ? 'h-3 w-3' : 'h-4 w-4'}
            ${isPrimary ? 'animate-pulse' : 'group-hover:animate-pulse'}
          `}
        />
      )}
      <span>{isLoading ? 'Drafting...' : label}</span>

      {/* Gradient border effect for primary variant */}
      {isPrimary && !disabled && (
        <div
          className="
            absolute inset-0
            rounded-lg
            bg-gradient-to-r from-purple-500 to-blue-500
            opacity-0 group-hover:opacity-20
            transition-opacity duration-200
            pointer-events-none
          "
        />
      )}
    </motion.button>
  );
}
