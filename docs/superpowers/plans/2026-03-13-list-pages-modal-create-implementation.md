# List Pages + Modal Create Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver list-first pages with top-right modal create flow for `departamentos`, `usuarios`, `hardwares`, `emprestimo`, and `devolucao`, including fixed pagination (10), filters, and reliable save/error behavior.

**Architecture:** Keep backend as feature modules with thin controllers, application-layer use cases, and repository query implementations in infrastructure; keep frontend server-first route composition in `app` and feature behavior in `features/*`; centralize API contracts in shared schemas/types and enforce tenant/auth error mapping globally.

**Tech Stack:** NestJS 11, Next.js 16 App Router, TypeORM, SQLite, React Hook Form, Zod, Vitest, pnpm workspaces

---

## File Structure (lock before coding)

### Create

- `packages/schemas/src/pagination.ts` - shared pagination query/response schemas (`page`, `pageSize`, envelope).
- `packages/schemas/src/list-filters.ts` - shared filter schemas for the five list pages.
- `packages/schemas/src/pagination.spec.ts` - shared pagination contract tests.
- `packages/schemas/src/list-filters.spec.ts` - shared list-filter contract tests.
- `packages/types/src/pagination.ts` - shared pagination/filter output types if needed by app/api.

- `api/src/shared/presentation/http/api-error.filter.ts` - global exception filter mapping tenant/auth/domain errors to standard payload.
- `api/src/shared/presentation/http/pagination.ts` - helpers to normalize/validate page and fixed page size policy.

- `api/src/modules/departamentos/application/use-cases/list-departamentos-paginado.use-case.ts`
- `api/src/modules/usuarios/application/use-cases/list-usuarios-paginado.use-case.ts`
- `api/src/modules/hardwares/application/use-cases/list-hardwares-paginado.use-case.ts`
- `api/src/modules/emprestimos/application/use-cases/list-emprestimos-paginado.use-case.ts`

- `api/test/api/departamentos.listing.api.spec.ts`
- `api/test/api/usuarios.listing.api.spec.ts`
- `api/test/api/hardwares.listing.api.spec.ts`
- `api/test/api/emprestimos.listing.api.spec.ts`
- `api/test/api/error-mapping.api.spec.ts`
- `api/test/api/departamentos.create-error.api.spec.ts`

- `api/src/modules/departamentos/application/dto/departamento.list-query.schemas.spec.ts`
- `api/src/modules/usuarios/application/dto/usuario.list-query.schemas.spec.ts`
- `api/src/modules/hardwares/application/dto/hardware.list-query.schemas.spec.ts`
- `api/src/modules/emprestimos/application/dto/emprestimo.list-query.schemas.spec.ts`

- `app/src/components/ui/modal.tsx` - generic modal shell.
- `app/src/components/ui/pagination-controls.tsx` - generic pagination controls.
- `app/src/components/ui/filter-bar.tsx` - generic filter container.
- `app/src/components/ui/list-table.tsx` - generic list table shell.
- `app/src/components/ui/feedback-banner.tsx` - top-level success/error feedback.
- `app/src/components/ui/modal.test.tsx`
- `app/src/components/ui/pagination-controls.test.tsx`
- `app/src/components/ui/filter-bar.test.tsx`
- `app/src/components/ui/list-table.test.tsx`
- `app/src/components/ui/feedback-banner.test.tsx`

- `app/src/features/departamentos/components/departamentos-list.tsx`
- `app/src/features/usuarios/components/usuarios-list.tsx`
- `app/src/features/hardwares/components/hardwares-list.tsx`
- `app/src/features/emprestimos/components/emprestimos-list.tsx`
- `app/src/features/emprestimos/components/devolucoes-list.tsx`

- `app/src/features/departamentos/schemas/departamentos-list-query-schema.ts`
- `app/src/features/usuarios/schemas/usuarios-list-query-schema.ts`
- `app/src/features/hardwares/schemas/hardwares-list-query-schema.ts`
- `app/src/features/emprestimos/schemas/emprestimos-list-query-schema.ts`
- `app/src/features/emprestimos/schemas/devolucoes-list-query-schema.ts`

- `app/src/features/departamentos/server/departamentos-list-api.ts`
- `app/src/features/usuarios/server/usuarios-list-api.ts`
- `app/src/features/hardwares/server/hardwares-list-api.ts`
- `app/src/features/emprestimos/server/emprestimos-list-api.ts`
- `app/src/features/emprestimos/server/devolucoes-open-selector-api.ts`

