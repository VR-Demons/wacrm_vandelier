# Implementation Plan: Light/Dark Theme Support

## 1. Overview
The goal is to introduce a light/dark theme toggle to the application while preserving the existing dark aesthetic (defined in `art_guide.md`) as the primary or system-dependent dark theme. This feature will involve setting up a theme provider, establishing a complementary light color palette, refactoring hardcoded Tailwind classes, and adapting the interactive particle background.

## 2. Dependencies
- Install `next-themes` to manage theme state (`system`, `light`, `dark`) robustly in Next.js 15.
  ```bash
  pnpm add next-themes
  ```
- `lucide-react` or similar for Sun/Moon toggle icons, assuming not already present in the UI library.

## 3. Architecture & Approach

### 3.1. Theme Strategy
We will use the **Tailwind class strategy** (`darkMode: 'class'`). We can either use Tailwind's `dark:` modifier directly in class names or move hardcoded colors to CSS variables in `globals.css` (the preferred approach for Next.js applications using a design system).

### 3.2. Color Palette Mapping
Based on `art_guide.md`, we will define light mode equivalents:
- **Background**:
  - Dark: `#020617` (Slate 950)
  - Light: `#f8fafc` (Slate 50)
- **Surface**:
  - Dark: `#0f172a` (Slate 900)
  - Light: `#ffffff` (White)
- **Text**:
  - Dark: `#f8fafc` (Slate 50)
  - Light: `#0f172a` (Slate 900)
- **Borders**:
  - Dark: `slate-800`
  - Light: `slate-200`
- **Primary / Danger / Success**:
  - The Red, Amber, Emerald, and Purple colors remain generally the same as they have adequate contrast, but hover states or opacities may need slight adjustments.

## 4. Implementation Steps

### Step 1: Configuration Updates
- Update `tailwind.config.ts`:
  ```typescript
  export default {
    darkMode: "class",
    // ...
  }
  ```
- If opting for CSS variables, update `app/globals.css` with `:root` and `.dark` blocks defining `--background`, `--foreground`, `--surface`, `--border`, etc.

### Step 2: Theme Provider Setup
- Create a client component `components/ThemeProvider.tsx`:
  ```tsx
  "use client"
  import { ThemeProvider as NextThemesProvider } from "next-themes"
  // ... wrap children
  ```
- Update `app/layout.tsx`:
  - Add `suppressHydrationWarning` to the `<html>` tag to prevent Next.js hydration mismatch errors caused by `next-themes` injecting the `class` attribute.
  - Wrap the children in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`.

### Step 3: Refactor UI Components
Audit and replace hardcoded color classes across the codebase to support light mode using the `dark:` variant:
- **Backgrounds**: Change `bg-slate-950` to `bg-slate-50 dark:bg-slate-950`.
- **Surfaces/Glassmorphism**: Change `bg-slate-900/40` to `bg-white/40 dark:bg-slate-900/40`.
- **Text**: Change `text-slate-50` to `text-slate-900 dark:text-slate-50`.
- **Borders**: Change `border-slate-800` to `border-slate-200 dark:border-slate-800`.
- **Glows & Shadows**: Adjust `drop-shadow-[...]` and `shadow-[...]` to have softer opacities in light mode or use `dark:drop-shadow-[...]`.

### Step 4: Theme Toggle Component
- Build `ThemeToggle.tsx` (a button that toggles between light and dark).
- Add this component to the main navigation bar, sidebar, or header.
- Ensure the button has accessibility attributes (`aria-label="Toggle theme"`).

### Step 5: Adapt Interactive Background (Landing Page)
The `LandingPage.tsx` uses `@tsparticles/react` which requires imperative configuration updates when the theme changes.
- **Hook into theme**: Use `useTheme()` from `next-themes`.
- **Update Particle Config**:
  - Background color: switch between `#020617` (dark) and `#f8fafc` (light).
  - Particle node and link colors: switch between `#ffffff` (dark mode nodes) and `#0f172a` (light mode nodes).
- **Force Re-render**: You may need to use a React `key` tied to the current theme on the `Particles` component so it correctly re-initializes its canvas context when the theme changes.

### Step 6: Documentation
- Update `docs/vrdemons/art_guide.md` to document the new Light Theme palette, referencing the mapping defined in section 3.2.

## 5. Testing & Verification
1. **Hydration**: Check console for React hydration errors.
2. **Toggle Behavior**: Ensure toggling works and state persists across page reloads (via `localStorage` managed by `next-themes`).
3. **Contrast**: Validate readability in light mode, especially the primary red accents against white backgrounds.
4. **Particles**: Verify the landing page background updates correctly on theme change without memory leaks.
5. **E2E Tests**: Run `pnpm test:e2e` to ensure UI refactoring didn't break playwright locators or assertions.
