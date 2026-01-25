/**
 * AI Enhance Client - Client-side AI enhancement using OpenRouter
 *
 * Provides functions to enhance individual questions or regenerate sections.
 * Requires user to have configured their OpenRouter API key.
 */

import { callOpenRouter, LLMError } from './llmClient';
import { getApiKeys } from '../hooks/useApiKeys';
import type { EditableStudyFlowSection, EditableQuestionType } from '../types';

/**
 * Check if AI enhance is available (user has OpenRouter API key configured)
 */
export async function isEnhanceAvailable(): Promise<boolean> {
  const keys = await getApiKeys();
  return Boolean(keys.openrouterApiKey);
}

/**
 * Enhance a single question using AI.
 *
 * @param question - The current question text
 * @param answer - The current answer (optional)
 * @param questionType - The type of question (observation/interpretation/feeling/application)
 * @param passageContext - Relevant passage text for context
 * @returns Enhanced question and answer
 */
export async function enhanceQuestion(
  question: string,
  answer: string | undefined,
  questionType: EditableQuestionType,
  passageContext: string
): Promise<{ question: string; answer?: string }> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  const typeGuidance = getTypeGuidance(questionType);

  const prompt = `You are an expert Bible study curriculum designer. Your task is to improve a Bible study question.

PASSAGE CONTEXT:
${passageContext}

QUESTION TYPE: ${questionType}
${typeGuidance}

CURRENT QUESTION: ${question}
${answer ? `CURRENT ANSWER: ${answer}` : ''}

Please improve this question to be:
- More thought-provoking and theologically rich
- Clear and well-structured
- Appropriate for the question type
- Grounded in the passage context

Return ONLY valid JSON in this exact format:
{
  "question": "Your improved question here",
  ${answer || questionType === 'observation' || questionType === 'interpretation' ? '"answer": "Your improved answer here"' : '"answer": null'}
}`;

  const response = await callOpenRouter(prompt, keys.openrouterApiKey);

  // The response should have question and answer fields
  return {
    question: (response as unknown as { question: string }).question || question,
    answer: (response as unknown as { answer?: string }).answer || answer,
  };
}

/**
 * Regenerate an entire section with new questions.
 *
 * @param section - The current section
 * @param passageText - The full passage text
 * @returns Updated section with new questions
 */
export async function regenerateSection(
  section: EditableStudyFlowSection,
  passageText: string
): Promise<EditableStudyFlowSection> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  const prompt = `You are an expert Bible study curriculum designer. Your task is to regenerate questions for a Bible study section.

PASSAGE SECTION: ${section.passage_section}
SECTION HEADING: ${section.section_heading}

FULL PASSAGE TEXT:
${passageText}

Please generate new questions for this section. Include:
1. One observation question (What does the text say?)
2. One interpretation question (What does it mean?)
3. Optionally, a feeling question if the passage warrants emotional/spiritual response
4. A connection sentence bridging to further study (optional)

Return ONLY valid JSON in this exact format:
{
  "section_heading": "Your section heading",
  "questions": [
    {
      "type": "observation",
      "question": "Your observation question",
      "answer": "Sample answer based on the text"
    },
    {
      "type": "interpretation",
      "question": "Your interpretation question",
      "answer": "Sample interpretive answer"
    }
  ],
  "connection": "Optional connection to next section or further study"
}`;

  const response = await callOpenRouter(prompt, keys.openrouterApiKey) as unknown as {
    section_heading?: string;
    questions?: Array<{ type: string; question: string; answer?: string }>;
    connection?: string;
  };

  // Map response to EditableStudyFlowSection format
  return {
    ...section,
    section_heading: response.section_heading || section.section_heading,
    questions: (response.questions || []).map((q) => ({
      id: crypto.randomUUID(),
      type: q.type as EditableQuestionType,
      question: q.question,
      answer: q.answer,
    })),
    connection: response.connection || section.connection,
  };
}

