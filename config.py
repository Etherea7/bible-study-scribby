import os
from dotenv import load_dotenv

load_dotenv()

ESV_API_KEY = os.getenv("ESV_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
DATABASE_PATH = os.getenv("DATABASE_PATH", "bible_study.db")
