/**
 * Format a Bible reference string
 * Supports same-chapter and cross-chapter ranges
 */
export function formatReference(
  book: string,
  startChapter: number,
  startVerse?: number,
  endChapter?: number,
  endVerse?: number
): string {
  // Default end chapter to start chapter if not provided
  const effectiveEndChapter = endChapter ?? startChapter;

  // No verses specified
  if (!startVerse) {
    if (startChapter === effectiveEndChapter) {
      return `${book} ${startChapter}`;
    }
    return `${book} ${startChapter}-${effectiveEndChapter}`;
  }

  // Same chapter case
  if (startChapter === effectiveEndChapter) {
    if (!endVerse || endVerse === startVerse) {
      return `${book} ${startChapter}:${startVerse}`;
    }
    return `${book} ${startChapter}:${startVerse}-${endVerse}`;
  }

  // Cross-chapter case
  if (!endVerse) {
    return `${book} ${startChapter}:${startVerse}-${effectiveEndChapter}`;
  }
  return `${book} ${startChapter}:${startVerse}-${effectiveEndChapter}:${endVerse}`;
}

/**
 * Parse a reference string back into components
 * Supports cross-chapter references like "John 1:1-2:10"
 */
export function parseReference(reference: string): {
  book: string;
  startChapter: number;
  startVerse?: number;
  endChapter?: number;
  endVerse?: number;
} | null {
  // Match patterns like:
  // "John 3:16" - single verse
  // "John 3:16-18" - same chapter range
  // "John 1:1-2:10" - cross-chapter range
  // "1 John 1:1-10" - books with numbers

  // Try cross-chapter pattern first: "Book Chapter:Verse-Chapter:Verse"
  const crossChapterMatch = reference.match(/^(.+?)\s+(\d+):(\d+)-(\d+):(\d+)$/);
  if (crossChapterMatch) {
    const [, book, startChapterStr, startVerseStr, endChapterStr, endVerseStr] = crossChapterMatch;
    return {
      book,
      startChapter: parseInt(startChapterStr, 10),
      startVerse: parseInt(startVerseStr, 10),
      endChapter: parseInt(endChapterStr, 10),
      endVerse: parseInt(endVerseStr, 10),
    };
  }

  // Same chapter pattern: "Book Chapter:Verse-Verse" or "Book Chapter:Verse"
  const sameChapterMatch = reference.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (sameChapterMatch) {
    const [, book, chapterStr, startVerseStr, endVerseStr] = sameChapterMatch;
    const chapter = parseInt(chapterStr, 10);
    return {
      book,
      startChapter: chapter,
      startVerse: startVerseStr ? parseInt(startVerseStr, 10) : undefined,
      endChapter: chapter,
      endVerse: endVerseStr ? parseInt(endVerseStr, 10) : (startVerseStr ? parseInt(startVerseStr, 10) : undefined),
    };
  }

  return null;
}
