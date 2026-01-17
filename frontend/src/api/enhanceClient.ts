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
