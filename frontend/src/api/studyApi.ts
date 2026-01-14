/**
 * API Client for Bible Study Scribby
 */

import type {
  GenerateStudyRequest,
  GenerateStudyResponse,
  ProvidersResponse,
} from '../types';

const API_BASE = '/api';

/**
 * Generate a Bible study for the given passage
 */
export async function generateStudy(
  request: GenerateStudyRequest
): Promise<GenerateStudyResponse> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get status of all LLM providers
 */
export async function getProviders(): Promise<ProvidersResponse> {
  const response = await fetch(`${API_BASE}/providers`);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}
