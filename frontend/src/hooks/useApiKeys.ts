/**
 * useApiKeys - Hook for managing user-provided API keys
 *
 * Stores API keys in IndexedDB via Dexie userPreferences table.
 * Keys are stored locally in the browser and never sent to our backend.
 */

import { useState, useEffect, useCallback } from 'react';
import { getUserPreference, setUserPreference } from '../db';
import type { ApiKeySettings, LLMProvider } from '../types';

const API_KEYS_STORAGE_KEY = 'apiKeys';

const DEFAULT_API_KEYS: ApiKeySettings = {
  esvApiKey: undefined,
  openrouterApiKey: undefined,
  groqApiKey: undefined,
  geminiApiKey: undefined,
  anthropicApiKey: undefined,
  preferredProvider: 'auto',
};

export function useApiKeys() {
  const [apiKeys, setApiKeysState] = useState<ApiKeySettings>(DEFAULT_API_KEYS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load API keys from IndexedDB on mount
  useEffect(() => {
    const loadKeys = async () => {
      try {
        const stored = await getUserPreference<ApiKeySettings>(
          API_KEYS_STORAGE_KEY,
          DEFAULT_API_KEYS
        );
        setApiKeysState(stored);
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
    key: keyof Omit<ApiKeySettings, 'preferredProvider'>,
    value: string | undefined
  ) => {
    return saveApiKeys({ [key]: value });
  }, [saveApiKeys]);

  // Update preferred provider
  const setPreferredProvider = useCallback(async (provider: LLMProvider) => {
    return saveApiKeys({ preferredProvider: provider });
  }, [saveApiKeys]);

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

  // Check if client-side generation is available
  const canGenerateClientSide = Boolean(
    apiKeys.esvApiKey && apiKeys.openrouterApiKey
  );

  // Check if a specific provider is configured
  const isProviderConfigured = useCallback((provider: LLMProvider): boolean => {
    switch (provider) {
      case 'openrouter':
        return Boolean(apiKeys.openrouterApiKey);
      case 'groq':
        return Boolean(apiKeys.groqApiKey);
      case 'gemini':
        return Boolean(apiKeys.geminiApiKey);
      case 'claude':
        return Boolean(apiKeys.anthropicApiKey);
      case 'auto':
        return canGenerateClientSide;
      default:
        return false;
    }
  }, [apiKeys, canGenerateClientSide]);

  return {
    apiKeys,
    isLoading,
    isSaving,
    saveApiKeys,
    updateKey,
    setPreferredProvider,
    clearAllKeys,
    canGenerateClientSide,
    isProviderConfigured,
  };
}

/**
 * Get API keys directly (non-hook version for use in async functions)
 */
export async function getApiKeys(): Promise<ApiKeySettings> {
  return getUserPreference<ApiKeySettings>(API_KEYS_STORAGE_KEY, DEFAULT_API_KEYS);
}
