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
  - `POST /api/passage` - Fetch passage text from server's ESV API (for blank study creation when user lacks API key)

**services/llm_router.py**
- Multi-provider LLM orchestration with automatic fallback:
  - Groq (primary, free) → OpenRouter → Gemini → Claude (paid)
- Each provider has its own module in `services/providers/`

**services/prompts/study_prompt.py**
- `STUDY_PROMPT` - Unified study generation prompt with optional flow context
- `format_study_prompt(reference, passage_text, flow_context?)` - Single formatter function
- **Doctrinal guardrails** for Reformed Christian theology:
  - Trinity, Total Depravity, Unconditional Election
  - Substitutionary Atonement, Salvation by Grace through Faith
  - Scripture Authority, Perseverance of Saints
- Handling ambiguous passages: focus on concrete text, note debates
- Flow context: When provided, adds instructions for custom question generation per section

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
├── api/
│   ├── studyApi.ts        # Backend API calls (generateStudy, getProviders, fetchPassageFromServer)
│   ├── llmClient.ts       # Direct OpenRouter/ESV API calls (client-side)
│   └── enhanceClient.ts   # AI enhancement functions (rephrase, shorten, enhance)
├── components/
│   ├── forms/        # PassageSelector
│   ├── layout/       # Header, DraggableColumn
│   ├── settings/
│   │   └── ApiKeySettings.tsx  # API key configuration modal
│   ├── study/        # PassageDisplay, StudyGuide, StudyFlowEditor, QuestionCard
│   │   ├── EditableStudyGuide.tsx  # Full editable study component
│   │   ├── EditableQuestionCard.tsx # Sortable question with CRUD + AI enhance
│   │   ├── SortableQuestionList.tsx # Drag-drop question reordering
│   │   ├── EditableThemeList.tsx   # Theme badge management
│   │   ├── EditableCrossReferences.tsx # Cross-reference CRUD
│   │   └── AddQuestionButton.tsx   # Add O/I/F/A questions
│   └── ui/           # Button, Card, LoadingSpinner, EditableTextField, FloatingToolbar
├── db/
│   └── index.ts      # Dexie database (v3 schema)
├── hooks/
│   ├── useHistory.ts       # History CRUD + import/export
│   ├── useSavedStudies.ts  # Saved studies CRUD + import/export
│   ├── useStudyGeneration.ts # Hybrid client/server generation
│   ├── useEditableStudy.ts # Full CRUD for editable study state
│   ├── useApiKeys.ts       # API key storage in IndexedDB
│   ├── useBeforeUnload.ts  # Warn on unsaved changes
│   └── useDarkMode.ts
├── pages/
│   ├── HomePage.tsx   # 3-column drag-drop layout with save bar at bottom
│   ├── SavedPage.tsx  # Saved studies list with JSON import/export
│   └── HistoryPage.tsx # History list with import/export
├── types/
│   └── index.ts       # TypeScript interfaces
└── utils/
    ├── bibleData.ts      # Book/chapter/verse validation
    ├── validation.ts     # Zod schemas for import validation (strict mode)
    ├── normalizeStudy.ts # Normalize studies for export (ensure all keys present)
    ├── studyPrompt.ts    # TypeScript port of study prompt
    ├── blankStudy.ts     # Create blank study templates
    └── wordExport.ts     # Export studies to Word documents
