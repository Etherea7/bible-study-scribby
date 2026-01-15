// Study types matching the backend JSON structure

export interface StudyFlowItem {
  passage_section: string;
  section_heading: string;
  observation_question: string;
  observation_answer: string;
  interpretation_question: string;
  interpretation_answer: string;
  connection?: string;
}

export interface CrossReference {
  reference: string;
  note: string;
}

export interface Study {
  purpose: string;
  context: string;
  key_themes: string[];
  study_flow: StudyFlowItem[];
  summary: string;
  application_questions: string[];
  cross_references: CrossReference[];
  prayer_prompt: string;
  error?: boolean;
}

export interface GenerateStudyResponse {
  reference: string;
  passage_text: string;
  study: Study;
  provider: string;
}

export interface GenerateStudyRequest {
  book: string;
  chapter: number;
  start_verse?: number;
  end_verse?: number;
}

// Database types

export interface ReadingHistoryItem {
  id?: number;
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  reference: string;
  timestamp: Date;
  provider?: string;
}

export interface CachedPassage {
  reference: string;
  text: string;
}

export interface CachedStudy {
  reference: string;
  studyJson: Study;
  generatedAt: Date;
  provider: string;
}

// Provider types

export interface ProviderStatus {
  available: boolean;
  model: string;
}

export interface ProvidersResponse {
  providers: Record<string, ProviderStatus>;
}

// UI types

export type QuestionType = 'observation' | 'interpretation' | 'application';

// Extended question type with "feeling" for personal reflection
export type EditableQuestionType = 'observation' | 'interpretation' | 'feeling' | 'application';

// Question with ID for tracking edits
export interface EditableQuestion {
  id: string;
  type: EditableQuestionType;
  question: string;
  answer?: string;  // Optional for application/feeling
}

// Cross reference with ID for tracking edits
export interface EditableCrossReference {
  id: string;
  reference: string;
  note: string;
}

// Study flow section with editable questions
export interface EditableStudyFlowSection {
  id: string;
  passage_section: string;
  section_heading: string;
  questions: EditableQuestion[];  // All questions for this section
  connection?: string;
}

// Full editable study structure
export interface EditableStudyFull {
  id: string;
  purpose: string;
  context: string;
  key_themes: string[];
  study_flow: EditableStudyFlowSection[];
  summary: string;
  application_questions: EditableQuestion[];
  cross_references: EditableCrossReference[];
  prayer_prompt: string;
  lastModified?: Date;
  isEdited?: boolean;
  isSaved?: boolean;  // Whether saved to history
}

export interface BibleBook {
  name: string;
  chapters: number;
}

// Column layout types (for 3-column drag-drop dashboard)

export type ColumnId = 'scripture' | 'flow' | 'guide';

export interface ColumnConfig {
  id: ColumnId;
  label: string;
  visible: boolean;
}

// Editable study types (for user modifications)

export interface EditableStudyFlowItem extends StudyFlowItem {
  id: string;
  purpose?: string;
  isEdited?: boolean;
}

export interface EditableStudy extends Study {
  id: string;
  study_flow: EditableStudyFlowItem[];
  lastModified?: Date;
  isEdited?: boolean;
}

// Study flow context (for AI generation with user-defined purposes)

export interface StudyFlowContext {
  sectionPurposes: {
    passageSection: string;
    purpose: string;
    focusAreas?: string[];
  }[];
}

// Import/Export types

export interface ExportData {
  exportedAt: string;
  version: string;
  history: ReadingHistoryItem[];
  passages: CachedPassage[];
  studies: CachedStudy[];
}

export interface ImportResult {
  success: boolean;
  imported: {
    history: number;
    passages: number;
    studies: number;
  };
  errors?: string[];
}

// User preferences (stored in Dexie)

export interface UserPreference {
  key: string;
  value: unknown;
}

// API Key settings for client-side LLM calls
export type LLMProvider = 'openrouter' | 'groq' | 'gemini' | 'claude' | 'auto';

export interface ApiKeySettings {
  esvApiKey?: string;
  openrouterApiKey?: string;
  groqApiKey?: string;
  geminiApiKey?: string;
  anthropicApiKey?: string;
  preferredProvider: LLMProvider;
}

// Edited study storage

export interface EditedStudyRecord {
  id: string;
  reference: string;
  study: EditableStudy;
  lastModified: Date;
}
