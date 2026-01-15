# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Daily Bible Study - A full-stack application with a React frontend and FastAPI backend that generates AI-powered expository Bible study guides. Users can select any book, chapter, and verse range to generate an in-depth study with context, themes, sample answers to observation/interpretation questions, selective cross-references, and prayer prompts.

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
# - GROQ_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY for LLM providers
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
  - `POST /api/generate` - Generate study for verse range (returns JSON)
  - `GET /api/providers` - Check available LLM provider status

**services/llm_router.py**
- Multi-provider LLM orchestration with automatic fallback:
  - Groq (primary, free) → OpenRouter → Gemini → Claude (paid)
- Each provider has its own module in `services/providers/`

**services/prompts/study_prompt.py**
- `INTERWOVEN_STUDY_PROMPT` - Main study generation prompt
- **Doctrinal guardrails** for Reformed Christian theology:
  - Trinity, Total Depravity, Unconditional Election
  - Substitutionary Atonement, Salvation by Grace through Faith
  - Scripture Authority, Perseverance of Saints
- Handling ambiguous passages: focus on concrete text, note debates
- `format_study_prompt_with_flow()` - Supports user-defined flow context for custom generation

**services/esv_api.py**
- Fetches passage text from ESV API
- Returns formatted error messages if API key missing

### Frontend (React)

**Tech Stack**
- React 18 with TypeScript
- TanStack React Query for server state
- Dexie.js (IndexedDB) for client-side persistence
- Tailwind CSS for styling
- Framer Motion for animations
- @dnd-kit for drag-and-drop
- Zod for JSON validation

**Directory Structure**
```
frontend/src/
├── components/
│   ├── forms/        # PassageSelector
│   ├── layout/       # Header, DraggableColumn
│   ├── study/        # PassageDisplay, StudyGuide, StudyFlowEditor, QuestionCard
│   │   ├── EditableStudyGuide.tsx  # Full editable study component
│   │   ├── EditableQuestionCard.tsx # Sortable question with CRUD
│   │   ├── SortableQuestionList.tsx # Drag-drop question reordering
│   │   ├── EditableThemeList.tsx   # Theme badge management
│   │   ├── EditableCrossReferences.tsx # Cross-reference CRUD
│   │   └── AddQuestionButton.tsx   # Add O/I/F/A questions
│   └── ui/           # Button, Card, LoadingSpinner, EditableTextField
├── db/
│   └── index.ts      # Dexie database (v2 schema)
├── hooks/
│   ├── useHistory.ts       # History CRUD + import/export
│   ├── useStudyGeneration.ts
│   ├── useEditableStudy.ts # Full CRUD for editable study state
│   ├── useBeforeUnload.ts  # Warn on unsaved changes
│   └── useDarkMode.ts
├── pages/
│   ├── HomePage.tsx   # 3-column drag-drop layout with save bar
│   └── HistoryPage.tsx # History list with import/export
├── types/
│   └── index.ts       # TypeScript interfaces
└── utils/
    ├── bibleData.ts   # Book/chapter/verse validation
    └── validation.ts  # Zod schemas for import validation
```

### Key Components

**HomePage.tsx**
- 3-column modular dashboard with drag-and-drop reordering:
  - Scripture (passage text)
  - Study Flow (section overview with editable purposes)
  - Study Guide (fully editable questions and answers)
- Column order persisted to Dexie userPreferences
- Discernment disclaimer at top
- **Save bar** with:
  - Unsaved changes indicator (amber)
  - Validation error indicator (red)
  - Saved to history indicator (green)
  - Discard button (reset to original)
  - Save Study button (manual save)
- **Keyboard shortcuts**: Ctrl+S to save
- **Before unload warning** when unsaved changes exist

**StudyFlowEditor.tsx**
- Displays study sections with expandable details
- Editable section purposes for custom AI generation context
- Shows question counts per section

**EditableStudyGuide.tsx**
- Full editable study component replacing StudyGuide in edit mode
- All fields editable: Purpose, Context, Summary, Prayer Prompt
- Required field validation for Purpose and Context (cannot be empty)
- EditableThemeList for theme badges (add/edit/remove)
- SortableQuestionList per section (drag-drop reordering)
- AddQuestionButton with type selector (O/I/F/A)
- EditableCrossReferences for cross-reference CRUD

**EditableQuestionCard.tsx**
- Drag handle for reordering within section
- Delete button (trash icon)
- Question type dropdown (Observation/Interpretation/Feeling/Application)
- Click to edit question/answer inline
- Debounced save (500ms)

**QuestionCard.tsx** (read-only mode)
- Displays observation/interpretation/application questions
- Collapsible sample answers

**HistoryPage.tsx**
- Lists all generated studies
- Import/Export JSON functionality with validation
- Clear all with confirmation

### Database Schema (Dexie v2)

```typescript
// IndexedDB tables
readingHistory: '++id, reference, timestamp'  // Auto-increment ID
cachedPassages: 'reference'                    // ESV API cache
cachedStudies: 'reference'                     // LLM response cache
editedStudies: 'id, reference, lastModified'  // User modifications
userPreferences: 'key'                         // Settings (column order, etc.)
```

### Data Types

