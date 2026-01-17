import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PROVIDERS, PROVIDER_ORDER, type ProviderName } from './_shared';

/**
 * GET /api/providers
 *
 * Get status of all LLM providers.
 * Returns which providers are configured and available.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const status: Record<string, { available: boolean; model: string }> = {};

    for (const name of PROVIDER_ORDER) {
        const config = PROVIDERS[name as ProviderName];
        status[name] = {
            available: Boolean(process.env[config.envKey]),
            model: config.model,
        };
    }

    return res.status(200).json({ providers: status });
}
