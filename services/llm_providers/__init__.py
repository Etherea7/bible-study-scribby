"""
LLM Provider System

Provides a unified interface for multiple LLM providers with automatic fallback.
"""

from abc import ABC, abstractmethod
from typing import Optional
import json
import logging
import re

logger = logging.getLogger(__name__)


def create_error_study(error_message: str) -> dict:
    """Create a valid study structure with error information."""
    return {
        "error": True,
        "purpose": f"Error: {error_message}",
        "context": "Unable to generate study at this time.",
        "key_themes": ["Error"],
        "study_flow": [
            {
                "passage_section": "N/A",
                "section_heading": "Error",
                "observation_question": "What does the text say?",
                "observation_answer": "Please try again.",
                "interpretation_question": "What does it mean?",
                "interpretation_answer": "Please try again.",
                "connection": ""
            }
        ],
        "summary": error_message,
        "application_questions": ["Please try generating the study again."],
        "cross_references": [],
        "prayer_prompt": "Pray for understanding as you read God's Word."
    }


def parse_json_response(response_text: str) -> dict:
    """Parse JSON response, handling potential markdown code blocks and malformed JSON."""
    text = response_text.strip()

    # Handle markdown code blocks
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json or ```)
        lines = lines[1:]
        # Find closing ```
        for i, line in enumerate(lines):
            if line.strip() == "```":
                lines = lines[:i]
                break
        text = "\n".join(lines)

    # Try direct parsing first
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.warning(f"Initial JSON parse failed: {e}. Attempting cleanup...")

    # Try to extract JSON object using regex (find first { to last })
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        text = json_match.group(0)

    # Fix common JSON issues in LLM responses
    # The main issue: literal newlines inside JSON string values
    def fix_newlines_in_strings(json_text: str) -> str:
        """Fix literal newlines inside JSON strings by escaping them."""
        result = []
        in_string = False
        escape_next = False

        for char in json_text:
            if escape_next:
                result.append(char)
                escape_next = False
                continue

            if char == '\\':
                escape_next = True
                result.append(char)
                continue

            if char == '"':
                in_string = not in_string
                result.append(char)
                continue

            if in_string and char == '\n':
                result.append('\\n')
                continue

            if in_string and char == '\r':
                result.append('\\r')
                continue

            if in_string and char == '\t':
                result.append('\\t')
                continue

            result.append(char)

        return ''.join(result)

    # Try fixing newlines inside strings
    try:
        cleaned = fix_newlines_in_strings(text)
        # Remove any BOM or zero-width characters
        cleaned = cleaned.replace('\ufeff', '').replace('\u200b', '')
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.warning(f"Fixed-newlines parse failed: {e}. Trying more fixes...")

    # Last resort: try to fix by processing line by line
    try:
        # Split into lines and rejoin, fixing obvious issues
        lines = text.split('\n')
        fixed_lines = []
        in_string = False

        for line in lines:
            # Track if we're inside a string value (rough heuristic)
            quote_count = line.count('"') - line.count('\\"')
            fixed_lines.append(line)

        cleaned = '\n'.join(fixed_lines)
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Final attempt: use a permissive approach - try to repair truncated JSON
    try:
        # First fix newlines, then try to close truncated JSON
        repaired = fix_newlines_in_strings(text)

        # If JSON is truncated, try to close it
        bracket_count = repaired.count('{') - repaired.count('}')
        square_count = repaired.count('[') - repaired.count(']')
        # Close any unclosed arrays
        repaired += ']' * max(0, square_count)
        # Close any unclosed objects
        repaired += '}' * max(0, bracket_count)

        # Try to fix if we're in the middle of a string (truncated)
        if repaired.count('"') % 2 == 1:
            repaired += '"'
            # Re-check brackets after closing string
            bracket_count = repaired.count('{') - repaired.count('}')
            square_count = repaired.count('[') - repaired.count(']')
            repaired += ']' * max(0, square_count)
            repaired += '}' * max(0, bracket_count)

        result = json.loads(repaired)
        logger.info("Successfully repaired truncated JSON")
        return result
    except json.JSONDecodeError as e:
        # Log the problematic portion for debugging
        logger.error(f"All JSON parse attempts failed. Error at char {e.pos}: {e.msg}")
        logger.error(f"Context around error: ...{text[max(0,e.pos-50):e.pos+50]}...")
        raise


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    name: str = "base"

    @abstractmethod
    def is_available(self) -> bool:
        """Check if this provider is configured and available."""
        pass

    @abstractmethod
    async def generate_study(self, reference: str, passage_text: str, model_override: Optional[str] = None) -> dict:
        """Generate a Bible study for the given passage.

        Args:
            reference: Bible reference string
            passage_text: The passage text
            model_override: Optional model ID to use instead of default
        """
        pass

    @abstractmethod
    async def complete_prompt(self, prompt: str, model_override: Optional[str] = None) -> str:
        """Generic text completion for enhancement operations.

        Args:
            prompt: The full prompt to send to the LLM
            model_override: Optional model ID to use instead of default

        Returns:
            The LLM's text response (not JSON parsed)
        """
        pass

    def _get_system_message(self) -> str:
        """Get the system message for the LLM."""
        return "You are an expert Bible study curriculum designer. Always respond with valid JSON only."

    def _handle_error(self, error: Exception) -> dict:
        """Handle errors and return a valid study structure."""
        logger.error(f"{self.name} provider error: {error}")
        return create_error_study(f"{self.name} error: {str(error)}")


from .groq_provider import GroqProvider
from .openrouter_provider import OpenRouterProvider
from .gemini_provider import GeminiProvider
from .claude_provider import ClaudeProvider

__all__ = [
    "LLMProvider",
    "GroqProvider",
    "OpenRouterProvider",
    "GeminiProvider",
    "ClaudeProvider",
    "create_error_study",
    "parse_json_response"
]
