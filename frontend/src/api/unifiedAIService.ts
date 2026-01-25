/**
 * UnifiedAIService - Centralized AI service for study generation
 *
 * Handles routing between:
 * - Client-side calls (OpenRouter via CORS)
 * - Server-side calls (Anthropic, Google via backend proxy)
 *
 * Provides consistent interface regardless of provider used.
 */

import type { Study, LLMProvider, GenerateStudyRequest, GenerateStudyResponse } from '../types';
import { getApiKeys, getEffectiveProviderAndModel } from '../hooks/useApiKeys';
import { fetchPassage as fetchPassageFromESV, LLMError } from './llmClient';
import { fetchPassageFromServer, generateStudy as apiGenerateStudy } from './studyApi';
import { formatStudyPrompt } from '../utils/studyPrompt';

// OpenRouter configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Configuration for AI generation
 */
export interface AIGenerationConfig {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Result from AI generation
 */
export interface AIGenerationResult {
  study: Study;
  provider: string;
  model: string;
  isClientSide: boolean;
}

/**
 * Call OpenRouter API with a specific model
 */
async function callOpenRouterWithModel(
  prompt: string,
  apiKey: string,
  model: string,
  config: AIGenerationConfig = {}
): Promise<Study> {
  const { temperature = 0.6, maxTokens = 3000 } = config;

  console.log(`[Dev] Calling OpenRouter with model: ${model}`);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Bible Study Scribby',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert Bible study curriculum designer. Respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Dev] OpenRouter error:', errorText);
    throw new LLMError(
      `OpenRouter API error: ${response.status} ${response.statusText}`,
      'openrouter',
      response.status
    );
  }

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new LLMError('Invalid response from OpenRouter: no content', 'openrouter');
  }

  const content = data.choices[0].message.content;

  // Parse JSON response
  try {
    let jsonString = content.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7);
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.slice(0, -3);
    }

    const study = JSON.parse(jsonString.trim()) as Study;
    console.log('[Dev] OpenRouter response parsed successfully');
    return study;
  } catch (parseError) {
    console.error('[Dev] Failed to parse OpenRouter response:', parseError);
    throw new LLMError(
      'Failed to parse LLM response as JSON. The model may have returned invalid JSON.',
      'openrouter'
    );
  }
}

/**
 * Unified AI Service class for all AI operations
 */
export class UnifiedAIService {
  /**
   * Fetch passage text using the best available method
   */
  static async fetchPassage(reference: string): Promise<string> {
    const apiKeys = await getApiKeys();

    // Prefer client-side ESV fetch if key is available
    if (apiKeys.esvApiKey) {
      console.log('[Dev] Fetching passage client-side (ESV API)');
      return fetchPassageFromESV(reference, apiKeys.esvApiKey);
    }

    // Fallback to server
    console.log('[Dev] Fetching passage server-side (backend proxy)');
    return fetchPassageFromServer(reference);
  }

  /**
   * Generate a study using the best available provider
   */
  static async generateStudy(
    request: GenerateStudyRequest,
    config: AIGenerationConfig = {}
  ): Promise<AIGenerationResult> {
    const apiKeys = await getApiKeys();
    const { provider: configProvider, model: configModel } = config;

    // Determine which provider and model to use
    const { provider, model, apiKey } = await getEffectiveProviderAndModel();

    // Override with config if provided
    const effectiveProvider = configProvider !== 'auto' && configProvider ? configProvider : provider;
    const effectiveModel = configModel || model;

    // Build reference string
    const reference = buildReference(request);

    // Check if we can do client-side generation
    const canClientSide = effectiveProvider === 'openrouter' && apiKeys.openrouterApiKey && apiKeys.esvApiKey;

    if (canClientSide && effectiveProvider === 'openrouter' && apiKey && effectiveModel) {
      return this.generateClientSide(reference, apiKey, effectiveModel, config);
    }

    // Fall back to server-side generation
    return this.generateServerSide(request, effectiveProvider, effectiveModel);
  }

  /**
   * Generate study client-side using OpenRouter
   */
  private static async generateClientSide(
    reference: string,
    apiKey: string,
    model: string,
    config: AIGenerationConfig = {}
  ): Promise<AIGenerationResult> {
    console.log(`[Dev] Generating study client-side with ${model}`);

    // Fetch passage
    const passageText = await this.fetchPassage(reference);

    // Build prompt
    const prompt = formatStudyPrompt(reference, passageText);

    // Generate study
    const study = await callOpenRouterWithModel(prompt, apiKey, model, config);

    return {
      study,
      provider: 'openrouter (client)',
      model,
      isClientSide: true,
    };
  }

  /**
   * Generate study server-side using backend proxy
   */
  private static async generateServerSide(
    request: GenerateStudyRequest,
    provider: string | null,
    model: string | null
  ): Promise<AIGenerationResult> {
    console.log(`[Dev] Generating study server-side (provider: ${provider || 'auto'}, model: ${model || 'default'})`);

    // Add provider and model to request if specified
    const extendedRequest = {
      ...request,
      ...(provider && { provider }),
      ...(model && { model }),
    };

    const response: GenerateStudyResponse = await apiGenerateStudy(extendedRequest);

    return {
      study: response.study,
      provider: response.provider,
      model: model || 'server-default',
      isClientSide: false,
    };
  }

  /**
   * Check if client-side generation is available
   */
  static async canGenerateClientSide(): Promise<boolean> {
    const apiKeys = await getApiKeys();
    return Boolean(apiKeys.esvApiKey && apiKeys.openrouterApiKey);
  }

  /**
   * Get the effective provider that will be used
   */
  static async getEffectiveConfig(): Promise<{
    provider: string | null;
    model: string | null;
    isClientSide: boolean;
  }> {
    const apiKeys = await getApiKeys();
    const { provider, model } = await getEffectiveProviderAndModel();

    const isClientSide = provider === 'openrouter' && Boolean(apiKeys.esvApiKey);

    return {
      provider,
      model,
      isClientSide,
    };
  }
}

/**
 * Helper to build reference string from request
 */
function buildReference(request: GenerateStudyRequest): string {
  const { book, chapter, start_verse, end_chapter, end_verse } = request;

  // Default end chapter to start chapter if not provided
  const effectiveEndChapter = end_chapter ?? chapter;

  // If no verses specified, just return book and chapter
  if (!start_verse) {
    if (chapter === effectiveEndChapter) {
      return `${book} ${chapter}`;
    }
    return `${book} ${chapter}-${effectiveEndChapter}`;
  }

  // Same chapter case
  if (chapter === effectiveEndChapter) {
    if (!end_verse || end_verse === start_verse) {
      return `${book} ${chapter}:${start_verse}`;
    }
    return `${book} ${chapter}:${start_verse}-${end_verse}`;
  }

  // Cross-chapter case
  if (!end_verse) {
    return `${book} ${chapter}:${start_verse}-${effectiveEndChapter}`;
  }
  return `${book} ${chapter}:${start_verse}-${effectiveEndChapter}:${end_verse}`;
}

// Export convenience functions for backward compatibility
export { fetchPassageFromESV as fetchPassage };
export { LLMError };
