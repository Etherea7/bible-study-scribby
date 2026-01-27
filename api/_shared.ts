/**
 * Shared utilities for Vercel serverless functions
 */

// LLM Provider configurations
export const PROVIDERS = {
    groq: {
        name: 'groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
        envKey: 'GROQ_API_KEY',
    },
    openrouter: {
        name: 'openrouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        envKey: 'OPENROUTER_API_KEY',
    },
    gemini: {
        name: 'gemini',
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        model: 'gemini-2.0-flash',
        envKey: 'GOOGLE_API_KEY',
    },
    claude: {
        name: 'claude',
        url: 'https://api.anthropic.com/v1/messages',
        model: 'claude-sonnet-4-20250514',
        envKey: 'ANTHROPIC_API_KEY',
    },
} as const;

export type ProviderName = keyof typeof PROVIDERS;

// Default fallback order (Claude last as it's typically the most expensive)
export const PROVIDER_ORDER: ProviderName[] = ['groq', 'openrouter', 'gemini', 'claude'];

/**
 * Get available providers based on configured environment variables
 */
export function getAvailableProviders(): ProviderName[] {
    return PROVIDER_ORDER.filter((name) => {
        const config = PROVIDERS[name];
        return Boolean(process.env[config.envKey]);
    });
}

/**
 * Parse JSON from LLM response, handling potential markdown code blocks
 */
export function parseJsonResponse<T>(responseText: string): T {
    let text = responseText.trim();

    // Handle markdown code blocks
    if (text.startsWith('```')) {
        const lines = text.split('\n');
        // Remove first line (```json or ```)
        lines.shift();
        // Find and remove closing ```
        const closingIndex = lines.findIndex((line) => line.trim() === '```');
        if (closingIndex !== -1) {
            lines.splice(closingIndex);
        }
        text = lines.join('\n');
    }

    return JSON.parse(text) as T;
}

/**
 * Create an error study response
 */
export function createErrorStudy(errorMessage: string) {
    return {
        error: true,
        purpose: `Error: ${errorMessage}`,
        context: 'Unable to generate study at this time.',
        key_themes: ['Error'],
        study_flow: [
            {
                passage_section: 'N/A',
                section_heading: 'Error',
                observation_question: 'What does the text say?',
                observation_answer: 'Please try again.',
                interpretation_question: 'What does it mean?',
                interpretation_answer: 'Please try again.',
                connection: '',
            },
        ],
        summary: errorMessage,
        application_questions: ['Please try generating the study again.'],
        cross_references: [],
        prayer_prompt: "Pray for understanding as you read God's Word.",
    };
}

/**
 * The study generation prompt (shared with frontend)
 */
