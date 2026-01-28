import json
import anthropic
from config import ANTHROPIC_API_KEY
from database import get_cached_study, cache_study

STUDY_PROMPT = """You are a Bible study guide creating an in-depth expository study for personal use.

Given the following Bible passage, create a comprehensive study guide that helps the reader carefully observe, interpret, and apply God's Word.

Passage Reference: {reference}

Passage Text:
{passage_text}

IMPORTANT INSTRUCTIONS:

1. For OBSERVATION and INTERPRETATION questions, provide SAMPLE ANSWERS that model good Bible study technique:
   - Sample answers should be 1-3 sentences demonstrating careful textual analysis
   - Sample answers should point to specific details in the text
   - These serve as examples to guide independent study

2. For APPLICATION questions, do NOT provide sample answers:
   - Application is personal and should be worked out individually
   - Leave these for the reader to answer themselves

3. For CROSS-REFERENCES, be selective and strategic:
   - ONLY include cross-references that genuinely help contextualize or illuminate this specific passage
   - Each cross-reference must have a clear connection that aids understanding
   - Quality over quantity: 2-3 excellent references are better than many mediocre ones
   - If no meaningful cross-references exist, use an empty array
   - Format: {{"reference": "Book Chapter:Verse", "note": "brief explanation of connection"}}

4. For OBSERVATION QUESTIONS, ask about what the text literally says:
   - Who, what, when, where questions
   - Questions that can be answered by looking at the passage
   - Example: "What event do these verses remind you of?" (for John 1:1-3, pointing to Genesis creation)

Please provide a study guide in the following JSON format:
{{
    "purpose_statement": "A single sentence summarizing the main point with an action verb (e.g., 'Believe that Jesus is the eternal Word made flesh' or 'Know that God is faithful in all circumstances')",
    "context": "2-3 sentences providing historical, cultural, or literary context",
    "key_themes": ["theme 1", "theme 2", "theme 3"],
    "summary": "A 2-3 sentence summary of the main message",
    "observation_questions": [
        {{
            "question": "What does the text literally say?",
            "sample_answer": "Brief model answer showing careful observation of the text"
        }},
        {{
            "question": "Another observation question",
            "sample_answer": "Another brief model answer"
        }}
    ],
    "interpretation_questions": [
        {{
            "question": "What does this passage mean theologically?",
            "sample_answer": "Brief model answer demonstrating sound interpretation"
        }},
        {{
            "question": "Another interpretation question",
            "sample_answer": "Another brief model answer"
        }}
    ],
    "application_questions": [
        {{
            "question": "How does this apply to your daily life?"
        }},
        {{
            "question": "Another application question"
        }}
    ],
    "cross_references": [
        {{
            "reference": "Book Chapter:Verse",
            "note": "Brief explanation of how this illuminates the passage"
        }}
    ],
    "prayer_prompt": "A focused prayer direction based on this passage"
}}

Respond ONLY with valid JSON, no additional text or markdown code blocks."""


async def generate_study(reference: str, passage_text: str) -> dict:
    """
    Generate a Bible study using Claude API.
    Returns cached version if available.
    """
    # Check cache first
    cached = get_cached_study(reference)
    if cached:
        return cached

    if not ANTHROPIC_API_KEY:
        return {
            "error": True,
            "purpose_statement": "Configure your API key to generate studies",
            "context": "API key not configured",
            "key_themes": ["Please add ANTHROPIC_API_KEY to your .env file"],
            "summary": "Get your API key from console.anthropic.com",
            "observation_questions": [{"question": "What does the text say?", "sample_answer": "Read the passage carefully."}],
            "interpretation_questions": [{"question": "What does it mean?", "sample_answer": "Consider the context and meaning."}],
            "application_questions": [{"question": "How does it apply to your life?"}],
            "cross_references": [],
            "prayer_prompt": "Pray for understanding as you read God's Word."
        }

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2500,
            messages=[
                {
                    "role": "user",
                    "content": STUDY_PROMPT.format(
                        reference=reference,
                        passage_text=passage_text
                    )
                }
            ]
        )

        response_text = message.content[0].text.strip()

        # Parse JSON response
        # Handle potential markdown code blocks
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()

        study_content = json.loads(response_text)

        # Cache the result
        cache_study(reference, study_content)

        return study_content

    except json.JSONDecodeError as e:
        return {
            "error": True,
            "purpose_statement": "Retry generating the study",
            "context": f"Error parsing AI response: {str(e)}",
            "key_themes": ["Error generating study"],
            "summary": "Please try refreshing the page.",
            "observation_questions": [{"question": "What does the text say?", "sample_answer": "Read the passage carefully."}],
            "interpretation_questions": [{"question": "What does it mean?", "sample_answer": "Consider the context and meaning."}],
            "application_questions": [{"question": "How does it apply to your life?"}],
            "cross_references": [],
            "prayer_prompt": "Pray for understanding as you read God's Word."
        }
    except anthropic.APIError as e:
        return {
            "error": True,
            "purpose_statement": "Check your API configuration",
            "context": f"API error: {str(e)}",
            "key_themes": ["Error connecting to AI service"],
            "summary": "Please check your API key and try again.",
            "observation_questions": [{"question": "What does the text say?", "sample_answer": "Read the passage carefully."}],
            "interpretation_questions": [{"question": "What does it mean?", "sample_answer": "Consider the context and meaning."}],
            "application_questions": [{"question": "How does it apply to your life?"}],
            "cross_references": [],
            "prayer_prompt": "Pray for understanding as you read God's Word."
        }
    except Exception as e:
        return {
            "error": True,
            "purpose_statement": "Investigate the error and try again",
            "context": f"Unexpected error: {str(e)}",
            "key_themes": ["Error generating study"],
            "summary": "An unexpected error occurred.",
            "observation_questions": [{"question": "What does the text say?", "sample_answer": "Read the passage carefully."}],
            "interpretation_questions": [{"question": "What does it mean?", "sample_answer": "Consider the context and meaning."}],
            "application_questions": [{"question": "How does it apply to your life?"}],
            "cross_references": [],
            "prayer_prompt": "Pray for understanding as you read God's Word."
        }
