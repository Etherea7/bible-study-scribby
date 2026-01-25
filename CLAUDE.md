# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bible Study Scribby - A full-stack application with a React frontend and FastAPI backend that helps users craft AI-powered expository Bible study guides. The app has been refocused from a pure "generator" to an "AI-enhanced editor" experience where users can:
- Select any book, chapter, and verse range
- Generate AI-powered studies or start from blank templates
- Edit all content in a professional workspace layout
- Use AI assistance for drafting, rephrasing, and enhancement

## Development Commands

### Environment Setup
```bash
# Backend dependencies
pip install -r requirements.txt

# Frontend dependencies
cd frontend && npm install

# Create .env file from template
cp .env.example .env
# Edit .env with your API keys:
# - ESV_API_KEY from https://api.esv.org/
# - OPENROUTER_API_KEY, GOOGLE_API_KEY, ANTHROPIC_API_KEY for LLM providers
```

### Running the Application
```bash
# Run backend (FastAPI)
python main.py
# Or: uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run frontend (React/Vite)
cd frontend && npm run dev

# Frontend at http://localhost:5173
# Backend at http://localhost:8000
```

## Architecture

### Backend (FastAPI)

**main.py**
- FastAPI application with API routes:
  - `GET /` - Health check / default study
  - `POST /api/generate` - Generate study for verse range (accepts `provider` and `model` params)
  - `GET /api/providers` - Check available LLM provider status
  - `POST /api/passage` - Fetch passage text from server's ESV API

**services/llm_router.py**
- Multi-provider LLM orchestration with automatic fallback:
  - Groq → OpenRouter → Gemini → Claude
- Accepts `requested_provider` and `requested_model` parameters
- Maps frontend provider names to backend names (anthropic→claude, google→gemini)

