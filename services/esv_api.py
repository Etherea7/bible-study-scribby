import httpx
from config import ESV_API_KEY
from database import get_cached_passage, cache_passage

ESV_API_URL = "https://api.esv.org/v3/passage/text/"


async def fetch_passage(reference: str) -> str:
    """
    Fetch a Bible passage from the ESV API.
    Returns cached version if available.
    """
    # Check cache first
    cached = get_cached_passage(reference)
    if cached:
        return cached

    if not ESV_API_KEY:
        return f"[ESV API key not configured. Please add ESV_API_KEY to your .env file.\nGet a free key at: https://api.esv.org/]"

    params = {
        "q": reference,
        "include-headings": "true",
        "include-footnotes": "false",
        "include-verse-numbers": "true",
        "include-short-copyright": "true",
        "include-passage-references": "true",
    }

    headers = {
        "Authorization": f"Token {ESV_API_KEY}"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                ESV_API_URL,
                params=params,
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()

            passages = data.get("passages", [])
            if passages:
                text = passages[0].strip()
                # Cache the result
                cache_passage(reference, text)
                return text
            else:
                return f"[No passage found for: {reference}]"

    except httpx.HTTPStatusError as e:
        return f"[Error fetching passage: HTTP {e.response.status_code}]"
    except httpx.RequestError as e:
        return f"[Error connecting to ESV API: {str(e)}]"
    except Exception as e:
        return f"[Unexpected error: {str(e)}]"
