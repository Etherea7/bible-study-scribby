# Bible Study Generator

An AI-powered web application that generates in-depth expository Bible study guides for any passage. Built with FastAPI and Claude AI.

## Features

### Study Generation
- **Verse-Range Selection**: Choose any book, chapter, and verse range for focused study
- **Purpose Statement**: Single-sentence action-focused summary of the passage's main point
- **Contextual Analysis**: Historical, cultural, and literary background
- **Key Themes**: Core theological concepts identified in the passage
- **Three Types of Questions**:
  - **Observation**: "What does the text say?" with sample answers
  - **Interpretation**: "What does it mean?" with sample answers
  - **Application**: "How does it apply to your life?" (user reflects independently)
- **Selective Cross-References**: Related passages that genuinely illuminate the text
- **Prayer Focus**: Guided prayer direction based on the passage

### User Experience
- **Side-by-Side Layout**: Scripture stays visible while you study (desktop)
- **Collapsible Sample Answers**: Encourages independent thinking before revealing
- **Async Loading**: Smooth generation with loading indicator (no page reloads)
- **Study History**: Track and revisit previously generated studies
- **Smart Caching**: Instant loading for previously generated studies
- **Mobile Responsive**: Works seamlessly on all devices

## Quick Start

### Prerequisites
- Python 3.8+
- [ESV API Key](https://api.esv.org/) (free)
- [Anthropic API Key](https://console.anthropic.com/) (paid)

### Installation

1. **Clone the repository**
   ```bash
   cd daily-bible-study
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure API keys**

   Create a `.env` file in the project root:
   ```env
   ESV_API_KEY=your_esv_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

4. **Run the application**
   ```bash
   python main.py
   ```

5. **Open your browser**
   ```
   http://localhost:8000
   ```

## Usage

### Generate a Study

1. Select a book from the dropdown (e.g., "John")
2. Enter chapter number (e.g., "1")
3. Enter verse range:
   - Start verse: 1
   - End verse: 18
4. Click "Generate Study"
5. Wait for AI to generate your study (cached studies load instantly)

### Example Passages to Try

- **John 1:1-18** - The divinity and incarnation of Christ (pre-loaded default)
- **Psalm 23** - The Lord as shepherd
- **Romans 3:23-24** - Justification by faith
- **Genesis 1:1-31** - Creation account
- **Ephesians 2:8-10** - Salvation by grace

### View History

Click "📖 View History" to see all previously generated studies and regenerate them with one click.

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLite**: Local database for caching and history
- **Claude Sonnet 4**: AI model for generating study content
- **ESV API**: Bible text retrieval

### Frontend
- **Vanilla JavaScript**: Async form handling and dynamic updates
- **Jinja2**: Server-side templating
- **CSS Flexbox**: Responsive two-column layout

## Project Structure

```
daily-bible-study/
├── main.py                    # FastAPI application and routes
├── database.py                # SQLite setup and operations
├── config.py                  # Environment variable loading
├── services/
│   ├── claude_api.py         # AI study generation
│   ├── esv_api.py            # Bible passage fetching
│   ├── reading_plan.py       # Bible book data and reference formatting
│   └── bible_data.py         # Verse count validation data
├── templates/
│   ├── base.html             # Base template
│   ├── index.html            # Main study page
│   └── history.html          # Study history page
├── static/
│   ├── style.css             # Application styles
│   └── app.js                # Frontend JavaScript
├── requirements.txt          # Python dependencies
└── CLAUDE.md                 # Developer documentation
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ESV_API_KEY` | Yes | Free API key from https://api.esv.org/ |
| `ANTHROPIC_API_KEY` | Yes | Paid API key from https://console.anthropic.com/ |
| `DATABASE_PATH` | No | SQLite database path (defaults to `bible_study.db`) |

### API Costs

- **ESV API**: Free (with attribution)
- **Anthropic Claude API**: ~$0.01-0.03 per study generation (cached studies are free)

## How It Works

1. **User selects passage** → Form validates verse range client-side
2. **Generate request** → Server validates and checks cache
3. **Fetch passage** → ESV API retrieves Bible text (or cache)
4. **Generate study** → Claude AI creates comprehensive study guide (or cache)
5. **Display results** → JavaScript updates UI without page reload
6. **Save history** → Study saved to database for future reference

## Caching

All API responses are cached indefinitely in SQLite:
- **ESV passages**: Instant retrieval for any previously fetched passage
- **Study guides**: Instant display for previously generated studies
- Cache persists across server restarts

## Customization

### Modify the AI Prompt

Edit `services/claude_api.py` → `STUDY_PROMPT` to adjust:
- Study depth and focus
- Question types and quantity
- Cross-reference criteria
- Theological perspective

### Change Default Passage

Edit `main.py` → `home()` function:
```python
book = "John"
chapter = 1
start_verse = 1
end_verse = 18
```

### Adjust Study Length

Edit `services/claude_api.py` → `max_tokens` parameter (line 113):
```python
max_tokens=2500  # Increase for longer studies
```

## Development

### Run in Development Mode
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Database Location
By default, `bible_study.db` is created in the project root. To reset the database:
```bash
rm bible_study.db
# Restart the application to recreate
```

### Adding New Features
See `CLAUDE.md` for detailed architecture documentation and design decisions.

## Troubleshooting

### "API key not configured"
- Ensure `.env` file exists with valid API keys
- Restart the server after adding keys

### Verse validation errors
- Check that the verse range is valid for the selected chapter
- Example: Psalm 23 only has 6 verses

### Slow study generation
- First-time generation takes 5-15 seconds (AI processing)
- Cached studies load instantly
- Check your internet connection

## Credits

- **Scripture quotations**: ESV® Bible (The Holy Bible, English Standard Version®)
- **AI**: Anthropic Claude Sonnet 4
- **Framework**: FastAPI by Sebastián Ramírez

## License

This project is for personal and educational use. Please respect the ESV API terms of service and include proper attribution when displaying Scripture.

---

**Need help?** Check `CLAUDE.md` for detailed technical documentation.
