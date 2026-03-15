# Relatorios Hardwares Payload Fix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `linhasApi.filter is not a function` in relatorios by aligning frontend parsing with backend `/relatorios/hardwares` contract and validating empty/malformed `linhas` safely.

**Architecture:** Keep backend contract unchanged (`{ total, linhas }`) and update the relatorios server data-access layer in `app` to parse that payload explicitly. Preserve existing local filtering behavior (`hardware`, `usuario`, `periodo`) and add defensive normalization for `linhas` to prevent runtime crashes.

**Tech Stack:** Next.js 16, TypeScript, Vitest, pnpm workspaces

---

## File Structure

- Modify: `app/src/features/relatorios/server/relatorios-api.ts`
  - Parse `/relatorios/hardwares` as object payload (`total`, `linhas`).
  - Normalize `linhas` to array before filtering.
  - Apply deterministic `total` rule for malformed payloads.
- Modify: `app/src/features/relatorios/server/relatorios-api.test.ts`
  - Update existing mocks to object payload format.
  - Add regression coverage for empty and malformed `linhas`.

## Chunk 1: Test Contract and Failure Reproduction

### Task 1: Update tests to enforce backend payload contract

**Files:**

- Test: `app/src/features/relatorios/server/relatorios-api.test.ts`

- [ ] **Step 1: Write failing/contract tests for object payload parsing**

Add/update tests in `getRelatorioResultado` suite so `/relatorios/hardwares` mock returns:

```ts
mockFetchJson({
  total: 1,
  linhas: [
    {
      hardwareId: 'hw-1',
      descricao: 'Notebook',
      codigoPatrimonio: 'PAT-1',
      status: 'emprestado',
      usuarioId: 'user-active',
      dataRetirada: '2026-03-01',
      dataDevolucao: null,
    },
  ],
});
```

Required assertions for this case:

- `result.total === 1`
- `result.linhas.length === 1`
- first row keeps expected mapped fields (`hardwareId`, `descricao`,
  `codigoPatrimonio`, `status`, `usuarioId`, `dataRetirada`,
  `dataDevolucao`)

- [ ] **Step 2: Add zero-registros regression test**

Add test for empty response:

```ts
mockFetchJson({ total: 0, linhas: [] });
```

Assert:

- no throw
- `result.total` is `0`
- `result.linhas` equals `[]`

- [ ] **Step 3: Add malformed `linhas` regression tests**

Add two tests with malformed `linhas`:

```ts
mockFetchJson({ total: 5, linhas: null });
mockFetchJson({ total: 2, linhas: {} });
```

Assert in both:

- no throw
- `result.linhas` equals `[]`
- `result.total` follows this deterministic rule:
  - preserve `payload.total` when it is a finite number
  - otherwise fallback to `linhasOriginais.length`

Expected totals for these malformed cases:

- `{ total: 5, linhas: null }` -> `result.total === 5`
- `{ total: 2, linhas: {} }` -> `result.total === 2`

- [ ] **Step 4: Run focused test file to confirm RED (or at least new assertions fail before implementation)**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/features/relatorios/server/relatorios-api.test.ts
```

Expected:

- At least one newly added `getRelatorioResultado` contract/regression test
  fails due to old array-based parsing.
- If all pass unexpectedly, re-check tests are asserting object payload parsing
  and malformed `linhas` handling with exact expectations.

---

## Chunk 2: Implement Parsing Alignment and Safety

### Task 2: Align relatorios-api parsing with `{ total, linhas }`

**Files:**

- Modify: `app/src/features/relatorios/server/relatorios-api.ts`
- Test: `app/src/features/relatorios/server/relatorios-api.test.ts`

- [ ] **Step 1: Add explicit payload type for situacao endpoint**

In `relatorios-api.ts`, add type near existing API row types:

```ts
type RelatorioSituacaoPayload = {
  total?: unknown;
  linhas?: unknown;
};
```

- [ ] **Step 2: Parse `/relatorios/hardwares` as object payload**

Update fetch call to start from unknown payload:

```ts
const rawPayload = await fetchJson<unknown>(`/relatorios/hardwares${statusQuery}`);
```

and stop treating top-level response as array.

- [ ] **Step 3: Guard root payload and normalize `linhas` before filtering**

Add safe root payload extraction:

```ts
const payload: RelatorioSituacaoPayload =
  rawPayload && typeof rawPayload === 'object' ? (rawPayload as RelatorioSituacaoPayload) : {};
```

Add safe collection extraction:

```ts
const linhasOriginais = Array.isArray(payload.linhas) ? payload.linhas : [];
```

Use `linhasOriginais.filter(...).map(...)` for the existing filter/mapping flow.

- [ ] **Step 4: Implement deterministic `total` rule**

Set returned `total` as:

```ts
const total =
  typeof payload.total === 'number' && Number.isFinite(payload.total)
    ? payload.total
    : linhasOriginais.length;
```

Return this `total` in `RelatorioResultado`.

- [ ] **Step 5: Run focused relatorios-api tests to confirm GREEN**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/features/relatorios/server/relatorios-api.test.ts
```

Expected:

- PASS

- [ ] **Step 6: Run broader relatorios tests as regression check**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/features/relatorios/server/relatorios-api.test.ts src/features/relatorios/components/relatorios-page.test.tsx
```

Expected:

- PASS

- [ ] **Step 7: Commit implementation changes**

```bash
git add app/src/features/relatorios/server/relatorios-api.ts app/src/features/relatorios/server/relatorios-api.test.ts
git commit -m "fix(app): align relatorios hardwares parsing with payload contract"
```

---

## Chunk 3: Verification and Handoff

### Task 3: Final verification for bugfix scope

**Files:**

- No additional file changes expected

- [ ] **Step 1: Re-run targeted tests for evidence**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/features/relatorios/server/relatorios-api.test.ts src/features/relatorios/components/relatorios-page.test.tsx
```

Expected:

- PASS and no runtime type error path.
- Preserve auditable evidence in handoff notes with:
  - executed command
  - test files discovered/executed
  - pass count
  - zero failures
  - explicit mention that malformed/empty `linhas` regression tests passed.

- [ ] **Step 2: Optional smoke check in relatorios route (if local env is available)**

Run app and open `/relatorios`, verifying:

- no `linhasApi.filter is not a function`
- empty data renders safely.

If smoke check cannot run (env unavailable), record that constraint and use
Step 1 test evidence as substitute verification.

- [ ] **Step 3: Prepare concise evidence summary for PR/hand-off**

Include:

- commit SHA (or explicit note that changes are still uncommitted)
- test command outputs (pass)
- exact changed files
- contract statement for `/relatorios/hardwares`.

### Chunk 3 closure gate

Chunk 3 is complete only when:

- Step 1 evidence is attached with pass details
- Step 2 result is recorded (run result or skip reason)
- Step 3 handoff summary includes commit traceability + contract statement.

---

## Risks and Mitigations

- Risk: Existing tests still rely on legacy array payload.
  - Mitigation: update all `/relatorios/hardwares` mocks to object payload shape.
- Risk: Malformed payloads silently degrade UX by showing no lines.
  - Mitigation: deterministic `total` rule + explicit malformed payload tests.
- Risk: Unintended change in historico behavior.
  - Mitigation: keep existing historico tests in same suite passing without modifications to historico code path.

## Definition of Done

- `getRelatorioResultado` consumes `{ total, linhas }` from `/relatorios/hardwares`.
- No runtime crash from `.filter` when payload is empty or malformed.
- Focused relatorios server tests pass under `pnpm`.
- Implementation commit created with the planned message (or equivalent conventional-commit style).
