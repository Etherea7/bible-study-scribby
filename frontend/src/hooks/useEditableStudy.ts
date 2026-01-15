/**
 * useEditableStudy - Hook for managing editable study state
 *
 * Features:
 * - Converts a Study to an EditableStudy with UUIDs
 * - Tracks modifications to questions and answers
 * - Auto-saves changes to Dexie editedStudies table
 * - Provides update functions for individual fields
 */

import { useState, useEffect, useCallback } from 'react';
import { saveEditedStudy, getEditedStudy } from '../db';
import type { Study, EditableStudy, EditableStudyFlowItem } from '../types';

// Generate a simple UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Convert a Study to an EditableStudy
function toEditableStudy(study: Study, existingId?: string): EditableStudy {
  return {
    ...study,
    id: existingId || generateId(),
    study_flow: study.study_flow.map((item) => ({
      ...item,
      id: generateId(),
      isEdited: false,
    })),
    lastModified: new Date(),
    isEdited: false,
  };
}

interface UseEditableStudyOptions {
  autoSave?: boolean;
  saveDelay?: number;
}

export function useEditableStudy(
  initialStudy: Study | null,
  reference: string,
  options: UseEditableStudyOptions = {}
) {
  const { autoSave = true, saveDelay = 1000 } = options;

  const [study, setStudy] = useState<EditableStudy | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load edited study from Dexie or create from initial
  useEffect(() => {
    async function loadStudy() {
      if (!initialStudy) {
        setStudy(null);
        return;
      }

      // Try to load edited version from Dexie
      const edited = await getEditedStudy(reference);
      if (edited) {
        setStudy(edited.study);
        setLastSaved(edited.lastModified);
      } else {
        setStudy(toEditableStudy(initialStudy));
      }
    }

    loadStudy();
  }, [initialStudy, reference]);

  // Auto-save when study changes
  useEffect(() => {
    if (!autoSave || !study?.isEdited) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveEditedStudy({
          id: study.id,
          reference,
          study,
          lastModified: new Date(),
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save edited study:', error);
      } finally {
        setIsSaving(false);
      }
    }, saveDelay);

    return () => clearTimeout(timer);
  }, [study, reference, autoSave, saveDelay]);

  // Update a study flow item field
  const updateStudyFlowItem = useCallback(
    (
      sectionId: string,
      field: keyof EditableStudyFlowItem,
      value: string
    ) => {
      setStudy((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          isEdited: true,
          lastModified: new Date(),
          study_flow: prev.study_flow.map((item) =>
            item.id === sectionId
              ? { ...item, [field]: value, isEdited: true }
              : item
          ),
        };
      });
    },
    []
  );

  // Update observation question
  const updateObservationQuestion = useCallback(
    (sectionId: string, question: string) => {
      updateStudyFlowItem(sectionId, 'observation_question', question);
    },
    [updateStudyFlowItem]
  );

  // Update observation answer
  const updateObservationAnswer = useCallback(
    (sectionId: string, answer: string) => {
      updateStudyFlowItem(sectionId, 'observation_answer', answer);
    },
    [updateStudyFlowItem]
  );

  // Update interpretation question
  const updateInterpretationQuestion = useCallback(
    (sectionId: string, question: string) => {
      updateStudyFlowItem(sectionId, 'interpretation_question', question);
    },
    [updateStudyFlowItem]
  );

  // Update interpretation answer
  const updateInterpretationAnswer = useCallback(
    (sectionId: string, answer: string) => {
      updateStudyFlowItem(sectionId, 'interpretation_answer', answer);
    },
    [updateStudyFlowItem]
  );

  // Update an application question
  const updateApplicationQuestion = useCallback(
    (index: number, question: string) => {
      setStudy((prev) => {
        if (!prev) return null;

        const newQuestions = [...prev.application_questions];
        newQuestions[index] = question;

        return {
          ...prev,
          isEdited: true,
          lastModified: new Date(),
          application_questions: newQuestions,
        };
      });
    },
    []
  );

  // Reset to original study
  const resetStudy = useCallback(() => {
    if (initialStudy) {
      setStudy(toEditableStudy(initialStudy));
    }
  }, [initialStudy]);

  // Manual save
  const saveNow = useCallback(async () => {
    if (!study) return;

    setIsSaving(true);
    try {
      await saveEditedStudy({
        id: study.id,
        reference,
        study,
        lastModified: new Date(),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save edited study:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [study, reference]);

  return {
    study,
    isSaving,
    lastSaved,
    updateObservationQuestion,
    updateObservationAnswer,
    updateInterpretationQuestion,
    updateInterpretationAnswer,
    updateApplicationQuestion,
    resetStudy,
    saveNow,
  };
}