/**
 * Rephrase selected text for clarity or different tone.
 *
 * @param text - The selected text to rephrase
 * @param context - Surrounding context (optional)
 * @returns Rephrased text
 */
export async function rephraseText(
  text: string,
  context?: string
): Promise<string> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  const prompt = `You are an expert Bible study curriculum writer. Rephrase the following text to be clearer, more engaging, and theologically precise while maintaining the same meaning.

${context ? `CONTEXT:\n${context}\n\n` : ''}TEXT TO REPHRASE:
${text}

Return ONLY the rephrased text, no quotes or explanation.`;

  const response = await callOpenRouter(prompt, keys.openrouterApiKey, true);
  return typeof response === 'string' ? response.trim() : text;
}

/**
 * Shorten selected text while preserving key meaning.
 *
 * @param text - The selected text to shorten
 * @param context - Surrounding context (optional)
 * @returns Shortened text
 */
export async function shortenText(
  text: string,
  context?: string
): Promise<string> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  const prompt = `You are an expert Bible study curriculum writer. Shorten the following text to be more concise while preserving the essential meaning and theological accuracy.

${context ? `CONTEXT:\n${context}\n\n` : ''}TEXT TO SHORTEN:
${text}

Return ONLY the shortened text, no quotes or explanation. Aim for roughly 50-70% of the original length.`;

  const response = await callOpenRouter(prompt, keys.openrouterApiKey, true);
  return typeof response === 'string' ? response.trim() : text;
}

/**
 * Draft a purpose statement for a Bible study passage.
 *
 * @param reference - The Bible reference (e.g., "John 1:1-18")
 * @param passageText - The full passage text
 * @returns A purpose statement string
 */
export async function draftPurposeStatement(
  reference: string,
  passageText: string
): Promise<string> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  const prompt = `You are an expert Bible study curriculum designer with a Reformed theological perspective.

Generate a concise purpose statement for a study of ${reference}.

PASSAGE TEXT:
${passageText}

The purpose statement should:
- State what the reader will learn or understand
- Be specific to this passage's unique contribution
- Be 1-2 sentences maximum
- Focus on the main theological truth

Return ONLY the purpose statement text, no quotes or explanation.`;

  const response = await callOpenRouter(prompt, keys.openrouterApiKey, true);
  return typeof response === 'string' ? response.trim() : '';
}

/**
 * Draft historical context for a Bible passage.
 *
 * @param reference - The Bible reference
 * @param passageText - The full passage text
 * @returns Historical context string
 */
export async function draftHistoricalContext(
  reference: string,
  passageText: string
): Promise<string> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  const prompt = `You are an expert Bible study curriculum designer with a Reformed theological perspective.

Generate historical and literary context for a study of ${reference}.

PASSAGE TEXT:
${passageText}

The context should include:
- Author and audience (who wrote it, to whom)
- Historical setting (time period, circumstances)
- Literary context (where it fits in the book's argument)
- Key background information the reader needs

Keep it to 2-4 sentences. Be accurate and helpful without overwhelming detail.

Return ONLY the context text, no quotes or explanation.`;

  const response = await callOpenRouter(prompt, keys.openrouterApiKey, true);
  return typeof response === 'string' ? response.trim() : '';
}

/**
 * Validate if user notes are relevant to the passage context.
 * Returns a relevance score and feedback.
 *
 * @param userNotes - The user's free-write notes
 * @param passageText - The Bible passage text
 * @param sectionHeading - The section heading for context
 * @returns Validation result with relevance score and feedback
 */
