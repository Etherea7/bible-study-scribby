/**
 * Normalization utilities for Saved Studies export
 *
 * Ensures all keys are present in exported data, even if values are empty.
 * This enables strict validation on import.
 */

import type {
  EditableQuestion,
  EditableCrossReference,
  EditableStudyFlowSection,
  EditableStudyFull,
  SavedStudyRecord,
} from '../types';

/**
 * Normalize an EditableQuestion, ensuring all keys are present
 */
export function normalizeQuestion(q: Partial<EditableQuestion> | undefined): EditableQuestion {
  return {
    id: q?.id ?? crypto.randomUUID(),
    type: q?.type ?? 'observation',
    question: q?.question ?? '',
    answer: q?.answer ?? '',
  };
}

/**
 * Normalize an EditableCrossReference, ensuring all keys are present
 */
export function normalizeCrossReference(
  cr: Partial<EditableCrossReference> | undefined
): EditableCrossReference {
  return {
    id: cr?.id ?? crypto.randomUUID(),
    reference: cr?.reference ?? '',
    note: cr?.note ?? '',
  };
}

/**
 * Normalize an EditableStudyFlowSection, ensuring all keys are present
 */
export function normalizeSection(
  s: Partial<EditableStudyFlowSection> | undefined
): EditableStudyFlowSection {
  return {
    id: s?.id ?? crypto.randomUUID(),
    passage_section: s?.passage_section ?? '',
    section_heading: s?.section_heading ?? '',
    questions: (s?.questions ?? []).map(normalizeQuestion),
    connection: s?.connection ?? '',
  };
}

/**
 * Normalize an EditableStudyFull, ensuring all keys are present
 */
export function normalizeStudy(
  study: Partial<EditableStudyFull> | undefined
): EditableStudyFull {
  return {
    id: study?.id ?? crypto.randomUUID(),
    purpose: study?.purpose ?? '',
    context: study?.context ?? '',
    key_themes: study?.key_themes ?? [],
    study_flow: (study?.study_flow ?? []).map(normalizeSection),
    summary: study?.summary ?? '',
    application_questions: (study?.application_questions ?? []).map(normalizeQuestion),
    cross_references: (study?.cross_references ?? []).map(normalizeCrossReference),
    prayer_prompt: study?.prayer_prompt ?? '',
    lastModified: study?.lastModified ?? undefined,
    isEdited: study?.isEdited ?? false,
    isSaved: study?.isSaved ?? true,
  };
}

/**
 * Normalize a SavedStudyRecord for export, ensuring all keys present
 */
export function normalizeSavedStudyRecord(
  record: Partial<SavedStudyRecord> | undefined
): SavedStudyRecord {
  return {
    id: record?.id ?? crypto.randomUUID(),
    reference: record?.reference ?? '',
    passageText: record?.passageText ?? '',
    study: normalizeStudy(record?.study),
    provider: record?.provider ?? undefined,
    savedAt: record?.savedAt ?? new Date(),
  };
}
