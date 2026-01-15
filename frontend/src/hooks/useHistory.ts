import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHistory,
  deleteFromHistory,
  clearHistory,
  exportData,
  downloadExport,
  importData,
} from '../db';
import type { ReadingHistoryItem, ImportResult } from '../types';

/**
 * Hook for fetching reading history
 */
export function useHistory(limit = 50) {
  return useQuery<ReadingHistoryItem[], Error>({
    queryKey: ['history', limit],
    queryFn: () => getHistory(limit),
  });
}

/**
 * Hook for deleting a history item
 */
export function useDeleteHistory() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id) => deleteFromHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

/**
 * Hook for clearing all history
 */
export function useClearHistory() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

/**
 * Hook for exporting history as JSON
 */
export function useExportHistory() {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const data = await exportData();
      downloadExport(data);
    },
  });
}

/**
 * Hook for importing history from JSON file
 * Appends to existing data without replacing
 */
export function useImportHistory() {
  const queryClient = useQueryClient();

  return useMutation<ImportResult, Error, File>({
    mutationFn: async (file: File) => {
      const text = await file.text();
      return importData(text);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['history'] });
      }
    },
  });
}
