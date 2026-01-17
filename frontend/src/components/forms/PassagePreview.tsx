import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import {
    buildCrossChapterReference,
    getTotalVersesInRange,
    type PassageRange
} from '../../utils/bibleData';
import { fetchPassage } from '../../api/llmClient';
import { fetchPassageFromServer } from '../../api/studyApi';
import { useApiKeys } from '../../hooks/useApiKeys';

interface PassagePreviewProps {
    range: PassageRange;
    className?: string;
}

type PreviewState = 'idle' | 'loading' | 'success' | 'error';

export function PassagePreview({ range, className = '' }: PassagePreviewProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [passageText, setPassageText] = useState<string>('');
    const [state, setState] = useState<PreviewState>('idle');
    const [error, setError] = useState<string>('');
    const { apiKeys } = useApiKeys();

    // Debounce timer ref
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const lastFetchedRef = useRef<string>('');

    const reference = buildCrossChapterReference(range);
    const verseCount = getTotalVersesInRange(range);

    // Fetch passage when range changes (debounced)
    useEffect(() => {
        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Skip if same reference
        if (reference === lastFetchedRef.current) {
            return;
        }

        // Set loading state immediately for visual feedback
        setState('loading');

        // Debounce the API call
        debounceRef.current = setTimeout(async () => {
            try {
                let text: string;

                if (apiKeys.esvApiKey) {
                    // Use user's ESV API key (client-side), exclude headings for clean preview
                    text = await fetchPassage(reference, apiKeys.esvApiKey, { includeHeadings: false });
                } else {
                    // Fall back to server's ESV API, exclude headings for clean preview
                    text = await fetchPassageFromServer(reference, { includeHeadings: false });
                }

                setPassageText(text);
                setState('success');
                lastFetchedRef.current = reference;
            } catch (err) {
                console.error('[PassagePreview] Fetch error:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch passage');
                setState('error');
            }
        }, 500); // 500ms debounce

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [reference, apiKeys.esvApiKey]);

    const handleRetry = () => {
        lastFetchedRef.current = ''; // Force refetch
        setState('loading');
        // Trigger useEffect by changing a dependency
        setError('');
    };

    return (
        <div className={`rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden ${className}`}>
            {/* Header - Always visible */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="
          w-full flex items-center justify-between px-4 py-3
          bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)]
          transition-colors duration-200
        "
            >
                <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[var(--color-observation)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                        Preview: {reference}
                    </span>
                    {verseCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-observation)]/10 text-[var(--color-observation)]">
                            {verseCount} verse{verseCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {state === 'loading' && (
                        <Loader2 className="h-4 w-4 text-[var(--text-muted)] animate-spin" />
                    )}
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                    )}
                </div>
            </button>

            {/* Content - Collapsible */}
            {isExpanded && (
                <div className="px-4 py-3 border-t border-[var(--border-color)]">
                    {state === 'loading' && !passageText && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 text-[var(--color-observation)] animate-spin" />
                            <span className="ml-2 text-sm text-[var(--text-muted)]">
                                Loading passage...
                            </span>
                        </div>
                    )}

                    {state === 'error' && (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
                            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                                {error}
                            </p>
                            <button
                                type="button"
                                onClick={handleRetry}
                                className="
                  flex items-center gap-1.5 px-3 py-1.5
                  text-sm font-medium text-[var(--color-observation)]
                  hover:bg-[var(--color-observation)]/10
                  rounded-lg transition-colors
                "
                            >
                                <RefreshCw className="h-4 w-4" />
                                Retry
                            </button>
                        </div>
                    )}

                    {(state === 'success' || (state === 'loading' && passageText)) && passageText && (
                        <div className="max-h-96 overflow-y-auto">
                            <div className="passage-text text-sm leading-relaxed text-[var(--text-primary)]">
                                {passageText}
                            </div>
                        </div>
                    )}

                    {state === 'idle' && (
                        <div className="flex items-center justify-center py-6 text-sm text-[var(--text-muted)]">
                            Select a passage to preview
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
