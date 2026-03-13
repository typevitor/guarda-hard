# List Pages + Modal Create Flow + Save Reliability — Design Spec

**Date:** 2026-03-13  
**Status:** Approved (design conversation)  
**Scope:** Standardize list-first pages and modal create flows for five menu entries, and fix current create failure behavior that is surfacing as `POST /departamentos` 500.

---

## 1. Context

The current dashboard routes already exist for:

- `/departamentos`
- `/usuarios`
- `/hardwares`
- `/emprestimo`
- `/devolucao`

However, the UX is inconsistent with the desired behavior:

- Pages currently emphasize inline forms instead of list-first workflows.
- There is no shared modal-based create pattern across these routes.
- Save behavior is inconsistent and currently fails for at least one flow (`POST /departamentos` returns 500).

The target UX should follow the reference behavior discussed by the user and be consistent across all five routes.

---

## 2. Approved Product Decisions

### 2.1 Pages included

Apply the new pattern to:

- `Departamentos`
- `Usuarios`
- `Hardwares`
- `Emprestimo`
- `Devolucao`

Do not include `Dashboard` or `Relatorios` in this scope.

### 2.2 Core UX contract

For all five pages:

- Menu route opens list view of that feature.
- Page header contains a top-right `New` button.
- Clicking `New` opens a modal with the create form.
- Save success: close modal, show success feedback, refresh current list.
- Save failure: keep modal open, preserve user input, show error at top of modal.

### 2.3 List behavior

- Pagination is required from first delivery.
- Fixed page size: `10` on all pages.
- Filters are required from first delivery.
- `Emprestimo` and `Devolucao` each show their own operation list (not combined).

---

## 3. Architecture Alignment

This design follows `docs/architecture.md`:

- Keep route composition in `app/src/app/(dashboard)/*/page.tsx`.
- Keep feature behavior in `app/src/features/<feature>/...`.
- Keep controllers thin in API modules.
- Keep use-case orchestration in `application` layer.
- Keep persistence query details in `infrastructure/persistence` repositories.
- Keep tenant isolation enforced centrally, not manually per controller.

---

## 4. Proposed System Design

## 4.1 Frontend structure

For each of the five features:

- Route file (`app/.../page.tsx`) loads initial list data and wires server actions.
- Feature page component renders:
  - list header (title + `New` button)
  - filter area
  - table/list view
  - pagination controls
  - modal with create form

Reusable pieces:

- Generic UI primitives stay in `app/src/components/ui` (dialog shell, table shell, pagination controls, feedback alert).
- Feature-specific list and form components stay under each feature folder.

Feature-specific modal create behavior:

- `departamentos`, `usuarios`, `hardwares`, `emprestimo`: modal contains direct create form fields for that entity.
- `devolucao`: modal contains a required selector for an open emprestimo and submits `POST /emprestimos/:id/devolucao` using selected emprestimo id.
- If there are no open emprestimos, `devolucao` modal shows empty-state guidance and disables submit.

### 4.2 URL and state model

List state is URL-driven for each page:

- `page` (default `1`)
- feature filters

Behavior:

- Initial load reads search params.
- Applying filters resets to page 1.
- Pagination updates `page` while preserving active filters.
- Modal open/close state is local component state (not URL state).

### 4.3 Route-to-endpoint mapping (explicit)

There are five UI routes but four list API endpoints. `Emprestimo` and `Devolucao` are separate UI pages backed by one listing endpoint with different fixed status filters.

| UI Route         | List API Endpoint    | Fixed Query Params |
| ---------------- | -------------------- | ------------------ |
| `/departamentos` | `GET /departamentos` | none               |
| `/usuarios`      | `GET /usuarios`      | none               |
| `/hardwares`     | `GET /hardwares`     | none               |
| `/emprestimo`    | `GET /emprestimos`   | `status=open`      |
| `/devolucao`     | `GET /emprestimos`   | `status=returned`  |

Create endpoints:

| UI Route         | Create API Endpoint               |
| ---------------- | --------------------------------- |
| `/departamentos` | `POST /departamentos`             |
| `/usuarios`      | `POST /usuarios`                  |
| `/hardwares`     | `POST /hardwares`                 |
| `/emprestimo`    | `POST /emprestimos`               |
| `/devolucao`     | `POST /emprestimos/:id/devolucao` |

