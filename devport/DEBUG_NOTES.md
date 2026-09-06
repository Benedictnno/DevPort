# DevPort — Debug & Production-Readiness Log (`DEBUG_NOTES.md`)

## Ground Rules Tracker
- **Git working tree status**: 3 modified files in working tree (`src/app/api/v1/integrations/github/repositories/route.ts`, `src/modules/integrations/github/github.service.ts`, `src/modules/projects/project.repository.ts`).
- **Phase progression**: Phase 0 (Complete) -> Phase 1 (Complete) -> Phase 2 (Awaiting Approval) -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6.

---

## Phase 0 — Environment & Baseline (Read-Only)

### 1. Stack & Environment Identification
- **Next.js Version**: `16.2.9` (Turbopack)
- **Router Type**: App Router exclusively (`src/app/` structure, no `pages/` directory)
- **React Version**: `19.2.4` (`react` & `react-dom`)
- **Package Manager**: `npm` (v11.6.2)
- **Node Version**: `v24.13.0` | No `.nvmrc` or `engines` constraint
- **TypeScript**: `^5` (tsc 5.x)
- **Database / ORM**: Prisma Client `7.10.0`, Prisma CLI `7.8.0`, PostgreSQL adapter
- **Auth**: Auth.js / NextAuth `5.0.0-beta.32`

---

## Phase 1 — Systematic Error Sweep & Ranked Findings

### A. Confirmed Bugs (Reproduced / Failing Checks)

1. **React 19 Hook / Error Boundary Violation in Project Route**
   - **Location**: `src/app/dashboard/projects/[slug]/page.tsx:20:12`
   - **Evidence**: `react-hooks/error-boundaries` ESLint error: `Avoid constructing JSX within try/catch`. React 19 does not catch rendering errors with try/catch.
   - **Impact**: Blocks `npm run lint` and violates React 19 Server Component patterns.

2. **Cascading Render Effect in Repository Picker**
   - **Location**: `src/components/github/repository-picker.tsx:59:5`
   - **Evidence**: `react-hooks/set-state-in-effect` ESLint error: `Calling setState synchronously within an effect can trigger cascading renders`. `fetchRepositories` triggers `setLoading(true)` synchronously on mount.
   - **Impact**: Blocks `npm run lint`, causes double-render cycles on mount.

3. **Strict TypeScript & ESLint Rule Failures in OpenAPI Parser & Tests**
   - **Location**: `src/modules/documentation/openapi.parser.ts` (lines 41, 93, 98, 111), `tests/unit/crypto.test.ts` (line 25), `tests/unit/dto.test.ts` (lines 103-106)
   - **Evidence**: 4 `@typescript-eslint/no-explicit-any` errors in parser; 1 `@typescript-eslint/no-require-imports` in crypto test; 4 `@typescript-eslint/no-explicit-any` in DTO test. Total 11 ESLint errors blocking CI/lint.
   - **Impact**: Lint build step fails (Exit Code 1).

---

### B. Strong Suspects (Pattern Strongly Associated with Bugs / Flakiness)

1. **Unchecked Non-Null Assertions on Session (`session!.user.id`) across Dashboard Pages**
   - **Location**:
     - `src/app/dashboard/page.tsx:23` (`session!.user.id`)
     - `src/app/dashboard/projects/page.tsx:13` (`session!.user.id`)
     - `src/app/dashboard/projects/[slug]/page.tsx:19` (`session!.user.id`)
     - `src/app/dashboard/import/page.tsx:14` (`session!.user.id`)
   - **Pattern**: Although `DashboardLayout` performs a redirect check, Server Components execute concurrently and independently. If a page is directly loaded or rendered without an active session, dereferencing `session!.user.id` crashes with a 500 TypeError (`Cannot read properties of null (reading 'user')`) before layout redirect completes.
   - **Recommendation**: Validate `session?.user?.id` explicitly or use a centralized auth helper with `redirect("/sign-in")`.

2. **Locale-Sensitive Date Formatting in Server Component SSR**
   - **Location**: `src/app/dashboard/page.tsx:293`
   - **Pattern**: `updated {new Date(project.updatedAt).toLocaleDateString()}` inside a Server Component without fixed locale/formatting options.
   - **Risk**: Potential hydration mismatch between server-rendered HTML (UTC / Node server locale) and client browser locale.

3. **Top-level Evaluation of `process.env.ENCRYPTION_KEY` in Crypto Module**
   - **Location**: `src/shared/crypto/index.ts:74`
   - **Pattern**: `const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";` is cached at module import time. If environment variables are initialized or mocked after module resolution (e.g. in test runners or workers), encryption/decryption calls will fail with missing key error.
   - **Recommendation**: Resolve key lazily inside `encryptToken` and `decryptToken`.

---

### C. Cosmetic / Deprecation / Lint-Level

1. **Next.js 16 Middleware Deprecation Warning**
   - **Location**: `src/middleware.ts`
   - **Evidence**: `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy`
   - **Note**: Next.js 16 recommends updating middleware convention.

2. **Vitest Native Config ESM Warning**
   - **Location**: `vitest.config.ts`
   - **Evidence**: `(!) Your Vite config uses features that are unsupported by configLoader: 'native'`.
   - **Fix**: Rename to `vitest.config.mjs` or configure accordingly.

3. **29 Unused Variable & Import Warnings**
   - **Location**: 15 files across `src/app`, `src/components`, `src/modules`, `src/jobs`, and `tests`.
   - **Note**: Clean up unused imports and parameters to keep code clean and readable.

4. **Missing Granular `loading.tsx` and `error.tsx` Boundaries**
   - **Location**: `src/app/dashboard/projects/[slug]`, `src/app/projects/[slug]`, `src/app/dashboard/import`
   - **Note**: Will be addressed during production structure audit (Phase 4).
