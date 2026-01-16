/**
 * EditableTextField - Click to edit inline text field
 *
 * Features:
 * - Click to edit
 * - Textarea for multiline, input for single line
 * - Required field validation
 * - Native keyboard shortcuts (Ctrl+Z/C/X/V work automatically)
 * - AI FloatingToolbar for text selection (rephrase/shorten)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { Edit2 } from 'lucide-react';
import { FloatingToolbar } from './FloatingToolbar';
import { isEnhanceAvailable } from '../../api/enhanceClient';

interface EditableTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  displayClassName?: string;
  label?: string;
  enableAiToolbar?: boolean;  // Enable FloatingToolbar for AI text enhancement
  context?: string;           // Context for AI enhancement (e.g., passage text)
}

export function EditableTextField({
  value,
  onChange,
  placeholder = 'Click to edit...',
  multiline = false,
  required = false,
  error,
  className,
  displayClassName,
  label,
  enableAiToolbar = false,
  context,
}: EditableTextFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // AI Toolbar state
  const [selection, setSelection] = useState<{
    text: string;
    start: number;
    end: number;
    position: { x: number; y: number };
  } | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);

  // Check AI availability on mount
  useEffect(() => {
    if (enableAiToolbar) {
      isEnhanceAvailable().then(setAiAvailable);
    }
  }, [enableAiToolbar]);

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle text selection for AI toolbar
  const handleSelectionChange = useCallback(() => {
    if (!enableAiToolbar || !aiAvailable || !inputRef.current) return;

    const el = inputRef.current;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selectedText = localValue.substring(start, end);

    // Only show toolbar for non-trivial selections (at least 10 chars)
    if (selectedText.trim().length >= 10) {
      // Get position for toolbar
      const rect = el.getBoundingClientRect();
      setSelection({
        text: selectedText,
        start,
        end,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.bottom + 8,
        },
      });
    } else {
      setSelection(null);
    }
  }, [enableAiToolbar, aiAvailable, localValue]);

  // Handle AI text replacement
  const handleAiReplace = useCallback((newText: string) => {
    if (!selection) return;

    // Replace the selected text with the AI result
    const before = localValue.substring(0, selection.start);
    const after = localValue.substring(selection.end);
    const newValue = before + newText + after;

    setLocalValue(newValue);
    onChange(newValue);
    setSelection(null);
  }, [selection, localValue, onChange]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    // Delay blur to allow toolbar click
    setTimeout(() => {
      if (!selection) {
        setIsEditing(false);
        if (localValue !== value) {
          onChange(localValue);
        }
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setLocalValue(value);
      setSelection(null);
    }
    // For single-line, Enter saves
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    }
  };

  // Clear selection when clicking elsewhere
  const handleCloseToolbar = useCallback(() => {
    setSelection(null);
  }, []);

  const showError = required && !localValue.trim();

  if (isEditing) {
    const commonProps = {
      ref: inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>,
      value: localValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setLocalValue(e.target.value),
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      onSelect: handleSelectionChange,
      onMouseUp: handleSelectionChange,
      placeholder,
      className: clsx(
        'w-full bg-transparent border-b-2 focus:outline-none transition-colors',
        showError
          ? 'border-red-500 focus:border-red-600'
          : 'border-[var(--color-observation)] focus:border-[var(--color-observation-dark)]',
        className
      ),
    };

    return (
      <div>
        {label && (
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide block mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {multiline ? (
          <textarea {...commonProps} rows={3} />
        ) : (
          <input type="text" {...commonProps} />
        )}
        {showError && (
          <p className="text-red-500 text-xs mt-1">{error || 'This field is required'}</p>
        )}

        {/* AI Floating Toolbar */}
        {selection && enableAiToolbar && (
          <FloatingToolbar
            selectedText={selection.text}
            position={selection.position}
            context={context}
            onReplace={handleAiReplace}
            onClose={handleCloseToolbar}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {label && (
        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide block mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div
        onClick={handleClick}
        className={clsx(
          'group cursor-text rounded px-2 py-1 -mx-2 -my-1 transition-colors',
          'hover:bg-[var(--bg-elevated)]/50',
          showError && 'border border-red-300 bg-red-50/30',
          displayClassName
        )}
      >
        <div className="flex items-start gap-2">
          <span className={clsx('flex-1', !value && 'text-[var(--text-muted)] italic')}>
            {value || placeholder}
          </span>
          <Edit2 className="h-3 w-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-50 flex-shrink-0 mt-1" />
        </div>
      </div>
      {showError && (
        <p className="text-red-500 text-xs mt-1">{error || 'This field is required'}</p>
      )}
    </div>
  );
}