### 4.4 Backend list contracts

All list endpoints return a unified envelope:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 10,
  "total": 0,
  "totalPages": 0
}
```

Query contract baseline:

- `page` (integer >= 1)
- `pageSize` fixed to 10 by server policy (incoming value ignored)
- feature-specific filters

Sorting and normalization rules (required):

- Default order: `createdAt DESC`, tiebreaker `id DESC`.
- `page` parse failures or values `< 1` normalize to `1`.
- Boolean filters accept only `"true"` or `"false"`.
- Date filters accept ISO-8601 date strings.
- Invalid boolean/date values return `400` with validation error payload (not silent ignore).

Filter sets:

- `departamentos`: `search` (name)
- `usuarios`: `search`, `departamentoId`, `ativo`
- `hardwares`: `search`, `funcionando`, `livre`
- `emprestimo`: `search`, `usuarioId`, `hardwareId`, `retiradaFrom`, `retiradaTo`, `status=open`
- `devolucao`: `search`, `usuarioId`, `hardwareId`, `retiradaFrom`, `retiradaTo`, `devolucaoFrom`, `devolucaoTo`, `status=returned`

### 4.5 Response item contracts (required fields)

Paginated envelopes use feature-specific `items` schemas:

- `departamentos` item:
  - `id`, `empresaId`, `nome`, `createdAt`, `updatedAt`
- `usuarios` item:
  - `id`, `empresaId`, `departamentoId`, `nome`, `email`, `ativo`, `createdAt`, `updatedAt`
- `hardwares` item:
  - `id`, `empresaId`, `descricao`, `marca`, `modelo`, `codigoPatrimonio`, `funcionando`, `descricaoProblema`, `livre`, `version`, `createdAt`, `updatedAt`
- `emprestimos` item (used by both `/emprestimo` and `/devolucao` pages):
  - `id`, `empresaId`, `usuarioId`, `hardwareId`, `dataRetirada`, `dataDevolucao`, `createdAt`, `updatedAt`

### 4.6 Create contracts

Create endpoints return created resource payloads (same shape as existing feature response entities).

Request bodies:

- `POST /departamentos`: `{ nome: string }`
- `POST /usuarios`: `{ departamentoId: string, nome: string, email: string }`
- `POST /hardwares`: `{ descricao: string, marca: string, modelo: string, codigoPatrimonio: string }`
- `POST /emprestimos`: `{ usuarioId: string, hardwareId: string }`
- `POST /emprestimos/:id/devolucao`: empty body

`/devolucao` modal id-resolution contract (required):

- Modal renders a searchable selector for open emprestimos.
- Selector data source uses paginated open-emprestimo queries (`GET /emprestimos?status=open&page=<n>`), not only page 1.
- Selector must allow fetching additional pages (load-more/infinite or paged navigation) so any open emprestimo can be selected.
- Selection value is the emprestimo `id`.
- Submit is disabled until one valid emprestimo is selected.
- On submit, client must call `POST /emprestimos/{selectedEmprestimoId}/devolucao`.
- If selected id is stale (already returned), backend returns mapped business error and modal keeps state open with error banner.

Frontend save actions may ignore response body for mutation success, but API contracts remain explicit and testable.

### 4.7 Error payload and HTTP status mapping

Standard error payload for all API errors:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Human-readable message",
  "details": []
}
```

Required status/code mapping:

- `401 AUTH_REQUIRED`: missing/invalid authenticated context
- `403 TENANT_FORBIDDEN`: tenant mismatch or cross-tenant access
- `400 VALIDATION_ERROR`: malformed query/body/params (including bad filters)
- `409 BUSINESS_RULE_VIOLATION`: domain rule conflicts (for example unavailable hardware)
- `500 INTERNAL_ERROR`: unexpected failures only

Required backend mechanism:

- Add a global exception mapping strategy so tenant/auth/domain errors are converted to mapped HTTP errors consistently across modules.

### 4.8 Backend layering changes

For each feature module:

