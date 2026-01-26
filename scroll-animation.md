# Scroll Animation & Landing Page Revamp Documentation

## Context & Goal
The initial target for this feature was to transform the landing page from a standard web layout into a thematic, immersive experience that resembles an **ancient scroll unrolling**.

**Specific Desires:**
-   **Thematic Immersion**: The page should behave like a physical scroll opening up.
-   **Visual Fidelity**: Fix the "grainy" logo background and the "invisible title" text gradient bug.
-   **Textures**: Implement "aged parchment" textures for light mode and a "dark vellum" aesthetic for dark mode, complete with stains and ruled lines.

## Implementation Details

### 1. New Component: `ScrollContainer`
**File**: `frontend/src/components/layout/ScrollContainer.tsx`

This is the core wrapper component that implements the "Unrolling" effect.
-   **Structure**: Consists of a Top Handle (cylinder), Middle Content (expandable div), and Bottom Handle (cylinder).
-   **Animation**: Uses `framer-motion` to animate the handles moving apart (`y` axis) and the middle content expanding (`height: 0` to `auto`) and fading in.
-   **Styling**:
    -   **Handles**: Styled with CSS gradients to resemble polished wood (`#8B4513` palette).
    -   **Texture**: Uses distinct CSS backgrounds for Light (Parchment) and Dark (Vellum) modes.
    -   **Details**: Added "ruled lines" using repeating linear gradients and "stains" using radial gradients to mimic age.

### 2. Landing Page Integration
**File**: `frontend/src/pages/LandingPage.tsx`

-   Wrapped the main content in `<ScrollContainer>`.
-   **Fix**: Re-added `heroContainer` to imports to resolve a `ReferenceError`.
-   **Sequencing**: The Hero animations (`heroContainer`) run naturally within the scroll context.

### 3. Visual Bug Fixes & Assets
**File**: `frontend/public/scribby-logo.png`
-   **Change**: Replaced the original logo (which had a baked-in checkerboard pattern) with a clean, transparent PNG version.

**File**: `frontend/src/index.css`
-   **Change**: Added `@keyframes text-shimmer` and `.animate-text-shimmer` class.
-   **Reason**: The previous `animate-shimmer` class (intended for loading skeletons) conflicting with the gold text gradient, making the title invisible. The new class animates `background-position` exclusively, preserving the gold gradient.

### 4. Color Palette Updates (Design System)
**File**: `frontend/src/index.css`
-   **Dark Mode**: Shifted the dark mode background from generic gray to a deep "Midnight Slate" (`#0F172A`) to better complement the "Dark Vellum" scroll aesthetic.
-   **Accents**: Made the gold/amber accent (`#D97706`) more vibrant to pop against both parchment and vellum backgrounds.
