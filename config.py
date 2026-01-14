import os
from dotenv import load_dotenv

load_dotenv()

# Bible Passage API (required)
ESV_API_KEY = os.getenv("ESV_API_KEY")

# LLM Provider API Keys
# At least one is required for study generation
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # Primary (free)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")  # Fallback (free)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")  # Fallback - Gemini (free)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")  # Private option (paid)

# LLM Provider Selection
# Options: "auto", "groq", "openrouter", "gemini", "claude"
# "auto" tries providers in order: groq -> openrouter -> gemini -> claude
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "auto")