- `app/src/features/departamentos/components/departamentos-page.listing.test.tsx`
- `app/src/features/usuarios/components/usuarios-page.listing.test.tsx`
- `app/src/features/hardwares/components/hardwares-page.listing.test.tsx`
- `app/src/features/emprestimos/components/emprestimo-page.listing.test.tsx`
- `app/src/features/emprestimos/components/devolucao-page.listing.test.tsx`

- `app/e2e/list-modal-smoke.spec.ts`
- `app/playwright.config.ts`

### Modify

- `packages/schemas/src/index.ts` - export new pagination/filter schemas.

- `api/src/main.ts` - register global exception filter.
- `api/src/modules/departamentos/application/dto/departamento.schemas.ts` - add list query schema.
- `api/src/modules/usuarios/application/dto/usuario.schemas.ts` - add list query schema.
- `api/src/modules/hardwares/application/dto/hardware.schemas.ts` - add list query schema.
- `api/src/modules/emprestimos/application/dto/emprestimo.schemas.ts` - add list query schema and `status` enum (`open|returned`).
- `api/src/modules/departamentos/domain/repositories/departamento.repository.interface.ts` - add paginated list signature.
- `api/src/modules/usuarios/domain/repositories/usuario.repository.interface.ts` - add paginated list signature.
- `api/src/modules/hardwares/domain/repositories/hardware.repository.interface.ts` - add paginated list signature.
- `api/src/modules/emprestimos/domain/repositories/emprestimo.repository.interface.ts` - add paginated list signature.
- `api/src/modules/departamentos/infrastructure/persistence/departamento.typeorm-repository.ts` - implement paginated+filtered query.
- `api/src/modules/usuarios/infrastructure/persistence/usuario.typeorm-repository.ts` - implement paginated+filtered query.
- `api/src/modules/hardwares/infrastructure/persistence/hardware.typeorm-repository.ts` - implement paginated+filtered query.
- `api/src/modules/emprestimos/infrastructure/persistence/emprestimo.typeorm-repository.ts` - implement paginated+filtered query.
- `api/src/modules/departamentos/application/services/departamentos.service.ts` - wire new list use case.
- `api/src/modules/usuarios/application/services/usuarios.service.ts` - wire new list use case.
- `api/src/modules/hardwares/application/services/hardwares.service.ts` - wire new list use case.
- `api/src/modules/emprestimos/application/services/emprestimos.service.ts` - wire new list use case.
- `api/src/modules/departamentos/presentation/http/departamentos.controller.ts` - parse query and return envelope.
- `api/src/modules/usuarios/presentation/http/usuarios.controller.ts` - parse query and return envelope.
- `api/src/modules/hardwares/presentation/http/hardwares.controller.ts` - parse query and return envelope.
- `api/src/modules/emprestimos/presentation/http/emprestimos.controller.ts` - add `GET /emprestimos` and return envelope.
- `api/src/modules/departamentos/departamentos.module.ts` - register list use case providers.
- `api/src/modules/usuarios/usuarios.module.ts` - register list use case providers.
- `api/src/modules/hardwares/hardwares.module.ts` - register list use case providers.
- `api/src/modules/emprestimos/emprestimos.module.ts` - register list use case providers.

- `app/src/app/(dashboard)/departamentos/page.tsx` - load list from query params and pass create/list actions.
- `app/src/app/(dashboard)/usuarios/page.tsx`
- `app/src/app/(dashboard)/hardwares/page.tsx`
- `app/src/app/(dashboard)/emprestimo/page.tsx`
- `app/src/app/(dashboard)/devolucao/page.tsx`
- `app/src/features/departamentos/components/departamentos-page.tsx` - move to list-first + modal create.
- `app/src/features/usuarios/components/usuarios-page.tsx`
- `app/src/features/hardwares/components/hardwares-page.tsx`
- `app/src/features/emprestimos/components/emprestimo-page.tsx`
- `app/src/features/emprestimos/components/devolucao-page.tsx`
- `app/src/features/departamentos/forms/departamento-form.tsx` - support preserved state + top-level error passthrough.
- `app/src/features/usuarios/forms/usuario-form.tsx`
- `app/src/features/hardwares/forms/hardware-form.tsx`
- `app/src/features/emprestimos/forms/emprestimo-form.tsx`
- `app/src/features/emprestimos/forms/devolucao-form.tsx` - use selected open emprestimo id, not free id typing.
- `app/src/features/departamentos/server/departamentos-api.ts` - add list function and preserve create.
- `app/src/features/usuarios/server/usuarios-api.ts`
- `app/src/features/hardwares/server/hardwares-api.ts`
- `app/src/features/emprestimos/server/emprestimos-api.ts`
- `app/src/app/globals.css` - add modal/list/pagination styles aligned with existing visual system.
- `app/package.json` - add e2e script and playwright dependency for smoke checks.