**services/llm_providers/**
- Each provider accepts `model_override` parameter in `generate_study()`
- Providers: `groq_provider.py`, `openrouter_provider.py`, `gemini_provider.py`, `claude_provider.py`

**services/prompts/study_prompt.py**
- Unified study generation prompt with doctrinal guardrails (Reformed theology)

### Frontend (React)

**Tech Stack**
- React 18 with TypeScript
- TanStack React Query for server state
- Dexie.js (IndexedDB) for client-side persistence
- Tailwind CSS for styling
- Framer Motion for animations
- Zod for JSON validation

**Directory Structure**
```
frontend/src/
├── api/
│   ├── studyApi.ts          # Backend API calls
│   ├── llmClient.ts         # Direct OpenRouter/ESV API calls (client-side)
│   ├── enhanceClient.ts     # AI enhancement functions
│   └── unifiedAIService.ts  # Centralized AI service for all providers
├── components/
│   ├── editor/              # Workspace editor components (NEW)
│   │   ├── WorkspaceEditor.tsx    # Main split-view layout
│   │   ├── PassagePanel.tsx       # Sticky passage display
│   │   ├── StudyContentPanel.tsx  # Document-style editor
│   │   └── MagicDraftButton.tsx   # AI draft button
│   ├── forms/               # PassageSelector, BookSearchCombobox, PassagePreview
│   ├── layout/              # Header
│   ├── settings/            # ApiKeySettings modal with model selection
│   ├── study/               # Study display components
│   ├── ui/                  # Button, Card, FloatingToolbar, etc.
│   └── wizard/              # CreateStudyWizard (NEW)
├── db/
│   └── index.ts             # Dexie database (v3 schema)
├── hooks/
│   ├── useApiKeys.ts        # API key + model selection storage
│   ├── useStudyGeneration.ts # Uses UnifiedAIService
│   ├── useEditableStudy.ts  # Full CRUD for editable study state
│   ├── useSavedStudies.ts   # Saved studies CRUD
│   └── ...
├── pages/
│   ├── LandingPage.tsx      # NEW entry point at "/"
│   ├── HomePage.tsx         # Editor page at "/editor"
│   ├── SavedPage.tsx        # Saved studies list at "/saved"
│   └── HistoryPage.tsx      # History list at "/history"
├── types/
│   └── index.ts             # TypeScript interfaces (provider/model types)
└── utils/
    └── ...
```

### Routing Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LandingPage` | Welcome page with hero, "Create New Study" button, recent studies grid |
| `/editor` | `HomePage` | Workspace editor with split view (Passage | Study) |
| `/editor?saved=id` | `HomePage` | Load saved study by ID |
| `/editor?ref=ref` | `HomePage` | Load from history by reference |
| `/saved` | `SavedPage` | List of saved studies |
| `/history` | `HistoryPage` | Generation history |

### Key Components

**LandingPage.tsx** (NEW - Entry Point)
- Hero section with "Craft Your Bible Study" title
- Primary CTA: "Create New Study" button (opens wizard)
- Recent Studies grid showing 4 most recent saved studies
- Premium aesthetics with Framer Motion animations

**CreateStudyWizard.tsx** (NEW - 3-Step Creation Flow)
- Step 1: Select passage (uses PassageSelector)
- Step 2: Verify & preview (PassagePreview, optional context input)
- Step 3: Choose method ("Start Blank" or "Generate with AI")
- Modal overlay with progress indicator

**WorkspaceEditor.tsx** (NEW - Split View Layout)
- Two-panel split view: Passage (left) | Study Content (right)
- Responsive: side-by-side on desktop, stacked on mobile
- Collapsible passage panel

**PassagePanel.tsx** (NEW)
- Displays Bible passage text with verse formatting
- Sticky positioning (always visible while scrolling)
- Text selection triggers FloatingToolbar with passage actions

**StudyContentPanel.tsx** (NEW)
- Document-style layout for all study fields
- All fields editable: Purpose, Context, Themes, Study Flow, Summary, etc.
- MagicDraftButton for AI-assisted content generation
- Section management (add/remove/collapse)
- **Free-Write Notes**: Each section has a "Your Notes & Outline" textarea for personal study
- **Notes-Guided Generation**: When generating questions, user can use their notes to guide AI

**FloatingToolbar.tsx** (Enhanced - Dual Mode)
- **Edit mode**: Rephrase, Shorten (for editable text fields)
- **Passage mode**: Explain, Cross-Reference (for selected Bible text)

**ApiKeySettings.tsx** (Enhanced)
- Provider selection: OpenRouter, Anthropic, Google, Auto
- Model selection dropdown per provider
- Migration support for old settings format

### Provider & Model System

**Available Providers:**
```typescript
type LLMProvider = 'openrouter' | 'anthropic' | 'google' | 'auto';
```

**Model Configuration:**
```typescript
// OpenRouter models
'meta-llama/llama-3.2-3b-instruct:free' (default, free)
'meta-llama/llama-3.3-70b-instruct:free'
'anthropic/claude-3.5-sonnet'
'openai/gpt-4o'

// Anthropic models
'claude-sonnet-4-20250514' (default)
'claude-3-5-sonnet-20241022'
'claude-3-5-haiku-20241022'

// Google models
'gemini-2.0-flash' (default)
'gemini-1.5-pro'
'gemini-1.5-flash'
```

**UnifiedAIService** (`unifiedAIService.ts`)
- Central service for all AI operations
- Routes between client-side (OpenRouter via CORS) and server-side
- Methods: `generateStudy()`, `fetchPassage()`, `getEffectiveConfig()`

### Database Schema (Dexie v3)

```typescript
// IndexedDB tables
readingHistory: '++id, reference, timestamp'
cachedPassages: 'reference'
cachedStudies: 'reference'
editedStudies: 'id, reference, lastModified'
userPreferences: 'key'  // Stores API keys, model selections
savedStudies: 'id, reference, savedAt'
```

### Data Types

**ApiKeySettings** (Updated)
```typescript
interface ApiKeySettings {
  esvApiKey?: string;
  openrouterApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  preferredProvider: LLMProvider;
  selectedModels: {
    openrouter?: string;
    anthropic?: string;
    google?: string;
  };
}
```

**GenerateStudyRequest** (Updated)
```typescript
interface GenerateStudyRequest {
  book: string;
  chapter: number;
  start_verse?: number;
  end_chapter?: number;
  end_verse?: number;
  provider?: string;  // Optional: override provider
  model?: string;     // Optional: override model
}
```

## Key Design Decisions

1. **Landing Page First**: New "/" route is a welcoming landing page, editor moved to "/editor"
2. **Creation Wizard**: 3-step flow guides users through passage selection and creation method
3. **Workspace Layout**: Split view with sticky passage panel replaces 3-column drag-drop
4. **Provider Agnostic**: Unified service handles OpenRouter (CORS), Anthropic, Google
5. **Model Selection**: Users can choose specific models per provider
6. **Client-Side First**: OpenRouter preferred for CORS support, server fallback for others
7. **AI Tools**: Magic draft buttons, text selection toolbar, question enhancement
8. **Migration Support**: Old settings automatically migrated to new format

## Client-Side Architecture

**Generation Flow:**
1. Check if ESV + OpenRouter keys configured
2. If yes: Client-side generation via UnifiedAIService
3. If no: Fall back to backend `/api/generate`
4. Provider/model preferences sent to backend when using server-side

**AI Enhancement:**
- Requires OpenRouter API key
- FloatingToolbar: Select text → Rephrase/Shorten (edit mode) or Explain/Cross-Ref (passage mode)
- MagicDraftButton: Generate content for empty sections
- Question enhancement: Sparkles button on each question card

**Notes-Guided Generation:**
- Each study section has a "Your Notes & Outline" textarea for free-form notes
- Users can write down observations, main points, or outlines during self-study
- When generating questions, user is prompted to use their notes
- Notes are validated for relevance using AI before being used in generation
- Validation checks: relevance to passage, theological consistency, usefulness for question generation
- User can override validation and use notes anyway, or generate without notes
- Notes are stored per-section in `EditableStudyFlowSection.userNotes`

## Testing Checklist

### Landing Page & Wizard
1. Landing page loads at "/"
2. "Create New Study" opens wizard modal
3. Step 1: Passage selector works with defaults
4. Step 2: Preview shows passage text
5. Step 3: Both "Start Blank" and "Generate" options work
6. Navigation to /editor with study data

### Workspace Editor
1. Split view renders (Passage left, Study right)
2. Passage panel is sticky when scrolling
3. Collapse/expand passage panel works
4. All study fields are editable
5. Section add/remove works
6. Save bar functions correctly

### AI Tools
1. Select text in passage → toolbar with Explain/Cross-Ref
2. Select text in editable field → toolbar with Rephrase/Shorten
3. Magic draft buttons appear on empty sections
4. Question enhancement (sparkles) works

### Notes-Guided Generation
1. Each section shows "Your Notes & Outline" textarea
2. Typing notes updates section state
3. Clicking "Draft Observations/Interpretations" with notes → prompts "Use your notes?"
4. Choosing "Yes" validates notes relevance before generation
5. If notes irrelevant (score < 40), warning shown with options
6. Generated questions incorporate relevant notes content
7. Notes persist when saving study

### Provider/Model Selection
1. Settings modal shows provider dropdown
2. Model dropdown updates per provider
3. Selected model persists after reload
4. Generation uses selected model

### Responsive Design
1. Desktop: Side-by-side split view
2. Tablet: Narrower panels
3. Mobile: Stacked layout (passage first)

## Files Reference

### Phase 1 (Foundation)
- `frontend/src/types/index.ts` - Provider/model types
- `frontend/src/hooks/useApiKeys.ts` - Enhanced with model selection
- `frontend/src/api/unifiedAIService.ts` - Unified AI service
- `main.py` - Provider/model parameters
- `services/llm_router.py` - Provider routing

### Phase 2 (New Flow)
- `frontend/src/pages/LandingPage.tsx` - Landing page
- `frontend/src/components/wizard/CreateStudyWizard.tsx` - Creation wizard
- `frontend/src/App.tsx` - Updated routing

### Phase 3 (Editor)
- `frontend/src/components/editor/WorkspaceEditor.tsx` - Split view
- `frontend/src/components/editor/PassagePanel.tsx` - Passage display
- `frontend/src/components/editor/StudyContentPanel.tsx` - Study editor with notes
- `frontend/src/components/editor/MagicDraftButton.tsx` - AI draft button
- `frontend/src/components/ui/FloatingToolbar.tsx` - Dual-mode toolbar
- `frontend/src/api/enhanceClient.ts` - AI enhancement functions including notes validation

### Key AI Functions (`enhanceClient.ts`)
- `validateUserNotes(notes, passageText, sectionHeading)` - Validates notes relevance (returns score 0-100)
- `draftObservationQuestions(text, heading, count, userNotes?)` - Generates observation questions (optionally guided by notes)
- `draftInterpretationQuestions(text, heading, count, userNotes?)` - Generates interpretation questions (optionally guided by notes)
- `rephraseText(text, context?)` - Rephrases selected text
- `shortenText(text, context?)` - Shortens selected text
- `explainPassage(text, context)` - Explains selected Bible text
- `findCrossReferences(text, reference)` - Finds related passages

### EditableStudyFlowSection (Updated)
```typescript
interface EditableStudyFlowSection {
  id: string;
  passage_section: string;
  section_heading: string;
  questions: EditableQuestion[];
  connection?: string;
  userNotes?: string;  // Free-write notes for personal study/outline
}
```
