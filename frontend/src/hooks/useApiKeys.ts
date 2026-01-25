/**
 * useApiKeys - Hook for managing user-provided API keys and model preferences
 *
 * Stores API keys and model selections in IndexedDB via Dexie userPreferences table.
 * Keys are stored locally in the browser and never sent to our backend.
 */

import { useState, useEffect, useCallback } from 'react';
import { getUserPreference, setUserPreference } from '../db';
import type { ApiKeySettings, LLMProvider, ProviderModelSelection } from '../types';
import { DEFAULT_MODELS } from '../types';

const API_KEYS_STORAGE_KEY = 'apiKeys';

const DEFAULT_API_KEYS: ApiKeySettings = {
  esvApiKey: undefined,
  openrouterApiKey: undefined,
  anthropicApiKey: undefined,
  googleApiKey: undefined,
  preferredProvider: 'auto',
  selectedModels: {
    openrouter: DEFAULT_MODELS.openrouter,
    anthropic: DEFAULT_MODELS.anthropic,
    google: DEFAULT_MODELS.google,
  },
};

// Migration function to handle old settings format
function migrateApiKeys(stored: Partial<ApiKeySettings>): ApiKeySettings {
  const migrated: ApiKeySettings = {
    ...DEFAULT_API_KEYS,
    ...stored,
  };

  // Migrate old 'groq' preference to 'auto'
  if ((stored as { preferredProvider?: string }).preferredProvider === 'groq') {
    migrated.preferredProvider = 'auto';
  }

  // Migrate old 'gemini' preference to 'google'
  if ((stored as { preferredProvider?: string }).preferredProvider === 'gemini') {
    migrated.preferredProvider = 'google';
  }

  // Migrate old 'claude' preference to 'anthropic'
  if ((stored as { preferredProvider?: string }).preferredProvider === 'claude') {
    migrated.preferredProvider = 'anthropic';
  }

  // Migrate old geminiApiKey to googleApiKey
  const oldSettings = stored as { geminiApiKey?: string; groqApiKey?: string };
  if (oldSettings.geminiApiKey && !migrated.googleApiKey) {
    migrated.googleApiKey = oldSettings.geminiApiKey;
  }

  // Ensure selectedModels exists with defaults
  if (!migrated.selectedModels) {
    migrated.selectedModels = {
      openrouter: DEFAULT_MODELS.openrouter,
      anthropic: DEFAULT_MODELS.anthropic,
      google: DEFAULT_MODELS.google,
    };
  } else {
    // Fill in any missing model selections with defaults
    migrated.selectedModels = {
      openrouter: migrated.selectedModels.openrouter || DEFAULT_MODELS.openrouter,
      anthropic: migrated.selectedModels.anthropic || DEFAULT_MODELS.anthropic,
      google: migrated.selectedModels.google || DEFAULT_MODELS.google,
    };
  }

  return migrated;
}