- Add/extend list query DTO schemas in `application/dto`.
- Add paginated list use case in `application/use-cases`.
- Extend repository interface for paginated+filtered list.
- Implement query details in TypeORM repository with tenant scoping.
- Keep controller limited to validation + use-case invocation + response mapping.

For emprestimos/devolucoes:

- Keep one core listing capability in `emprestimos` module.
- Use status/date filters to drive the `Emprestimo` and `Devolucao` page perspectives.

---

## 5. Save Reliability and 500 Error Strategy

## 5.1 Observed issue

User-reported error:

- `POST http://localhost:3000/departamentos 500 (Internal Server Error)`

In current code, create flows depend on tenant context (`TenantContext.requireEmpresaId()`), and missing tenant context can bubble as an unhandled internal failure.

### 5.2 Root-cause-oriented fix direction

- Enforce tenant/auth context at HTTP boundary before use-case execution.
- Convert missing/invalid tenant context into explicit mapped HTTP errors (`401`/`403`) instead of opaque 500.
- Ensure frontend modal surfaces backend message in top-level error area.

This same handling must be applied as a global pattern for all five create flows.

### 5.3 Error UX contract

For failed saves:

- Modal stays open.
- Input values remain untouched.
- Top-of-modal error alert displays actionable message.
- No silent reset and no forced close.

---

## 6. Frontend Interaction Flow

1. User navigates via menu to one of the five pages.
2. Page loads list for current query params.
3. User clicks `New`.
4. Modal opens with create form.
5. User submits form.
6. On success:
   - close modal
   - show success message
   - call `router.refresh()` to reload server-rendered list for current page/filters
7. On failure:
   - keep modal open
   - preserve form values
   - show top-level error message

Implementation note for consistency:

- Submit path stays server-action-based from route files (`app/.../page.tsx`) to feature server API callers.
- Client page components own modal state and invoke refresh after successful action completion.

---

## 7. Testing Strategy

### 7.1 API tests

- Paginated list contract tests for all five views.
- Filter behavior tests per feature.
- Sort-order tests (`createdAt DESC`, `id DESC` tiebreaker).
- Query normalization tests (`page<1`, parse failures) and invalid filter 400 tests.
- Tenant isolation tests for list and create operations.
- Regression test for previous `POST /departamentos` 500 scenario.

### 7.2 Frontend tests

Per page (`departamentos`, `usuarios`, `hardwares`, `emprestimo`, `devolucao`):

- Renders list-first layout.
- `New` button opens modal.
- Successful save closes modal and refreshes list.
- Failed save keeps modal open and shows error banner.
- Pagination and filters update route query state as expected.
- `devolucao` modal requires selecting an open emprestimo id before enabling submit.
- `devolucao` submit calls endpoint with selected id path parameter.

### 7.3 End-to-end checks

- Smoke E2E for full create flow in each page.
- Verify list reflects new record after success.
- Verify error feedback behavior with simulated backend failures.
- Verify `/devolucao` flow resolves selected open emprestimo id into `POST /emprestimos/:id/devolucao`.

---

## 8. Rollout Plan

Apply in this order to reduce risk and maximize reuse:

1. `departamentos`
2. `usuarios`
3. `hardwares`
4. `emprestimo`
5. `devolucao`

After first module is complete, reuse shared UI primitives and list patterns for remaining modules.

---

## 9. Acceptance Criteria

- All five target pages are list-first and include top-right `New` button.
- Each page uses modal-based creation.
- Success behavior is consistent: close + feedback + list refresh.
- Failure behavior is consistent: keep open + preserve values + top error.
- Pagination exists from day one with fixed size `10`.
- Filters exist from day one for all five pages.
- `Emprestimo` and `Devolucao` show separate operation lists.
- The current `POST /departamentos` failure path is fixed and covered by tests.
- No cross-tenant rows appear in list responses for any of the five pages.
- `/devolucao` create modal explicitly selects an open emprestimo and uses that selected id in the devolucao POST path.

---

## 10. Out of Scope

- Redesign of `Dashboard` or `Relatorios` pages.
- Bulk actions, CSV export, or advanced analytics views.
- Full visual redesign of global shell/navigation.
