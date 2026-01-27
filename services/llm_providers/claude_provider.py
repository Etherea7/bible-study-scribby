"""
Claude LLM Provider

Private/premium provider using Anthropic's Claude API.
"""

import json
import logging
from typing import Optional

import anthropic

from config import ANTHROPIC_API_KEY
from services.prompts import format_study_prompt
from . import LLMProvider, create_error_study, parse_json_response

logger = logging.getLogger(__name__)


class ClaudeProvider(LLMProvider):
    """Anthropic Claude provider."""

    name = "claude"
    model = "claude-sonnet-4-20250514"

    def __init__(self):
        self._client = None

    def is_available(self) -> bool:
        """Check if Anthropic API key is configured."""
        return bool(ANTHROPIC_API_KEY)

    def _get_client(self):
        """Lazy initialization of Anthropic client."""
        if self._client is None:
            self._client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        return self._client

    async def generate_study(self, reference: str, passage_text: str, model_override: str = None) -> dict:
        """Generate a Bible study using Claude."""
        if not self.is_available():
            return create_error_study("Anthropic API key not configured")

        # Use model override if provided, otherwise use default
        effective_model = model_override or self.model

        try:
            client = self._get_client()
            prompt = format_study_prompt(reference, passage_text)

            # Claude SDK is synchronous
            message = client.messages.create(
                model=effective_model,
                max_tokens=3000,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            response_text = message.content[0].text
            study = parse_json_response(response_text)

            logger.info(f"Claude successfully generated study for {reference}")
            return study

        except json.JSONDecodeError as e:
            logger.error(f"Claude JSON parse error: {e}")
            return create_error_study(f"Failed to parse Claude response: {str(e)}")
        except anthropic.APIError as e:
            logger.error(f"Claude API error: {e}")
            return create_error_study(f"Claude API error: {str(e)}")
        except Exception as e:
            return self._handle_error(e)

    async def complete_prompt(self, prompt: str, model_override: str = None) -> str:
        """Generic text completion using Claude."""
        if not self.is_available():
            raise RuntimeError("Anthropic API key not configured")

        effective_model = model_override or self.model

        try:
            client = self._get_client()

            message = client.messages.create(
                model=effective_model,
                max_tokens=2000,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            response_text = message.content[0].text
            logger.info(f"Claude completed prompt (model: {effective_model})")
            return response_text.strip()

        except anthropic.APIError as e:
            logger.error(f"Claude API error: {e}")
            raise RuntimeError(f"Claude API error: {str(e)}")
        except Exception as e:
            logger.error(f"Claude completion error: {e}")
            raise RuntimeError(f"Claude error: {str(e)}")
