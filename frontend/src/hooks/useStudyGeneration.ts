import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateStudy as apiGenerateStudy } from '../api/studyApi';
import { UnifiedAIService } from '../api/unifiedAIService';
import { getApiKeys, getEffectiveProviderAndModel } from './useApiKeys';
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
  model?: string;
}

/**
 * Hook for generating Bible studies with caching
 * Uses the UnifiedAIService for consistent provider/model handling
 */
export function useStudyGeneration() {
  const queryClient = useQueryClient();

  return useMutation<StudyResult, Error, GenerateStudyRequest>({
    mutationFn: async (params) => {
      // Use end_chapter from params, defaulting to start chapter
      const endChapter = params.end_chapter ?? params.chapter;

      const reference = formatReference(
        params.book,
        params.chapter,
        params.start_verse,
        endChapter,
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

      // Check for user API keys and settings
      const apiKeys = await getApiKeys();
      const { provider, model, apiKey } = await getEffectiveProviderAndModel();

      // Check if we can do client-side generation
      const canUseClientSide = Boolean(
        apiKeys.esvApiKey &&
        apiKeys.openrouterApiKey &&
        (provider === 'openrouter' || !provider)  // Only OpenRouter supports CORS
      );

      let response: GenerateStudyResponse;

      if (canUseClientSide) {
        // Client-side generation using UnifiedAIService
        console.log(`[Dev] Using client-side generation (provider: ${provider}, model: ${model})`);

        try {
          const result = await UnifiedAIService.generateStudy(params, {
            provider: provider || 'openrouter',
            model: model || undefined,
          });

          response = {
            reference: result.isClientSide ? reference : reference,  // Build reference for consistency
            passage_text: await UnifiedAIService.fetchPassage(reference),
            study: result.study,
            provider: result.provider,
          };
        } catch (error) {
          console.error('[Dev] Client-side generation failed, falling back to server:', error);
          // Fallback to server on client-side error
          response = await apiGenerateStudy({
            ...params,
            provider: provider || undefined,
            model: model || undefined,
          });
        }
      } else {
        // Server-side generation
        console.log(`[Dev] Using server-side generation (provider: ${provider}, model: ${model})`);

        // Include provider and model in the server request if user has preferences
        const requestWithSettings = {
          ...params,
          provider: provider || undefined,
          model: model || undefined,
        };

        response = await apiGenerateStudy(requestWithSettings);
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

      return { ...response, fromCache: false, model: model || undefined };
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

/**
 * Hook for getting current AI configuration
 */
export function useAIConfig() {
  return useMutation<{
    provider: string | null;
    model: string | null;
    isClientSide: boolean;
  }, Error, void>({
    mutationFn: async () => {
      return UnifiedAIService.getEffectiveConfig();
    },
  });
}
