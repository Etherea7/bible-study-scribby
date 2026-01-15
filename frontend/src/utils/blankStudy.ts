/**
 * Create a blank study template for manual study creation.
 *
 * This allows users to create studies without AI generation.
 */

import type { EditableStudyFull } from '../types';

/**
 * Create a blank editable study with minimal structure.
 *
 * @param reference - The passage reference (e.g., "Romans 8:1-4")
 * @returns A blank EditableStudyFull with one empty section
 */
export function createBlankStudy(reference: string): EditableStudyFull {
  return {
    id: crypto.randomUUID(),
    purpose: '', // User fills in (required)
    context: '', // User fills in (required)
    key_themes: [],
    study_flow: [
      {
        id: crypto.randomUUID(),
        passage_section: reference,
        section_heading: 'Section 1',
        questions: [],
        connection: '',
      },
    ],
    summary: '',
    application_questions: [],
    cross_references: [],
    prayer_prompt: '',
    lastModified: new Date(),
    isEdited: true, // Mark as edited since user needs to fill in
    isSaved: false,
  };
}
