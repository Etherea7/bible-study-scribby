# Scribby - Bible Study Editor

A modern Bible study editor with AI-powered generation capabilities. Create, edit, and organize in-depth expository Bible studies with full control over every element. Generate comprehensive study guides with AI assistance, or craft them manually from scratch.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-Personal%20Use-blue)

## Features

### Study Editor
- **Full CRUD Operations**: Add, edit, reorder, and delete questions, themes, cross-references, and more
- **Drag-and-Drop**: Reorder questions within sections and rearrange the 3-column layout
- **Inline Editing**: Click any field to edit - purpose, context, questions, answers, themes
- **Question Types**: Observation, Interpretation, Feeling, and Application questions
- **Manual Save**: Explicit save control with unsaved changes warning
- **Validation**: Required field validation for Purpose and Context
- **Keyboard Shortcuts**: Ctrl+S to save

### AI-Powered Generation
- **Multi-Provider Support**: Groq (free) → OpenRouter → Gemini → Claude with automatic fallback
- **Client-Side Generation**: Use your own API keys for direct browser-to-API calls
- **AI Enhancement**: Enhance individual questions with AI assistance
- **Doctrinal Guardrails**: Reformed theological perspective built into prompts

### Study Structure
- **Purpose Statement**: Action-focused summary of the passage's main point
- **Contextual Analysis**: Historical, cultural, and literary background
- **Key Themes**: Theological concepts with editable theme badges
- **Study Flow**: Section-by-section breakdown with questions and sample answers
- **Cross-References**: Related passages that illuminate the text
- **Application Questions**: Personal reflection prompts
- **Prayer Prompt**: Guided prayer direction

