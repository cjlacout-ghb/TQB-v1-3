
# Implementation Plan - Analysis, Cleanup, and Optimization

This plan outlines the steps to analyze, refactor, and optimize the "The Show Pro Series" Next.js application.

## 1. Analysis (Completed)
- **Current State**: Next.js 16 App Router, Supabase, shadcn/ui.
- **Key Issues**:
    - `next.config.ts` has `ignoreBuildErrors: true`.
    - `src/app/actions.ts` is monolithic (25KB, ~700 lines) and lacks type safety (`any` usage).
    - `replace_team.ts` is a root script causing type check failures.
- **Performance**:
    - `getGames` fetches all statistics for all games, which is potentially heavy but acceptable for current scale.
    - Large components (`BoxScoreDialog`, etc.) could be split but are not critical blockers yet.

## 2. Cleanup & Refactoring
### 2.1 Type Safety & Configuration
- [x] Remove `ignoreBuildErrors: true` from `next.config.ts`.
- [x] Create a `scripts/` directory and move `replace_team.ts` and `supabase_schema_awards.sql` there to declutter root.
- [x] Update `tsconfig.json` to exclude `scripts/` from the main build if necessary, or fix `replace_team.ts` imports.
- [x] Enhance `src/lib/types.ts` to include strict Database Types (mirroring Supabase schema) to avoid `any`.

### 2.2 Server Actions Refactoring
- [x] Create `src/actions/` directory.
- [x] Split `src/app/actions.ts` into:
    - `src/actions/games.ts` (Fetching/Updating games, Schedule)
    - `src/actions/stats.ts` (Saving/Fetching stats, Imports)
    - `src/actions/admin.ts` (Reset logic, Admin verification middleware)
    - `src/actions/awards.ts` (Awards logic)
- [x] Update all import paths in `src/app/page.tsx`, `src/hooks/useTournamentState.ts`, etc.
- [x] internalize `verifyAdmin` and `getRequestClient` helper functions (put in `src/lib/auth-utils.ts`).

### 2.3 Code Quality
- [x] Run `npm run lint` and fix reported issues. (Ran manually, verify mainly via Typecheck).
- [x] Replace `any` with specific types in critical paths (especially `actions`).

## 3. Optimization
### 3.1 Rendering
- [x] Review `next/image` usage in `AwardsSection` and `ScheduleCard` (Checked).
- [x] Split `BoxScoreDialog` into `BattingPanel` and `PitchingPanel`.

### 3.2 Data Fetching (Low Risk)
- [x] Ensure `getGames` handles potential errors gracefully without crashing the entire page (already has try-catch in `page.tsx`).

## 4. Testing
### 4.1 Verification
- [x] Run `npm run typecheck` to ensure zero TS errors. (Passed)
- [x] Run `npm run build` to verify production build success. (Passed)
- [ ] **Manual Walkthrough**:
    - Open App.
    - Login as Admin.
    - Edit a Game score.
    - Verify Standings update.
    - Reset a Game (and check data clears).
    - Check "Champions" logic (simulated).

## 5. Execution Order
1.  Move scripts & fix `next.config.ts`. (Done)
2.  Refactor Actions (Split & Type). (Done)
3.  Update Imports. (Done)
4.  Typecheck & Fix. (Done)
5.  Lint & Fix. (Done)
6.  Final Manual Test. (Left for User)