- `docs/PRD-GuardaHard.md` - mark stage items immediately after each completed stage per repository rule.

### Existing tests to update

- `api/test/api/departamentos.api.spec.ts`
- `api/test/api/usuarios.api.spec.ts`
- `api/test/api/hardwares.api.spec.ts`
- `api/test/api/emprestimos.api.spec.ts`
- `app/src/features/departamentos/components/departamentos-page.test.tsx`
- `app/src/features/usuarios/forms/usuario-form.test.tsx`
- `app/src/features/hardwares/forms/hardware-form.test.tsx`
- `app/src/features/emprestimos/forms/emprestimo-form.test.tsx`
- `app/src/features/emprestimos/forms/devolucao-form.test.tsx`

---

## Chunk 1: Contracts + Backend Listing + Error Mapping

### Task 1: Add shared pagination/filter contracts (packages)

**Files:**

- Create: `packages/schemas/src/pagination.ts`
- Create: `packages/schemas/src/list-filters.ts`
- Modify: `packages/schemas/src/index.ts`
- Create/Modify: `packages/types/src/pagination.ts` (if needed)

- [ ] **Step 1: Write failing schema tests for pagination/filter parsing**

Create:

- `packages/schemas/src/pagination.spec.ts`
- `packages/schemas/src/list-filters.spec.ts`

Assert:

- `page` defaults to `1`
- invalid page parses/normalizes per contract
- fixed `pageSize` behavior
- `status` enum only accepts `open|returned`

- [ ] **Step 2: Run package tests and confirm FAIL**

Run: `pnpm --filter @guarda-hard/schemas test -- src/pagination.spec.ts src/list-filters.spec.ts`
Expected: FAIL on missing schemas.

- [ ] **Step 3: Implement minimal shared schemas and exports**

Add Zod contracts and export from `packages/schemas/src/index.ts`.

- [ ] **Step 4: Re-run package tests and confirm PASS**

Run: `pnpm --filter @guarda-hard/schemas test -- src/pagination.spec.ts src/list-filters.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit shared contracts**

```bash
git add packages/schemas/src packages/types/src
git commit -m "feat(contracts): add shared pagination and list filter schemas"
```

### Task 2: Add backend list query DTOs and repository paginated interfaces

**Files:**

- Modify: `api/src/modules/departamentos/application/dto/departamento.schemas.ts`
- Modify: `api/src/modules/usuarios/application/dto/usuario.schemas.ts`
- Modify: `api/src/modules/hardwares/application/dto/hardware.schemas.ts`
- Modify: `api/src/modules/emprestimos/application/dto/emprestimo.schemas.ts`
- Modify: repository interfaces for all four modules

- [ ] **Step 1: Write failing unit tests for DTO query validation**

Create focused tests:

- `api/src/modules/departamentos/application/dto/departamento.list-query.schemas.spec.ts`
- `api/src/modules/usuarios/application/dto/usuario.list-query.schemas.spec.ts`
- `api/src/modules/hardwares/application/dto/hardware.list-query.schemas.spec.ts`
- `api/src/modules/emprestimos/application/dto/emprestimo.list-query.schemas.spec.ts`

Assert:

- bool filter accepts only `"true"|"false"`
- invalid dates => validation error
- `status` must be `open|returned`

- [ ] **Step 2: Run focused DTO tests and confirm FAIL**

Run: `pnpm --filter @guarda-hard/api test -- src/modules/departamentos/application/dto/departamento.list-query.schemas.spec.ts src/modules/usuarios/application/dto/usuario.list-query.schemas.spec.ts src/modules/hardwares/application/dto/hardware.list-query.schemas.spec.ts src/modules/emprestimos/application/dto/emprestimo.list-query.schemas.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement query DTO schemas + interface signatures**

Use shared contracts where possible; keep module-specific filters in each feature DTO.

- [ ] **Step 4: Re-run focused DTO tests and confirm PASS**