```

### Key Components

**HomePage.tsx**
- 3-column modular dashboard with drag-and-drop reordering:
  - Scripture (passage text)
  - Study Flow (section overview with editable purposes)
  - Study Guide (fully editable questions and answers)
- Column order persisted to Dexie userPreferences
- Discernment disclaimer at top
- **History/Saved viewing**: Uses `useSearchParams` to load studies from `?ref=` (history) or `?saved=` (saved studies) URL params
- **New Blank Study**: "New Blank Study" button opens modal to create manual study with ESV passage fetching
- **Provider badge**: Shows below columns (at bottom of column area, aligned right)
- **Save bar** (positioned at bottom, after columns):
  - Export to Word button
  - Unsaved changes indicator (amber)
  - Validation error indicator (red)
  - Saved indicator (green)
  - Discard button (reset to original)
  - Save Study button (saves to Saved Studies, NOT History)
- **Keyboard shortcuts**: Ctrl+S to save
- **Before unload warning** when unsaved changes exist
- **Dev logging**: Console logs show provider for generated/loaded studies

**Header.tsx**
- Saved navigation link (to /saved)
- History navigation link (to /history)
- Settings icon (gear) opens API key configuration modal with disclaimer
- Dark mode toggle

**StudyFlowEditor.tsx**
- Displays study sections with expandable details
- Editable section purposes for custom AI generation context
- Shows question counts per section

**EditableStudyGuide.tsx**
- Full editable study component replacing StudyGuide in edit mode
- All fields editable: Purpose, Context, Summary, Prayer Prompt
- Required field validation for Purpose and Context (cannot be empty)
- **AI FloatingToolbar**: Select text (10+ chars) in Purpose/Context/Summary/Prayer fields to show rephrase/shorten options
- EditableThemeList for theme badges (add/edit/remove)
- **Section management**: Add/remove study flow sections, edit passage references and headings
- SortableQuestionList per section (drag-drop reordering)
- AddQuestionButton with type selector (O/I/F/A)
- EditableCrossReferences for cross-reference CRUD

**EditableQuestionCard.tsx**
- Drag handle for reordering within section
- Delete button (trash icon)
- **AI Enhance button** (sparkles icon) - requires OpenRouter API key
- Question type dropdown (Observation/Interpretation/Feeling/Application)
- Click to edit question/answer inline
- Debounced save (500ms)

**QuestionCard.tsx** (read-only mode)
- Displays observation/interpretation/application questions
- Collapsible sample answers

**SavedPage.tsx** (route: /saved)
- Lists all user-saved studies with full content
- Each study shows reference, provider, saved date
- "View" button loads study into HomePage (via `?saved=` param)
- "Delete" button removes individual study
- Import/Export JSON functionality (exports savedStudies array)
- Clear all with confirmation

**HistoryPage.tsx**
- Lists all generated studies (lightweight metadata only)
- Import/Export JSON functionality with validation
- Clear all with confirmation

### Database Schema (Dexie v3)

```typescript
// IndexedDB tables
readingHistory: '++id, reference, timestamp'  // Auto-increment ID
cachedPassages: 'reference'                    // ESV API cache
cachedStudies: 'reference'                     // LLM response cache
editedStudies: 'id, reference, lastModified'  // User modifications
userPreferences: 'key'                         // Settings (column order, etc.)
savedStudies: 'id, reference, savedAt'        // User-saved studies with full content
```

**SavedStudyRecord** (for saved studies)
```typescript
interface SavedStudyRecord {
  id: string;                    // UUID
  reference: string;             // e.g., "John 1:1-18"
  passageText: string;           // ESV passage text
  study: EditableStudyFull;      // Full editable study content
  provider?: string;             // Which LLM generated it
  savedAt: Date;                 // When saved
}
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
updateSectionHeading, updateSectionConnection, updateSectionPassage
addSection(passageSection, heading)  // Add new study flow section
removeSection(sectionId)             // Remove section (min 1 required)

// Actions
saveToHistory()   // Save to history (legacy)
markAsSaved()     // Mark study as saved (for savedStudies flow)
discardChanges()  // Reset to original
setBlankStudy()   // Set a blank study template
```

**useSavedStudies Hook** - CRUD for saved studies:
```typescript
// Queries
useSavedStudies()    // List all saved studies
useSavedStudy(id)    // Get single saved study

