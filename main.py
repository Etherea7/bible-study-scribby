from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional

from database import init_db, save_study_to_history, get_study_history
from services.reading_plan import (
    get_reference,
    BIBLE_BOOKS,
)
from services.esv_api import fetch_passage
from services.claude_api import generate_study
from services.bible_data import validate_verse_range, get_chapter_count


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database on startup
    init_db()
    yield


app = FastAPI(title="Scribby", lifespan=lifespan)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup templates
templates = Jinja2Templates(directory="templates")


# Request model for /generate endpoint
class GenerateStudyRequest(BaseModel):
    book: str
    chapter: int
    start_verse: Optional[int] = None
    end_verse: Optional[int] = None


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Display Bible study with pre-loaded default (John 1:1-18)."""
    # Default to John 1:1-18
    book = "John"
    chapter = 1
    start_verse = 1
    end_verse = 18

    reference = get_reference(book, chapter, start_verse, end_verse)

    # Fetch passage text
    passage_text = await fetch_passage(reference)

    # Generate or retrieve study
    study = await generate_study(reference, passage_text)

    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "bible_books": BIBLE_BOOKS,
            "selected_book": book,
            "selected_chapter": chapter,
            "selected_start_verse": start_verse,
            "selected_end_verse": end_verse,
            "reference": reference,
            "passage_text": passage_text,
            "study": study,
        },
    )


@app.post("/generate")
async def generate_study_endpoint(req: GenerateStudyRequest):
    """Generate Bible study for specified passage."""
    # Validate chapter exists for the book
    max_chapters = get_chapter_count(req.book)
    if max_chapters == 0:
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid book name"}
        )

    if req.chapter < 1 or req.chapter > max_chapters:
        return JSONResponse(
            status_code=400,
            content={"error": f"Chapter must be between 1 and {max_chapters} for {req.book}"}
        )

    # Validate verse range if provided
    if req.start_verse is not None and req.end_verse is not None:
        if not validate_verse_range(req.book, req.chapter, req.start_verse, req.end_verse):
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid verse range"}
            )

    # Build reference string
    reference = get_reference(req.book, req.chapter, req.start_verse, req.end_verse)

    # Fetch passage text
    passage_text = await fetch_passage(reference)

    # Generate study
    study = await generate_study(reference, passage_text)

    # Save to history
    save_study_to_history(req.book, req.chapter, req.start_verse, req.end_verse, reference)

    return {
        "reference": reference,
        "passage_text": passage_text,
        "study": study
    }


@app.get("/history", response_class=HTMLResponse)
async def view_history(request: Request):
    """Display study history."""
    history = get_study_history(limit=50)

    return templates.TemplateResponse(
        "history.html",
        {
            "request": request,
            "history": history,
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
