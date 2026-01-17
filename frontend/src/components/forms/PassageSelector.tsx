import { useState, useEffect, useMemo } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { BookSearchCombobox } from './BookSearchCombobox';
import { PassagePreview } from './PassagePreview';
import {
  getVerseCount,
  getChapterCount,
  validateCrossChapterRange,
  type PassageRange
} from '../../utils/bibleData';

interface PassageSelectorProps {
  onSubmit: (
    book: string,
    startChapter: number,
    startVerse: number,
    endChapter: number,
    endVerse: number
  ) => void;
  loading?: boolean;
  initialBook?: string;
  initialStartChapter?: number;
  initialStartVerse?: number;
  initialEndChapter?: number;
  initialEndVerse?: number;
}

export function PassageSelector({
  onSubmit,
  loading = false,
  initialBook = 'John',
  initialStartChapter = 1,
  initialStartVerse = 1,
  initialEndChapter = 1,
  initialEndVerse = 18,
}: PassageSelectorProps) {
  const [book, setBook] = useState(initialBook);
  const [startChapter, setStartChapter] = useState(initialStartChapter);
  const [startVerse, setStartVerse] = useState(initialStartVerse);
  const [endChapter, setEndChapter] = useState(initialEndChapter);
  const [endVerse, setEndVerse] = useState(initialEndVerse);
  const [error, setError] = useState<string | null>(null);

  const maxChapters = getChapterCount(book);
  const startMaxVerses = getVerseCount(book, startChapter);
  const endMaxVerses = getVerseCount(book, endChapter);

  // Current passage range for preview
  const passageRange: PassageRange = useMemo(() => ({
    book,
    startChapter,
    startVerse,
    endChapter,
    endVerse,
  }), [book, startChapter, startVerse, endChapter, endVerse]);

  // Reset chapters when book changes
  useEffect(() => {
    const newMaxChapters = getChapterCount(book);
    if (startChapter > newMaxChapters) {
      setStartChapter(1);
      setEndChapter(1);
    }
    if (endChapter > newMaxChapters) {
      setEndChapter(Math.min(endChapter, newMaxChapters));
    }
  }, [book]);

  // Ensure end chapter >= start chapter
  useEffect(() => {
    if (endChapter < startChapter) {
      setEndChapter(startChapter);
    }
  }, [startChapter]);

  // Reset start verse when start chapter changes
  useEffect(() => {
    const newMaxVerses = getVerseCount(book, startChapter);
    if (startVerse > newMaxVerses) {
      setStartVerse(1);
    }
  }, [book, startChapter]);

  // Reset end verse when end chapter changes or when verses become invalid
  useEffect(() => {
    const newMaxVerses = getVerseCount(book, endChapter);
    if (endVerse > newMaxVerses) {
      setEndVerse(newMaxVerses);
    }
    // If same chapter, end verse must be >= start verse
    if (startChapter === endChapter && endVerse < startVerse) {
      setEndVerse(startVerse);
    }
  }, [book, startChapter, endChapter, startVerse]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!validateCrossChapterRange(passageRange)) {
      setError('Invalid verse range');
      return;
    }

    onSubmit(book, startChapter, startVerse, endChapter, endVerse);
  };

  const handleBookChange = (newBook: string) => {
    setBook(newBook);
    // Reset to reasonable defaults when book changes
    setStartChapter(1);
    setStartVerse(1);
    setEndChapter(1);
    const firstChapterVerses = getVerseCount(newBook, 1);
    setEndVerse(Math.min(18, firstChapterVerses));
  };

  const selectBaseClasses = `
    w-full px-3 py-2.5
    bg-[var(--bg-elevated)]
    border border-[var(--border-color)]
    rounded-lg
    focus:ring-2 focus:ring-[var(--color-observation)]/30 focus:border-[var(--color-observation)]
    text-[var(--text-primary)]
    transition-all duration-200
    cursor-pointer
    appearance-none
    bg-no-repeat bg-[length:1rem] bg-[right_0.75rem_center]
  `.trim();

  // Generate chapter options
  const chapterOptions = Array.from({ length: maxChapters }, (_, i) => i + 1);

  // Generate verse options for start (1 to max)
  const startVerseOptions = Array.from({ length: startMaxVerses }, (_, i) => i + 1);

  // Generate verse options for end
  // If same chapter, must be >= startVerse, otherwise 1 to max
  const endVerseOptions = useMemo(() => {
    const options = Array.from({ length: endMaxVerses }, (_, i) => i + 1);
    if (startChapter === endChapter) {
      return options.filter(v => v >= startVerse);
    }
    return options;
  }, [endMaxVerses, startChapter, endChapter, startVerse]);

  // End chapter options: must be >= startChapter
  const endChapterOptions = chapterOptions.filter(c => c >= startChapter);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Book Selector */}
      <BookSearchCombobox
        value={book}
        onChange={handleBookChange}
      />

      {/* Chapter/Verse Range Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FROM Section */}
        <div className="p-4 rounded-lg bg-[var(--bg-elevated)]/50 border border-[var(--border-color)]">
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            From
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startChapter" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Chapter
              </label>
              <select
                id="startChapter"
                value={startChapter}
                onChange={(e) => setStartChapter(Number(e.target.value))}
                className={selectBaseClasses}
              >
                {chapterOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startVerse" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Verse
              </label>
              <select
                id="startVerse"
                value={startVerse}
                onChange={(e) => setStartVerse(Number(e.target.value))}
                className={selectBaseClasses}
              >
                {startVerseOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TO Section */}
        <div className="p-4 rounded-lg bg-[var(--bg-elevated)]/50 border border-[var(--border-color)]">
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            To
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="endChapter" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Chapter
              </label>
              <select
                id="endChapter"
                value={endChapter}
                onChange={(e) => setEndChapter(Number(e.target.value))}
                className={selectBaseClasses}
              >
                {endChapterOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="endVerse" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Verse
              </label>
              <select
                id="endVerse"
                value={endVerse}
                onChange={(e) => setEndVerse(Number(e.target.value))}
                className={selectBaseClasses}
              >
                {endVerseOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Passage Preview */}
      <PassagePreview range={passageRange} />

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-generate w-full md:w-auto"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Sparkles className="h-5 w-5 sparkle-icon" />
        )}
        {loading ? 'Generating...' : 'Generate Study Guide'}
      </button>
    </form>
  );
}
