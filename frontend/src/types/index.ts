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

export interface BibleBook {
  name: string;
  chapters: number;
}
