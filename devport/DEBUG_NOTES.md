# DevPort — Debug & Production-Readiness Log (`DEBUG_NOTES.md`)

## Ground Rules Tracker
- **Git working tree status**: Clean.
- **Phase progression**: Phase 0 (Complete) -> Phase 1 (Complete) -> Phase 2 (Complete) -> Phase 3 (Awaiting Approval) -> Phase 4 -> Phase 5 -> Phase 6.

---

## Phase 0 — Environment & Baseline (Read-Only)

### 1. Stack & Environment Identification
- **Next.js Version**: `16.2.9` (Turbopack)
- **Router Type**: Pure App Router (`src/app/`)
- **React Version**: `19.2.4` (`react` & `react-dom`)
- **Package Manager**: `npm` (v11.6.2)
- **Node Version**: `v24.13.0` | No `.nvmrc` or `engines` constraint
- **TypeScript**: `^5` (tsc 5.x)
- **Database / ORM**: Prisma Client `7.10.0`, Prisma CLI `7.8.0`, PostgreSQL adapter
- **Auth**: Auth.js / NextAuth `5.0.0-beta.32`

---

## Phase 1 — Systematic Error Sweep & Ranked Findings

### A. Confirmed Bugs (Reproduced / Failing Checks)
1. **React 19 Try/Catch JSX Violation**: `src/app/dashboard/projects/[slug]/page.tsx:20` (`react-hooks/error-boundaries`).
2. **Cascading Render Effect on Mount**: `src/components/github/repository-picker.tsx:59` (`react-hooks/set-state-in-effect`).
3. **Strict ESLint & Type Rule Failures**: `openapi.parser.ts` (`no-explicit-any`), `crypto.test.ts` (`no-require-imports`), `dto.test.ts` (`no-explicit-any`).

### B. Strong Suspects
1. **Unchecked Non-Null Assertions on Session (`session!.user.id`) across Dashboard Routes**: `dashboard/page.tsx`, `dashboard/projects/page.tsx`, `dashboard/import/page.tsx`.
2. **Locale-Sensitive Date Formatting in Server Component SSR**: `src/app/dashboard/page.tsx:293`.
3. **Module-Load-Time Evaluation of `process.env.ENCRYPTION_KEY`**: `src/shared/crypto/index.ts:74`.

### C. Cosmetic / Deprecations / Lint-Level
1. **Next.js 16 Middleware Deprecation**: `src/middleware.ts` (`middleware` -> `proxy`).
2. **Vitest Native Config Warning**: `vitest.config.ts`.
3. **26 Unused Variable & Import Warnings**.
4. **Missing Granular Boundaries**: `loading.tsx` and `error.tsx` for dynamic project routes.

---

## Phase 2 — Fix Confirmed Bugs (Execution & Verification)

### Fix 2.1: React 19 Try/Catch JSX Violation & Auth Guard
- **File**: `src/app/dashboard/projects/[slug]/page.tsx`
- **Root Cause**: Returning `<ProjectEditor project={project} />` directly within a `try/catch` block violates React 19 render boundary guidelines. Additionally, `session` was accessed with unsafe `session!.user.id`.
- **Resolution**: Added safe session validation with redirect; fetched `project` data in `try/catch` and returned JSX cleanly outside of `try/catch`.
- **Verification**: `npx tsc --noEmit` passed.
- **Commit**: `185d28f fix(projects): extract JSX construction outside try-catch for React 19 compliance`

### Fix 2.2: Prevent Cascading Render Effect in Repository Picker
- **File**: `src/components/github/repository-picker.tsx`
- **Root Cause**: `useEffect` invoked `fetchRepositories()`, which called `setLoading(true)` synchronously inside the effect on mount.
- **Resolution**: Restructured effect to fetch data with cleanup flag without redundant synchronous `setLoading(true)` on mount; separated manual retry/refresh handler `loadRepositories()`; removed unused `Terminal` icon import.
- **Verification**: `npm run lint` and `npx tsc --noEmit` passed.
- **Commit**: `a84df5e fix(github): prevent cascading setState inside repository picker effect and remove unused Terminal import`

### Fix 2.3: Eliminate `any` and `require()` in OpenAPI Parser & Tests
- **Files**: `src/modules/documentation/openapi.parser.ts`, `tests/unit/crypto.test.ts`, `tests/unit/dto.test.ts`
- **Root Cause**: Unsafe `any` typings in parser operations; CommonJS `require("crypto")` inside test block; `any` assertions in DTO test.
- **Resolution**: Refactored OpenAPI parser to use `Record<string, unknown>` and safe type narrowing; converted crypto test to top-level ES `import crypto from "crypto"`; replaced `any` with `Record<string, unknown>` and removed unused imports in DTO tests.
- **Verification**: `npm test` (18/18 tests passed), `npm run lint` (0 errors, down from 11 errors), `npm run build` (21 routes compiled cleanly).
- **Commit**: `8d18812 fix(types): eliminate any types and require imports in openapi parser and unit tests`

---

## Current Status
All confirmed bugs resolved. Full test suite, linter (0 errors), typechecker, and production build pass cleanly.
