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

    async def generate_study(self, reference: str, passage_text: str) -> dict:
        """Generate a Bible study using Claude."""
        if not self.is_available():
            return create_error_study("Anthropic API key not configured")

        try:
            client = self._get_client()
            prompt = format_study_prompt(reference, passage_text)

            # Claude SDK is synchronous
            message = client.messages.create(
                model=self.model,
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
