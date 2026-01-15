# Frontend Design & Implementation Plan

## Goal
Redesign the "Daily Bible Study" application frontend to achieve a premium, scholarly aesthetic and implement new functional requirements for study management, editing, persistent history, and a modular dashboard layout.

## User Review Required
> [!NOTE]
> **Layout Finalized**: 3-Column Modular Dashboard.
> - **Default Order**: Scripture (Left) | Study Flow (Center) | Study Guide (Right).
> - **Capability**: User can drag-and-drop or rearrange these columns to their preference.

## Proposed Changes

### 1. Visual Design & Theme (`index.css`)
Refine the "Warm Beige" theme to match the clean, high-end look with "fun" interactive elements.

- **Typography**: `Lora` (Headers), `Inter` (Body).
- **Color Palette**: Cream (`#FDFBF7`) background, Gold/Bronze (`#B8860B`) accents, Dark Grey (`#2D3339`) text.
- **Premium Feel**: Soft shadows, rounded corners, subtle gradients on active elements.

### 2. Component Restructuring

#### Layout Components
- **`Layout.tsx`**: Global theme wrapper.
- **`Header.tsx`**: Simplified, elegant centered title.

#### Dashboard Page (`HomePage.tsx`)
Refactor into a modular dashboard.

- **Controls Bar** (Top):
  - **`PassageSelector.tsx`**: Horizontal, minimalist inputs (Book, Chapter, Verses).
  - **Generate Button**: 
    - **Style**: Vibrant gradient (Amber/Gold), rounded-pill shape, icon-enhanced (Sparkles).
    - **Behavior**: Distinct "CTA" placement, distinct from the inputs.

- **Main Content Area** (Modular 3-Column Grid):
  - **Technology**: Use `@dnd-kit/core` or similar for accessible drag-and-drop reordering.
  - **Default Layout**:
    1. **Column 1: Scripture Text** (`PassageDisplay.tsx`)
       - The core source material. Elegant serif typography.
    2. **Column 2: Study Flow / Context** (New)
       - **Purpose**: Input context/direction for the AI.
       - **Features**: Editable list of direction items. passed to AI as context.
    3. **Column 3: Study Guide** (`StudyGuide.tsx`)
       - **Content**: AI-generated questions (Observation, Interpretation, Application).
       - **Interactive**: fully editable text areas.

### 3. Functional Implementation Details

#### [NEW] Modular Layout State
- Persist user's preferred column order in `localStorage` or `Dexie`.
- Default: `['scripture', 'flow', 'guide']`.

#### [NEW] Editable Study Content
- **Inline Editing**: Users can click any question/answer to edit.
- **Persistence**: Auto-save changes to the local database (`dexie`).

#### [NEW] JSON Import/Export
- **Export**: Valid JSON download.
- **Import**: 
  - **Action**: "Append to History".
  - **Validation**: Schema check ensuring valid `Study` structure.
  - **UI**: Simple "Import Study" button in History or Header.

### 4. Technical Stack Additions
- **Drag & Drop**: `dnd-kit` (recommended) or `react-beautiful-dnd` for column reordering.
- **Validation**: `zod` for JSON schema validation.

## Verification Plan

### Manual Verification
1. **Layout & Modularity**:
   - Verify default order: Scripture -> Flow -> Guide.
   - **Action**: Drag "Scripture" to the right. Refresh page.
   - **Check**: Order persists.
2. **Visuals**:
   - Check the "Fun" Generate button hover effects.
   - Verify "Premium" typography and spacing.
3. **Data Integrity**:
   - Import a study JSON.
   - Verify it is added to the history list without deleting existing items.
