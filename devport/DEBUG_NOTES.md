# DevPort — Debug & Production-Readiness Log (`DEBUG_NOTES.md`)

## Ground Rules Tracker
- **Git working tree status**: Clean.
- **Phase progression**: Phase 0 (Complete) -> Phase 1 (Complete) -> Phase 2 (Complete) -> Phase 3 (Complete) -> Phase 4 (Awaiting Approval) -> Phase 5 -> Phase 6.

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
1. **Unchecked Non-Null Assertions on Session (`session!.user.id`) across Dashboard Routes**: `dashboard/page.tsx`, `dashboard/projects/page.tsx`, `dashboard/import/page.tsx`, `dashboard/api-keys/page.tsx`, `dashboard/settings/page.tsx`.
2. **Locale-Sensitive Date Formatting in Server Component SSR**: `src/app/dashboard/page.tsx:293`.
3. **Module-Load-Time Evaluation of `process.env.ENCRYPTION_KEY`**: `src/shared/crypto/index.ts:74`.

### C. Cosmetic / Deprecations / Lint-Level
1. **Next.js 16 Middleware Deprecation**: `src/middleware.ts` (`middleware` -> `proxy`).
2. **Vitest Native Config Warning**: `vitest.config.ts`.
3. **Unused Variable & Import Warnings**.
4. **Missing Granular Boundaries**: `loading.tsx` and `error.tsx` for dynamic project routes.

---

## Phase 2 — Fix Confirmed Bugs (Execution & Verification)

### Fix 2.1: React 19 Try/Catch JSX Violation & Auth Guard
- **File**: `src/app/dashboard/projects/[slug]/page.tsx`
- **Root Cause**: Returning `<ProjectEditor project={project} />` directly within a `try/catch` block violates React 19 render boundary guidelines.
- **Resolution**: Added safe session validation with redirect; fetched `project` data in `try/catch` and returned JSX cleanly outside of `try/catch`.
- **Commit**: `185d28f fix(projects): extract JSX construction outside try-catch for React 19 compliance`

### Fix 2.2: Prevent Cascading Render Effect in Repository Picker
- **File**: `src/components/github/repository-picker.tsx`
- **Root Cause**: `useEffect` called `fetchRepositories()`, setting state synchronously on mount.
- **Resolution**: Restructured effect with cleanup flag without redundant synchronous `setLoading(true)` on mount; separated manual retry/refresh handler `loadRepositories()`; removed unused `Terminal` icon import.
- **Commit**: `a84df5e fix(github): prevent cascading setState inside repository picker effect and remove unused Terminal import`

### Fix 2.3: Eliminate `any` and `require()` in OpenAPI Parser & Tests
- **Files**: `src/modules/documentation/openapi.parser.ts`, `tests/unit/crypto.test.ts`, `tests/unit/dto.test.ts`
- **Root Cause**: Unsafe `any` typings; CommonJS `require("crypto")` in test; `any` assertions in DTO test.
- **Resolution**: Refactored OpenAPI parser to use `Record<string, unknown>` and safe type narrowing; converted crypto test to top-level ES `import crypto from "crypto"`; replaced `any` with `Record<string, unknown>` in DTO tests.
- **Commit**: `8d18812 fix(types): eliminate any types and require imports in openapi parser and unit tests`

---

## Phase 3 — Investigate Remaining Suspects (Resolved & Verified)

### Suspect 3.1: Unchecked Non-Null Assertions on Session (`session!.user.id`) across Dashboard Pages
- **Files**: `src/app/dashboard/page.tsx`, `src/app/dashboard/projects/page.tsx`, `src/app/dashboard/import/page.tsx`, `src/app/dashboard/api-keys/page.tsx`, `src/app/dashboard/settings/page.tsx`
- **Investigation**: Next.js Server Components evaluate independently from layouts. Unauthenticated or expired session access directly to these routes could trigger an unhandled 500 `TypeError: Cannot read properties of null (reading 'user')` before the layout redirect took effect.
- **Resolution**: Added explicit `if (!session?.user?.id) redirect("/sign-in");` at the top of every dashboard page. Cleaned up unused icons and variables in the process.
- **Commit**: `5a9b5f9 fix(auth): enforce safe session redirect and deterministic date SSR across all dashboard pages`

### Suspect 3.2: Locale-Sensitive Date Formatting in Server Component SSR
- **File**: `src/app/dashboard/page.tsx`
- **Investigation**: Calling `.toLocaleDateString()` without fixed locale on the server uses Node's default environment locale/timezone, risking client hydration mismatch errors.
- **Resolution**: Standardized on deterministic ISO date formatting (`new Date(project.updatedAt).toISOString().split("T")[0]`).
- **Commit**: `5a9b5f9 fix(auth): enforce safe session redirect and deterministic date SSR across all dashboard pages`

### Suspect 3.3: Module-Load-Time Evaluation of `process.env.ENCRYPTION_KEY`
- **File**: `src/shared/crypto/index.ts`
- **Investigation**: `const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";` at module root caused permanent empty key if environment variables were initialized dynamically after module loading.
- **Resolution**: Created `getEncryptionKey()` helper to evaluate `process.env.ENCRYPTION_KEY` lazily at invocation time with explicit error throwing if unset.
- **Commit**: `8abf447 fix(crypto): evaluate ENCRYPTION_KEY lazily at invocation time`

---

## Baseline Stability Checkpoint
- **TypeScript (`npx tsc --noEmit`)**: Clean (0 errors)
- **Unit Tests (`npm test`)**: 18/18 passed
- **ESLint (`npm run lint`)**: Clean (0 errors)
- **Production Build (`npm run build`)**: 21 routes compiled & static pages generated cleanly
- **Git Working Tree**: Clean on `main`
