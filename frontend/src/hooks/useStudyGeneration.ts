import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateStudy as apiGenerateStudy } from '../api/studyApi';
import { callOpenRouter, fetchPassage, buildReference } from '../api/llmClient';
import { getApiKeys } from './useApiKeys';
import { formatStudyPrompt } from '../utils/studyPrompt';
import {
  getCachedStudy,
  getCachedPassage,
  cacheStudy,
  cachePassage,
  addToHistory,
} from '../db';
import { formatReference } from '../utils/formatReference';
import type { GenerateStudyRequest, GenerateStudyResponse, Study } from '../types';

interface StudyResult extends GenerateStudyResponse {
  fromCache: boolean;
}

/**
 * Hook for generating Bible studies with caching
 */
export function useStudyGeneration() {
  const queryClient = useQueryClient();

  return useMutation<StudyResult, Error, GenerateStudyRequest>({
    mutationFn: async (params) => {
      const reference = formatReference(
        params.book,
        params.chapter,
        params.start_verse,
        params.end_verse
      );

      // Check cache first
      const cachedStudy = await getCachedStudy(reference);
      const cachedPassage = await getCachedPassage(reference);

      if (cachedStudy && cachedPassage) {
        console.log('[Dev] Loading from cache:', reference);
        return {
          reference,
          passage_text: cachedPassage.text,
          study: cachedStudy.studyJson,
          provider: cachedStudy.provider,
          fromCache: true,
        };
      }

      // Check for user API keys for client-side generation
      const apiKeys = await getApiKeys();
      const canUseClientSide = Boolean(apiKeys.esvApiKey && apiKeys.openrouterApiKey);

      let response: GenerateStudyResponse;

      if (canUseClientSide) {
        // Client-side generation using user's API keys
        console.log('[Dev] Using client-side generation with user API keys');

        // Build reference for ESV API
        const esvReference = buildReference(
          params.book,
          params.chapter,
          params.start_verse,
          params.end_verse
        );

        // Fetch passage from ESV API
        const passageText = await fetchPassage(esvReference, apiKeys.esvApiKey!);

        // Format the prompt and call OpenRouter
        const prompt = formatStudyPrompt(reference, passageText);
        const study = await callOpenRouter(prompt, apiKeys.openrouterApiKey!);

        response = {
          reference,
          passage_text: passageText,
          study,
          provider: 'openrouter (client)',
        };
      } else {
        // Fallback to backend API
        console.log('[Dev] Fetching from backend API:', reference);
        response = await apiGenerateStudy(params);
      }

      // Cache results
      await cachePassage(response.reference, response.passage_text);
      await cacheStudy(response.reference, response.study, response.provider);

      // Add to history
      await addToHistory(
        params.book,
        params.chapter,
        params.start_verse,
        params.end_verse,
        response.reference,
        response.provider
      );

      return { ...response, fromCache: false };
    },
    onSuccess: () => {
      // Invalidate history queries so they refetch
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

/**
 * Hook for checking if a study is cached
 */
export function useCheckCache() {
  return useMutation<{ cached: boolean; study?: Study }, Error, string>({
    mutationFn: async (reference) => {
      const cached = await getCachedStudy(reference);
      if (cached) {
        return { cached: true, study: cached.studyJson };
      }
      return { cached: false };
    },
  });
}
