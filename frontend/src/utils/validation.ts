/**
 * Zod validation schemas for import/export data
 *
 * Validates JSON structure when importing study data backups.
 */

import { z } from 'zod';
import type { ExportData } from '../types';

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
  const errors = result.error.errors.map((e) => {
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