**Study** (from LLM)
```typescript
interface Study {
  purpose: string;           // Action-focused purpose statement
  context: string;           // Historical/cultural background
  key_themes: string[];      // Theme tags
  study_flow: StudyFlowItem[];  // Sections with questions
  summary: string;           // Main takeaway
  application_questions: string[];  // Personal reflection (no answers)
  cross_references: CrossReference[];  // Related passages
  prayer_prompt: string;     // Prayer direction
}

interface StudyFlowItem {
  passage_section: string;       // e.g., "John 1:1-3"
  section_heading: string;       // Section title
  observation_question: string;  // What does text say?
  observation_answer: string;    // Model answer
  interpretation_question: string;  // What does it mean?
  interpretation_answer: string;    // Model answer
  connection?: string;           // Bridge to next section
}
```

**EditableStudyFull** (for full user modifications)
```typescript
// Question types include "feeling" for personal reflection
type EditableQuestionType = 'observation' | 'interpretation' | 'feeling' | 'application';

interface EditableQuestion {
  id: string;
  type: EditableQuestionType;
  question: string;
  answer?: string;  // Optional for application/feeling
}

interface EditableCrossReference {
  id: string;
  reference: string;
  note: string;
}

interface EditableStudyFlowSection {
  id: string;
  passage_section: string;
  section_heading: string;
  questions: EditableQuestion[];  // All questions for this section
  connection?: string;
}

interface EditableStudyFull {
  id: string;
  purpose: string;
  context: string;
  key_themes: string[];
  study_flow: EditableStudyFlowSection[];
  summary: string;
  application_questions: EditableQuestion[];
  cross_references: EditableCrossReference[];
  prayer_prompt: string;
  lastModified?: Date;
  isEdited?: boolean;
  isSaved?: boolean;  // Whether saved to history
}
```

**useEditableStudy Hook** - Full CRUD operations:
```typescript
// Field updaters
updatePurpose, updateContext, updateSummary, updatePrayerPrompt

// Theme management
addTheme, updateTheme, removeTheme

// Question management (within study flow sections)
addQuestion, updateQuestion, removeQuestion, reorderQuestions

// Application questions
addApplicationQuestion, updateApplicationQuestion, removeApplicationQuestion

// Cross references
addCrossReference, updateCrossReference, removeCrossReference

// Section management
updateSectionHeading, updateSectionConnection

// Actions
saveToHistory()   // Manual save (NOT auto-save)
discardChanges()  // Reset to original
```

### Import/Export Format

```json
{
  "exportedAt": "2026-01-15T...",
  "version": "2.0",
  "history": [...],    // ReadingHistoryItem[]
  "passages": [...],   // CachedPassage[]
  "studies": [...]     // CachedStudy[]
}
```

## Key Design Decisions

1. **Client-side persistence**: All data stored in IndexedDB via Dexie - fully offline-capable
2. **Multi-provider LLM**: Automatic fallback Groq → OpenRouter → Gemini → Claude
3. **3-column drag-drop layout**: Scripture | Flow | Guide, user can reorder and persist
4. **Full editable study content**:
   - Add/edit/remove questions (Observation/Interpretation/Feeling/Application)
   - Drag-drop reorder questions within sections
   - Edit all fields (Purpose, Context, Themes, Summary, Cross-References, Prayer)
   - Required field validation (Purpose, Context cannot be empty)
5. **Manual save flow**: Studies NOT auto-saved to history - explicit Save button required
6. **Unsaved changes protection**: Browser warning on navigation, Ctrl+S shortcut
7. **JSON import/export**: Zod validation on import, append mode (no replace)
8. **Doctrinal guardrails**: Reformed theology embedded in prompt (Trinity, TULIP, etc.)
9. **Flow-based generation**: Users can define section purposes for custom question generation
10. **Fun generate button**: Animated gradient button with sparkles icon

## Testing Checklist

1. **Study generation**:
   - Verse range works: "John 1:1-18"
   - Purpose statement has action verb
   - Doctrinal content aligns with Reformed theology

2. **3-Column Layout**:
   - Drag columns to reorder
   - Refresh page - order persists
   - Mobile: stacks vertically

3. **Editable Content**:
   - Click any field to edit (Purpose, Context, questions, etc.)
   - Add questions via type selector (O/I/F/A)
   - Remove questions via trash icon
   - Drag questions to reorder within section
   - Add/edit/remove themes and cross-references
   - Escape cancels edit, changes debounced (500ms)
   - Purpose and Context show validation error if empty

4. **Manual Save Flow**:
   - Save bar shows "Unsaved changes" (amber)
   - Save bar shows validation errors (red)
   - Discard button resets to original
   - Save Study button saves to history
   - Ctrl+S keyboard shortcut works
   - Browser warns before leaving with unsaved changes

5. **Import/Export**:
   - Export creates valid JSON
   - Import validates structure
   - Import appends (doesn't replace)
   - Invalid JSON shows error messages

6. **UI**:
   - Generate button has gradient animation
   - Discernment disclaimer visible
   - Back button styled properly
   - History items have hover state
   - Card headers have proper padding (px-6 pt-6)

## Prompt Engineering

**services/prompts/study_prompt.py** contains:
- `INTERWOVEN_STUDY_PROMPT` - Main prompt with doctrinal guardrails
- `FLOW_CONTEXT_ADDON` - Additional instructions when user provides flow context
- `format_study_prompt()` - Basic formatting
- `format_study_prompt_with_flow()` - Format with optional user-defined purposes

Doctrinal guidelines enforce:
- Scripture interprets Scripture
- Focus on concrete text, not speculation
- Note debates on non-essentials
- Never contradict Reformed doctrines
