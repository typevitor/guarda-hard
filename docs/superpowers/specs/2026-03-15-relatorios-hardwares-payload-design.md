# Relatorios Hardwares Payload Alignment Design

## Context

Accessing the relatorios view crashes with `linhasApi.filter is not a function` in
`app/src/features/relatorios/server/relatorios-api.ts`.

The frontend currently assumes `/relatorios/hardwares` returns an array, but the
backend use case returns an object in the shape `{ total, linhas }`. When there
are zero registros, `linhas` should be an empty array (`[]`), and the frontend
must continue to work without runtime errors.

## Goal

Align frontend payload parsing with the backend contract for
`GET /relatorios/hardwares`, ensuring stable behavior for both non-empty and
empty datasets.

## Non-Goals

- Changing backend contract shape for `/relatorios/hardwares`.
- Refactoring relatorios architecture beyond the contract fix.
- Altering historico endpoint behavior.

## Current Behavior

- Backend (`ListarSituacaoHardwaresUseCase`) returns:
  - `total: number`
  - `linhas: RelatorioSituacaoLinha[]`
- Frontend reads `/relatorios/hardwares` as `HardwareApiRow[]` directly and calls
  `.filter()` on the top-level payload.
- If payload is object-shaped, `.filter()` crashes.

## Proposed Design

### 1) Frontend contract alignment

In `app/src/features/relatorios/server/relatorios-api.ts`, update
`getRelatorioResultado` to parse `/relatorios/hardwares` as object payload:

- Introduce/adjust a local response type:
  - `RelatorioSituacaoPayload = { total: number; linhas: HardwareApiRow[] }`
- Use `payload.linhas` as source collection for local filtering and mapping.

### 2) Defensive normalization for crash prevention

Before filtering, normalize collection access defensively:

- If `payload.linhas` is not an array, treat it as `[]`.
- This prevents runtime errors from malformed payloads and guarantees safe
  `.filter()` execution.

This guard is defensive only; the contract remains `{ total, linhas }`.

### 3) Keep local filtering semantics unchanged

Preserve existing frontend filter behavior for:

- hardware text match
- usuario text match
- periodo range match

No business rule changes; only payload access changes.

## Error Handling

- Keep existing API client behavior and fallback error message
  (`Nao foi possivel carregar relatorios`).
- Keep backend error propagation semantics already covered by tests.
- Ensure malformed `linhas` data does not throw a type error in relatorios page
  loading path.

## Testing Design

Update tests in `app/src/features/relatorios/server/relatorios-api.test.ts`:

1. Adapt existing `/relatorios/hardwares` mocks to `{ total, linhas }` shape.
2. Keep the filter behavior test, now driven by `linhas` array from payload.
3. Add explicit zero-registros test with `{ total: 0, linhas: [] }` and assert:
   - no crash
   - `result.total === 0`
   - `result.linhas` equals `[]`
4. Add malformed payload regression tests (for example `linhas: null` and
   `linhas: {}`) and assert:
   - no crash
   - `result.linhas` equals `[]`
   - `result.total` follows deterministic rule (see below)
5. Keep one existing historico test passing unchanged to enforce that this work
   does not alter historico endpoint behavior.
6. Keep one API failure test that asserts the fallback/propagated message path
   remains unchanged (`Nao foi possivel carregar relatorios` fallback behavior).

### Deterministic total rule

When parsing `/relatorios/hardwares` payload:

- If `payload.total` is a finite number, preserve it in `result.total`.
- Otherwise, default `result.total` to `linhas.length` after normalization.

This keeps `total` stable for valid payloads and deterministic for malformed
responses while avoiding runtime failures.

## Files Affected

- Modify: `app/src/features/relatorios/server/relatorios-api.ts`
- Modify: `app/src/features/relatorios/server/relatorios-api.test.ts`

## Risks and Mitigations

- Risk: Hidden contract drift in backend.
  - Mitigation: keep tests tied to explicit object payload shape.
- Risk: Silent fallback to `[]` could mask malformed responses.
  - Mitigation: scope fallback only to `linhas` collection safety while keeping
    existing API error semantics intact.

## Success Criteria

- Relatorios page no longer throws `linhasApi.filter is not a function`.
- Empty dataset (`0` registros) renders safely with no rows.
- Existing relatorios filtering behavior remains unchanged.
- Historico endpoint behavior remains unchanged (regression test still passing).
- Automated tests in relatorios server API module pass with updated contract.
