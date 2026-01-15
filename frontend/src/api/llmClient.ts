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
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

/**
 * Call OpenRouter API directly from the browser.
 *
 * @param prompt - The full prompt to send to the LLM
 * @param apiKey - The user's OpenRouter API key
 * @returns Parsed Study object from the LLM response
 */
export async function callOpenRouter(prompt: string, apiKey: string): Promise<Study> {
  console.log('[Dev] Calling OpenRouter directly from browser');

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
          content:
            'You are an expert Bible study curriculum designer. Respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 3000,
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
 * Fetch Bible passage text from ESV API directly from the browser.
 *
 * @param reference - The passage reference (e.g., "John 1:1-18")
 * @param apiKey - The user's ESV API key
 * @returns The passage text
 */
export async function fetchPassage(reference: string, apiKey: string): Promise<string> {
  console.log(`[Dev] Fetching passage "${reference}" from ESV API`);

  const params = new URLSearchParams({
    q: reference,
    'include-headings': 'true',
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
 *
 * @param book - Book name (e.g., "John")
 * @param chapter - Chapter number
 * @param startVerse - Optional start verse
 * @param endVerse - Optional end verse
 * @returns Formatted reference string (e.g., "John 1:1-18")
 */
export function buildReference(
  book: string,
  chapter: number,
  startVerse?: number,
  endVerse?: number
): string {
  let reference = `${book} ${chapter}`;

  if (startVerse) {
    reference += `:${startVerse}`;
    if (endVerse && endVerse !== startVerse) {
      reference += `-${endVerse}`;
    }
  }

  return reference;
}