export async function validateUserNotes(
  userNotes: string,
  passageText: string,
  sectionHeading: string
): Promise<{ isRelevant: boolean; score: number; feedback: string }> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  // Skip validation for very short notes
  if (userNotes.trim().length < 20) {
    return {
      isRelevant: false,
      score: 0,
      feedback: 'Notes are too short to validate. Please add more detail.',
    };
  }

  const prompt = `You are an expert Bible study evaluator. Assess whether the user's notes are relevant to the given Bible passage.

PASSAGE TEXT:
${passageText}

SECTION: ${sectionHeading}

USER'S NOTES:
${userNotes}

Evaluate:
1. Do the notes relate to themes, concepts, or content in the passage?
2. Are they theologically consistent (not contradicting the passage)?
3. Could they meaningfully guide question generation for this passage?

Return ONLY valid JSON:
{
  "isRelevant": true/false,
  "score": 0-100,
  "feedback": "Brief explanation of relevance assessment"
}

Score guide:
- 0-30: Off-topic or irrelevant
- 31-60: Partially relevant, some connection to passage
- 61-100: Clearly relevant and useful for guiding study`;

  try {
    const response = await callOpenRouter(prompt, keys.openrouterApiKey) as unknown as {
      isRelevant?: boolean;
      score?: number;
      feedback?: string;
    };

    return {
      isRelevant: response.isRelevant ?? false,
      score: response.score ?? 0,
      feedback: response.feedback ?? 'Unable to assess relevance.',
    };
  } catch (error) {
    console.error('Failed to validate notes:', error);
    // On error, be permissive and allow notes to be used
    return {
      isRelevant: true,
      score: 50,
      feedback: 'Validation unavailable. Proceeding with notes.',
    };
  }
}

/**
 * Draft observation questions for a passage section.
 *
 * @param sectionText - The text of the specific section
 * @param sectionHeading - The heading for this section
 * @param count - Number of questions to generate (default: 2)
 * @param userNotes - Optional user notes to guide question generation
 * @returns Array of observation questions with answers
 */
export async function draftObservationQuestions(
  sectionText: string,
  sectionHeading: string,
  count: number = 2,
  userNotes?: string
): Promise<Array<{ question: string; answer: string }>> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  const userNotesSection = userNotes?.trim()
    ? `\nUSER'S STUDY NOTES (use these to guide your questions where relevant):
${userNotes}

When generating questions, incorporate insights from the user's notes where they align with the passage. Focus on what the user found interesting or important.
`
    : '';

  const prompt = `You are an expert Bible study curriculum designer with a Reformed theological perspective.

Generate ${count} observation questions for this Bible passage section.

SECTION: ${sectionHeading}
PASSAGE TEXT:
${sectionText}
${userNotesSection}
Observation questions should:
- Ask what the text literally says (who, what, when, where, how)
- Be answerable directly from the text
- Help readers notice details they might miss
- Focus on concrete facts, not interpretation

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {"question": "Your observation question", "answer": "Sample answer from the text"},
    {"question": "Second observation question", "answer": "Sample answer from the text"}
  ]
}`;

  const response = await callOpenRouter(prompt, keys.openrouterApiKey) as unknown as {
    questions?: Array<{ question: string; answer: string }>;
  };

  return response.questions || [];
}

/**
 * Draft interpretation questions for a passage section.
 *
 * @param sectionText - The text of the specific section
 * @param sectionHeading - The heading for this section
 * @param count - Number of questions to generate (default: 2)
 * @param userNotes - Optional user notes to guide question generation
 * @returns Array of interpretation questions with answers
 */
export async function draftInterpretationQuestions(
  sectionText: string,
  sectionHeading: string,
  count: number = 2,
  userNotes?: string
): Promise<Array<{ question: string; answer: string }>> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  const userNotesSection = userNotes?.trim()
    ? `\nUSER'S STUDY NOTES (use these to guide your questions where relevant):
${userNotes}

When generating questions, incorporate insights from the user's notes where they align with the passage. Focus on theological themes and interpretations the user highlighted.
`
    : '';

  const prompt = `You are an expert Bible study curriculum designer with a Reformed theological perspective.

Generate ${count} interpretation questions for this Bible passage section.

SECTION: ${sectionHeading}
PASSAGE TEXT:
${sectionText}
${userNotesSection}
Interpretation questions should:
- Ask what the text means spiritually/theologically
- Connect to broader biblical themes
- Explore the author's purpose and message
- Consider historical and literary context
- Be grounded in Reformed theology

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {"question": "Your interpretation question", "answer": "Sample interpretive answer"},
    {"question": "Second interpretation question", "answer": "Sample interpretive answer"}
  ]
}`;

  const response = await callOpenRouter(prompt, keys.openrouterApiKey) as unknown as {
    questions?: Array<{ question: string; answer: string }>;
  };

  return response.questions || [];
}

