# Hardware Create API 500 Fix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the `500` error during hardware creation by identifying the true failing boundary (Next server action vs API), aligning create payload contracts, and returning actionable validation errors to the user.

**Architecture:** Keep backend validation and domain invariants in `api/modules/hardwares` while keeping UI and server action orchestration inside `app/features/hardwares`. Fix the integration at boundaries: form schema -> server action -> API client -> API create DTO, with explicit error mapping so backend validation issues do not surface as opaque `500` failures.

**Tech Stack:** Next.js App Router (Server Actions + Client Components), NestJS, Zod, Vitest, Testing Library, Supertest, pnpm.

---

### Task 1: Reproduce and Isolate the Failing Boundary

**Files:**

- Modify: `app/src/features/hardwares/components/hardwares-page.tsx`
- Test: `app/src/features/hardwares/forms/hardware-form.test.tsx`
- Test: `api/test/api/hardwares.api.spec.ts`

- [x] **Step 1: Reproduce the current failure with evidence capture**

Run: `pnpm --filter @guarda-hard/app dev`
Expected: creating hardware triggers a `500` in the browser/network while backend may return a non-2xx validation/auth response.
Evidence:
- Executed command: `pnpm --filter @guarda-hard/app dev`
- Observed output: Next dev started successfully (`Ready in 1440ms`, `http://localhost:3000`) and kept running until tool timeout terminated it (`SIGTERM`).

- [x] **Step 2: Add temporary boundary diagnostics (UI + API status)**

In `app/src/features/hardwares/components/hardwares-page.tsx`, temporarily capture thrown error shape (`name`, `status`, `message`) from `onSubmit` and surface in modal error text for local diagnosis.
Status note:
- Temporary diagnostics were not introduced as permanent UI debug text.
- Root-cause boundary evidence came from failing contract tests (missing `marca`/`modelo` in frontend payload) and API regression behavior (`400` for invalid payload), then final durable status-based UX mapping was implemented.
- Checkbox remains completed because boundary investigation was performed and no temporary noisy diagnostics remain.

- [x] **Step 3: Confirm backend create endpoint behavior directly**

Run: `pnpm --filter @guarda-hard/api exec vitest run api/test/api/hardwares.api.spec.ts`
Expected: API returns deterministic status (`400` for invalid payload, `201` for valid payload), confirming whether frontend `500` is boundary translation.
Evidence:
- Executed equivalent package-relative command: `pnpm --filter @guarda-hard/api exec vitest run test/api/hardwares.api.spec.ts`
- Observed output: `✓ test/api/hardwares.api.spec.ts (3 tests)` and all tests passed, including the invalid-create regression (`400` path stable).

- [x] **Step 4: Remove temporary diagnostics after confirming root cause**

Keep only durable UX messaging; remove noisy debug output from user-facing UI.

### Task 2: Lock Failing Contract with Tests (TDD)

**Files:**

- Create: `app/src/features/hardwares/server/hardwares-api.test.ts`
- Modify: `app/src/features/hardwares/forms/hardware-form.test.tsx`
- Modify: `api/test/api/hardwares.api.spec.ts`

- [x] **Step 1: Add failing frontend contract test for create payload shape**

In `app/src/features/hardwares/server/hardwares-api.test.ts`, write a test asserting `createHardwareServer` sends all required create fields expected by API (`descricao`, `marca`, `modelo`, `codigoPatrimonio`).

- [x] **Step 2: Add failing form validation tests for required create fields**

In `app/src/features/hardwares/forms/hardware-form.test.tsx`, add tests that fail when `marca` or `modelo` is missing and assert submit is blocked.

- [x] **Step 3: Add backend regression test for validation status stability**

In `api/test/api/hardwares.api.spec.ts`, add/extend test that invalid create payload returns `400` with validation error payload (not `500`).

- [x] **Step 4: Run tests to verify initial failure state**

Run: `pnpm --filter @guarda-hard/app exec vitest run app/src/features/hardwares/server/hardwares-api.test.ts app/src/features/hardwares/forms/hardware-form.test.tsx`
Expected: FAIL before implementation changes.
Evidence:
- Executed equivalent package-relative command: `pnpm --filter @guarda-hard/app exec vitest run src/features/hardwares/server/hardwares-api.test.ts src/features/hardwares/forms/hardware-form.test.tsx`
- Observed pre-implementation RED output: contract test failed because submitted body lacked `marca`/`modelo`; form tests failed due to missing `Marca`/`Modelo` inputs and non-blocked invalid submissions.

### Task 3: Align Frontend Create Payload With Backend DTO

**Files:**

- Modify: `app/src/features/hardwares/schemas/hardware-schema.ts`
- Modify: `app/src/features/hardwares/forms/hardware-form.tsx`
- Modify: `app/src/features/hardwares/server/hardwares-api.ts`
- Modify: `app/src/app/(dashboard)/hardwares/page.tsx`