export function useApiKeys() {
  const [apiKeys, setApiKeysState] = useState<ApiKeySettings>(DEFAULT_API_KEYS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load API keys from IndexedDB on mount
  useEffect(() => {
    const loadKeys = async () => {
      try {
        const stored = await getUserPreference<Partial<ApiKeySettings>>(
          API_KEYS_STORAGE_KEY,
          DEFAULT_API_KEYS
        );
        const migrated = migrateApiKeys(stored);
        setApiKeysState(migrated);
      } catch (error) {
        console.error('[Dev] Failed to load API keys:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadKeys();
  }, []);

  // Save API keys to IndexedDB
  const saveApiKeys = useCallback(async (newKeys: Partial<ApiKeySettings>) => {
    setIsSaving(true);
    try {
      const updated = { ...apiKeys, ...newKeys };
      await setUserPreference(API_KEYS_STORAGE_KEY, updated);
      setApiKeysState(updated);
      console.log('[Dev] API keys saved successfully');
      return true;
    } catch (error) {
      console.error('[Dev] Failed to save API keys:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [apiKeys]);

  // Update a single API key
  const updateKey = useCallback(async (
    key: 'esvApiKey' | 'openrouterApiKey' | 'anthropicApiKey' | 'googleApiKey',
    value: string | undefined
  ) => {
    return saveApiKeys({ [key]: value });
  }, [saveApiKeys]);

  // Update preferred provider
  const setPreferredProvider = useCallback(async (provider: LLMProvider) => {
    return saveApiKeys({ preferredProvider: provider });
  }, [saveApiKeys]);

  // Update selected model for a provider
  const setSelectedModel = useCallback(async (
    provider: keyof ProviderModelSelection,
    modelId: string
  ) => {
    const newSelectedModels = {
      ...apiKeys.selectedModels,
      [provider]: modelId,
    };
    return saveApiKeys({ selectedModels: newSelectedModels });
  }, [apiKeys.selectedModels, saveApiKeys]);

  // Get the currently selected model for a provider
  const getSelectedModel = useCallback((provider: keyof ProviderModelSelection): string => {
    return apiKeys.selectedModels[provider] || DEFAULT_MODELS[provider];
  }, [apiKeys.selectedModels]);

  // Clear all API keys
  const clearAllKeys = useCallback(async () => {
    setIsSaving(true);
    try {
      await setUserPreference(API_KEYS_STORAGE_KEY, DEFAULT_API_KEYS);
      setApiKeysState(DEFAULT_API_KEYS);
      console.log('[Dev] All API keys cleared');
      return true;
    } catch (error) {
      console.error('[Dev] Failed to clear API keys:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Check if client-side generation is available (ESV + OpenRouter)
  const canGenerateClientSide = Boolean(
    apiKeys.esvApiKey && apiKeys.openrouterApiKey
  );

  // Check if a specific provider is configured
  const isProviderConfigured = useCallback((provider: LLMProvider): boolean => {
    switch (provider) {
      case 'openrouter':
        return Boolean(apiKeys.openrouterApiKey);
      case 'anthropic':
        return Boolean(apiKeys.anthropicApiKey);
      case 'google':
        return Boolean(apiKeys.googleApiKey);
      case 'auto':
        return canGenerateClientSide;
      default:
        return false;
    }
  }, [apiKeys, canGenerateClientSide]);

  // Get the effective provider based on preference and availability
  const getEffectiveProvider = useCallback((): Exclude<LLMProvider, 'auto'> | null => {
    const { preferredProvider } = apiKeys;

    if (preferredProvider !== 'auto') {
      // User explicitly selected a provider
      if (isProviderConfigured(preferredProvider)) {
        return preferredProvider;
      }
      // Preferred provider not configured, fall through to auto
    }

    // Auto mode: prefer OpenRouter (CORS-enabled), then others
    if (apiKeys.openrouterApiKey) return 'openrouter';
    if (apiKeys.anthropicApiKey) return 'anthropic';
    if (apiKeys.googleApiKey) return 'google';

    return null; // No provider available
  }, [apiKeys, isProviderConfigured]);

  // Get the model to use for the current effective provider
  const getEffectiveModel = useCallback((): string | null => {
    const provider = getEffectiveProvider();
    if (!provider) return null;
    return getSelectedModel(provider);
  }, [getEffectiveProvider, getSelectedModel]);

  return {
    apiKeys,
    isLoading,
    isSaving,
    saveApiKeys,
    updateKey,
    setPreferredProvider,
    setSelectedModel,
    getSelectedModel,
    clearAllKeys,
    canGenerateClientSide,
    isProviderConfigured,
    getEffectiveProvider,
    getEffectiveModel,
  };
}

/**
 * Get API keys directly (non-hook version for use in async functions)
 */
export async function getApiKeys(): Promise<ApiKeySettings> {
  const stored = await getUserPreference<Partial<ApiKeySettings>>(
    API_KEYS_STORAGE_KEY,
    DEFAULT_API_KEYS
  );
  return migrateApiKeys(stored);
}

/**
 * Get the effective provider and model for API calls (non-hook version)
 */
export async function getEffectiveProviderAndModel(): Promise<{
  provider: Exclude<LLMProvider, 'auto'> | null;
  model: string | null;
  apiKey: string | null;
}> {
  const apiKeys = await getApiKeys();

  let provider: Exclude<LLMProvider, 'auto'> | null = null;
  let apiKey: string | null = null;

  const { preferredProvider } = apiKeys;

  if (preferredProvider !== 'auto') {
    // Check if preferred provider is configured
    switch (preferredProvider) {
      case 'openrouter':
        if (apiKeys.openrouterApiKey) {
          provider = 'openrouter';
          apiKey = apiKeys.openrouterApiKey;
        }
        break;
      case 'anthropic':
        if (apiKeys.anthropicApiKey) {
          provider = 'anthropic';
          apiKey = apiKeys.anthropicApiKey;
        }
        break;
      case 'google':
        if (apiKeys.googleApiKey) {
          provider = 'google';
          apiKey = apiKeys.googleApiKey;
        }
        break;
    }
  }

  // Fall through to auto if preferred not available
  if (!provider) {
    if (apiKeys.openrouterApiKey) {
      provider = 'openrouter';
      apiKey = apiKeys.openrouterApiKey;
    } else if (apiKeys.anthropicApiKey) {
      provider = 'anthropic';
      apiKey = apiKeys.anthropicApiKey;
    } else if (apiKeys.googleApiKey) {
      provider = 'google';
      apiKey = apiKeys.googleApiKey;
    }
  }

  const model = provider
    ? apiKeys.selectedModels[provider] || DEFAULT_MODELS[provider]
    : null;

  return { provider, model, apiKey };
}
