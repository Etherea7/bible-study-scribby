import type { VercelRequest, VercelResponse } from '@vercel/node';

// ESV API configuration
const ESV_API_URL = 'https://api.esv.org/v3/passage/text/';

/**
 * POST /api/passage
 *
 * Fetch Bible passage text from ESV API.
 * Used when user doesn't have their own ESV API key configured.
 * 
 * Request body:
 * - reference: string (required) - The passage reference
 * - include_headings: boolean (optional, default: true) - Whether to include section headings
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { reference, include_headings = true } = req.body;

        if (!reference || typeof reference !== 'string') {
            return res.status(400).json({ error: 'Missing required field: reference' });
        }

        const apiKey = process.env.ESV_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                error: 'ESV API key not configured on server.',
            });
        }

        // Convert include_headings to boolean if it's a string
        const includeHeadings = include_headings === true || include_headings === 'true';

        const params = new URLSearchParams({
            q: reference,
            'include-headings': includeHeadings ? 'true' : 'false',
            'include-footnotes': 'false',
            'include-verse-numbers': 'true',
            'include-short-copyright': 'true',
            'include-passage-references': includeHeadings ? 'true' : 'false',
        });

        const response = await fetch(`${ESV_API_URL}?${params}`, {
            headers: {
                Authorization: `Token ${apiKey}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] ESV API error:', errorText);
            return res.status(response.status).json({
                error: `ESV API error: ${response.status}`,
            });
        }

        const data = await response.json();
        const passages = data.passages || [];

        if (passages.length === 0) {
            return res.status(404).json({
                error: `No passage found for: ${reference}`,
            });
        }

        return res.status(200).json({
            passage_text: passages[0].trim(),
        });
    } catch (error) {
        console.error('[API] Error fetching passage:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
}
