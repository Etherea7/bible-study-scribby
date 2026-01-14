import sqlite3
import json
from contextlib import contextmanager
from config import DATABASE_PATH


def init_db():
    """Initialize the database with required tables."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Drop old reading_progress table if it exists
        cursor.execute("DROP TABLE IF EXISTS reading_progress")

        # Reading history table - tracks all generated studies
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reading_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book TEXT NOT NULL,
                chapter INTEGER NOT NULL,
                start_verse INTEGER,
                end_verse INTEGER,
                reference TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Cached passages table (ESV text)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cached_passages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reference TEXT UNIQUE NOT NULL,
                text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Cached studies table (AI-generated content)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cached_studies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reference TEXT UNIQUE NOT NULL,
                study_content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()


@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def save_study_to_history(book: str, chapter: int, start_verse: int | None, end_verse: int | None, reference: str):
    """Save a generated study to history."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO reading_history (book, chapter, start_verse, end_verse, reference) VALUES (?, ?, ?, ?, ?)",
            (book, chapter, start_verse, end_verse, reference)
        )
        conn.commit()


def get_study_history(limit: int = 50):
    """Get study history, most recent first."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, book, chapter, start_verse, end_verse, reference, created_at FROM reading_history ORDER BY created_at DESC LIMIT ?",
            (limit,)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_cached_passage(reference: str):
    """Get cached ESV passage text."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT text FROM cached_passages WHERE reference = ?", (reference,))
        row = cursor.fetchone()
        return row["text"] if row else None


def cache_passage(reference: str, text: str):
    """Cache ESV passage text."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO cached_passages (reference, text) VALUES (?, ?)",
            (reference, text)
        )
        conn.commit()


def get_cached_study(reference: str):
    """Get cached study content."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT study_content FROM cached_studies WHERE reference = ?", (reference,))
        row = cursor.fetchone()
        return json.loads(row["study_content"]) if row else None


def cache_study(reference: str, study_content: dict):
    """Cache study content."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO cached_studies (reference, study_content) VALUES (?, ?)",
            (reference, json.dumps(study_content))
        )
        conn.commit()
