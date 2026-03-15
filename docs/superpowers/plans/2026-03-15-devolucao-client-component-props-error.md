# Devolucao Client Boundary Fix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the `/devolucao` runtime/build error caused by passing non-serializable function props from Server Components to Client Components.

**Architecture:** Keep `app/(dashboard)/devolucao/page.tsx` as a thin Server Component that only passes serializable data and a valid server action. Move open-loan selector loading to a client-side fetch path (route handler + client API helper) so the interactive search/pagination stays in the client boundary. Preserve existing feature boundaries from `docs/architecture.md` (`app/api` for handlers, `features/emprestimos` for feature logic).

**Tech Stack:** Next.js App Router (RSC + Client Components), TypeScript, Vitest + Testing Library, pnpm.

---

### Task 1: Lock In Failure and Baseline

**Files:**

- Modify: `app/src/app/(dashboard)/devolucao/page.tsx`
- Test: `app/src/features/emprestimos/components/devolucao-page.listing.test.tsx`

- [ ] **Step 1: Reproduce the boundary error from current implementation**

Run: `pnpm --filter app build`
Expected: fail on `/devolucao` with `Event handlers cannot be passed to Client Component props` and pointer to `onLoadOpenEmprestimos`.

- [ ] **Step 2: Capture current behavioral coverage for devolucao page/form flow**

Run: `pnpm --filter app test -- devolucao-page.listing.test.tsx devolucao-form.test.tsx`
Expected: existing tests pass before refactor starts.

### Task 2: Remove Invalid Function Prop Across RSC Boundary

**Files:**

- Modify: `app/src/app/(dashboard)/devolucao/page.tsx`
- Modify: `app/src/features/emprestimos/components/devolucao-page.tsx`

- [ ] **Step 1: Keep only serializable props + valid server action in route page**

In `app/src/app/(dashboard)/devolucao/page.tsx`, remove `onLoadOpenEmprestimos={listOpenEmprestimosForDevolucao}` from `<DevolucaoPage />` props.

- [ ] **Step 2: Update DevolucaoPage prop contract**

In `app/src/features/emprestimos/components/devolucao-page.tsx`, remove `onLoadOpenEmprestimos` from `DevolucaoPageProps` and from component usage.

- [ ] **Step 3: Keep modal submit flow unchanged**

Ensure `onSubmit` server action flow (submit, success banner, refresh, modal close/error handling) remains exactly as before.

### Task 3: Add Client-Safe Open Emprestimos Loader

**Files:**

- Create: `app/src/app/api/emprestimos/open/route.ts`
- Create: `app/src/features/emprestimos/client/devolucoes-open-selector-client.ts`
- Modify: `app/src/features/emprestimos/forms/devolucao-form.tsx`

- [ ] **Step 1: Create route handler for open emprestimos selector**

Implement `GET /api/emprestimos/open?page=<n>&search=<term>` in `app/src/app/api/emprestimos/open/route.ts` that delegates to `listOpenEmprestimosForDevolucao(page, search)` and returns JSON.

- [ ] **Step 2: Add client fetch helper with runtime validation**

In `app/src/features/emprestimos/client/devolucoes-open-selector-client.ts`, implement:

```ts
export async function fetchOpenEmprestimosForDevolucao(page: number, search?: string) {
  // fetch('/api/emprestimos/open?...')
  // parse json with zod schema equivalent to selector response
  // throw normalized error for non-2xx responses
}
```

- [ ] **Step 3: Rewire DevolucaoForm to use client fetch helper**

In `app/src/features/emprestimos/forms/devolucao-form.tsx`, remove `loadOptions` prop and call `fetchOpenEmprestimosForDevolucao` in both initial load/search effect and `loadMore` branch.

- [ ] **Step 4: Keep UX and pagination semantics stable**

Preserve existing behavior: loading state, empty state, error messages, incremental page append, submit disable rules.

### Task 4: Update Tests for New Boundary and Data Source

**Files:**

- Modify: `app/src/features/emprestimos/components/devolucao-page.listing.test.tsx`
- Modify: `app/src/features/emprestimos/forms/devolucao-form.test.tsx`

- [ ] **Step 1: Adapt page test API to new prop contract**

Remove `onLoadOpenEmprestimos` from `DevolucaoPage` test renders.

- [ ] **Step 2: Mock client fetch helper in form and page tests**

Mock `fetchOpenEmprestimosForDevolucao` module and assert call patterns for first page, search term, and `load more` pagination.

- [ ] **Step 3: Keep behavioral assertions focused**

Retain assertions for:

- disabled submit until selection
- selected ID submission payload
- stale-id modal error handling
- empty-state message
- loading additional selector pages

### Task 5: Verify End-to-End and Regressions

**Files:**

- Test: `app/src/features/emprestimos/components/devolucao-page.listing.test.tsx`
- Test: `app/src/features/emprestimos/forms/devolucao-form.test.tsx`

- [ ] **Step 1: Run targeted tests**

Run: `pnpm --filter app test -- devolucao-page.listing.test.tsx devolucao-form.test.tsx`
Expected: PASS.

- [ ] **Step 2: Run full app test suite (or nearest equivalent in repo)**

Run: `pnpm --filter app test`
Expected: PASS.

- [ ] **Step 3: Build verification for RSC boundary**

Run: `pnpm --filter app build`
Expected: `/devolucao` compiles without client-props function error.

- [ ] **Step 4: Manual smoke validation**

Run: `pnpm --filter app dev`, then verify `/devolucao`:

- modal opens
- selector loads open emprestimos
- search works
- load more works when available
- register devolucao succeeds and list refreshes

### Task 6: PRD/Checklist Hygiene (If This Work Is Tied to a PRD)

**Files:**

- Modify: `PRD file that owns this fix (if applicable)`

- [ ] **Step 1: Mark stage/checklist item complete immediately after implementation**

Update the corresponding PRD checklist item as soon as this fix is done, before starting the next stage, per repository execution rules.
