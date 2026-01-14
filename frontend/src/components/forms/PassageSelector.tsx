import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { BIBLE_BOOKS, getVerseCount, getChapterCount, validateVerseRange } from '../../utils/bibleData';

interface PassageSelectorProps {
  onSubmit: (book: string, chapter: number, startVerse?: number, endVerse?: number) => void;
  loading?: boolean;
  initialBook?: string;
  initialChapter?: number;
  initialStartVerse?: number;
  initialEndVerse?: number;
}

export function PassageSelector({
  onSubmit,
  loading = false,
  initialBook = 'John',
  initialChapter = 1,
  initialStartVerse = 1,
  initialEndVerse = 18,
}: PassageSelectorProps) {
  const [book, setBook] = useState(initialBook);
  const [chapter, setChapter] = useState(initialChapter);
  const [startVerse, setStartVerse] = useState(initialStartVerse);
  const [endVerse, setEndVerse] = useState(initialEndVerse);
  const [error, setError] = useState<string | null>(null);

  const maxChapters = getChapterCount(book);
  const maxVerses = getVerseCount(book, chapter);

  // Reset chapter when book changes
  useEffect(() => {
    const newMaxChapters = getChapterCount(book);
    if (chapter > newMaxChapters) {
      setChapter(1);
    }
  }, [book, chapter]);

  // Reset verses when chapter changes
  useEffect(() => {
    const newMaxVerses = getVerseCount(book, chapter);
    if (startVerse > newMaxVerses) {
      setStartVerse(1);
    }
    if (endVerse > newMaxVerses) {
      setEndVerse(newMaxVerses);
    }
  }, [book, chapter, startVerse, endVerse]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!validateVerseRange(book, chapter, startVerse, endVerse)) {
      setError('Invalid verse range');
      return;
    }

    onSubmit(book, chapter, startVerse, endVerse);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Book Select */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="book" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Book
          </label>
          <select
            id="book"
            value={book}
            onChange={(e) => setBook(e.target.value)}
            className={selectBaseClasses}
          >
            {BIBLE_BOOKS.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chapter Select */}
        <div>
          <label htmlFor="chapter" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Chapter
          </label>
          <select
            id="chapter"
            value={chapter}
            onChange={(e) => setChapter(Number(e.target.value))}
            className={selectBaseClasses}
          >
            {Array.from({ length: maxChapters }, (_, i) => i + 1).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Start Verse */}
        <div>
          <label htmlFor="startVerse" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            From Verse
          </label>
          <select
            id="startVerse"
            value={startVerse}
            onChange={(e) => setStartVerse(Number(e.target.value))}
            className={selectBaseClasses}
          >
            {Array.from({ length: maxVerses }, (_, i) => i + 1).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* End Verse */}
        <div>
          <label htmlFor="endVerse" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            To Verse
          </label>
          <select
            id="endVerse"
            value={endVerse}
            onChange={(e) => setEndVerse(Number(e.target.value))}
            className={selectBaseClasses}
          >
            {Array.from({ length: maxVerses }, (_, i) => i + 1)
              .filter((v) => v >= startVerse)
              .map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full md:w-auto">
        <Search className="h-4 w-4 mr-2" />
        Generate Study Guide
      </Button>
    </form>
  );
}
