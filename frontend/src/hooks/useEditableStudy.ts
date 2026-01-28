/**
 * useEditableStudy - Hook for managing editable study state
 *
 * Features:
 * - Converts a Study to an EditableStudyFull with UUIDs
 * - Tracks modifications with isDirty flag
 * - Manual save only (no auto-save)
 * - Provides update functions for all fields
 * - Supports question CRUD and reordering
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { addToHistory } from '../db';
import type {
  Study,
  EditableStudyFull,
  EditableQuestion,
  EditableCrossReference,
  EditableQuestionType,
} from '../types';

// Generate a simple UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Check if the study is already in editable format
function isEditableStudy(study: Study | EditableStudyFull): study is EditableStudyFull {
  // Check if it has the specific structure of an editable study
  // Key indicators: study_flow items have 'questions' array instead of specific question fields
  // OR application_questions contains objects instead of strings
  if (study.study_flow.length > 0) {
    return 'questions' in study.study_flow[0];
  }
  if (study.application_questions.length > 0) {
    return typeof study.application_questions[0] !== 'string';
  }
  // Fallback if empty arrays (check for other fields if needed, or assume raw Study)
  return 'isEdited' in study;
}

// Convert a Study to an EditableStudyFull
function toEditableStudy(study: Study | EditableStudyFull): EditableStudyFull {
  // If it's already an editable study (e.g. from saved studies), return it directly
  // We perform a shallow clone to avoid mutation issues
  if (isEditableStudy(study)) {
    return {
      ...study,
      // Reset these for a fresh session? Or keep them?
      // When loading a saved study, we usually want to treat it as "saved" initially
      // But the logic in useEffect below will set internal state. 
      // Important: Ensure deep consistency if needed.
    };
  }

  // Otherwise convert raw Study to EditableStudyFull
  const rawStudy = study as Study;
  return {
    id: generateId(),
    purpose: rawStudy.purpose,
    context: rawStudy.context,
    key_themes: [...rawStudy.key_themes],
    study_flow: rawStudy.study_flow.map((item) => ({
      id: generateId(),
      passage_section: item.passage_section,
      section_heading: item.section_heading,
      questions: [
        {
          id: generateId(),
          type: 'observation' as EditableQuestionType,
          question: item.observation_question,
          answer: item.observation_answer,
        },
        {
          id: generateId(),
          type: 'interpretation' as EditableQuestionType,
          question: item.interpretation_question,
          answer: item.interpretation_answer,
        },
      ],
      connection: item.connection,
    })),
    summary: rawStudy.summary,
    application_questions: rawStudy.application_questions.map((q) => ({
      id: generateId(),
      type: 'application' as EditableQuestionType,
      question: q,
    })),
    cross_references: rawStudy.cross_references.map((ref) => ({
      id: generateId(),
      reference: ref.reference,
      note: ref.note,
    })),
    prayer_prompt: rawStudy.prayer_prompt,
    studyNotes: '',
    lastModified: new Date(),
    isEdited: false,
    isSaved: false,
  };
}

interface UseEditableStudyResult {
  study: EditableStudyFull | null;
  isDirty: boolean;
  isSaving: boolean;
  validationErrors: { purpose?: string; context?: string };

  // Field updaters
  updatePurpose: (value: string) => void;
  updateContext: (value: string) => void;
  updateSummary: (value: string) => void;
  updatePrayerPrompt: (value: string) => void;

  // Theme management
  addTheme: (theme: string) => void;
  updateTheme: (index: number, value: string) => void;
  removeTheme: (index: number) => void;

  // Question management (within study flow sections)
  addQuestion: (sectionId: string, type: EditableQuestionType, question: string, answer?: string) => void;
  updateQuestion: (sectionId: string, questionId: string, updates: Partial<EditableQuestion>) => void;
  removeQuestion: (sectionId: string, questionId: string) => void;
  reorderQuestions: (sectionId: string, fromIndex: number, toIndex: number) => void;

  // Application questions (separate section)
  addApplicationQuestion: (question: string) => void;
  updateApplicationQuestion: (id: string, updates: Partial<EditableQuestion>) => void;
  removeApplicationQuestion: (id: string) => void;

  // Cross references
  addCrossReference: (reference: string, note: string) => void;
  updateCrossReference: (id: string, updates: Partial<EditableCrossReference>) => void;
  removeCrossReference: (id: string) => void;

  // Section management
  updateSectionHeading: (sectionId: string, heading: string) => void;
  updateSectionConnection: (sectionId: string, connection: string) => void;
  updateSectionPassage: (sectionId: string, passage: string) => void;
  addSection: (passageSection: string, heading: string) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;

  // Study-level notes
  updateStudyNotes: (notes: string) => void;

  // Actions
  saveToHistory: (reference: string, passageText: string, provider: string) => Promise<void>;
  discardChanges: () => void;
  setBlankStudy: (blankStudy: EditableStudyFull | Study) => void;
  markAsSaved: () => void;
}

export function useEditableStudy(
  initialStudy: Study | EditableStudyFull | null
): UseEditableStudyResult {
  const [study, setStudy] = useState<EditableStudyFull | null>(null);
  const [originalStudy, setOriginalStudy] = useState<Study | EditableStudyFull | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize editable study from initial study
  useEffect(() => {
    if (initialStudy) {
      setStudy(toEditableStudy(initialStudy));
      setOriginalStudy(initialStudy);
    } else {
      setStudy(null);
      setOriginalStudy(null);
    }
  }, [initialStudy]);

  // Validation errors
  const validationErrors = useMemo(() => {
    const errors: { purpose?: string; context?: string } = {};
    if (study && !study.purpose.trim()) {
      errors.purpose = 'Purpose statement is required';
    }
    if (study && !study.context.trim()) {
      errors.context = 'Context is required';
    }
    return errors;
  }, [study]);

  // Check if study has been modified
  const isDirty = useMemo(() => {
    return study?.isEdited ?? false;
  }, [study]);

  // Field updaters
  const updatePurpose = useCallback((value: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return { ...prev, purpose: value, isEdited: true, lastModified: new Date() };
    });
  }, []);

  const updateContext = useCallback((value: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return { ...prev, context: value, isEdited: true, lastModified: new Date() };
    });
  }, []);

  const updateSummary = useCallback((value: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return { ...prev, summary: value, isEdited: true, lastModified: new Date() };
    });
  }, []);

  const updatePrayerPrompt = useCallback((value: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return { ...prev, prayer_prompt: value, isEdited: true, lastModified: new Date() };
    });
  }, []);

  const updateStudyNotes = useCallback((value: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return { ...prev, studyNotes: value, isEdited: true, lastModified: new Date() };
    });
  }, []);

  // Theme management
  const addTheme = useCallback((theme: string) => {
    if (!theme.trim()) return;
    setStudy((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        key_themes: [...prev.key_themes, theme.trim()],
        isEdited: true,
        lastModified: new Date(),
      };
    });
  }, []);

  const updateTheme = useCallback((index: number, value: string) => {
    setStudy((prev) => {
      if (!prev || index < 0 || index >= prev.key_themes.length) return prev;
      const newThemes = [...prev.key_themes];
      newThemes[index] = value;
      return { ...prev, key_themes: newThemes, isEdited: true, lastModified: new Date() };
    });
  }, []);

  const removeTheme = useCallback((index: number) => {
    setStudy((prev) => {
      if (!prev || index < 0 || index >= prev.key_themes.length) return prev;
      const newThemes = prev.key_themes.filter((_, i) => i !== index);
      return { ...prev, key_themes: newThemes, isEdited: true, lastModified: new Date() };
    });
  }, []);

  // Question management (within study flow sections)
  const addQuestion = useCallback(
    (sectionId: string, type: EditableQuestionType, question: string, answer?: string) => {
      setStudy((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          study_flow: prev.study_flow.map((section) =>
            section.id === sectionId
              ? {
                ...section,
                questions: [
                  ...section.questions,
                  { id: generateId(), type, question, answer },
                ],
              }
              : section
          ),
          isEdited: true,
          lastModified: new Date(),
        };
      });
    },
    []
  );

  const updateQuestion = useCallback(
    (sectionId: string, questionId: string, updates: Partial<EditableQuestion>) => {
      setStudy((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          study_flow: prev.study_flow.map((section) =>
            section.id === sectionId
              ? {
                ...section,
                questions: section.questions.map((q) =>
                  q.id === questionId ? { ...q, ...updates } : q
                ),
              }
              : section
          ),
          isEdited: true,
          lastModified: new Date(),
        };
      });
    },
    []
  );

  const removeQuestion = useCallback((sectionId: string, questionId: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        study_flow: prev.study_flow.map((section) =>
          section.id === sectionId
            ? {
              ...section,
              questions: section.questions.filter((q) => q.id !== questionId),
            }
            : section
        ),
        isEdited: true,
        lastModified: new Date(),
      };
    });
  }, []);

  const reorderQuestions = useCallback(
    (sectionId: string, fromIndex: number, toIndex: number) => {
      setStudy((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          study_flow: prev.study_flow.map((section) => {
            if (section.id !== sectionId) return section;
            const questions = [...section.questions];
            const [removed] = questions.splice(fromIndex, 1);
            questions.splice(toIndex, 0, removed);
            return { ...section, questions };
          }),
          isEdited: true,
          lastModified: new Date(),
        };
      });
    },
    []
  );

  // Application questions
  const addApplicationQuestion = useCallback((question: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        application_questions: [
          ...prev.application_questions,
          { id: generateId(), type: 'application' as EditableQuestionType, question },
        ],
        isEdited: true,
        lastModified: new Date(),
      };
    });
  }, []);

  const updateApplicationQuestion = useCallback(
    (id: string, updates: Partial<EditableQuestion>) => {
      setStudy((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          application_questions: prev.application_questions.map((q) =>
            q.id === id ? { ...q, ...updates } : q
          ),
          isEdited: true,
          lastModified: new Date(),
        };
      });
    },
    []
  );

  const removeApplicationQuestion = useCallback((id: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        application_questions: prev.application_questions.filter((q) => q.id !== id),
        isEdited: true,
        lastModified: new Date(),
      };
    });
  }, []);

  // Cross references
  const addCrossReference = useCallback((reference: string, note: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        cross_references: [
          ...prev.cross_references,
          { id: generateId(), reference, note },
        ],
        isEdited: true,
        lastModified: new Date(),
      };
    });
  }, []);

  const updateCrossReference = useCallback(
    (id: string, updates: Partial<EditableCrossReference>) => {
      setStudy((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          cross_references: prev.cross_references.map((ref) =>
            ref.id === id ? { ...ref, ...updates } : ref
          ),
          isEdited: true,
          lastModified: new Date(),
        };
      });
    },
    []
  );

  const removeCrossReference = useCallback((id: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        cross_references: prev.cross_references.filter((ref) => ref.id !== id),
        isEdited: true,
        lastModified: new Date(),
      };
    });
  }, []);

  // Section management
  const updateSectionHeading = useCallback((sectionId: string, heading: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        study_flow: prev.study_flow.map((section) =>
          section.id === sectionId ? { ...section, section_heading: heading } : section
        ),
        isEdited: true,
        lastModified: new Date(),
      };
    });
  }, []);

  const updateSectionConnection = useCallback((sectionId: string, connection: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        study_flow: prev.study_flow.map((section) =>
          section.id === sectionId ? { ...section, connection } : section
        ),
        isEdited: true,
        lastModified: new Date(),
      };
    });
  }, []);

  const updateSectionPassage = useCallback((sectionId: string, passage: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        study_flow: prev.study_flow.map((section) =>
          section.id === sectionId ? { ...section, passage_section: passage } : section
        ),
        isEdited: true,
        lastModified: new Date(),
      };
    });
  }, []);

  const addSection = useCallback((passageSection: string, heading: string) => {
    setStudy((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        study_flow: [
          ...prev.study_flow,
          {
            id: generateId(),
            passage_section: passageSection,
            section_heading: heading,
            questions: [],
            connection: '',
          },
        ],
        isEdited: true,
        lastModified: new Date(),
      };
    });
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setStudy((prev) => {
      if (!prev || prev.study_flow.length <= 1) return prev; // Keep at least one section
      return {
        ...prev,
        study_flow: prev.study_flow.filter((section) => section.id !== sectionId),
        isEdited: true,
        lastModified: new Date(),
      };
    });
  }, []);

  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    setStudy((prev) => {
      if (!prev) return null;
      const sections = [...prev.study_flow];
      const [removed] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, removed);
      return { ...prev, study_flow: sections, isEdited: true, lastModified: new Date() };
    });
  }, []);

  // Set a blank study directly (for manual study creation)
  const setBlankStudy = useCallback((blankStudy: EditableStudyFull | Study) => {
    const editable = isEditableStudy(blankStudy) ? blankStudy : toEditableStudy(blankStudy);
    setStudy(editable);
    setOriginalStudy(null); // No original to revert to
  }, []);

  // Mark the current study as saved (used when saving to savedStudies)
  const markAsSaved = useCallback(() => {
    setStudy((prev) => {
      if (!prev) return null;
      return { ...prev, isSaved: true, isEdited: false };
    });
  }, []);

  // Save to history
  const saveToHistory = useCallback(
    async (reference: string, _passageText: string, provider: string) => {
      if (!study) return;
      if (Object.keys(validationErrors).length > 0) {
        throw new Error('Cannot save: validation errors exist');
      }

      setIsSaving(true);
      try {
        // Extract book, chapter, verses from reference
        const match = reference.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
        if (!match) {
          throw new Error('Invalid reference format');
        }

        const [, book, chapterStr, startVerseStr, endVerseStr] = match;
        const chapter = parseInt(chapterStr, 10);
        const startVerse = startVerseStr ? parseInt(startVerseStr, 10) : undefined;
        const endVerse = endVerseStr ? parseInt(endVerseStr, 10) : undefined;

        await addToHistory(book, chapter, startVerse, endVerse, reference, provider);

        // Mark as saved
        setStudy((prev) => {
          if (!prev) return null;
          return { ...prev, isSaved: true, isEdited: false };
        });
      } finally {
        setIsSaving(false);
      }
    },
    [study, validationErrors]
  );

  // Discard changes and reset to original
  const discardChanges = useCallback(() => {
    if (originalStudy) {
      setStudy(toEditableStudy(originalStudy));
    }
  }, [originalStudy]);

  return {
    study,
    isDirty,
    isSaving,
    validationErrors,
    updatePurpose,
    updateContext,
    updateSummary,
    updatePrayerPrompt,
    addTheme,
    updateTheme,
    removeTheme,
    addQuestion,
    updateQuestion,
    removeQuestion,
    reorderQuestions,
    addApplicationQuestion,
    updateApplicationQuestion,
    removeApplicationQuestion,
    addCrossReference,
    updateCrossReference,
    removeCrossReference,
    updateSectionHeading,
    updateSectionConnection,
    updateSectionPassage,
    addSection,
    removeSection,
    reorderSections,
    updateStudyNotes,
    saveToHistory,
    discardChanges,
    setBlankStudy,
    markAsSaved,
  };
}
