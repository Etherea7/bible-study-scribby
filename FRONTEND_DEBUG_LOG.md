# Frontend Redesign & Debugging Log

**Date:** January 14, 2026
**Status:** In Progress / Paused
**Objective:** Implement a "Warm Beige" light theme as default, using Tailwind CSS v4 variables.

## 1. Validated Changes
The following changes were implemented and code-reviewed:

### Design System via `index.css`
- **Theme Variables**: Defined warm beige palette (`#FDFBF7`) and dual-font system (`Lora` + `Inter`).
- **Configuration**: Updated to use Tailwind v4 `@theme` directive alongside standard `:root` variables for maximum compatibility.

### Component Architecture
- **Theme Logic**: Updated `useDarkMode.ts` to default to `false` (Light Mode), ignoring system preference on initial load.
- **Component Styling**: Refactored `HomePage.tsx`, `QuestionCard.tsx`, `PassageSelector.tsx`, and `Button.tsx` to use dynamic CSS variables (e.g., `text-[var(--color-text-primary)]`) instead of hardcoded utility classes.

### Typography
- **Fonts**: Added `Lora` (Serif) and `Inter` (Sans) to `index.html`.

## 2. The Issue
Despite the code changes, the browser didn't seem to reflect the new styles (specifically the background color), or the theme toggle appeared non-responsive.

**Symptoms:**
- Background remained white/gray instead of beige.
- Dark mode toggle might have been stuck due to conflicting `localStorage` state.

## 3. Debugging Attempts

### A. Tailwind v4 Configuration Check
- **Verified**: `package.json` contains `@tailwindcss/vite` and `tailwindcss` v4.1.18.
- **Verified**: `vite.config.ts` correctly imports and uses the `tailwindcss()` plugin.
- **Conclusion**: Build configuration is correct.

### B. CSS Loading Order
- **Action**: Ensured `@import "tailwindcss";` is strictly the first line in `index.css`.
- **Action**: Confirmed `main.tsx` imports `./index.css` before the App component.

### C. Variable Scope Refactoring
- **Hypothesis**: Variables defined *only* inside `@theme` might not be accessible via `var(--...)` in arbitrary class strings in some runtime contexts.
- **Fix**: Moved all color definitions to `:root` to ensure global runtime availability, then mapped them inside `@theme` for Tailwind utility usage.

## 4. Next Steps (To Resume)

1.  **Hard Cache Clear**: The most likely culprit is stubborn browser caching of the `index.css` file. Attempt testing in a completely new Incognito window or browser.
2.  **Build Check**: Run `npm run build` and `npm run preview` to see if the production build works (eliminates HMR issues).
3.  **Inspect Computed Styles**: Use DevTools to inspect the `<body>` element.
    - Check if `--color-bg-main` is defined in the "Computed" tab.
    - Check if the `bg-[...]` class is actually applying that variable.
4.  **Tailwind Cache**: Delete `node_modules/.vite` to force Vite to re-bundle dependencies.
