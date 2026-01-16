/**
 * Zod validation schemas for import/export data
 *
 * Validates JSON structure when importing study data backups.
 */

import { z } from 'zod';
import type { ExportData, SavedStudyRecord } from '../types';

// Cross reference schema
const CrossReferenceSchema = z.object({
  reference: z.string(),
  note: z.string(),
});

// Study flow item schema
const StudyFlowItemSchema = z.object({
  passage_section: z.string(),
  section_heading: z.string(),
  observation_question: z.string(),
  observation_answer: z.string(),
  interpretation_question: z.string(),
  interpretation_answer: z.string(),
  connection: z.string().optional(),
});

// Full study schema
const StudySchema = z.object({
  purpose: z.string(),
  context: z.string(),
  key_themes: z.array(z.string()),
  study_flow: z.array(StudyFlowItemSchema),
  summary: z.string(),
  application_questions: z.array(z.string()),
  cross_references: z.array(CrossReferenceSchema),
  prayer_prompt: z.string(),
  error: z.boolean().optional(),
});

// Reading history item schema
const ReadingHistoryItemSchema = z.object({
  id: z.number().optional(),
  book: z.string(),
  chapter: z.number(),
  startVerse: z.number().optional(),
  endVerse: z.number().optional(),
  reference: z.string(),
  timestamp: z.union([z.string(), z.date()]),
  provider: z.string().optional(),
});

// Cached passage schema
const CachedPassageSchema = z.object({
  reference: z.string(),
  text: z.string(),
});

// Cached study schema
const CachedStudySchema = z.object({
  reference: z.string(),
  studyJson: StudySchema,
  generatedAt: z.union([z.string(), z.date()]),
  provider: z.string(),
});

// Full export data schema
export const ExportDataSchema = z.object({
  exportedAt: z.string(),
  version: z.string(),
  history: z.array(ReadingHistoryItemSchema),
  passages: z.array(CachedPassageSchema),
  studies: z.array(CachedStudySchema),
});

export interface ValidationResult {
  success: boolean;
  data?: ExportData;
  errors?: string[];
}

/**
 * Validate imported JSON data against the export schema
 *
 * @param data - Unknown data to validate (parsed JSON)
 * @returns ValidationResult with success status and either data or errors
 */
export function validateImportData(data: unknown): ValidationResult {
  const result = ExportDataSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data as ExportData,
    };
  }

  // Format error messages for user display
  const errors = result.error.issues.map((e) => {
    const path = e.path.join('.');
    return path ? `${path}: ${e.message}` : e.message;
  });

  return {
    success: false,
    errors,
  };
}

/**
 * Parse JSON string and validate
 *
 * @param jsonString - Raw JSON string to parse and validate
 * @returns ValidationResult
 */
export function parseAndValidateImport(jsonString: string): ValidationResult {
  try {
    const parsed = JSON.parse(jsonString);
    return validateImportData(parsed);
  } catch (e) {
    return {
      success: false,
      errors: [`Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`],
    };
  }
}

// ============================================================================
// Saved Studies Validation (Strict mode - rejects foreign keys)
// ============================================================================

/**
 * Editable question schema (strict - rejects unknown keys)
 */
const EditableQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['observation', 'interpretation', 'feeling', 'application']),
  question: z.string(),
  answer: z.string().optional(),
}).strict();

/**
 * Editable cross reference schema (strict)
 */
const EditableCrossReferenceSchema = z.object({
  id: z.string(),
  reference: z.string(),
  note: z.string(),
}).strict();

/**
 * Editable study flow section schema (strict)
 */
const EditableStudyFlowSectionSchema = z.object({
  id: z.string(),
  passage_section: z.string(),
  section_heading: z.string(),
  questions: z.array(EditableQuestionSchema),
  connection: z.string().optional(),
}).strict();

/**
 * Full editable study schema (strict)
 */
const EditableStudyFullSchema = z.object({
  id: z.string(),
  purpose: z.string(),
  context: z.string(),
  key_themes: z.array(z.string()),
  study_flow: z.array(EditableStudyFlowSectionSchema),
  summary: z.string(),
  application_questions: z.array(EditableQuestionSchema),
  cross_references: z.array(EditableCrossReferenceSchema),
  prayer_prompt: z.string(),
  lastModified: z.union([z.string(), z.date(), z.null()]).optional(),
  isEdited: z.boolean().optional(),
  isSaved: z.boolean().optional(),
}).strict();

/**
 * Saved study record schema (strict)
 */
export const SavedStudyRecordSchema = z.object({
  id: z.string(),
  reference: z.string(),
  passageText: z.string(),
  study: EditableStudyFullSchema,
  provider: z.string().optional(),
  savedAt: z.union([z.string(), z.date()]),
}).strict();

/**
 * Result of validating a single saved study
 */
export interface SingleStudyValidationResult {
  success: boolean;
  data?: SavedStudyRecord;
  error?: string;
}

/**
 * Validate a single saved study record
 */
export function validateSavedStudyRecord(record: unknown): SingleStudyValidationResult {
  const result = SavedStudyRecordSchema.safeParse(record);

  if (result.success) {
    return {
      success: true,
      data: result.data as SavedStudyRecord,
    };
  }

  // Format first error for display (most relevant)
  const firstIssue = result.error.issues[0];
  const path = firstIssue.path.join('.');
  const error = path ? `${path}: ${firstIssue.message}` : firstIssue.message;

  return {
    success: false,
    error,
  };
}

/**
 * Validate saved studies export structure (container only, not individual studies)
 * Checks for foreign keys at the top level.
 */
export function validateSavedStudiesExportStructure(data: unknown): {
  success: boolean;
  studies?: unknown[];
  version?: string;
  error?: string;
} {
  // Check basic structure
  if (typeof data !== 'object' || data === null) {
    return { success: false, error: 'Invalid format: expected object' };
  }

  const obj = data as Record<string, unknown>;

  if (!('savedStudies' in obj)) {
    return { success: false, error: 'Invalid format: missing savedStudies array' };
  }

  if (!Array.isArray(obj.savedStudies)) {
    return { success: false, error: 'Invalid format: savedStudies must be an array' };
  }

  // Check for foreign keys at the top level
  const allowedTopLevelKeys = ['exportedAt', 'version', 'savedStudies'];
  const foreignKeys = Object.keys(obj).filter((k) => !allowedTopLevelKeys.includes(k));

  if (foreignKeys.length > 0) {
    return {
      success: false,
      error: `Invalid format: unexpected keys at top level: ${foreignKeys.join(', ')}`,
    };
  }

  return {
    success: true,
    studies: obj.savedStudies,
    version: typeof obj.version === 'string' ? obj.version : undefined,
  };
}
