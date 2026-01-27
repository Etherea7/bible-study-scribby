"""
Groq LLM Provider

Primary free provider using Llama 3.3 70B with JSON mode.
"""

import json
import logging
from typing import Optional

from config import GROQ_API_KEY
from services.prompts import format_study_prompt
from . import LLMProvider, create_error_study, parse_json_response

logger = logging.getLogger(__name__)


class GroqProvider(LLMProvider):
    """Groq provider using Llama 3.3 70B."""

    name = "groq"
    model = "llama-3.3-70b-versatile"

    def __init__(self):
        self._client = None

    def is_available(self) -> bool:
        """Check if Groq API key is configured."""
        return bool(GROQ_API_KEY)

    def _get_client(self):
        """Lazy initialization of Groq client."""
        if self._client is None:
            from groq import Groq
            self._client = Groq(api_key=GROQ_API_KEY)
        return self._client

    async def generate_study(self, reference: str, passage_text: str, model_override: str = None) -> dict:
        """Generate a Bible study using Groq/Llama 3.3."""
        if not self.is_available():
            return create_error_study("Groq API key not configured")

        # Use model override if provided, otherwise use default
        effective_model = model_override or self.model

        try:
            client = self._get_client()
            prompt = format_study_prompt(reference, passage_text)

            # Groq SDK is synchronous but fast
            response = client.chat.completions.create(
                model=effective_model,
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_message()
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.6,
                max_tokens=3000,
                response_format={"type": "json_object"}
            )

            response_text = response.choices[0].message.content
            study = parse_json_response(response_text)

            logger.info(f"Groq successfully generated study for {reference}")
            return study

        except json.JSONDecodeError as e:
            logger.error(f"Groq JSON parse error: {e}")
            return create_error_study(f"Failed to parse Groq response: {str(e)}")
        except Exception as e:
            return self._handle_error(e)

    async def complete_prompt(self, prompt: str, model_override: str = None) -> str:
        """Generic text completion using Groq."""
        if not self.is_available():
            raise RuntimeError("Groq API key not configured")

        effective_model = model_override or self.model

        try:
            client = self._get_client()

            response = client.chat.completions.create(
                model=effective_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert Bible study curriculum writer. Respond with plain text only, no JSON or markdown formatting."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.6,
                max_tokens=2000
            )

            response_text = response.choices[0].message.content
            logger.info(f"Groq completed prompt (model: {effective_model})")
            return response_text.strip()

        except Exception as e:
            logger.error(f"Groq completion error: {e}")
            raise RuntimeError(f"Groq error: {str(e)}")
