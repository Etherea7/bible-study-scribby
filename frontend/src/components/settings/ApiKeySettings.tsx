/**
 * ApiKeySettings - Modal for managing user API keys
 *
 * Allows users to configure their own API keys for:
 * - ESV Bible API (for passage fetching)
 * - OpenRouter (for LLM calls - CORS-enabled)
 * - Groq/Gemini/Claude (via backend proxy)
 *
 * Keys are stored in browser IndexedDB and never sent to our backend.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Eye,
  EyeOff,
  Key,
  AlertTriangle,
  Check,
  Trash2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useApiKeys } from '../../hooks/useApiKeys';
import type { ApiKeySettings as ApiKeySettingsType, LLMProvider } from '../../types';

interface ApiKeySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  helpUrl?: string;
  helpText?: string;
}

function KeyInput({ label, value, onChange, placeholder, helpUrl, helpText }: KeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
        {helpUrl && (
          <a
            href={helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
          >
            Get API key <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="
            w-full px-3 py-2 pr-10
            bg-[var(--bg-surface)] border border-[var(--border-color)]
            rounded-lg text-sm text-[var(--text-primary)]
            placeholder:text-[var(--text-muted)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50
          "
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {helpText && (
        <p className="text-xs text-[var(--text-muted)]">{helpText}</p>
      )}
    </div>
  );
}

export function ApiKeySettings({ isOpen, onClose }: ApiKeySettingsProps) {
  const {
    apiKeys,
    isLoading,
    isSaving,
    saveApiKeys,
    clearAllKeys,
  } = useApiKeys();

  // Local state for form
  const [localKeys, setLocalKeys] = useState<ApiKeySettingsType>({
    esvApiKey: '',
    openrouterApiKey: '',
    groqApiKey: '',
    geminiApiKey: '',
    anthropicApiKey: '',
    preferredProvider: 'auto',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync with stored keys when they load
  useEffect(() => {
    if (!isLoading) {
      setLocalKeys({
        esvApiKey: apiKeys.esvApiKey || '',
        openrouterApiKey: apiKeys.openrouterApiKey || '',
        groqApiKey: apiKeys.groqApiKey || '',
        geminiApiKey: apiKeys.geminiApiKey || '',
        anthropicApiKey: apiKeys.anthropicApiKey || '',
        preferredProvider: apiKeys.preferredProvider,
      });
    }
  }, [apiKeys, isLoading]);

  // Track changes
  useEffect(() => {
    const changed =
      localKeys.esvApiKey !== (apiKeys.esvApiKey || '') ||
      localKeys.openrouterApiKey !== (apiKeys.openrouterApiKey || '') ||
      localKeys.groqApiKey !== (apiKeys.groqApiKey || '') ||
      localKeys.geminiApiKey !== (apiKeys.geminiApiKey || '') ||
      localKeys.anthropicApiKey !== (apiKeys.anthropicApiKey || '') ||
      localKeys.preferredProvider !== apiKeys.preferredProvider;
    setHasChanges(changed);
    setSaveSuccess(false);
  }, [localKeys, apiKeys]);

  const handleSave = async () => {
    const keysToSave: ApiKeySettingsType = {
      esvApiKey: localKeys.esvApiKey || undefined,
      openrouterApiKey: localKeys.openrouterApiKey || undefined,
      groqApiKey: localKeys.groqApiKey || undefined,
      geminiApiKey: localKeys.geminiApiKey || undefined,
      anthropicApiKey: localKeys.anthropicApiKey || undefined,
      preferredProvider: localKeys.preferredProvider,
    };
    const success = await saveApiKeys(keysToSave);
    if (success) {
      setSaveSuccess(true);
      setHasChanges(false);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all API keys? This cannot be undone.')) {
      await clearAllKeys();
      setLocalKeys({
        esvApiKey: '',
        openrouterApiKey: '',
        groqApiKey: '',
        geminiApiKey: '',
        anthropicApiKey: '',
        preferredProvider: 'auto',
      });
    }
  };

  const updateKey = (key: keyof ApiKeySettingsType, value: string) => {
    setLocalKeys((prev) => ({ ...prev, [key]: value }));
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container - pointer-events-none lets clicks pass through to backdrop */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--bg-elevated)] rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-[var(--color-accent)]" />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    API Key Settings
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-6 overflow-y-auto">
                {/* Purpose Disclaimer */}
                <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-600 dark:text-blue-400">Why Configure API Keys?</p>
                    <p className="text-[var(--text-secondary)] mt-1">
                      Use your own API keys to operate on your personal rate limits instead of the shared server key, which has limited capacity.
                    </p>
                  </div>
                </div>

                {/* Security Warning */}
                <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-600">Security Notice</p>
                    <p className="text-[var(--text-secondary)] mt-1">
                      API keys are stored locally in your browser. They are visible in browser DevTools.
                      Only use free-tier or development keys here.
                    </p>
                  </div>
                </div>

                {/* Required Keys for Client-Side */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                    Required for Client-Side Generation
                  </h3>

                  <KeyInput
                    label="ESV Bible API Key"
                    value={localKeys.esvApiKey || ''}
                    onChange={(v) => updateKey('esvApiKey', v)}
                    placeholder="Enter your ESV API key"
                    helpUrl="https://api.esv.org/"
                    helpText="Required to fetch Bible passage text"
                  />

                  <KeyInput
                    label="OpenRouter API Key"
                    value={localKeys.openrouterApiKey || ''}
                    onChange={(v) => updateKey('openrouterApiKey', v)}
                    placeholder="Enter your OpenRouter API key"
                    helpUrl="https://openrouter.ai/keys"
                    helpText="Required for AI study generation (free tier available)"
                  />
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-surface)]">
                  <div
                    className={`w-2 h-2 rounded-full ${localKeys.esvApiKey && localKeys.openrouterApiKey
                        ? 'bg-green-500'
                        : 'bg-amber-500'
                      }`}
                  />
                  <span className="text-sm text-[var(--text-secondary)]">
                    {localKeys.esvApiKey && localKeys.openrouterApiKey
                      ? 'Ready for client-side generation'
                      : 'Configure both keys to enable client-side generation'}
                  </span>
                </div>

                {/* Optional Keys (for backend proxy) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                    Optional (Backend Proxy)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    These keys require the backend server to be running.
                  </p>

                  <KeyInput
                    label="Groq API Key"
                    value={localKeys.groqApiKey || ''}
                    onChange={(v) => updateKey('groqApiKey', v)}
                    placeholder="Enter your Groq API key"
                    helpUrl="https://console.groq.com/keys"
                  />

                  <KeyInput
                    label="Google Gemini API Key"
                    value={localKeys.geminiApiKey || ''}
                    onChange={(v) => updateKey('geminiApiKey', v)}
                    placeholder="Enter your Gemini API key"
                    helpUrl="https://aistudio.google.com/apikey"
                  />

                  <KeyInput
                    label="Anthropic (Claude) API Key"
                    value={localKeys.anthropicApiKey || ''}
                    onChange={(v) => updateKey('anthropicApiKey', v)}
                    placeholder="Enter your Anthropic API key"
                    helpUrl="https://console.anthropic.com/settings/keys"
                  />
                </div>

                {/* Provider Preference */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    Preferred Provider
                  </label>
                  <select
                    value={localKeys.preferredProvider}
                    onChange={(e) => updateKey('preferredProvider', e.target.value as LLMProvider)}
                    className="
                      w-full px-3 py-2
                      bg-[var(--bg-surface)] border border-[var(--border-color)]
                      rounded-lg text-sm text-[var(--text-primary)]
                      focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50
                    "
                  >
                    <option value="auto">Auto (OpenRouter first, then fallback)</option>
                    <option value="openrouter">OpenRouter only</option>
                    <option value="groq">Groq (via backend)</option>
                    <option value="gemini">Gemini (via backend)</option>
                    <option value="claude">Claude (via backend)</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)] flex-shrink-0">
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </button>

                <div className="flex items-center gap-2">
                  {saveSuccess && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="h-4 w-4" />
                      Saved
                    </span>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="
                      flex items-center gap-1.5 px-4 py-2
                      text-sm font-medium text-white
                      bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)]
                      rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors
                    "
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
