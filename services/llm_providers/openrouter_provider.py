"""
OpenRouter LLM Provider

Fallback provider using free models via OpenRouter API.
"""

import json
import logging
from typing import Optional

import httpx

from config import OPENROUTER_API_KEY
from services.prompts import format_study_prompt
from . import LLMProvider, create_error_study, parse_json_response

logger = logging.getLogger(__name__)


class OpenRouterProvider(LLMProvider):
    """OpenRouter provider using free-tier models."""

    name = "openrouter"
    # Free models available on OpenRouter
    model = "meta-llama/llama-3.2-3b-instruct:free"
    api_url = "https://openrouter.ai/api/v1/chat/completions"

    def is_available(self) -> bool:
        """Check if OpenRouter API key is configured."""
        return bool(OPENROUTER_API_KEY)

    async def generate_study(self, reference: str, passage_text: str, model_override: str = None) -> dict:
        """Generate a Bible study using OpenRouter."""
        if not self.is_available():
            return create_error_study("OpenRouter API key not configured")

        # Use model override if provided, otherwise use default
        effective_model = model_override or self.model

        try:
            prompt = format_study_prompt(reference, passage_text)

            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://bible-study-scribby.app",
                "X-Title": "Bible Study Scribby"
            }

            payload = {
                "model": effective_model,
                "messages": [
                    {
                        "role": "system",
                        "content": self._get_system_message()
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.6,
                "max_tokens": 3000
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

            response_text = data["choices"][0]["message"]["content"]
            study = parse_json_response(response_text)

            logger.info(f"OpenRouter successfully generated study for {reference}")
            return study

        except json.JSONDecodeError as e:
            logger.error(f"OpenRouter JSON parse error: {e}")
            return create_error_study(f"Failed to parse OpenRouter response: {str(e)}")
        except httpx.HTTPStatusError as e:
            logger.error(f"OpenRouter HTTP error: {e}")
            return create_error_study(f"OpenRouter API error: {e.response.status_code}")
        except Exception as e:
            return self._handle_error(e)

    async def complete_prompt(self, prompt: str, model_override: str = None) -> str:
        """Generic text completion using OpenRouter."""
        if not self.is_available():
            raise RuntimeError("OpenRouter API key not configured")

        effective_model = model_override or self.model

        try:
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://bible-study-scribby.app",
                "X-Title": "Bible Study Scribby"
            }

            payload = {
                "model": effective_model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert Bible study curriculum writer. Respond with plain text only, no JSON or markdown formatting."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.6,
                "max_tokens": 2000
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

            response_text = data["choices"][0]["message"]["content"]
            logger.info(f"OpenRouter completed prompt (model: {effective_model})")
            return response_text.strip()

        except httpx.HTTPStatusError as e:
            logger.error(f"OpenRouter HTTP error: {e}")
            raise RuntimeError(f"OpenRouter API error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"OpenRouter completion error: {e}")
            raise RuntimeError(f"OpenRouter error: {str(e)}")