/**
 * Draft application questions for a passage.
 *
 * @param passageText - The full passage text
 * @param count - Number of questions to generate (default: 3)
 * @returns Array of application questions
 */
export async function draftApplicationQuestions(
  passageText: string,
  count: number = 3
): Promise<Array<{ question: string }>> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  const prompt = `You are an expert Bible study curriculum designer with a Reformed theological perspective.

Generate ${count} application questions for this Bible passage.

PASSAGE TEXT:
${passageText}

Application questions should:
- Ask how to apply the passage to daily life
- Be practical and actionable
- Connect truth to behavior/attitude change
- Be personal and challenging
- Respect the indicative-imperative pattern (what God has done → how we respond)

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {"question": "Your application question"},
    {"question": "Second application question"},
    {"question": "Third application question"}
  ]
}`;

  const response = await callOpenRouter(prompt, keys.openrouterApiKey) as unknown as {
    questions?: Array<{ question: string }>;
  };

  return response.questions || [];
}

/**
 * Explain a selected portion of Bible text.
 *
 * @param selectedText - The selected text to explain
 * @param fullPassageContext - The full passage for context
 * @returns Explanation string
 */
export async function explainPassage(
  selectedText: string,
  fullPassageContext: string
): Promise<string> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  const prompt = `You are an expert Bible teacher with a Reformed theological perspective.

Explain the following selected text from Scripture in a helpful, accessible way.

SELECTED TEXT:
"${selectedText}"

FULL PASSAGE CONTEXT:
${fullPassageContext}

Your explanation should:
- Clarify the meaning in plain language
- Note any important Greek/Hebrew word meanings if relevant
- Connect to the passage's main point
- Be 2-4 sentences
- Be theologically accurate (Reformed perspective)

Return ONLY the explanation text, no quotes or headers.`;

  const response = await callOpenRouter(prompt, keys.openrouterApiKey, true);
  return typeof response === 'string' ? response.trim() : '';
}

/**
 * Find cross-references for a selected portion of Bible text.
 *
 * @param selectedText - The selected text to find references for
 * @param reference - The current passage reference
 * @returns Array of cross references with notes
 */
export async function findCrossReferences(
  selectedText: string,
  reference: string
): Promise<Array<{ reference: string; note: string }>> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  const prompt = `You are an expert Bible study curriculum designer with a Reformed theological perspective.

Find 3-5 cross-references for this selected Bible text.

SELECTED TEXT FROM ${reference}:
"${selectedText}"

Find passages that:
- Share similar themes or theology
- Use similar language or imagery
- Provide Old/New Testament connections
- Help interpret or apply this text

Return ONLY valid JSON in this exact format:
{
  "references": [
    {"reference": "John 3:16", "note": "Brief note on the connection"},
    {"reference": "Romans 8:28", "note": "Brief note on the connection"}
  ]
}`;

  const response = await callOpenRouter(prompt, keys.openrouterApiKey) as unknown as {
    references?: Array<{ reference: string; note: string }>;
  };

  return response.references || [];
}

/**
 * Draft key themes for a Bible passage.
 *
 * @param reference - The Bible reference
 * @param passageText - The full passage text
 * @returns Array of theme strings
 */
