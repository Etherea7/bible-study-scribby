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
   - Provide 3 application questions at the end
   - Do NOT provide sample answers for application (personal reflection)
   - Make them practical and actionable

3. CROSS-REFERENCES:
   - Include cross references when they have direct involvement or are quoted in the passage.
   - Many passages in New Testament allude to events/accounts in the Old Testament, would be helpful to include these
   - Each must have a clear explanatory note
   - Quality over quantity - if no meaningful references exist, ok to not have any.

5. THEOLOGICAL GUIDELINES (Reformed Christian):
   You MUST ensure all generated content aligns with these doctrines:

   a) THE TRINITY: One God existing eternally as three distinct persons - Father, Son, and Holy Spirit - each fully God, sharing one undivided divine essence.

   b) TOTAL DEPRAVITY: All humanity is sinful from birth and utterly unable to save themselves apart from God's sovereign grace.

   c) UNCONDITIONAL ELECTION: God sovereignly chooses those He will save, not based on any foreseen merit, faith, or works in the person.

   d) SUBSTITUTIONARY ATONEMENT: Jesus Christ, fully God and fully man, died as a substitutionary sacrifice bearing the wrath of God for the sins of His people, and rose for their justification.

   e) SALVATION BY GRACE THROUGH FAITH: Salvation is entirely by grace through faith in Christ alone - not by human works, merit, or decision.

   f) SCRIPTURE AUTHORITY: The Bible is the infallible, inerrant Word of God, the final authority for faith and practice.

   g) PERSEVERANCE OF THE SAINTS: Those truly saved by God will be kept by His power unto eternal life and cannot lose their salvation.

6. HANDLING AMBIGUOUS OR DEBATED PASSAGES:
   - Focus on what the text clearly and concretely states
   - If a passage has multiple scholarly interpretations on non-essential matters, acknowledge this briefly
   - Always interpret unclear passages in light of clearer Scripture (let Scripture interpret Scripture)
   - Never speculate beyond what the text supports
   - For disputed interpretations, present the Reformed position while noting that debate exists among scholars
   - Do NOT generate content that contradicts the theological guidelines above

4. OUTPUT FORMAT:
   - Return ONLY valid JSON, no markdown code blocks, no preamble
   - Follow the exact structure below

JSON STRUCTURE:
{{
    "purpose": "Single-sentence action-focused purpose starting with an action verb to dictate action/purpose. If passage is more based on truths/knowledge, the verb can just be to 'Know' or to 'Believe' ",
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


# Flow-based generation prompt addon
FLOW_CONTEXT_ADDON = """

USER-DEFINED STUDY FLOW CONTEXT:
The user has specified the following purposes/focuses for each section of this passage:

{flow_context}

Based on the above flow context, please:
1. Structure your study_flow sections to align with these user-defined purposes
2. Generate questions that address the specific purposes defined for each section
3. You are NOT strictly bound to observation-then-interpretation order within sections
4. Interpretation questions can come at the end of sections if that better serves the flow
5. Include "feeling" questions (e.g., "How does this truth make you feel?") ONLY when:
   - The passage reveals profound theological truths about God's character or salvation
   - The text is meant to evoke an emotional or spiritual response (worship, awe, gratitude)
   - It naturally follows an interpretation of a moving truth
   - Do not force feeling questions - only include when genuinely appropriate
"""


def format_study_prompt_with_flow(
    reference: str,
    passage_text: str,
    flow_context: dict | None = None
) -> str:
    """
    Format the study prompt with optional user-defined flow context.

    Args:
        reference: The passage reference (e.g., "John 1:1-18")
        passage_text: The full text of the passage
        flow_context: Optional dict with 'sectionPurposes' list containing
                      {passageSection, purpose, focusAreas} for each section

    Returns:
        Formatted prompt string
    """
    base_prompt = INTERWOVEN_STUDY_PROMPT.format(
        reference=reference,
        passage_text=passage_text
    )

    if flow_context and flow_context.get('sectionPurposes'):
        context_lines = []
        for item in flow_context['sectionPurposes']:
            line = f"- {item.get('passageSection', 'Section')}: {item.get('purpose', 'General study')}"
            if item.get('focusAreas'):
                line += f" (Focus: {', '.join(item['focusAreas'])})"
            context_lines.append(line)

        flow_addon = FLOW_CONTEXT_ADDON.format(
            flow_context='\n'.join(context_lines)
        )

        # Insert before the final JSON instruction
        return base_prompt.replace(
            "Respond ONLY with valid JSON.",
            f"{flow_addon}\n\nRespond ONLY with valid JSON."
        )

    return base_prompt
