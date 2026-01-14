/**
 * Dexie.js Database
 *
 * Client-side IndexedDB storage for:
 * - Reading history
 * - Cached passages (ESV API responses)
 * - Cached studies (LLM responses)
 */

import Dexie, { type Table } from 'dexie';
import type { ReadingHistoryItem, CachedPassage, CachedStudy, Study } from '../types';

class BibleStudyDB extends Dexie {
  readingHistory!: Table<ReadingHistoryItem>;
  cachedPassages!: Table<CachedPassage>;
  cachedStudies!: Table<CachedStudy>;

  constructor() {
    super('BibleStudyDB');

    this.version(1).stores({
      readingHistory: '++id, reference, timestamp',
      cachedPassages: 'reference',
      cachedStudies: 'reference',
    });
  }
}

export const db = new BibleStudyDB();

// Helper functions

/**
 * Add a study to reading history
 */
export async function addToHistory(
  book: string,
  chapter: number,
  startVerse: number | undefined,
  endVerse: number | undefined,
  reference: string,
  provider?: string
): Promise<number> {
  return await db.readingHistory.add({
    book,
    chapter,
    startVerse,
    endVerse,
    reference,
    timestamp: new Date(),
    provider,
  });
}

/**
 * Get reading history, newest first
 */
export async function getHistory(limit = 50): Promise<ReadingHistoryItem[]> {
  return await db.readingHistory
    .orderBy('timestamp')
    .reverse()
    .limit(limit)
    .toArray();
}

/**
 * Delete a history item
 */
export async function deleteFromHistory(id: number): Promise<void> {
  await db.readingHistory.delete(id);
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  await db.readingHistory.clear();
}

/**
 * Get cached passage by reference
 */
export async function getCachedPassage(reference: string): Promise<CachedPassage | undefined> {
  return await db.cachedPassages.get(reference);
}

/**
 * Cache a passage
 */
export async function cachePassage(reference: string, text: string): Promise<void> {
  await db.cachedPassages.put({ reference, text });
}

/**
 * Get cached study by reference
 */
export async function getCachedStudy(reference: string): Promise<CachedStudy | undefined> {
  return await db.cachedStudies.get(reference);
}

/**
 * Cache a study
 */
export async function cacheStudy(
  reference: string,
  studyJson: Study,
  provider: string
): Promise<void> {
  await db.cachedStudies.put({
    reference,
    studyJson,
    generatedAt: new Date(),
    provider,
  });
}

/**
 * Export all data as JSON for backup
 */
export async function exportData(): Promise<string> {
  const history = await db.readingHistory.toArray();
  const passages = await db.cachedPassages.toArray();
  const studies = await db.cachedStudies.toArray();

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '2.0',
    history,
    passages,
    studies,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Download export data as JSON file
 */
export function downloadExport(data: string, filename?: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `bible-study-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Clear all cached data (but keep history)
 */
export async function clearCache(): Promise<void> {
  await Promise.all([
    db.cachedPassages.clear(),
    db.cachedStudies.clear(),
  ]);
}

/**
 * Clear everything
 */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.readingHistory.clear(),
    db.cachedPassages.clear(),
    db.cachedStudies.clear(),
  ]);
}
