"""
LLM Router

Orchestrates LLM provider selection with automatic fallback chain.
"""

import logging
from typing import Optional, Tuple

from config import LLM_PROVIDER
from .llm_providers import (
    LLMProvider,
    GroqProvider,
    OpenRouterProvider,
    GeminiProvider,
    ClaudeProvider,
    create_error_study
)

logger = logging.getLogger(__name__)

# Default fallback order: Groq (fastest free) -> OpenRouter -> Gemini -> Claude
DEFAULT_PROVIDER_ORDER = ["groq", "openrouter", "gemini", "claude"]


def get_provider_by_name(name: str) -> Optional[LLMProvider]:
    """Get a provider instance by name."""
    providers = {
        "groq": GroqProvider,
        "openrouter": OpenRouterProvider,
        "gemini": GeminiProvider,
        "claude": ClaudeProvider
    }
    provider_class = providers.get(name.lower())
    if provider_class:
        return provider_class()
    return None


def get_available_providers() -> list[LLMProvider]:
    """Get list of available (configured) providers in fallback order."""
    providers = []
    for name in DEFAULT_PROVIDER_ORDER:
        provider = get_provider_by_name(name)
        if provider and provider.is_available():
            providers.append(provider)
    return providers


async def generate_study_with_fallback(
    reference: str,
    passage_text: str,
    requested_provider: Optional[str] = None,
    requested_model: Optional[str] = None
) -> Tuple[dict, str]:
    """
    Generate a Bible study using the configured LLM provider(s).

    Args:
        reference: Bible reference string
        passage_text: The passage text
        requested_provider: Optional provider override from frontend (e.g., 'openrouter', 'anthropic', 'google')
        requested_model: Optional model override from frontend

    If a specific provider is requested (via parameter or LLM_PROVIDER env), only that provider is used.
    If "auto", tries providers in fallback order until one succeeds.

    Returns:
        Tuple of (study_dict, provider_name)
    """
    # Map frontend provider names to backend provider names
    provider_mapping = {
        'openrouter': 'openrouter',
        'anthropic': 'claude',
        'google': 'gemini',
        'claude': 'claude',
        'gemini': 'gemini',
        'groq': 'groq',
    }

    # Determine effective provider
    effective_provider = None
    if requested_provider:
        effective_provider = provider_mapping.get(requested_provider.lower(), requested_provider.lower())
    elif LLM_PROVIDER and LLM_PROVIDER.lower() != "auto":
        effective_provider = LLM_PROVIDER.lower()

    # Check if a specific provider is requested
    if effective_provider:
        provider = get_provider_by_name(effective_provider)
        if provider is None:
            logger.error(f"Unknown LLM provider: {effective_provider}")
            return create_error_study(f"Unknown provider: {effective_provider}"), "error"

        if not provider.is_available():
            logger.error(f"Provider {effective_provider} is not available (API key missing)")
            return create_error_study(f"Provider {effective_provider} not configured"), "error"

        logger.info(f"Using specific provider: {provider.name}" + (f" with model: {requested_model}" if requested_model else ""))
        study = await provider.generate_study(reference, passage_text, model_override=requested_model)
        return study, provider.name

    # Auto mode: try providers in fallback order
    providers = get_available_providers()

    if not providers:
        logger.error("No LLM providers available")
        return create_error_study(
            "No LLM providers configured. Please add at least one API key "
            "(GROQ_API_KEY, OPENROUTER_API_KEY, GOOGLE_API_KEY, or ANTHROPIC_API_KEY) to your .env file."
        ), "error"

    logger.info(f"Available providers: {[p.name for p in providers]}")

    for provider in providers:
        logger.info(f"Trying provider: {provider.name}")
        try:
            study = await provider.generate_study(reference, passage_text, model_override=requested_model)

            # Check if the study contains an error
            if study.get("error"):
                logger.warning(f"Provider {provider.name} returned error, trying next...")
                continue

            logger.info(f"Successfully generated study using {provider.name}")
            return study, provider.name

        except Exception as e:
            logger.error(f"Provider {provider.name} failed with exception: {e}")
            continue

    # All providers failed
    logger.error("All LLM providers failed")
    return create_error_study(
        "All LLM providers failed. Please try again later or check your API keys."
    ), "error"


async def complete_prompt(
    prompt: str,
    requested_provider: Optional[str] = None,
    requested_model: Optional[str] = None
) -> Tuple[str, str]:
    """
    Generic prompt completion using configured LLM providers.

    Used for enhancement operations (rephrase, draft, explain, etc.)

    Args:
        prompt: The full prompt to send to the LLM
        requested_provider: Optional provider override from frontend
        requested_model: Optional model override from frontend

    Returns:
        Tuple of (response_text, provider_name)
    """
    # Map frontend provider names to backend provider names
    provider_mapping = {
        'openrouter': 'openrouter',
        'anthropic': 'claude',
        'google': 'gemini',
        'claude': 'claude',
        'gemini': 'gemini',
        'groq': 'groq',
    }

    # Determine effective provider
    effective_provider = None
    if requested_provider:
        effective_provider = provider_mapping.get(requested_provider.lower(), requested_provider.lower())
    elif LLM_PROVIDER and LLM_PROVIDER.lower() != "auto":
        effective_provider = LLM_PROVIDER.lower()

    # Check if a specific provider is requested
    if effective_provider:
        provider = get_provider_by_name(effective_provider)
        if provider is None:
            raise RuntimeError(f"Unknown provider: {effective_provider}")

        if not provider.is_available():
            raise RuntimeError(f"Provider {effective_provider} not configured (API key missing)")

        logger.info(f"Using specific provider for enhancement: {provider.name}" + (f" with model: {requested_model}" if requested_model else ""))
        result = await provider.complete_prompt(prompt, model_override=requested_model)
        return result, provider.name

    # Auto mode: try providers in fallback order
    providers = get_available_providers()

    if not providers:
        raise RuntimeError(
            "No LLM providers configured. Please add at least one API key "
            "(GROQ_API_KEY, OPENROUTER_API_KEY, GOOGLE_API_KEY, or ANTHROPIC_API_KEY) to your .env file."
        )

    logger.info(f"Available providers for enhancement: {[p.name for p in providers]}")

    for provider in providers:
        logger.info(f"Trying provider for enhancement: {provider.name}")
        try:
            result = await provider.complete_prompt(prompt, model_override=requested_model)
            logger.info(f"Successfully completed prompt using {provider.name}")
            return result, provider.name

        except Exception as e:
            logger.error(f"Provider {provider.name} failed with exception: {e}")
            continue

    # All providers failed
    raise RuntimeError("All LLM providers failed. Please try again later or check your API keys.")


async def check_provider_status() -> dict:
    """
    Check the status of all LLM providers.

    Returns a dict with provider names as keys and availability status.
    """
    status = {}
    for name in DEFAULT_PROVIDER_ORDER:
        provider = get_provider_by_name(name)
        if provider:
            status[name] = {
                "available": provider.is_available(),
                "model": getattr(provider, "model", "unknown")
            }
    return status
