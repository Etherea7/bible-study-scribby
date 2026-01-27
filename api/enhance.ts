import type { VercelRequest, VercelResponse } from '@vercel/node';
import { completePromptWithFallback } from './_shared';

/**
 * POST /api/enhance
 *
 * Generic text enhancement using LLM providers.
 * Used for AI-powered editing features like rephrase, draft, explain, etc.
 * Routes to the appropriate provider based on user preferences.
 *
 * Request body:
 * - prompt: string (required) - The full prompt to send to the LLM
 * - provider: string (optional) - Override provider (openrouter, anthropic, google)
 * - model: string (optional) - Override model selection
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt, provider, model } = req.body;

        // Validate required fields
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Missing required field: prompt' });
        }

        console.log(`[API] Enhancement request (provider: ${provider || 'auto'}, model: ${model || 'default'})`);

        // Complete the prompt with fallback
        const { result, provider: usedProvider } = await completePromptWithFallback(
            prompt,
            provider,
            model
        );

        console.log(`[API] Enhancement completed using ${usedProvider}`);

        return res.status(200).json({
            result,
            provider: usedProvider,
        });
    } catch (error) {
        console.error('[API] Enhancement error:', error);

        // Return appropriate status code based on error type
        const message = error instanceof Error ? error.message : 'Internal server error';

        if (message.includes('not configured')) {
            return res.status(400).json({ error: message });
        }

        return res.status(500).json({ error: message });
    }
}