export const STUDY_PROMPT = `You are an expert Bible study curriculum designer creating an in-depth expository study for personal use.

Given the following Bible passage, create a comprehensive study guide that guides the reader through the text section by section, weaving observation and interpretation questions together naturally.

Passage Reference: {reference}

Passage Text:
{passage_text}

IMPORTANT INSTRUCTIONS:

1. STUDY FLOW STRUCTURE:
   - Break the passage into logical sections (2-4 sections typically)
   - For each section, provide BOTH an observation question AND an interpretation question
   - Observation asks "What does the text literally say?" (who, what, when, where)
   - Interpretation asks "What does this mean spiritually/theologically?"
   - Include sample answers for both observation and interpretation questions
   - Optionally add a "connection" sentence that bridges to the next section

2. APPLICATION QUESTIONS:
   - Provide 3 application questions at the end
   - Do NOT provide sample answers for application (personal reflection)
   - Make them practical and actionable

3. CROSS-REFERENCES:
   - Include cross references when they have direct involvement or are quoted in the passage.
   - Many passages in New Testament allude to events/accounts in the Old Testament, would be helpful to include these
   - Each must have a clear explanatory note
   - Quality over quantity - if no meaningful references exist, ok to not have any.

4. THEOLOGICAL GUIDELINES (Reformed Christian):
   You MUST ensure all generated content aligns with these doctrines:

   a) THE TRINITY: One God existing eternally as three distinct persons - Father, Son, and Holy Spirit - each fully God, sharing one undivided divine essence.

   b) TOTAL DEPRAVITY: All humanity is sinful from birth and utterly unable to save themselves apart from God's sovereign grace.

   c) UNCONDITIONAL ELECTION: God sovereignly chooses those He will save, not based on any foreseen merit, faith, or works in the person.

   d) SUBSTITUTIONARY ATONEMENT: Jesus Christ, fully God and fully man, died as a substitutionary sacrifice bearing the wrath of God for the sins of His people, and rose for their justification.

   e) SALVATION BY GRACE THROUGH FAITH: Salvation is entirely by grace through faith in Christ alone - not by human works, merit, or decision.

   f) SCRIPTURE AUTHORITY: The Bible is the infallible, inerrant Word of God, the final authority for faith and practice.

   g) PERSEVERANCE OF THE SAINTS: Those truly saved by God will be kept by His power unto eternal life and cannot lose their salvation.

5. HANDLING AMBIGUOUS OR DEBATED PASSAGES:
   - Focus on what the text clearly and concretely states
   - If a passage has multiple scholarly interpretations on non-essential matters, acknowledge this briefly
   - Always interpret unclear passages in light of clearer Scripture (let Scripture interpret Scripture)
   - Never speculate beyond what the text supports
   - For disputed interpretations, present the Reformed position while noting that debate exists among scholars
   - Do NOT generate content that contradicts the theological guidelines above

6. OUTPUT FORMAT:
   - Return ONLY valid JSON, no markdown code blocks, no preamble
   - Follow the exact structure below

JSON STRUCTURE:
{
    "purpose": "Single-sentence action-focused purpose starting with an action verb to dictate action/purpose. If passage is more based on truths/knowledge, the verb can just be to 'Know' or to 'Believe' ",
    "context": "2-3 sentences of historical, cultural, or literary background",
    "key_themes": ["theme1", "theme2", "theme3"],
    "study_flow": [
        {
            "passage_section": "Verse range (e.g., 'John 1:1-2')",
            "section_heading": "Brief descriptive heading",
            "observation_question": "What does the text literally say about...?",
            "observation_answer": "Complete answer based on careful reading of the text",
            "interpretation_question": "What does this mean spiritually/theologically?",
            "interpretation_answer": "Complete interpretive answer connecting to broader meaning",
            "connection": "Optional: How this section connects to the next"
        }
    ],
    "summary": "2-3 sentences synthesizing the main themes and message",
    "application_questions": [
        "Personal reflection question 1 (no answer)",
        "Personal reflection question 2 (no answer)",
        "Personal reflection question 3 (no answer)"
    ],
    "cross_references": [
        {
            "reference": "Book Chapter:Verse",
            "note": "Brief explanation of how this illuminates the passage"
        }
    ],
    "prayer_prompt": "A focused prayer direction based on this passage (3-4 sentences)"
}

Respond ONLY with valid JSON.`;

/**
 * Format the study prompt with reference and passage text
 */
export function formatStudyPrompt(reference: string, passageText: string): string {
    return STUDY_PROMPT.replace('{reference}', reference).replace('{passage_text}', passageText);
}

/**
 * Call Groq API
 */