Run: `pnpm --filter @guarda-hard/api test -- src/modules/departamentos/application/dto/departamento.list-query.schemas.spec.ts src/modules/usuarios/application/dto/usuario.list-query.schemas.spec.ts src/modules/hardwares/application/dto/hardware.list-query.schemas.spec.ts src/modules/emprestimos/application/dto/emprestimo.list-query.schemas.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit DTO + interface changes**

```bash
git add api/src/modules/*/application/dto api/src/modules/*/domain/repositories
git commit -m "feat(api): add paginated list query DTOs and repository contracts"
```

### Task 3: Implement paginated list use cases and repository queries

**Files:**

- Create: list paginated use-case files for 4 modules
- Modify: typeorm repository files for 4 modules
- Modify: services for 4 modules
- Modify: module provider registration files

- [ ] **Step 1: Write failing API tests for list envelope + filters + sort + tenant isolation**

Add tests in:

- `api/test/api/departamentos.listing.api.spec.ts`
- `api/test/api/usuarios.listing.api.spec.ts`
- `api/test/api/hardwares.listing.api.spec.ts`
- `api/test/api/emprestimos.listing.api.spec.ts`

Cover:

- envelope shape (`items,page,pageSize,total,totalPages`)
- fixed `pageSize=10`
- incoming `pageSize` query is ignored and response `pageSize` remains `10`
- sorting `createdAt DESC`, tie `id DESC`
- query normalization and 400 invalid filters
- `GET /emprestimos?status=open` and `GET /emprestimos?status=returned` both validated explicitly
- full filter matrix from spec is validated:
  - departamentos: `search`
  - usuarios: `search`, `departamentoId`, `ativo`
  - hardwares: `search`, `funcionando`, `livre`
  - emprestimos: `search`, `usuarioId`, `hardwareId`, `retiradaFrom`, `retiradaTo`, `status`
  - devolucao view: `search`, `usuarioId`, `hardwareId`, `retiradaFrom`, `retiradaTo`, `devolucaoFrom`, `devolucaoTo`, `status=returned`
- per-item response contract fields are asserted for each feature payload shape
- tenant isolation

- [ ] **Step 2: Run these listing API tests and confirm FAIL**

Run: `pnpm --filter @guarda-hard/api test -- test/api/departamentos.listing.api.spec.ts test/api/usuarios.listing.api.spec.ts test/api/hardwares.listing.api.spec.ts test/api/emprestimos.listing.api.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement minimal use-case and repository query logic**

Use query builders with tenant predicate at query construction and stable ordering.

- [ ] **Step 4: Re-run listing API tests and confirm PASS**

Run: `pnpm --filter @guarda-hard/api test -- test/api/departamentos.listing.api.spec.ts test/api/usuarios.listing.api.spec.ts test/api/hardwares.listing.api.spec.ts test/api/emprestimos.listing.api.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit list use cases/repositories/services**

```bash
git add api/src/modules api/test/api/departamentos.listing.api.spec.ts api/test/api/usuarios.listing.api.spec.ts api/test/api/hardwares.listing.api.spec.ts api/test/api/emprestimos.listing.api.spec.ts
git commit -m "feat(api): implement paginated filtered listings for core modules"
```

### Task 4: Add `GET` controller endpoints with unified envelope

**Files:**

- Modify: four controllers

- [ ] **Step 1: Add failing controller-level tests for query parsing + envelope mapping**

Extend or add API tests for each controller endpoint.

- [ ] **Step 2: Run focused controller tests and confirm FAIL**

Run: `pnpm --filter @guarda-hard/api test -- test/api/departamentos.listing.api.spec.ts test/api/usuarios.listing.api.spec.ts test/api/hardwares.listing.api.spec.ts test/api/emprestimos.listing.api.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement controller query parsing and response mapping**

Use Zod pipes, keep controllers thin.

- [ ] **Step 4: Re-run focused controller tests and confirm PASS**

Run the Step 2 command.
Expected: PASS.

- [ ] **Step 5: Commit controller listing endpoints**

```bash
git add api/src/modules/*/presentation/http
git commit -m "feat(api): expose unified paginated list endpoints"
```

### Task 5: Implement global error mapping for tenant/auth/domain failures

**Files:**

- Create: `api/src/shared/presentation/http/api-error.filter.ts`
- Modify: `api/src/main.ts`
- Create: `api/test/api/error-mapping.api.spec.ts`

