/**
 * Format a Bible reference string
 */
export function formatReference(
  book: string,
  chapter: number,
  startVerse?: number,
  endVerse?: number
): string {
  if (startVerse && endVerse) {
    if (startVerse === endVerse) {
      return `${book} ${chapter}:${startVerse}`;
    }
    return `${book} ${chapter}:${startVerse}-${endVerse}`;
  }
  if (startVerse) {
    return `${book} ${chapter}:${startVerse}`;
  }
  return `${book} ${chapter}`;
}

/**
 * Parse a reference string back into components
 */
export function parseReference(reference: string): {
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
} | null {
  // Match patterns like "John 3:16", "John 3:16-18", "1 John 1:1-10"
  const match = reference.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);

  if (!match) return null;

  const [, book, chapterStr, startVerseStr, endVerseStr] = match;

  return {
    book,
    chapter: parseInt(chapterStr, 10),
    startVerse: startVerseStr ? parseInt(startVerseStr, 10) : undefined,
    endVerse: endVerseStr ? parseInt(endVerseStr, 10) : undefined,
  };
}
