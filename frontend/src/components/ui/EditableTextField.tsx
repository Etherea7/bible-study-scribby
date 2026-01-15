/**
 * EditableTextField - Click to edit inline text field
 *
 * Features:
 * - Click to edit
 * - Textarea for multiline, input for single line
 * - Required field validation
 * - Native keyboard shortcuts (Ctrl+Z/C/X/V work automatically)
 */

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Edit2 } from 'lucide-react';

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
}: EditableTextFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

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

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setLocalValue(value);
    }
    // For single-line, Enter saves
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    }
  };

  const showError = required && !localValue.trim();

  if (isEditing) {
    const commonProps = {
      ref: inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>,
      value: localValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setLocalValue(e.target.value),
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
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
