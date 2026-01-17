/**
 * LLM Client - Direct client-side API calls to OpenRouter and ESV
 *
 * OpenRouter: CORS-enabled LLM API (can call directly from browser)
 * ESV API: CORS-enabled Bible passage API
 *
 * These calls bypass the backend when the user provides their own API keys.
 */

import type { Study } from '../types';

// OpenRouter configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'meta-llama/llama-3.2-3b-instruct:free';

// ESV API configuration
const ESV_API_URL = 'https://api.esv.org/v3/passage/text/';

/**
 * Error class for LLM API errors
 */
export class LLMError extends Error {
  readonly provider: string;
  readonly statusCode?: number;

  constructor(message: string, provider: string, statusCode?: number) {
    super(message);
    this.name = 'LLMError';
    this.provider = provider;
    this.statusCode = statusCode;
  }
}


/**
 * Call OpenRouter API directly from the browser.
 *
 * @param prompt - The full prompt to send to the LLM
 * @param apiKey - The user's OpenRouter API key
 * @param rawText - If true, return raw text instead of parsing as JSON
 * @returns Parsed Study object or raw text from the LLM response
 */
export async function callOpenRouter(
  prompt: string,
  apiKey: string,
  rawText: boolean = false
): Promise<Study | string> {
  console.log('[Dev] Calling OpenRouter directly from browser');

  const systemContent = rawText
    ? 'You are an expert Bible study curriculum writer. Respond with plain text only, no JSON or markdown.'
    : 'You are an expert Bible study curriculum designer. Respond with valid JSON only.';

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Bible Study Scribby',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: rawText ? 1000 : 3000,
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

  // Return raw text if requested
  if (rawText) {
    console.log('[Dev] OpenRouter raw text response received');
    return content.trim();
  }

  // Try to parse the JSON response
  try {
    // Handle potential markdown code block wrapping
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
    console.error('[Dev] Raw content:', content);
    throw new LLMError(
      'Failed to parse LLM response as JSON. The model may have returned invalid JSON.',
      'openrouter'
    );
  }
}

/**
 * Options for fetching passages
 */
export interface FetchPassageOptions {
  includeHeadings?: boolean;  // Default: true
}

/**
 * Fetch Bible passage text from ESV API directly from the browser.
 *
 * @param reference - The passage reference (e.g., "John 1:1-18")
 * @param apiKey - The user's ESV API key
 * @param options - Optional settings for the fetch
 * @returns The passage text
 */
export async function fetchPassage(
  reference: string,
  apiKey: string,
  options: FetchPassageOptions = {}
): Promise<string> {
  const { includeHeadings = true } = options;

  console.log(`[Dev] Fetching passage "${reference}" from ESV API`);

  const params = new URLSearchParams({
    q: reference,
    'include-headings': includeHeadings ? 'true' : 'false',
    'include-verse-numbers': 'true',
    'include-footnotes': 'false',
    'include-short-copyright': 'true',
  });

  const response = await fetch(`${ESV_API_URL}?${params}`, {
    headers: {
      Authorization: `Token ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Dev] ESV API error:', errorText);
    throw new LLMError(
      `ESV API error: ${response.status} ${response.statusText}`,
      'esv',
      response.status
    );
  }

  const data = await response.json();

  if (!data.passages || data.passages.length === 0) {
    throw new LLMError(`No passage found for reference: ${reference}`, 'esv');
  }

  console.log('[Dev] ESV passage fetched successfully');
  return data.passages[0];
}

/**
 * Build the passage reference string from components.
 * Supports same-chapter ranges (John 1:1-18) and cross-chapter ranges (John 1:1-2:10)
 *
 * @param book - Book name (e.g., "John")
 * @param startChapter - Start chapter number
 * @param startVerse - Start verse number (optional, defaults to 1)
 * @param endChapter - End chapter number (optional, defaults to startChapter)
 * @param endVerse - End verse number (optional)
 * @returns Formatted reference string (e.g., "John 1:1-18" or "John 1:1-2:10")
 */
export function buildReference(
  book: string,
  startChapter: number,
  startVerse?: number,
  endChapter?: number,
  endVerse?: number
): string {
  // Default end chapter to start chapter if not provided
  const effectiveEndChapter = endChapter ?? startChapter;

  // If no verses specified, just return book and chapter
  if (!startVerse) {
    if (startChapter === effectiveEndChapter) {
      return `${book} ${startChapter}`;
    }
    return `${book} ${startChapter}-${effectiveEndChapter}`;
  }

  // Same chapter case
  if (startChapter === effectiveEndChapter) {
    if (!endVerse || endVerse === startVerse) {
      return `${book} ${startChapter}:${startVerse}`;
    }
    return `${book} ${startChapter}:${startVerse}-${endVerse}`;
  }

  // Cross-chapter case
  if (!endVerse) {
    return `${book} ${startChapter}:${startVerse}-${effectiveEndChapter}`;
  }
  return `${book} ${startChapter}:${startVerse}-${effectiveEndChapter}:${endVerse}`;
}
