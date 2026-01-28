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
    model = "claude-haiku-4-5-20251001"

    def __init__(self):
        self._client = None

    def is_available(self) -> bool:
        """Check if Anthropic API key is configured."""
        return bool(ANTHROPIC_API_KEY)

    def _get_client(self):
        """Lazy initialization of Anthropic client."""
        if self._client is None:
            # Increase timeout for long passages (default is 10 minutes)
            self._client = anthropic.Anthropic(
                api_key=ANTHROPIC_API_KEY,
                timeout=600.0  # 10 minute timeout
            )
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
                max_tokens=20000,
                system="""You are an expert Bible study curriculum designer.

CRITICAL JSON FORMATTING RULES:
1. Respond with valid JSON only - no markdown, no code blocks, no preamble
2. All string values must be on a SINGLE LINE - never use literal line breaks
3. For multi-sentence content, write it all on one line within the quotes
4. Escape special characters properly: use \\n for newlines, \\" for quotes
5. For long passages, be concise - prioritize quality over quantity
6. Limit study_flow to 3-5 sections maximum even for long passages""",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            response_text = message.content[0].text
            stop_reason = message.stop_reason
            usage = message.usage

            logger.info(f"Claude stop_reason: {stop_reason}, tokens: {usage.input_tokens} in / {usage.output_tokens} out")

            # Check if response was truncated
            if stop_reason == "max_tokens":
                logger.warning(f"Claude response truncated at {usage.output_tokens} tokens for {reference}")
                # Try to parse anyway - our robust parser may recover partial JSON
                try:
                    study = parse_json_response(response_text)
                    logger.info(f"Successfully recovered truncated response for {reference}")
                    return study
                except json.JSONDecodeError as e:
                    logger.error(f"Could not recover truncated JSON: {e}")
                    return create_error_study(
                        f"Response truncated ({usage.output_tokens} tokens). Try a shorter passage or fewer verses."
                    )

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
