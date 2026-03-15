# API Playwright Errors Migration Sync Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the `POST /auth/register` 500 seen in Playwright API checks by guaranteeing runtime schema compatibility and adding regression coverage.

**Architecture:** The failure is caused by schema drift: application code now writes `usuario_empresas.departamento_id`, but the local runtime DB still has the pre-migration table shape. The fix is to make app startup enforce pending migrations, plus add automated tests that reproduce and prevent this drift regression.

**Tech Stack:** NestJS, TypeORM migrations, SQLite (`better-sqlite3`), Vitest, Playwright CLI smoke checks.

---

## Chunk 1: Diagnose and lock regression

### Task 1: Add failing runtime-schema regression test

**Files:**

- Create: `api/test/api/auth.register.schema-compat.api.spec.ts`
- Test: `api/test/api/auth.register.schema-compat.api.spec.ts`

- [x] **Step 1: Write the failing test**

```ts
it('returns 201 on register when DB schema includes usuario_empresas.departamento_id', async () => {
  // create temp sqlite db
  // apply all migrations
  // boot app against temp db
  // call POST /auth/register
  // expect 201 and no INTERNAL_ERROR payload
});
```

- [x] **Step 2: Run test to verify it fails first (RED)**

Run: `pnpm --filter @guarda-hard/api test test/api/auth.register.schema-compat.api.spec.ts`
Expected: FAIL, reproducing the 500 path before startup migration handling is implemented.

- [x] **Step 3: Keep this as the canonical regression**

No production changes yet; only stabilize test setup and deterministic assertions.

- [x] **Step 4: Re-run test and confirm deterministic failure reason**

Run: `pnpm --filter @guarda-hard/api test test/api/auth.register.schema-compat.api.spec.ts`
Expected: FAIL consistently for the same schema-compat reason.

- [ ] **Step 5: Commit test scaffold**

Skipped in-session because no explicit commit request was provided.

```bash
git add api/test/api/auth.register.schema-compat.api.spec.ts
git commit -m "test(api): reproduce auth register schema drift failure"
```

---

## Chunk 2: Runtime fix

### Task 2: Run pending migrations automatically at API startup

**Files:**

- Modify: `api/src/main.ts`
- Modify: `api/src/infrastructure/database/database.module.ts`
- Modify: `api/src/infrastructure/database/data-source.ts`
- Test: `api/test/api/auth.register.schema-compat.api.spec.ts`

- [x] **Step 1: Extend startup flow to execute pending migrations once**

```ts
// bootstrap startup sequence
// initialize app
// run dataSource.runMigrations() when needed
// continue normal startup
```

- [x] **Step 2: Keep behavior safe and explicit**

Guardrails:

- log when migrations run
- fail startup if migration application fails
- avoid duplicate migration execution in tests already controlling schema

- [x] **Step 3: Run regression test (GREEN target)**

Run: `pnpm --filter @guarda-hard/api test test/api/auth.register.schema-compat.api.spec.ts`
Expected: PASS; register no longer returns `INTERNAL_ERROR` due to missing column.

- [x] **Step 4: Run focused auth and migration tests**

Run: `pnpm --filter @guarda-hard/api test src/modules/auth/application/services/auth.service.spec.ts src/infrastructure/database/migrations/global-users-empresas-membership.migration.spec.ts`
Expected: PASS with no new failures.

- [ ] **Step 5: Commit runtime migration fix**

Skipped in-session because no explicit commit request was provided.

```bash
git add api/src/main.ts api/src/infrastructure/database/database.module.ts api/src/infrastructure/database/data-source.ts api/test/api/auth.register.schema-compat.api.spec.ts
git commit -m "fix(api): enforce pending migrations before serving requests"
```

---

## Chunk 3: End-to-end verification and operational guidance

### Task 3: Verify via Playwright API flow and document operator fallback

**Files:**

- Modify: `docs/superpowers/plans/2026-03-15-api-playwright-errors-migration-sync.md`
- Modify: `api/README.md` (or existing runbook doc if present)

- [x] **Step 1: Run Playwright API smoke flow after fix**

Run:

- `pnpm --filter @guarda-hard/api start`
- `pnpm exec playwright-cli open http://127.0.0.1:<PORT>/auth/empresas`
- `pnpm exec playwright-cli eval "...register/login/select-empresa/usuarios flow..."`

Expected:

- register = 201
- login = 200
- select-empresa = 200
- usuarios create/list = 200/201

- [x] **Step 2: Add explicit local recovery command to docs**

```bash
pnpm --filter @guarda-hard/api migration:run
```

Document when to use it (manual recovery for old local DBs).

- [x] **Step 3: Run full API suite**

Run: `pnpm --filter @guarda-hard/api test`
Expected: all tests pass.

- [ ] **Step 4: Commit docs and verification updates**

Skipped in-session because no explicit commit request was provided.

```bash
git add api/README.md docs/superpowers/plans/2026-03-15-api-playwright-errors-migration-sync.md
git commit -m "docs(api): add migration recovery and playwright verification flow"
```

---

## Implementation Notes

- Root cause found during Playwright run: runtime DB schema lacked `usuario_empresas.departamento_id`, causing `POST /auth/register` to throw and map to `INTERNAL_ERROR`.
- The follow-on `401` responses in login/select-empresa/usuarios are downstream effects of failed registration (no user/session created).
- Environment note: API listened on port `4000` in this workspace; Playwright checks must target actual runtime port.