### User Experience
- **3-Column Layout**: Scripture | Study Flow | Study Guide (drag to reorder)
- **Dark Mode**: Toggle between light and dark themes
- **History Management**: Track, revisit, and manage previously created studies
- **Import/Export**: JSON format for backup and sharing
- **Word Export**: Generate .docx documents for printing or sharing
- **Offline-Capable**: Client-side IndexedDB storage via Dexie.js
- **Mobile Responsive**: Works on all device sizes

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- API Keys (at least one of the following):
  - [ESV API Key](https://api.esv.org/) (free) - Required for passage text
  - [OpenRouter API Key](https://openrouter.ai/) (free tier available) - Recommended for client-side generation
  - [Groq API Key](https://console.groq.com/) (free) - For server-side generation

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/daily-bible-study.git
   cd daily-bible-study
   ```

2. **Install backend dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend && npm install
   ```

4. **Configure environment** (optional for server-side generation)
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your API keys:
   ```env
   ESV_API_KEY=your_esv_key
   GROQ_API_KEY=your_groq_key
   OPENROUTER_API_KEY=your_openrouter_key
   GEMINI_API_KEY=your_gemini_key
   ANTHROPIC_API_KEY=your_anthropic_key
   ```

5. **Run the application**

   Terminal 1 - Backend:
   ```bash
   python main.py
   # Or: uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   Terminal 2 - Frontend:
   ```bash
   cd frontend && npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

### Client-Side Configuration (Recommended)

You can configure API keys directly in the browser for client-side generation:

1. Click the **gear icon** in the header
2. Enter your **ESV API key** and **OpenRouter API key**
3. Click **Save**

With client-side keys configured, studies are generated directly from your browser without requiring the backend server.

## Usage

### Generate a Study with AI

1. Select a book, chapter, and verse range from the dropdown
2. Click **Generate Study** (animated button)
3. Wait for AI to generate the study guide
4. Edit any content as needed
5. Click **Save Study** to save to history

### Create a Blank Study

1. Click **New Blank Study** button
2. Enter a passage reference (e.g., "Romans 8:1-4")
3. Fill in Purpose and Context (required fields)
4. Add questions, themes, and content manually
5. Save when complete

### Edit a Study

- **Click any field** to edit inline
- **Add questions** using the + button with type selector (O/I/F/A)
- **Reorder questions** by dragging the handle
- **Delete questions** with the trash icon
- **Enhance with AI** using the sparkles icon (requires OpenRouter key)
- **Edit themes** by clicking the badge or using +/- buttons
- **Manage cross-references** in the dedicated section

### Export Options

- **Save to History**: Click "Save Study" to persist in IndexedDB
- **Export to Word**: Click "Export" to download a .docx file
- **Export to JSON**: Use History page for full backup/restore

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **TanStack React Query** for server state
- **Dexie.js** for IndexedDB client-side persistence
- **Tailwind CSS 4** for styling
- **Framer Motion** for animations
- **@dnd-kit** for drag-and-drop
- **Zod** for validation
- **docx** for Word export

### Backend
- **FastAPI** for API routes
- **Multi-provider LLM Router** with automatic fallback
- **ESV API** integration for Scripture text

### LLM Providers (in fallback order)
1. **Groq** (free, fast) - Primary
2. **OpenRouter** (free tier, CORS-enabled)
3. **Google Gemini**
4. **Anthropic Claude**

## Project Structure

```
daily-bible-study/
├── main.py                          # FastAPI application
├── requirements.txt                 # Python dependencies
├── services/
│   ├── esv_api.py                  # ESV Bible API client
│   ├── llm_router.py               # Multi-provider LLM orchestration
│   ├── llm_providers/              # Individual provider modules
│   │   ├── groq_provider.py
│   │   ├── openrouter_provider.py
│   │   ├── gemini_provider.py
│   │   └── claude_provider.py
│   └── prompts/
│       └── study_prompt.py         # Study generation prompts
├── frontend/
│   ├── package.json
│   └── src/
│       ├── api/                    # API clients
│       │   ├── studyApi.ts         # Backend API calls
│       │   ├── llmClient.ts        # Direct OpenRouter/ESV calls
│       │   └── enhanceClient.ts    # AI enhancement functions
│       ├── components/
│       │   ├── forms/              # PassageSelector
│       │   ├── layout/             # Header, DraggableColumn
│       │   ├── settings/           # API key configuration
│       │   ├── study/              # Study display and editing
│       │   │   ├── EditableStudyGuide.tsx
│       │   │   ├── EditableQuestionCard.tsx
│       │   │   ├── SortableQuestionList.tsx
│       │   │   └── ...
│       │   └── ui/                 # Reusable UI components
│       ├── db/                     # Dexie IndexedDB setup
│       ├── hooks/                  # React hooks
│       │   ├── useEditableStudy.ts # Full CRUD operations
│       │   ├── useStudyGeneration.ts
│       │   ├── useApiKeys.ts
│       │   └── useHistory.ts
│       ├── pages/
│       │   ├── HomePage.tsx        # Main editor interface
│       │   └── HistoryPage.tsx     # History management
│       ├── types/                  # TypeScript interfaces
│       └── utils/
│           ├── blankStudy.ts       # Blank study template
│           ├── wordExport.ts       # Word document generation
│           └── validation.ts       # Zod schemas
└── CLAUDE.md                       # Developer documentation
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ESV_API_KEY` | For server | ESV API key from https://api.esv.org/ |
| `GROQ_API_KEY` | No | Free Groq API key |
| `OPENROUTER_API_KEY` | No | OpenRouter API key (CORS-enabled) |
| `GEMINI_API_KEY` | No | Google Gemini API key |
| `ANTHROPIC_API_KEY` | No | Anthropic Claude API key |

### API Key Priority

**Client-side generation** (recommended):
- Configure ESV + OpenRouter keys in browser settings
- No backend required for generation

**Server-side generation**:
- Falls back through providers: Groq → OpenRouter → Gemini → Claude
- Uses first available provider with valid API key

## Theological Perspective

This tool generates studies from a **Reformed Christian perspective** with the following doctrinal guardrails:

- **Trinity**: One God in three persons
- **Scripture Authority**: Bible as the inspired, inerrant Word of God
- **Total Depravity**: Human inability apart from grace
- **Salvation by Grace**: Through faith alone, in Christ alone
- **Scripture Interprets Scripture**: Using clearer passages to illuminate others

AI-generated content includes a discernment disclaimer reminding users to verify all content against Scripture itself.

## Development

### Run in Development Mode

```bash
# Backend with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend with HMR
cd frontend && npm run dev
```

### Build for Production

```bash
cd frontend && npm run build
```

### Customization

**Modify AI prompts**: Edit `services/prompts/study_prompt.py`

**Change default passage**: Edit the default values in `main.py` → `home()` function

**Adjust study structure**: Modify TypeScript interfaces in `frontend/src/types/index.ts`

## Troubleshooting

### "API key not configured"
- For client-side: Click gear icon and enter your API keys
- For server-side: Check `.env` file exists with valid keys
- Restart the server after adding environment variables

### Study generation fails
- Check console for provider errors
- Verify at least one LLM provider has a valid API key
- Try configuring client-side keys as fallback

### Changes not saving
- Click "Save Study" button explicitly (no auto-save)
- Check for validation errors (red indicator in save bar)
- Ensure Purpose and Context fields are not empty

### Word export issues
- Ensure the study has been saved at least once
- Check browser console for export errors

## Credits

- **Scripture quotations**: ESV® Bible (The Holy Bible, English Standard Version®)
- **AI Providers**: Groq, OpenRouter, Google Gemini, Anthropic Claude
- **Icons**: Lucide React

## License

This project is for personal and educational use. Please respect the ESV API terms of service and include proper attribution when displaying Scripture.

---

**Questions?** Check `CLAUDE.md` for detailed technical documentation.
