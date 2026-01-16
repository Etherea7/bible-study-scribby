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
  SavedStudyRecord,
  EditableStudyFull,
  SavedStudiesExport,
  SavedStudiesImportResult,
} from '../types';
import { normalizeSavedStudyRecord } from '../utils/normalizeStudy';
import {
  validateSavedStudiesExportStructure,
  validateSavedStudyRecord,
} from '../utils/validation';

class BibleStudyDB extends Dexie {
  readingHistory!: Table<ReadingHistoryItem>;
  cachedPassages!: Table<CachedPassage>;
  cachedStudies!: Table<CachedStudy>;
  editedStudies!: Table<EditedStudyRecord>;
  userPreferences!: Table<UserPreference>;
  savedStudies!: Table<SavedStudyRecord>;

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

    // Version 3: Add savedStudies table for user-saved studies
    this.version(3).stores({
      readingHistory: '++id, reference, timestamp',
      cachedPassages: 'reference',
      cachedStudies: 'reference',
      editedStudies: 'id, reference, lastModified',
      userPreferences: 'key',
      savedStudies: 'id, reference, savedAt',
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

// Saved Studies (user-saved studies for export)

/**
 * Save a study to saved studies
 */
export async function saveToSavedStudies(
  reference: string,
  passageText: string,
  study: EditableStudyFull,
  provider?: string
): Promise<string> {
  const id = crypto.randomUUID();
  await db.savedStudies.put({
    id,
    reference,
    passageText,
    study,
    provider,
    savedAt: new Date(),
  });
  return id;
}

/**
 * Get all saved studies, newest first
 */
export async function getSavedStudies(): Promise<SavedStudyRecord[]> {
  return await db.savedStudies
    .orderBy('savedAt')
    .reverse()
    .toArray();
}

/**
 * Get a saved study by ID
 */
export async function getSavedStudy(id: string): Promise<SavedStudyRecord | undefined> {
  return await db.savedStudies.get(id);
}

/**
 * Update a saved study
 */
export async function updateSavedStudy(record: SavedStudyRecord): Promise<void> {
  await db.savedStudies.put(record);
}

/**
 * Delete a saved study by ID
 */
export async function deleteSavedStudy(id: string): Promise<void> {
  await db.savedStudies.delete(id);
}

/**
 * Clear all saved studies
 */
export async function clearSavedStudies(): Promise<void> {
  await db.savedStudies.clear();
}

/**
 * Export saved studies as JSON (v2.0 with all keys normalized)
 *
 * All studies are normalized to ensure every key is present,
 * even if values are empty. This enables strict validation on import.
 */
export async function exportSavedStudies(): Promise<string> {
  const savedStudies = await db.savedStudies.toArray();

  // Normalize all studies to ensure all keys are present
  const normalizedStudies = savedStudies.map(normalizeSavedStudyRecord);

  const exportData: SavedStudiesExport = {
    exportedAt: new Date().toISOString(),
    version: '2.0',
    savedStudies: normalizedStudies,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import saved studies from JSON with per-study validation
 *
 * Each study is validated individually - valid ones import, invalid ones skip.
 * Returns detailed results showing what was imported and what failed.
 *
 * Supports both v1.0 (lenient) and v2.0 (strict) formats.
 */
export async function importSavedStudies(jsonString: string): Promise<SavedStudiesImportResult> {
  // Step 1: Parse JSON
  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [
        {
          index: -1,
          error: `Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`,
        },
      ],
    };
  }

  // Step 2: Validate top-level structure (check for foreign keys)
  const structureResult = validateSavedStudiesExportStructure(data);
  if (!structureResult.success) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [
        {
          index: -1,
          error: structureResult.error!,
        },
      ],
    };
  }

  const studies = structureResult.studies!;
  const version = structureResult.version;
  const errors: SavedStudiesImportResult['errors'] = [];
  let importedCount = 0;
  let skippedCount = 0;

  // Step 3: Validate and import each study individually
  for (let i = 0; i < studies.length; i++) {
    const studyData = studies[i];

    // Get reference for error reporting (if available)
    const reference =
      typeof studyData === 'object' && studyData !== null
        ? (studyData as Record<string, unknown>).reference as string | undefined
        : undefined;

    // For v1.0 files, normalize first then validate (lenient)
    // For v2.0 files, validate strictly (rejects foreign keys)
    let recordToImport: SavedStudyRecord | undefined;

    if (version === '1.0' || !version) {
      // Lenient mode for v1.0: normalize the data first
      try {
        const normalized = normalizeSavedStudyRecord(
          studyData as Partial<SavedStudyRecord>
        );
        recordToImport = normalized;
      } catch {
        skippedCount++;
        errors.push({
          index: i,
          reference,
          error: 'Failed to normalize study data',
        });
        continue;
      }
    } else {
      // Strict mode for v2.0+: validate with strict schema
      const validation = validateSavedStudyRecord(studyData);

      if (!validation.success) {
        skippedCount++;
        errors.push({
          index: i,
          reference,
          error: validation.error!,
        });
        continue;
      }

      recordToImport = validation.data!;
    }

    // Check if already exists by ID
    const existing = await db.savedStudies.get(recordToImport.id);
    if (existing) {
      skippedCount++;
      errors.push({
        index: i,
        reference: recordToImport.reference,
        error: 'Study already exists (duplicate ID)',
      });
      continue;
    }

    // Import the study
    try {
      await db.savedStudies.put({
        ...recordToImport,
        savedAt: new Date(recordToImport.savedAt),
      });
      importedCount++;
    } catch (e) {
      skippedCount++;
      errors.push({
        index: i,
        reference: recordToImport.reference,
        error: `Database error: ${e instanceof Error ? e.message : 'Unknown error'}`,
      });
    }
  }

  return {
    success: importedCount > 0 || studies.length === 0, // Success if at least one imported (or empty array)
    imported: importedCount,
    skipped: skippedCount,
    errors,
  };
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