- [ ] **Step 1: Write failing API tests for status/code mapping**

Test required mappings:

- missing/invalid auth context => `401 AUTH_REQUIRED`
- tenant mismatch => `403 TENANT_FORBIDDEN`
- validation => `400 VALIDATION_ERROR`
- business conflict => `409 BUSINESS_RULE_VIOLATION`
- unhandled exception => `500 INTERNAL_ERROR`
- payload shape is asserted for every case: `statusCode`, `code`, `message`, `details`
- include explicit regression case for reported route: `POST /departamentos` must not return opaque 500 for tenant/auth context failure

- [ ] **Step 2: Run mapping tests and confirm FAIL**

Run: `pnpm --filter @guarda-hard/api test -- test/api/error-mapping.api.spec.ts test/api/departamentos.create-error.api.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement global filter and register in bootstrap**

Return standardized payload with `statusCode`, `code`, `message`, `details`.

- [ ] **Step 4: Re-run mapping tests and confirm PASS**

Run: `pnpm --filter @guarda-hard/api test -- test/api/error-mapping.api.spec.ts test/api/departamentos.create-error.api.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit error mapping**

```bash
git add api/src/shared/presentation/http api/src/main.ts api/test/api/error-mapping.api.spec.ts api/test/api/departamentos.create-error.api.spec.ts
git commit -m "feat(api): add global error mapping for tenant auth and domain failures"
```

### Task 6: Mark PRD stage after backend contracts complete

**Files:**

- Modify: `docs/PRD-GuardaHard.md`

- [ ] **Step 1: Mark current stage checklist item(s) complete in PRD**

Update the relevant stage/checklist row(s) immediately per repository rule.

Target row in `docs/PRD-GuardaHard.md`:

- `Etapa 8 — Relatórios`: mark exactly the checklist item that corresponds to backend listing contracts once this stage is complete.

- [ ] **Step 2: Commit PRD checkbox update**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark backend listing contracts stage complete"
```

---

## Chunk 2: Frontend List-First Pages + Modal Create Flows

### Task 7: Build shared UI primitives (modal/table/pagination/feedback)

**Files:**

- Create: `app/src/components/ui/modal.tsx`
- Create: `app/src/components/ui/pagination-controls.tsx`
- Create: `app/src/components/ui/filter-bar.tsx`
- Create: `app/src/components/ui/list-table.tsx`
- Create: `app/src/components/ui/feedback-banner.tsx`
- Modify: `app/src/app/globals.css`

- [ ] **Step 1: Write failing component tests for modal open/close and pagination events**

Create:

- `app/src/components/ui/modal.test.tsx`
- `app/src/components/ui/pagination-controls.test.tsx`
- `app/src/components/ui/filter-bar.test.tsx`
- `app/src/components/ui/list-table.test.tsx`
- `app/src/components/ui/feedback-banner.test.tsx`

Add Vitest + RTL tests for primitive behavior and accessibility roles.

- [ ] **Step 2: Run UI primitive tests and confirm FAIL**

Run: `pnpm --filter @guarda-hard/app test -- src/components/ui/modal.test.tsx src/components/ui/pagination-controls.test.tsx src/components/ui/filter-bar.test.tsx src/components/ui/list-table.test.tsx src/components/ui/feedback-banner.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement minimal primitives and styles**

Keep style aligned with existing CSS tokens.

- [ ] **Step 4: Re-run primitive tests and confirm PASS**

