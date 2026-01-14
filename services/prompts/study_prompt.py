"""
Interwoven Bible Study Prompt

This prompt generates studies where observation and interpretation questions
flow naturally through the passage, guiding readers section by section.
"""

INTERWOVEN_STUDY_PROMPT = """You are an expert Bible study curriculum designer creating an in-depth expository study for personal use.

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
   - Provide 3-5 application questions at the end
   - Do NOT provide sample answers for application (personal reflection)
   - Make them practical and actionable

3. CROSS-REFERENCES:
   - Include 2-3 high-quality cross-references that genuinely illuminate the passage
   - Each must have a clear explanatory note
   - Quality over quantity - if no meaningful references exist, use fewer

4. OUTPUT FORMAT:
   - Return ONLY valid JSON, no markdown code blocks, no preamble
   - Follow the exact structure below

JSON STRUCTURE:
{{
    "purpose": "Single-sentence action-focused purpose starting with 'Understand that...' or 'Discover how...'",
    "context": "2-3 sentences of historical, cultural, or literary background",
    "key_themes": ["theme1", "theme2", "theme3"],
    "study_flow": [
        {{
            "passage_section": "Verse range (e.g., 'John 1:1-2')",
            "section_heading": "Brief descriptive heading",
            "observation_question": "What does the text literally say about...?",
            "observation_answer": "Complete answer based on careful reading of the text",
            "interpretation_question": "What does this mean spiritually/theologically?",
            "interpretation_answer": "Complete interpretive answer connecting to broader meaning",
            "connection": "Optional: How this section connects to the next"
        }}
    ],
    "summary": "2-3 sentences synthesizing the main themes and message",
    "application_questions": [
        "Personal reflection question 1 (no answer)",
        "Personal reflection question 2 (no answer)",
        "Personal reflection question 3 (no answer)"
    ],
    "cross_references": [
        {{
            "reference": "Book Chapter:Verse",
            "note": "Brief explanation of how this illuminates the passage"
        }}
    ],
    "prayer_prompt": "A focused prayer direction based on this passage (3-4 sentences)"
}}

Respond ONLY with valid JSON."""


def format_study_prompt(reference: str, passage_text: str) -> str:
    """Format the study prompt with the given reference and passage text."""
    return INTERWOVEN_STUDY_PROMPT.format(
        reference=reference,
        passage_text=passage_text
    )
