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
  end_chapter?: number;  // Optional: defaults to same as chapter for backward compatibility
  end_verse?: number;
  provider?: string;  // Optional: override provider selection (openrouter, anthropic, google)
  model?: string;  // Optional: override model selection
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
  studyNotes?: string;  // Study-level notes/outline for the entire passage
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
export type LLMProvider = 'openrouter' | 'anthropic' | 'google' | 'auto';

// Model configuration for each provider
export interface ModelConfig {
  id: string;
  name: string;
  description?: string;
  isFree?: boolean;
}

// Available models per provider
export const PROVIDER_MODELS: Record<Exclude<LLMProvider, 'auto'>, ModelConfig[]> = {
  openrouter: [
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', description: 'Fast, free model', isFree: true },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', description: 'Larger free model', isFree: true },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', description: 'Fast Google model via OpenRouter' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Best for reasoning' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'OpenAI flagship model' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Latest Claude model' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Great for reasoning' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fast and efficient' },
  ],
  google: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast and capable' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Balanced speed/quality' },
  ],
};

// Default models per provider
export const DEFAULT_MODELS: Record<Exclude<LLMProvider, 'auto'>, string> = {
  openrouter: 'meta-llama/llama-3.2-3b-instruct:free',
  anthropic: 'claude-sonnet-4-20250514',
  google: 'gemini-2.0-flash',
};

// Provider metadata for UI display
export const PROVIDER_INFO: Record<Exclude<LLMProvider, 'auto'>, { name: string; description: string; corsEnabled: boolean }> = {
  openrouter: {
    name: 'OpenRouter',
    description: 'Access multiple models via one API. CORS-enabled for client-side calls.',
    corsEnabled: true,
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Claude models. Requires server proxy (no CORS).',
    corsEnabled: false,
  },
  google: {
    name: 'Google AI',
    description: 'Gemini models. Requires server proxy (no CORS).',
    corsEnabled: false,
  },
};

// Per-provider model selection
export interface ProviderModelSelection {
  openrouter?: string;
  anthropic?: string;
  google?: string;
}

export interface ApiKeySettings {
  esvApiKey?: string;
  openrouterApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  preferredProvider: LLMProvider;
  selectedModels: ProviderModelSelection;
}

// Edited study storage

export interface EditedStudyRecord {
  id: string;
  reference: string;
  study: EditableStudy;
  lastModified: Date;
}

// Saved study storage (user-saved studies for export)

export interface SavedStudyRecord {
  id: string;
  reference: string;
  passageText: string;
  study: EditableStudyFull;
  provider?: string;
  savedAt: Date;
}

// Saved studies export format

export interface SavedStudiesExport {
  exportedAt: string;
  version: string;
  savedStudies: SavedStudyRecord[];
}

// Saved studies import result (detailed per-study results)

export interface SavedStudiesImportResult {
  success: boolean; // true if at least one study imported (or empty array)
  imported: number; // count of successfully imported studies
  skipped: number; // count of invalid/duplicate studies
  errors: Array<{
    index: number; // position in array (0-indexed), -1 for structural errors
    reference?: string; // reference if available for identification
    error: string; // error message
  }>;
}
