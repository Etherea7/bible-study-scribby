"""
Gemini LLM Provider

Fallback provider using Google's Gemini API.
"""

import json
import logging
from typing import Optional

from config import GOOGLE_API_KEY
from services.prompts import format_study_prompt
from . import LLMProvider, create_error_study, parse_json_response

logger = logging.getLogger(__name__)


class GeminiProvider(LLMProvider):
    """Google Gemini provider."""

    name = "gemini"
    model = "gemini-2.0-flash"

    def __init__(self):
        self._client = None

    def is_available(self) -> bool:
        """Check if Google API key is configured."""
        return bool(GOOGLE_API_KEY)

    def _get_client(self):
        """Lazy initialization of Gemini client."""
        if self._client is None:
            from google import genai
            self._client = genai.Client(api_key=GOOGLE_API_KEY)
        return self._client

    async def generate_study(self, reference: str, passage_text: str, model_override: str = None) -> dict:
        """Generate a Bible study using Google Gemini."""
        if not self.is_available():
            return create_error_study("Google API key not configured")

        # Use model override if provided, otherwise use default
        effective_model = model_override or self.model

        try:
            client = self._get_client()
            prompt = format_study_prompt(reference, passage_text)

            # Full prompt including system instruction
            full_prompt = f"""{self._get_system_message()}

{prompt}"""

            # Gemini SDK is synchronous
            response = client.models.generate_content(
                model=effective_model,
                contents=full_prompt
            )

            response_text = response.text
            study = parse_json_response(response_text)

            logger.info(f"Gemini successfully generated study for {reference}")
            return study

        except json.JSONDecodeError as e:
            logger.error(f"Gemini JSON parse error: {e}")
            return create_error_study(f"Failed to parse Gemini response: {str(e)}")
        except Exception as e:
            return self._handle_error(e)

    async def complete_prompt(self, prompt: str, model_override: str = None) -> str:
        """Generic text completion using Gemini."""
        if not self.is_available():
            raise RuntimeError("Google API key not configured")

        effective_model = model_override or self.model

        try:
            client = self._get_client()

            response = client.models.generate_content(
                model=effective_model,
                contents=prompt
            )

            response_text = response.text
            logger.info(f"Gemini completed prompt (model: {effective_model})")
            return response_text.strip()

        except Exception as e:
            logger.error(f"Gemini completion error: {e}")
            raise RuntimeError(f"Gemini error: {str(e)}")