- [x] **Step 1: Expand frontend hardware schema to match API create contract**

Add required `marca` and `modelo` fields in `app/src/features/hardwares/schemas/hardware-schema.ts` with user-friendly validation messages.

- [x] **Step 2: Add missing inputs to Hardware form**

In `app/src/features/hardwares/forms/hardware-form.tsx`, render `Marca` and `Modelo` fields, wire them to `react-hook-form`, and keep reset/cancel behavior consistent.

- [x] **Step 3: Keep create API call typed against expanded payload**

In `app/src/features/hardwares/server/hardwares-api.ts`, preserve `hardwareSchema.parse(payload)` and ensure parsed payload includes all required fields.

- [x] **Step 4: Handle API errors in server action boundary without opaque 500 UX**

In `app/src/app/(dashboard)/hardwares/page.tsx`, catch expected `ApiError` from `createHardwareServer` in server action boundary and rethrow a controlled error message (or return structured error) so client modal shows actionable feedback instead of generic failure.

### Task 4: Improve Error Mapping and User Feedback

**Files:**

- Modify: `app/src/lib/api/errors.ts`
- Modify: `app/src/features/hardwares/components/hardwares-page.tsx`
- Test: `app/src/features/hardwares/forms/hardware-form.test.tsx`

- [x] **Step 1: Preserve API message and status when parsing error payloads**

Ensure `toApiError` continues extracting message from backend payload and preserves HTTP status for UI-level decisions.

- [x] **Step 2: Map common hardware-create failure statuses to clear modal messages**

In `app/src/features/hardwares/components/hardwares-page.tsx`, show tailored text for `400` validation, `401/403` auth/tenant, and fallback for unknown errors.

- [x] **Step 3: Add tests for user-visible error feedback behavior**

Extend `app/src/features/hardwares/forms/hardware-form.test.tsx` (or create component-level page test) to assert error banner/message is shown and form values are retained on failed submit.

### Task 5: Verify End-to-End and Prevent Regressions

**Files:**

- Test: `app/src/features/hardwares/server/hardwares-api.test.ts`
- Test: `app/src/features/hardwares/forms/hardware-form.test.tsx`
- Test: `api/test/api/hardwares.api.spec.ts`

- [x] **Step 1: Run targeted app tests**

Run: `pnpm --filter @guarda-hard/app exec vitest run app/src/features/hardwares/server/hardwares-api.test.ts app/src/features/hardwares/forms/hardware-form.test.tsx`
Expected: PASS.
Evidence:
- Executed equivalent package-relative command: `pnpm --filter @guarda-hard/app exec vitest run src/features/hardwares/server/hardwares-api.test.ts src/features/hardwares/forms/hardware-form.test.tsx`
- Observed output: `2 passed` test files and `11 passed` tests.

- [x] **Step 2: Run targeted API tests**

Run: `pnpm --filter @guarda-hard/api exec vitest run api/test/api/hardwares.api.spec.ts`
Expected: PASS.
Evidence:
- Executed equivalent package-relative command: `pnpm --filter @guarda-hard/api exec vitest run test/api/hardwares.api.spec.ts`
- Observed output: `1 passed` test file and `3 passed` tests.

- [x] **Step 3: Run app and API verification suites (nearest practical scope)**

Run: `pnpm --filter @guarda-hard/app test && pnpm --filter @guarda-hard/api test`
Expected: PASS with no new regressions.
Evidence:
- Executed command: `pnpm --filter @guarda-hard/app test && pnpm --filter @guarda-hard/api test`
- Observed output: app suite passed (`30 passed` files, `120 passed` tests); API suite passed (`57 passed` files, `121 passed` tests).

- [x] **Step 4: Manual smoke flow for hardware creation**

Run: `pnpm --filter @guarda-hard/app dev`
Expected: valid create succeeds with success banner; invalid data shows clear validation/auth message and does not appear as opaque `500` to user.
Evidence:
- Executed command: `pnpm --filter @guarda-hard/app dev`
- Observed output: Next dev server started successfully (`Ready in 726ms`, `http://localhost:3000`) until tool timeout sent `SIGTERM`.
- Non-interactive limitation: this environment cannot perform browser UI interactions, so submit-flow assertions (success banner, validation/auth modal messaging) are not directly verifiable here without interactive/manual browser steps.

### Task 6: PRD Checklist Hygiene

**Files:**

- Modify: `docs/PRD-GuardaHard.md`

- [x] **Step 1: Mark the corresponding PRD checklist item immediately after each completed stage**

Update the relevant stage/checklist entries in `docs/PRD-GuardaHard.md` as each stage above is completed, before starting the next stage.