Run: `pnpm --filter @guarda-hard/app test -- src/components/ui/modal.test.tsx src/components/ui/pagination-controls.test.tsx src/components/ui/filter-bar.test.tsx src/components/ui/list-table.test.tsx src/components/ui/feedback-banner.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit shared UI primitives**

```bash
git add app/src/components/ui app/src/app/globals.css
git commit -m "feat(app): add shared modal list pagination and feedback primitives"
```

### Task 8: Implement server list API clients per feature

**Files:**

- Create/Modify feature server files under `app/src/features/*/server`

Concrete targets:

- `app/src/features/departamentos/server/departamentos-list-api.ts`
- `app/src/features/usuarios/server/usuarios-list-api.ts`
- `app/src/features/hardwares/server/hardwares-list-api.ts`
- `app/src/features/emprestimos/server/emprestimos-list-api.ts`
- `app/src/features/emprestimos/server/devolucoes-open-selector-api.ts`

- [ ] **Step 1: Write failing tests for list API client parsing + query construction**

Cover page/filter query string generation and response parsing against schemas.

- [ ] **Step 2: Run server client tests and confirm FAIL**

Run: `pnpm --filter @guarda-hard/app test -- src/features/departamentos/server src/features/usuarios/server src/features/hardwares/server src/features/emprestimos/server`
Expected: FAIL.

- [ ] **Step 3: Implement list API clients with shared schemas**

Use `apiClient` and parse response via shared zod schema.

- [ ] **Step 4: Re-run server client tests and confirm PASS**

Run: `pnpm --filter @guarda-hard/app test -- src/features/departamentos/server src/features/usuarios/server src/features/hardwares/server src/features/emprestimos/server`
Expected: PASS.

- [ ] **Step 5: Commit server list API clients**

```bash
git add app/src/features/*/server app/src/features/*/schemas
git commit -m "feat(app): add server list clients for paginated feature pages"
```

### Task 9: Refactor `departamentos` page to list-first modal flow

**Files:**

- Modify: `app/src/app/(dashboard)/departamentos/page.tsx`
- Modify: `app/src/features/departamentos/components/departamentos-page.tsx`
- Create: `app/src/features/departamentos/components/departamentos-list.tsx`
- Modify: `app/src/features/departamentos/forms/departamento-form.tsx`
- Create/Modify tests for page and form

- [ ] **Step 1: Write failing page tests for list-first + modal create behavior**

Cover:

- route renders list
- top-right `New`
- success closes modal + shows success feedback + triggers `router.refresh()`
- failure keeps modal + preserves values + top error
- query-param model: filter change resets `page=1`, pagination preserves active filters

- [ ] **Step 2: Run feature tests and confirm FAIL**

Run: `pnpm --filter @guarda-hard/app test -- src/features/departamentos`
Expected: FAIL.

- [ ] **Step 3: Implement minimal list-first page + modal flow**

Use `router.refresh()` after successful save.

- [ ] **Step 3.1: Verify route-level server-action wiring remains in `app/src/app/(dashboard)/departamentos/page.tsx`**

- [ ] **Step 4: Re-run feature tests and confirm PASS**

Run: `pnpm --filter @guarda-hard/app test -- src/features/departamentos`
Expected: PASS.

- [ ] **Step 5: Commit departamentos migration**

```bash
git add app/src/app/(dashboard)/departamentos/page.tsx app/src/features/departamentos
git commit -m "feat(app): migrate departamentos to list-first modal create flow"
```

### Task 10: Refactor `usuarios` and `hardwares` pages to same pattern

**Files:**

- Modify route pages and feature components/forms for `usuarios` and `hardwares`
- Create list components for both features
- Add/update tests

- [ ] **Step 1: Write failing tests for users/hardwares list + modal create pattern**

Mandatory assertions in both features:

- route renders list-first view
- top-right `New` button opens modal
- save success closes modal, shows success feedback, and triggers `router.refresh()`
- save failure keeps modal open, preserves values, and shows top-of-modal error
- query-param model: filter change resets `page=1`, pagination preserves active filters

- [ ] **Step 2: Run focused tests and confirm FAIL**

Run: `pnpm --filter @guarda-hard/app test -- src/features/usuarios src/features/hardwares`
Expected: FAIL.

- [ ] **Step 3: Implement minimal users/hardwares list-first flows**
- [ ] **Step 4: Re-run focused tests and confirm PASS**

Run: `pnpm --filter @guarda-hard/app test -- src/features/usuarios src/features/hardwares`
Expected: PASS.

- [ ] **Step 5: Commit users/hardwares migration**

```bash
git add app/src/app/(dashboard)/usuarios/page.tsx app/src/app/(dashboard)/hardwares/page.tsx app/src/features/usuarios app/src/features/hardwares
git commit -m "feat(app): migrate usuarios and hardwares to list-first modal flows"
```

### Task 11: Refactor `emprestimo` page and keep operation-specific list

**Files:**

- Modify `app/src/app/(dashboard)/emprestimo/page.tsx`
- Modify `app/src/features/emprestimos/components/emprestimo-page.tsx`
- Create `app/src/features/emprestimos/components/emprestimos-list.tsx`
- Modify `app/src/features/emprestimos/forms/emprestimo-form.tsx`
- Add/update tests

- [ ] **Step 1: Write failing tests for emprestimo list + modal flow**

Mandatory assertions:

- route renders operation-specific emprestimo list
- list endpoint contract is explicit: `GET /emprestimos` with fixed `status=open`
- top-right `New` button opens modal
- save success closes modal, shows success feedback, triggers `router.refresh()`
- save failure keeps modal open, preserves values, and shows top-of-modal error
- query-param model: filter change resets `page=1`, pagination preserves active filters
- modal open/close state is local component state, not URL state

- [ ] **Step 2: Run focused tests and confirm FAIL**

Run: `pnpm --filter @guarda-hard/app test -- src/features/emprestimos -t "emprestimo"`
Expected: FAIL.

- [ ] **Step 3: Implement minimal emprestimo page flow**
- [ ] **Step 3.1: Verify route-level server-action wiring remains in `app/src/app/(dashboard)/emprestimo/page.tsx`**
- [ ] **Step 4: Re-run tests and confirm PASS**

Run: `pnpm --filter @guarda-hard/app test -- src/features/emprestimos -t "emprestimo"`
Expected: PASS.

- [ ] **Step 5: Commit emprestimo page migration**

```bash
git add app/src/app/(dashboard)/emprestimo/page.tsx app/src/features/emprestimos
git commit -m "feat(app): migrate emprestimo page to list-first modal create"
```

### Task 12: Refactor `devolucao` page with open-emprestimo selector contract

**Files:**

- Modify `app/src/app/(dashboard)/devolucao/page.tsx`
- Modify `app/src/features/emprestimos/components/devolucao-page.tsx`
- Create `app/src/features/emprestimos/components/devolucoes-list.tsx`
- Modify `app/src/features/emprestimos/forms/devolucao-form.tsx`
- Create `app/src/features/emprestimos/server/devolucoes-open-selector-api.ts`
- Add/update tests

- [ ] **Step 1: Write failing tests for devolucao selector + id-path submit flow**

Cover:

- modal requires selecting open emprestimo before enabling submit
- selector is searchable (text query) for open emprestimos
- selector fetch uses fixed `status=open` on all pages/queries
- selector can fetch additional pages of open emprestimos
- route list is devolucao-specific (`GET /emprestimos` with fixed `status=returned`)
- submit calls `/emprestimos/:id/devolucao`
- success closes modal + shows success feedback + triggers `router.refresh()`
- stale id returns error banner while modal stays open
- generic submit failure preserves selected value/input state and keeps modal open
- no-open-emprestimos state disables submit and shows empty-state guidance
- query-param model: filter change resets `page=1`, pagination preserves active filters
- modal open/close state is local component state, not URL state

- [ ] **Step 2: Run focused tests and confirm FAIL**

Run: `pnpm --filter @guarda-hard/app test -- src/features/emprestimos -t "devolucao"`
Expected: FAIL.

- [ ] **Step 3: Implement minimal selector-based devolucao flow**
- [ ] **Step 3.1: Verify route-level server-action wiring remains in `app/src/app/(dashboard)/devolucao/page.tsx`**
- [ ] **Step 4: Re-run tests and confirm PASS**

Run: `pnpm --filter @guarda-hard/app test -- src/features/emprestimos -t "devolucao"`
Expected: PASS.

- [ ] **Step 5: Commit devolucao page migration**

```bash
git add app/src/app/(dashboard)/devolucao/page.tsx app/src/features/emprestimos
git commit -m "feat(app): migrate devolucao page to selector-based modal return flow"
```

### Task 13: Mark PRD stage after frontend flow standardization complete

**Files:**

- Modify: `docs/PRD-GuardaHard.md`

- [ ] **Step 1: Mark current stage checklist item(s) complete in PRD**
- [ ] **Step 2: Commit PRD checkbox update**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark frontend list-modal standardization stage complete"
```

---

## Chunk 3: End-to-End Verification + Quality Gate

### Task 14: Run backend/full app test suites and fix regressions

**Files:**

- Modify: files touched by failing tests only

- [ ] **Step 1: Run API suite**

Run: `pnpm --filter @guarda-hard/api test`
Expected: PASS; if FAIL, capture failing specs and continue to Step 3.

- [ ] **Step 2: Run app suite**

Run: `pnpm --filter @guarda-hard/app test`
Expected: PASS; if FAIL, capture failing specs and continue to Step 3.

- [ ] **Step 3: Fix failures using minimal changes and rerun affected tests**

Run affected test commands until green, then rerun both full suites:

- `pnpm --filter @guarda-hard/api test`
- `pnpm --filter @guarda-hard/app test`

- [ ] **Step 4: Commit regression fixes**

Commit only if code changed.

```bash
git add api app
git commit -m "fix: resolve regressions from list modal flow rollout"
```

### Task 15: Run E2E smoke checks for all five routes

**Files:**

- Create: `app/e2e/list-modal-smoke.spec.ts`
- Create: `app/playwright.config.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Write failing Playwright smoke tests**

Cover:

- `/departamentos`, `/usuarios`, `/hardwares`, `/emprestimo`, `/devolucao` load list-first views
- `New` opens modal in each route
- success path closes modal + refreshes list + newly created row appears in list
- failure path keeps modal open with preserved values and top error
- `/devolucao` id-resolution contract: selected open emprestimo id is used in `POST /emprestimos/:id/devolucao`
- `/devolucao` selector can navigate additional pages and still submit selected id

- [ ] **Step 2: Run e2e smoke suite and confirm FAIL**

Prereq (once per clean environment):

- `pnpm --filter @guarda-hard/app exec playwright install --with-deps`

Run: `pnpm --filter @guarda-hard/app test:e2e -- app/e2e/list-modal-smoke.spec.ts`
Expected: FAIL before implementation is complete.

- [ ] **Step 3: Implement minimum e2e harness/configuration and rerun until PASS**

Run: `pnpm --filter @guarda-hard/app test:e2e -- app/e2e/list-modal-smoke.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit e2e smoke coverage**

```bash
git add app/e2e app/playwright.config.ts app/package.json
git commit -m "test(app): add playwright smoke checks for list modal flows"
```

### Task 16: Build verification

**Files:**

- Modify: files only if build issues require changes

- [ ] **Step 1: Run app build**

Run: `pnpm --filter @guarda-hard/app build`
Expected: PASS.

- [ ] **Step 2: Run api build**

Run: `pnpm --filter @guarda-hard/api build`
Expected: PASS.

- [ ] **Step 3: Commit build-only fixes if required**

```bash
git add api app
git commit -m "fix: address build issues for list and modal implementation"
```

### Task 17: Stage completion bookkeeping and closeout verification

**Files:**

- Modify: `docs/PRD-GuardaHard.md`

- [ ] **Step 1: Run monorepo quality gate before final stage closeout**

Run: `pnpm -r lint && pnpm -r test && pnpm -r build`
Expected: PASS.

- [ ] **Step 2: Mark all relevant stage checklist items complete in PRD immediately after Step 1 passes**
- [ ] **Step 3: Commit final PRD synchronization**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): sync completion after list modal and save reliability rollout"
```

- [ ] **Step 4: Request formal code review**

Invoke `@superpowers/requesting-code-review` and include:

- implemented scope list
- API contract highlights
- known non-critical follow-ups

---

## Plan Review Loop

### Chunk Review 1

- [ ] Dispatch plan-document-reviewer subagent for **Chunk 1** against spec `docs/superpowers/specs/2026-03-13-list-pages-modal-create-design.md`.
- [ ] Apply fixes until reviewer returns approved (max 5 loops).

### Chunk Review 2

- [ ] Dispatch plan-document-reviewer subagent for **Chunk 2**.
- [ ] Apply fixes until approved (max 5 loops).

### Chunk Review 3

- [ ] Dispatch plan-document-reviewer subagent for **Chunk 3**.
- [ ] Apply fixes until approved (max 5 loops).

---

## Risks and Mitigations

- **Risk:** list API contract diverges across modules.
  - **Mitigation:** shared schemas in `packages/schemas`; dedicated API tests per module.

- **Risk:** `devolucao` selector cannot resolve open emprestimo outside first page.
  - **Mitigation:** explicit paged selector contract and tests for page expansion.

- **Risk:** tenant errors still leak as 500 in some paths.
  - **Mitigation:** global exception mapping plus dedicated mapping test suite.

- **Risk:** modal state resets on submit error.
  - **Mitigation:** page-level tests asserting value preservation and open-state persistence.

---

## Definition of Done

- All five target pages are list-first with top-right `New` button and modal create.
- Pagination fixed to 10 with filters on all five pages.
- Save success and error behavior match approved design contract.
- `POST /departamentos` failure path no longer returns opaque 500 for tenant/auth context failures.
- API tests, app tests, and builds pass with pnpm commands.
- PRD checklist updates are recorded immediately after each completed stage.