// Mutations
useSaveStudy()       // Save study to savedStudies table
useDeleteSavedStudy() // Delete a saved study
useClearSavedStudies() // Clear all saved studies
useExportSavedStudies() // Export as JSON
useImportSavedStudies() // Import from JSON
```

### Import/Export Formats

**History Export** (HistoryPage)
```json
{
  "exportedAt": "2026-01-16T...",
  "version": "2.0",
  "history": [...],    // ReadingHistoryItem[]
  "passages": [...],   // CachedPassage[]
  "studies": [...]     // CachedStudy[]
}
```

**Saved Studies Export** (SavedPage) - v2.0
```json
{
  "exportedAt": "2026-01-17T...",
  "version": "2.0",
  "savedStudies": [
    {
      "id": "uuid",
      "reference": "John 1:1-18",
      "passageText": "In the beginning...",
      "study": {
        "id": "study-uuid",
        "purpose": "",           // All keys present even if empty
        "context": "",
        "key_themes": [],
        "study_flow": [],
        "summary": "",
        "application_questions": [],
        "cross_references": [],
        "prayer_prompt": "",
        "lastModified": null,
        "isEdited": false,
        "isSaved": true
      },
      "provider": "manual",
      "savedAt": "2026-01-17T..."
    }
  ]
}
```

**Import Validation Rules**:
- All required keys must be present (id, reference, passageText, study, savedAt)
- No foreign/unexpected keys allowed (rejected by strict validation)
- Per-study validation: valid studies import, invalid ones skip with error messages
- Backward compatible: v1.0 files are normalized before import

## Key Design Decisions

1. **Client-side persistence**: All data stored in IndexedDB via Dexie - fully offline-capable
2. **Multi-provider LLM**: Automatic fallback Groq → OpenRouter → Gemini → Claude
3. **3-column drag-drop layout**: Scripture | Flow | Guide, user can reorder and persist
4. **Full editable study content**:
   - Add/edit/remove questions (Observation/Interpretation/Feeling/Application)
   - Drag-drop reorder questions within sections
   - Edit all fields (Purpose, Context, Themes, Summary, Cross-References, Prayer)
   - Add/remove study flow sections with passage references
   - Required field validation (Purpose, Context cannot be empty)
5. **Saved vs History separation**:
   - "Save Study" saves to Saved Studies (full content, for later editing)
   - History tracks generation metadata only (lightweight)
   - Saved studies have their own page (/saved) with JSON import/export
6. **Manual save flow**: Studies NOT auto-saved - explicit Save button required
7. **Unsaved changes protection**: Browser warning on navigation, Ctrl+S shortcut
8. **JSON import/export**: Strict Zod validation, per-study validation (valid imports, invalid skips), append mode
9. **Doctrinal guardrails**: Reformed theology embedded in prompt (Trinity, TULIP, etc.)
10. **Flow-based generation**: Users can define section purposes for custom question generation
11. **Fun generate button**: Animated gradient button with sparkles icon
12. **Hybrid client/server generation**: When user provides API keys, generates studies client-side; falls back to backend otherwise
13. **Client-side AI enhance**: Individual questions can be enhanced using OpenRouter directly from browser
14. **AI FloatingToolbar**: Select text in editable fields to rephrase/shorten via AI
15. **Save bar at bottom**: Save controls positioned after content for better UX
16. **Provider badge below columns**: Shows at column bottom for alignment

## Client-Side Architecture

**API Key Settings** (`ApiKeySettings.tsx`, `useApiKeys.ts`)
- Users can configure their own API keys in browser settings (gear icon in header)
- **Disclaimer at top**: Explains why to configure keys (personal rate limits vs shared server key)
- Keys stored in IndexedDB `userPreferences` table - never sent to backend
- **Modal uses `createPortal`**: Renders to document.body for proper z-index stacking, avoiding issues with parent stacking contexts
- Modal properly positioned with scroll and margin to prevent edge touching
- Required keys for client-side generation:
  - ESV API key (for passage text)
  - OpenRouter API key (for LLM calls - CORS-enabled, free tier available)
- Optional backend proxy keys: Groq, Gemini, Anthropic

**Client-Side Generation** (`llmClient.ts`, `useStudyGeneration.ts`)
- When both ESV and OpenRouter keys are configured:
  - Fetches passage directly from ESV API
  - Generates study via OpenRouter API (direct CORS call)
  - No backend required - works completely offline with API keys
- Falls back to backend when keys not configured
- Provider badge shows "openrouter (client)" for client-side generation

**AI Enhancement** (`enhanceClient.ts`, `EditableQuestionCard.tsx`, `FloatingToolbar.tsx`)
- Hover over any question to reveal sparkles button
- Sends question + passage context to OpenRouter for enhancement
- Updates question and answer in place
- Only available when OpenRouter API key is configured
- **FloatingToolbar**: Select text (10+ chars) in editable fields to access:
  - Rephrase: Rewrite for clarity and engagement
  - Shorten: Condense while preserving meaning
  - Available in Purpose, Context, Summary, Prayer Prompt fields

**Word Export** (`wordExport.ts`)
- Client-side Word document generation using `docx` library
- Formats study with sections: Purpose, Context, Themes, Study Sections, Summary, Application, Cross-References, Prayer
- Downloads .docx file directly to user's computer

**Blank Study** (`blankStudy.ts`)
- "New Blank Study" button creates empty study template
- Modal shows ESV API key status:
  - Green: User has ESV API key configured (fetches via client-side)
  - Blue: No key configured, will fetch via server's ESV API
- **Passage text always fetched**: Either via user's ESV API key (client-side) or via backend `/api/passage` endpoint (server-side fallback)
- User fills in reference, then manually adds all content
- Useful for creating studies without AI assistance

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
   - Save bar at bottom (after columns)
   - Save bar shows "Unsaved changes" (amber)
   - Save bar shows validation errors (red)
   - Discard button resets to original
   - Save Study button saves to Saved Studies (not History)
   - Ctrl+S keyboard shortcut works
   - Browser warns before leaving with unsaved changes

5. **Saved Studies Page** (/saved):
   - Navigate via "Saved" link in header
   - Shows list of saved studies with reference, provider, date
   - "View" button loads study into HomePage
   - "Delete" button removes study with confirmation
   - Export downloads JSON with savedStudies array
   - Import appends studies from JSON file
   - Clear All removes all with confirmation

7. **History Viewing**:
   - Click "View" on history item
   - Study loads correctly with all sections
   - Provider badge shows below columns
   - Console shows `[Dev] Loading study from history`

8. **Import/Export**:
   - History export creates valid JSON
   - Saved studies export creates valid JSON (v2.0 with all keys present)
   - Export blank/incomplete study → verify all keys present (even if empty)
   - Import validates each study individually (per-study validation)
   - Import with mix of valid/invalid → valid ones import, invalid skip
   - Import shows "X imported, Y skipped" with detailed error list
   - Foreign keys in JSON → study rejected with clear error
   - Import appends (doesn't replace)
   - Duplicate IDs → skipped (not imported again)

9. **UI**:
   - Generate button has gradient animation
   - Discernment disclaimer visible
   - Back button styled properly
   - History items have hover state
   - Card headers have proper padding (px-6 pt-6)
   - Provider badge at bottom of columns (aligned right)

10. **API Key Settings**:
   - Click gear icon in header → modal opens (via createPortal to document.body)
   - Modal appears above all content (proper z-index stacking)
   - Disclaimer visible at top ("Why Configure API Keys?")
   - Enter ESV API key and OpenRouter API key
   - Modal scrollable and doesn't touch screen edges
   - Click Save → keys persist
   - Refresh page → keys still there
   - Provider preference dropdown works

11. **Client-Side Generation** (requires API keys):
   - Configure ESV + OpenRouter keys
   - Stop backend server
   - Generate study → works with client-side calls
   - Provider badge shows "openrouter (client)"
   - Network tab shows calls to api.esv.org and openrouter.ai

12. **AI Enhance** (requires OpenRouter key):
   - Hover over question card → sparkles button appears
   - Click sparkles → loading spinner
   - Question/answer updated with improved content
   - Console shows `[Dev] Question enhanced successfully`

13. **AI FloatingToolbar** (requires OpenRouter key):
   - Edit a text field (Purpose, Context, Summary, or Prayer)
   - Select at least 10 characters of text
   - Floating toolbar appears with Rephrase/Shorten buttons
   - Click Rephrase → loading spinner → text replaced
   - Click Shorten → loading spinner → text condensed
   - Click X or click elsewhere to dismiss toolbar

14. **New Blank Study**:
   - Click "New Blank Study" button
   - Shows ESV API key status (green if configured, blue if using server)
   - Enter passage reference → Create Study
   - Passage text ALWAYS fetched (via user's key or server fallback)
   - Empty study form appears with passage text populated
   - Fill in Purpose and Context (required)
   - Add questions and content manually
   - Add/remove study flow sections
   - Save to Saved Studies

15. **Section Management**:
   - Expand a study flow section
   - Edit passage reference and section heading
   - Click "Add Section" → enter passage and heading → section added
   - Click trash icon on section → confirmation → section removed
   - Cannot remove last section (minimum 1 required)

16. **Word Export**:
   - Generate or load a study
   - Click "Export to Word" button in save bar
   - .docx file downloads
   - Open in Word → formatting correct

## Prompt Engineering

**services/prompts/study_prompt.py** contains:
- `STUDY_PROMPT` - Unified prompt with doctrinal guardrails and optional flow context
- `format_study_prompt(reference, passage_text, flow_context?)` - Single formatter function
- `format_study_prompt_with_flow()` - Alias for backward compatibility

Doctrinal guidelines enforce:
- Scripture interprets Scripture
- Focus on concrete text, not speculation
- Note debates on non-essentials
- Never contradict Reformed doctrines
