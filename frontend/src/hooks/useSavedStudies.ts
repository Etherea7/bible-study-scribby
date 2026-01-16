import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSavedStudies,
  getSavedStudy,
  saveToSavedStudies,
  deleteSavedStudy,
  clearSavedStudies,
  exportSavedStudies,
  importSavedStudies,
  downloadExport,
} from '../db';
import type { SavedStudyRecord, EditableStudyFull, SavedStudiesImportResult } from '../types';

/**
 * Hook for fetching all saved studies
 */
export function useSavedStudies() {
  return useQuery<SavedStudyRecord[], Error>({
    queryKey: ['savedStudies'],
    queryFn: () => getSavedStudies(),
  });
}

/**
 * Hook for fetching a single saved study by ID
 */
export function useSavedStudy(id: string | undefined) {
  return useQuery<SavedStudyRecord | undefined, Error>({
    queryKey: ['savedStudy', id],
    queryFn: () => (id ? getSavedStudy(id) : Promise.resolve(undefined)),
    enabled: !!id,
  });
}

/**
 * Hook for saving a study to saved studies
 */
export function useSaveStudy() {
  const queryClient = useQueryClient();

  return useMutation<
    string,
    Error,
    {
      reference: string;
      passageText: string;
      study: EditableStudyFull;
      provider?: string;
    }
  >({
    mutationFn: ({ reference, passageText, study, provider }) =>
      saveToSavedStudies(reference, passageText, study, provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedStudies'] });
    },
  });
}

/**
 * Hook for deleting a saved study
 */
export function useDeleteSavedStudy() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteSavedStudy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedStudies'] });
    },
  });
}

/**
 * Hook for clearing all saved studies
 */
export function useClearSavedStudies() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => clearSavedStudies(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedStudies'] });
    },
  });
}

/**
 * Hook for exporting saved studies as JSON
 */
export function useExportSavedStudies() {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const data = await exportSavedStudies();
      downloadExport(data, `saved-studies-${new Date().toISOString().split('T')[0]}.json`);
    },
  });
}

/**
 * Hook for importing saved studies from JSON file
 *
 * Returns detailed results with per-study import status.
 * Valid studies are imported, invalid ones are skipped with error messages.
 */
export function useImportSavedStudies() {
  const queryClient = useQueryClient();

  return useMutation<SavedStudiesImportResult, Error, File>({
    mutationFn: async (file: File) => {
      const text = await file.text();
      return importSavedStudies(text);
    },
    onSuccess: (result) => {
      if (result.imported > 0) {
        queryClient.invalidateQueries({ queryKey: ['savedStudies'] });
      }
    },
  });
}
