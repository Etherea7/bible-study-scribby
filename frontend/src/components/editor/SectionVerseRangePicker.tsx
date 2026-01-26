/**
 * SectionVerseRangePicker - Inline verse range selector for adding sections
 *
 * Provides constrained chapter:verse selection within a study's passage bounds.
 * Validates that new sections don't exceed the study's passage range.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { getVerseCount } from '../../utils/bibleData';

export interface ParsedReference {
  book: string;
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
}

interface SectionVerseRangePickerProps {
  passageRange: ParsedReference;
  existingSections?: Array<{ passage_section: string }>;
  onAdd: (passageSection: string, heading: string) => void;
  onCancel: () => void;
}

export function SectionVerseRangePicker({
  passageRange,
  existingSections: _existingSections = [],
  onAdd,
  onCancel,
}: SectionVerseRangePickerProps) {
  const { book, startChapter, startVerse, endChapter, endVerse } = passageRange;

  // State for the new section
  const [sectionStartChapter, setSectionStartChapter] = useState(startChapter);
  const [sectionStartVerse, setSectionStartVerse] = useState(startVerse);
  const [sectionEndChapter, setSectionEndChapter] = useState(startChapter);
  const [sectionEndVerse, setSectionEndVerse] = useState(startVerse + 4 > getVerseCount(book, startChapter) ? getVerseCount(book, startChapter) : startVerse + 4);
  const [heading, setHeading] = useState('');

  // Generate chapter options (constrained to passage range)
  const chapterOptions: number[] = [];
  for (let ch = startChapter; ch <= endChapter; ch++) {
    chapterOptions.push(ch);
  }

  // Generate verse options for start (constrained by chapter)
  const getStartVerseOptions = (chapter: number): number[] => {
    const maxVerse = getVerseCount(book, chapter);
    const options: number[] = [];

    const minVerse = chapter === startChapter ? startVerse : 1;
    const limitVerse = chapter === endChapter ? endVerse : maxVerse;

    for (let v = minVerse; v <= limitVerse; v++) {
      options.push(v);
    }
    return options;
  };

  // Generate verse options for end (constrained by start selection)
  const getEndVerseOptions = (chapter: number): number[] => {
    const maxVerse = getVerseCount(book, chapter);
    const options: number[] = [];

    const minVerse = chapter === sectionStartChapter ? sectionStartVerse : 1;
    const limitVerse = chapter === endChapter ? endVerse : maxVerse;

    for (let v = minVerse; v <= limitVerse; v++) {
      options.push(v);
    }
    return options;
  };

  // Validate end selection when start changes
  useEffect(() => {
    // If end chapter is before start chapter, fix it
    if (sectionEndChapter < sectionStartChapter) {
      setSectionEndChapter(sectionStartChapter);
    }

    // If same chapter and end verse is before start verse, fix it
    if (sectionEndChapter === sectionStartChapter && sectionEndVerse < sectionStartVerse) {
      setSectionEndVerse(sectionStartVerse);
    }
  }, [sectionStartChapter, sectionStartVerse, sectionEndChapter, sectionEndVerse]);

  // Build the passage section string
  const buildPassageSection = (): string => {
    if (sectionStartChapter === sectionEndChapter) {
      if (sectionStartVerse === sectionEndVerse) {
        return `${book} ${sectionStartChapter}:${sectionStartVerse}`;
      }
      return `${book} ${sectionStartChapter}:${sectionStartVerse}-${sectionEndVerse}`;
    }
    return `${book} ${sectionStartChapter}:${sectionStartVerse}-${sectionEndChapter}:${sectionEndVerse}`;
  };

  const handleAdd = () => {
    if (!heading.trim()) return;
    const passageSection = buildPassageSection();
    onAdd(passageSection, heading.trim());
  };

  const isValid = heading.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--bg-surface)] space-y-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-[var(--text-primary)]">Add Section</h4>
        <button
          onClick={onCancel}
          className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Verse Range Selection */}
      <div className="space-y-3">
        {/* Start Selection */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] w-12">From:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--text-secondary)]">Ch.</span>
            <select
              value={sectionStartChapter}
              onChange={(e) => {
                const ch = parseInt(e.target.value, 10);
                setSectionStartChapter(ch);
                // Reset start verse to first available for this chapter
                const options = getStartVerseOptions(ch);
                if (options.length > 0 && !options.includes(sectionStartVerse)) {
                  setSectionStartVerse(options[0]);
                }
              }}
              className="
                px-2 py-1.5
                bg-[var(--bg-elevated)]
                border border-[var(--border-color)]
                rounded-md
                text-sm text-[var(--text-primary)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50
              "
            >
              {chapterOptions.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
            <span className="text-xs text-[var(--text-secondary)]">v.</span>
            <select
              value={sectionStartVerse}
              onChange={(e) => setSectionStartVerse(parseInt(e.target.value, 10))}
              className="
                px-2 py-1.5
                bg-[var(--bg-elevated)]
                border border-[var(--border-color)]
                rounded-md
                text-sm text-[var(--text-primary)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50
              "
            >
              {getStartVerseOptions(sectionStartChapter).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* End Selection */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] w-12">To:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--text-secondary)]">Ch.</span>
            <select
              value={sectionEndChapter}
              onChange={(e) => {
                const ch = parseInt(e.target.value, 10);
                setSectionEndChapter(ch);
                // Reset end verse if needed
                const options = getEndVerseOptions(ch);
                if (options.length > 0 && !options.includes(sectionEndVerse)) {
                  setSectionEndVerse(options[0]);
                }
              }}
              className="
                px-2 py-1.5
                bg-[var(--bg-elevated)]
                border border-[var(--border-color)]
                rounded-md
                text-sm text-[var(--text-primary)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50
              "
            >
              {chapterOptions
                .filter((ch) => ch >= sectionStartChapter)
                .map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
            </select>
            <span className="text-xs text-[var(--text-secondary)]">v.</span>
            <select
              value={sectionEndVerse}
              onChange={(e) => setSectionEndVerse(parseInt(e.target.value, 10))}
              className="
                px-2 py-1.5
                bg-[var(--bg-elevated)]
                border border-[var(--border-color)]
                rounded-md
                text-sm text-[var(--text-primary)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50
              "
            >
              {getEndVerseOptions(sectionEndChapter).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview */}
        <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-3 py-2 rounded">
          Preview: <span className="font-medium text-[var(--text-secondary)]">{buildPassageSection()}</span>
        </div>
      </div>

      {/* Section Heading */}
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1.5">Section Heading</label>
        <input
          type="text"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="e.g., The Eternal Word"
          className="
            w-full px-3 py-2
            bg-[var(--bg-elevated)]
            border border-[var(--border-color)]
            rounded-lg
            text-sm text-[var(--text-primary)]
            placeholder:text-[var(--text-muted)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50
          "
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isValid) handleAdd();
            if (e.key === 'Escape') onCancel();
          }}
          autoFocus
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleAdd}
          disabled={!isValid}
          className="
            flex items-center gap-1.5
            px-4 py-2 text-sm font-medium
            text-white bg-[var(--color-observation)]
            hover:bg-[var(--color-observation-dark)]
            rounded-lg
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
        <button
          onClick={onCancel}
          className="
            px-4 py-2 text-sm
            text-[var(--text-secondary)]
            hover:text-[var(--text-primary)]
            transition-colors
          "
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