export async function draftKeyThemes(
  reference: string,
  passageText: string
): Promise<string[]> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  const prompt = `You are an expert Bible study curriculum designer with a Reformed theological perspective.

Identify 3-5 key themes in ${reference}.

PASSAGE TEXT:
${passageText}

Themes should be:
- Concise (2-4 words each)
- Theologically significant
- Specific to this passage

Return ONLY valid JSON in this exact format:
{
  "themes": ["Theme 1", "Theme 2", "Theme 3"]
}`;

  const response = await callOpenRouter(prompt, keys.openrouterApiKey) as unknown as {
    themes?: string[];
  };

  return response.themes || [];
}

/**
 * Generate a full study outline (flow) for a passage.
 *
 * @param reference - The Bible reference
 * @param passageText - The full passage text
 * @param userNotes - Optional user notes to guide generation
 * @returns Study flow data
 */
export async function generateStudyFlow(
  reference: string,
  passageText: string,
  userNotes?: string
): Promise<{
  purpose: string;
  context: string;
  themes: string[];
  sections: Array<{
    passageSection: string;
    heading: string;
  }>;
}> {
  const keys = await getApiKeys();

  if (!keys.openrouterApiKey) {
    throw new LLMError('OpenRouter API key not configured', 'openrouter');
  }

  const userNotesSection = userNotes?.trim()
    ? `
USER'S STUDY NOTES (use these to guide the outline where relevant):
${userNotes}

When generating the outline, incorporate insights from the user's notes. Focus on themes and sections that align with what the user found interesting or important.
`
    : '';

  const prompt = `You are an expert Bible study curriculum designer with a Reformed theological perspective.

Create a study outline for ${reference}.

PASSAGE TEXT:
${passageText}
${userNotesSection}
Generate:
1. A concise purpose statement (1-2 sentences)
2. Historical/literary context (2-4 sentences)
3. 3-5 key themes
4. Section breakdown with passage references and headings

Return ONLY valid JSON in this exact format:
{
  "purpose": "Purpose statement here",
  "context": "Historical context here",
  "themes": ["Theme 1", "Theme 2", "Theme 3"],
  "sections": [
    {"passageSection": "John 1:1-5", "heading": "The Eternal Word"},
    {"passageSection": "John 1:6-8", "heading": "John's Witness"}
  ]
}`;

  try {
    const response = await callOpenRouter(prompt, keys.openrouterApiKey) as unknown as {
      purpose?: string;
      context?: string;
      themes?: string[];
      sections?: Array<{ passageSection: string; heading: string }>;
    };

    return {
      purpose: response.purpose || '',
      context: response.context || '',
      themes: response.themes || [],
      sections: response.sections || [],
    };
  } catch (error) {
    // Handle rate limit errors with user-friendly message
    if (error instanceof Error) {
      if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
        throw new LLMError(
          'Rate limit exceeded. Please wait a moment and try again, or try a different model in Settings.',
          'openrouter'
        );
      }
      if (error.message.includes('402') || error.message.toLowerCase().includes('payment')) {
        throw new LLMError(
          'API credit limit reached. Please check your OpenRouter account or switch to a free model.',
          'openrouter'
        );
      }
    }
    throw error;
  }
}

/**
 * Get type-specific guidance for question enhancement
 */
function getTypeGuidance(type: EditableQuestionType): string {
  switch (type) {
    case 'observation':
      return `Observation questions should:
- Ask what the text literally says (who, what, when, where, how)
- Be answerable directly from the text
- Help readers notice details they might miss
- Focus on concrete facts, not interpretation`;

    case 'interpretation':
      return `Interpretation questions should:
- Ask what the text means spiritually/theologically
- Connect to broader biblical themes
- Explore the author's purpose and message
- Consider historical and literary context`;

    case 'feeling':
      return `Feeling questions should:
- Ask how the truth in the passage affects the reader emotionally/spiritually
- Be appropriate for passages revealing God's character or salvation truths
- Encourage worship, awe, gratitude, or conviction
- Be genuinely moving, not forced`;

    case 'application':
      return `Application questions should:
- Ask how to apply the passage to daily life
- Be practical and actionable
- Connect truth to behavior/attitude change
- Be personal and challenging`;

    default:
      return '';
  }
}
