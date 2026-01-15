/**
 * Dexie.js Database
 *
 * Client-side IndexedDB storage for:
 * - Reading history
 * - Cached passages (ESV API responses)
 * - Cached studies (LLM responses)
 */

import Dexie, { type Table } from 'dexie';
import type {
  ReadingHistoryItem,
  CachedPassage,
  CachedStudy,
  Study,
  EditedStudyRecord,
  UserPreference,
  ImportResult,
  ColumnId,
} from '../types';

class BibleStudyDB extends Dexie {
  readingHistory!: Table<ReadingHistoryItem>;
  cachedPassages!: Table<CachedPassage>;
  cachedStudies!: Table<CachedStudy>;
  editedStudies!: Table<EditedStudyRecord>;
  userPreferences!: Table<UserPreference>;

  constructor() {
    super('BibleStudyDB');

    // Version 1: Original schema
    this.version(1).stores({
      readingHistory: '++id, reference, timestamp',
      cachedPassages: 'reference',
      cachedStudies: 'reference',
    });

    // Version 2: Add editedStudies and userPreferences tables
    this.version(2).stores({
      readingHistory: '++id, reference, timestamp',
      cachedPassages: 'reference',
      cachedStudies: 'reference',
      editedStudies: 'id, reference, lastModified',
      userPreferences: 'key',
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
    db.editedStudies.clear(),
  ]);
}

// User Preferences

/**
 * Get a user preference by key
 */
export async function getUserPreference<T>(key: string, defaultValue: T): Promise<T> {
  const pref = await db.userPreferences.get(key);
  return pref ? (pref.value as T) : defaultValue;
}

/**
 * Set a user preference
 */
export async function setUserPreference<T>(key: string, value: T): Promise<void> {
  await db.userPreferences.put({ key, value });
}

/**
 * Get column order preference
 */
export async function getColumnOrder(): Promise<ColumnId[]> {
  return getUserPreference<ColumnId[]>('columnOrder', ['scripture', 'flow', 'guide']);
}

/**
 * Save column order preference
 */
export async function setColumnOrder(order: ColumnId[]): Promise<void> {
  await setUserPreference('columnOrder', order);
}

// Edited Studies

/**
 * Save an edited study
 */
export async function saveEditedStudy(record: EditedStudyRecord): Promise<void> {
  await db.editedStudies.put(record);
}

/**
 * Get edited study by reference
 */
export async function getEditedStudy(reference: string): Promise<EditedStudyRecord | undefined> {
  return await db.editedStudies.where('reference').equals(reference).first();
}

/**
 * Delete edited study by reference
 */
export async function deleteEditedStudy(reference: string): Promise<void> {
  await db.editedStudies.where('reference').equals(reference).delete();
}

// Import functionality

/**
 * Import data from JSON string with validation
 * Appends to existing data (does not replace)
 * Skips duplicate history entries by reference
 */
export async function importData(jsonString: string): Promise<ImportResult> {
  // Dynamic import to avoid circular dependency
  const { parseAndValidateImport } = await import('../utils/validation');

  const validation = parseAndValidateImport(jsonString);

  if (!validation.success || !validation.data) {
    return {
      success: false,
      imported: { history: 0, passages: 0, studies: 0 },
      errors: validation.errors,
    };
  }

  const data = validation.data;
  let historyCount = 0;
  let passageCount = 0;
  let studyCount = 0;

  try {
    // Import history items (skip duplicates by reference + timestamp combination)
    for (const item of data.history) {
      // Check if this exact entry already exists
      const existing = await db.readingHistory
        .where('reference')
        .equals(item.reference)
        .toArray();

      const itemTimestamp = new Date(item.timestamp).getTime();
      const isDuplicate = existing.some(
        (e) => new Date(e.timestamp).getTime() === itemTimestamp
      );

      if (!isDuplicate) {
        await db.readingHistory.add({
          ...item,
          id: undefined, // Let Dexie assign new ID
          timestamp: new Date(item.timestamp),
        });
        historyCount++;
      }
    }

    // Import passages (upsert - updates if exists)
    for (const passage of data.passages) {
      await db.cachedPassages.put(passage);
      passageCount++;
    }

    // Import studies (upsert - updates if exists)
    for (const study of data.studies) {
      await db.cachedStudies.put({
        ...study,
        generatedAt: new Date(study.generatedAt),
      });
      studyCount++;
    }

    return {
      success: true,
      imported: {
        history: historyCount,
        passages: passageCount,
        studies: studyCount,
      },
    };
  } catch (e) {
    return {
      success: false,
      imported: { history: historyCount, passages: passageCount, studies: studyCount },
      errors: [`Database error: ${e instanceof Error ? e.message : 'Unknown error'}`],
    };
  }
}
