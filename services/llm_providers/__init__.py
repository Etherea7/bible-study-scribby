"""
LLM Provider System

Provides a unified interface for multiple LLM providers with automatic fallback.
"""

from abc import ABC, abstractmethod
from typing import Optional
import json
import logging

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
    """Parse JSON response, handling potential markdown code blocks."""
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

    return json.loads(text)


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