export async function callGroq(prompt: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('Groq API key not configured');

    const response = await fetch(PROVIDERS.groq.url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: PROVIDERS.groq.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert Bible study curriculum designer. Always respond with valid JSON only.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.6,
            max_tokens: 3000,
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Call OpenRouter API
 */
export async function callOpenRouter(prompt: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OpenRouter API key not configured');

    const response = await fetch(PROVIDERS.openrouter.url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://bible-study-scribby.vercel.app',
            'X-Title': 'Bible Study Scribby',
        },
        body: JSON.stringify({
            model: PROVIDERS.openrouter.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert Bible study curriculum designer. Always respond with valid JSON only.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.6,
            max_tokens: 3000,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Call Gemini API
 */
export async function callGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('Gemini API key not configured');

    const url = `${PROVIDERS.gemini.url}?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: `You are an expert Bible study curriculum designer. Always respond with valid JSON only.\n\n${prompt}`,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 3000,
                responseMimeType: 'application/json',
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

/**
 * Call Claude API (JSON mode)
 */
export async function callClaude(prompt: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Anthropic API key not configured');

    const response = await fetch(PROVIDERS.claude.url, {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: PROVIDERS.claude.model,
            max_tokens: 3000,
            messages: [
                {
                    role: 'user',
                    content: `You are an expert Bible study curriculum designer. Always respond with valid JSON only.\n\n${prompt}`,
                },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

// Provider mapping from frontend names to backend names
export const PROVIDER_MAPPING: Record<string, ProviderName | 'claude'> = {
    openrouter: 'openrouter',
    anthropic: 'claude',
    google: 'gemini',
    claude: 'claude',
    gemini: 'gemini',
    groq: 'groq',
};

/**
 * Call Groq API for text completion (no JSON mode)
 */
export async function callGroqText(prompt: string, model?: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('Groq API key not configured');

    const response = await fetch(PROVIDERS.groq.url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model || PROVIDERS.groq.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert Bible study curriculum writer. Respond with plain text only, no JSON or markdown formatting unless specifically requested.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.6,
            max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Call OpenRouter API for text completion (no JSON mode)
 */
export async function callOpenRouterText(prompt: string, model?: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OpenRouter API key not configured');

    const response = await fetch(PROVIDERS.openrouter.url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://bible-study-scribby.vercel.app',
            'X-Title': 'Bible Study Scribby',
        },
        body: JSON.stringify({
            model: model || PROVIDERS.openrouter.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert Bible study curriculum writer. Respond with plain text only, no JSON or markdown formatting unless specifically requested.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.6,
            max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Call Gemini API for text completion (no JSON mode)
 */
export async function callGeminiText(prompt: string, model?: string): Promise<string> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('Gemini API key not configured');

    // Build URL with model
    const effectiveModel = model || PROVIDERS.gemini.model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: `You are an expert Bible study curriculum writer. Respond with plain text only, no JSON or markdown formatting unless specifically requested.\n\n${prompt}`,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 2000,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

/**
 * Call Claude API for text completion
 */
export async function callClaudeText(prompt: string, model?: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Anthropic API key not configured');

    const effectiveModel = model || 'claude-sonnet-4-20250514';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: effectiveModel,
            max_tokens: 2000,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

/**
 * Complete a prompt with automatic fallback through providers
 * Used for enhancement operations (rephrase, draft, explain, etc.)
 */
export async function completePromptWithFallback(
    prompt: string,
    requestedProvider?: string,
    requestedModel?: string
): Promise<{ result: string; provider: string }> {
    // Map frontend provider names to backend names
    const effectiveProvider = requestedProvider
        ? PROVIDER_MAPPING[requestedProvider.toLowerCase()]
        : undefined;

    // Text completion callers
    const textCallers: Record<string, (prompt: string, model?: string) => Promise<string>> = {
        groq: callGroqText,
        openrouter: callOpenRouterText,
        gemini: callGeminiText,
        claude: callClaudeText,
    };

    // If a specific provider is requested, try only that one
    if (effectiveProvider && textCallers[effectiveProvider]) {
        const apiKeyEnv = effectiveProvider === 'claude' ? 'ANTHROPIC_API_KEY' :
            effectiveProvider === 'gemini' ? 'GOOGLE_API_KEY' :
            effectiveProvider === 'openrouter' ? 'OPENROUTER_API_KEY' :
            'GROQ_API_KEY';

        if (!process.env[apiKeyEnv]) {
            throw new Error(`${effectiveProvider} API key not configured on server`);
        }

        console.log(`[API] Using requested provider: ${effectiveProvider}`);
        const result = await textCallers[effectiveProvider](prompt, requestedModel);
        return { result: result.trim(), provider: effectiveProvider };
    }

    // Auto mode: try providers in fallback order
    const availableProviders = getAvailableProviders();

    if (availableProviders.length === 0) {
        throw new Error(
            'No LLM providers configured. Please add at least one API key to environment variables.'
        );
    }

    // Try available providers in order
    for (const providerName of availableProviders) {
        try {
            console.log(`[API] Trying provider for text completion: ${providerName}`);
            const caller = textCallers[providerName];
            if (!caller) continue;

            const result = await caller(prompt, requestedModel);
            console.log(`[API] Successfully completed prompt using ${providerName}`);
            return { result: result.trim(), provider: providerName };
        } catch (error) {
            console.error(`[API] Provider ${providerName} failed:`, error);
            continue;
        }
    }

    throw new Error('All LLM providers failed. Please try again later.');
}

/**
 * Generate study with automatic fallback through providers
 */
export async function generateStudyWithFallback(
    reference: string,
    passageText: string
): Promise<{ study: Record<string, unknown>; provider: string }> {
    const prompt = formatStudyPrompt(reference, passageText);
    const availableProviders = getAvailableProviders();

    if (availableProviders.length === 0) {
        return {
            study: createErrorStudy(
                'No LLM providers configured. Please add at least one API key (GROQ_API_KEY, OPENROUTER_API_KEY, GOOGLE_API_KEY, or ANTHROPIC_API_KEY) to environment variables.'
            ),
            provider: 'error',
        };
    }

    const callers: Record<ProviderName, (prompt: string) => Promise<string>> = {
        groq: callGroq,
        openrouter: callOpenRouter,
        gemini: callGemini,
        claude: callClaude,
    };

    for (const providerName of availableProviders) {
        try {
            console.log(`[API] Trying provider: ${providerName}`);
            const caller = callers[providerName];
            const responseText = await caller(prompt);
            const study = parseJsonResponse<Record<string, unknown>>(responseText);

            if (study.error) {
                console.log(`[API] Provider ${providerName} returned error, trying next...`);
                continue;
            }

            console.log(`[API] Successfully generated study using ${providerName}`);
            return { study, provider: providerName };
        } catch (error) {
            console.error(`[API] Provider ${providerName} failed:`, error);
            continue;
        }
    }

    return {
        study: createErrorStudy('All LLM providers failed. Please try again later.'),
        provider: 'error',
    };
}
