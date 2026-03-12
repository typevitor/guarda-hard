# Architecture Guide

This document defines the target architecture for GuardaHard so agents and developers generate code with consistent module boundaries.

It is intentionally prescriptive. When there is a tradeoff between short-term convenience and architectural clarity, prefer clarity.

## Goals

- Keep backend and frontend organized by business capability, not by technical file type alone.
- Preserve multi-tenant isolation as a first-class concern.
- Keep domain rules explicit and testable.
- Centralize shared contracts in workspace packages.
- Make it easy for AI agents to add features without creating circular dependencies or god modules.

## Monorepo Direction

Use the monorepo as three different responsibility zones:

- `api`: NestJS application, domain rules, persistence, authentication, tenant isolation.
- `app`: Next.js application, user flows, data consumption, forms, presentation.
- `packages`: shared contracts only, with no framework-specific runtime behavior.

Recommended package responsibilities:

- `packages/schemas`: Zod schemas for API payloads, filters, form validation, and response parsing.
- `packages/types`: stable shared types, enums, DTO-like shapes, and utility types.
- Future `packages/domain` only if domain primitives become framework-agnostic and truly shared across backend and frontend. Do not create it prematurely.

## Global Rules

- Organize by feature first, then by layer inside each feature.
- Default to one bounded context per feature: `departamentos`, `usuarios`, `hardwares`, `emprestimos`, `relatorios`, `auth`.
- Avoid cross-feature imports into internal files. Cross-feature collaboration should happen through exported application services, domain services, or shared contracts.
- Keep framework code at the edges. Business rules should not depend directly on Nest decorators or React components.
- All tenant-aware persistence must be mediated by tenant-aware infrastructure. Never rely on callers to remember `empresa_id` manually.
- Keep validation at the boundary and domain invariants in the domain model. Do not collapse both concerns into controllers or UI forms.

## Backend Architecture: NestJS

### Architectural Style

Use a modular monolith with feature modules and clear internal layering.

Recommended dependency direction:

`controllers / route handlers -> application layer -> domain layer -> infrastructure adapters`

The domain layer may define interfaces consumed by the application layer and implemented by infrastructure. Infrastructure must never contain core business decisions.

### Target Folder Structure

Recommended evolution for `api/src`:

```text
api/src
  main.ts
  app.module.ts
  shared/
    application/
    domain/
    infrastructure/
    testing/
  tenant/
    application/
      tenant-context.ts
    infrastructure/
      tenant.subscriber.ts
      tenant.repository.ts
      tenant-request.store.ts
  modules/
    auth/
      auth.module.ts
      application/
      infrastructure/
      presentation/
    departamentos/
      departamentos.module.ts
      application/
        use-cases/
        dto/
        mappers/
      domain/
        entities/
        repositories/
        services/
        errors/
      infrastructure/
        persistence/
          departamento.orm-entity.ts
          departamento.typeorm-repository.ts
      presentation/
        http/
          departamentos.controller.ts
    usuarios/
    hardwares/
    emprestimos/
    relatorios/
  infrastructure/
    database/
      data-source.ts
      database.module.ts
      migrations/
```

### Backend Layer Responsibilities

#### `modules/<feature>/domain`

Contains the business model and nothing framework-specific.

- Entities and value objects.
- Domain services for business rules spanning multiple entities.
- Repository interfaces, never TypeORM implementations.
- Domain errors such as hardware unavailable or devolucao duplicada.

Rules:

- Domain methods enforce invariants like `emprestar`, `devolver`, `marcarDefeito`, `consertar`.
- Avoid direct database access.
- Avoid Nest decorators.

#### `modules/<feature>/application`

Orchestrates use cases.

- Use cases like `CreateHardwareUseCase`, `EmprestarHardwareUseCase`, `DevolverHardwareUseCase`.
- Input and output DTOs tailored to the application boundary.
- Transaction orchestration when multiple repositories are involved.
- Authorization and tenant context checks if they are use-case concerns.

Rules:

- One use case per business action.
- Inject repository interfaces and service interfaces through tokens.
- Return stable output shapes, not ORM entities.

#### `modules/<feature>/infrastructure`

Contains concrete adapters.

- TypeORM entities and mappings.
- Repository implementations.
- Query builders for reporting or search.
- Integration with auth, files, messaging, or external APIs.

Rules:

- Translate between persistence models and domain models.
- Keep ORM-specific decorators here instead of leaking them into the domain.
- Optimize read queries here, not in controllers.

#### `modules/<feature>/presentation`

Contains transport-specific entrypoints.

- REST controllers.
- Request parsing and response serialization.
- Guards, interceptors, pipes, and presenters specific to HTTP.

Rules:

- Controllers stay thin.
- Controllers call a use case and map result to response.
- No business rules in controllers.

### Tenant Architecture

Tenant isolation must be implemented as infrastructure plus application policy, not just convention.

Recommended split:

- `tenant/application/tenant-context.ts`: current tenant contract used by use cases.
- `tenant/infrastructure/tenant-request.store.ts`: request-scoped or async-context-backed tenant storage populated from JWT.
- `tenant/infrastructure/tenant.subscriber.ts`: injects `empresa_id` on inserts and rejects invalid cross-tenant updates.
- `tenant/infrastructure/tenant.repository.ts`: base repository behavior that automatically scopes tenant-aware queries.

Rules:

- `empresa_id` comes from authenticated context, never from request payload for protected resources.
- Every tenant-aware aggregate must either extend a shared tenant-owned base model or expose `empresaId` consistently.
- Reporting queries must include tenant filters at the query-construction level.

### Persistence Strategy

For this project, keep a strict distinction between:

- Domain entities: plain TypeScript classes for behavior.
- ORM entities: TypeORM persistence classes for storage.

This adds mapping work, but it prevents TypeORM concerns from becoming the domain model and scales better once behavior grows.

If the team chooses to keep TypeORM entities as the initial domain model for speed, that should be treated as a temporary simplification and isolated per feature. Do not mix both approaches in the same feature.

### Shared Backend Utilities

Use `api/src/shared` only for cross-cutting concerns that are truly generic:

- base domain errors
- result helpers
- pagination primitives
- test factories and fixtures
- common guards, interceptors, filters, and pipes

Do not move feature logic into `shared` just because two modules might reuse it once.

### Testing Strategy for NestJS

Keep tests aligned to the architecture:

- Domain tests validate entity rules without Nest or database.
- Application tests validate use cases with fake repositories.
- Infrastructure tests validate TypeORM mappings, migrations, and tenant enforcement.
- E2E tests validate HTTP flows and tenant isolation.

Recommended location pattern:

- unit tests near the file when focused and small
- larger integration tests under feature-level `__tests__` or existing `test/` structure

### Backend Anti-Patterns To Avoid

- A shared `CrudService` that centralizes unrelated business logic.
- Importing TypeORM repositories directly into controllers.
- Circular module imports between `hardwares` and `emprestimos`.
- Putting tenant filtering in each controller manually.
- Creating a generic `common` folder that becomes a dumping ground.

## Frontend Architecture: Next.js + React

### Architectural Style

Use the App Router with server-first rendering and feature-oriented client code.

Recommended split:

- `app/src/app`: routing, layouts, route-level loading and error boundaries.
- `app/src/features`: business features and UI slices.
- `app/src/components`: low-level reusable UI primitives only.
- `app/src/lib`: framework-agnostic frontend utilities.

### Target Folder Structure

Recommended evolution for `app/src`:

```text
app/src
  app/
    (dashboard)/
      layout.tsx
      page.tsx
      hardwares/
        page.tsx
        loading.tsx
        error.tsx
      usuarios/
        page.tsx
      emprestimos/
        page.tsx
    login/
      page.tsx
    api/
  features/
    auth/
      components/
      hooks/
      server/
      schemas/
    hardwares/
      components/
      forms/
      hooks/
      server/
      mappers/
      schemas/
    usuarios/
    departamentos/
    emprestimos/
    relatorios/
  components/
    ui/
    layout/
  lib/
    api/
      client.ts
      fetcher.ts
      errors.ts
    env/
    format/
    utils/
```

### Frontend Layer Responsibilities

#### `app/`

Owns route composition.

- route segments
- layouts
- loading and error boundaries
- page-level data orchestration

Rules:

- Keep pages thin and compositional.
- Use Server Components by default.
- Add `'use client'` only where browser interactivity is required.

#### `features/<feature>/server`

Contains server-side data access and route-level orchestration.

- API calls to the Nest backend.
- response parsing with shared Zod schemas.
- server actions only when they fit the product constraints.

Rules:

- Centralize HTTP calls per feature.
- Parse backend responses instead of trusting raw JSON.
- Keep token and session handling out of presentational components.

#### `features/<feature>/components`

Contains feature-specific visual building blocks.

- tables
- cards
- details panels
- page sections

Rules:

- Reusable inside the feature first.
- Promote to `components/ui` only if the component is truly generic.

#### `features/<feature>/forms`

Contains form composition.

- React Hook Form setup
- field groups
- feature-specific validation mapping

Rules:

- Use shared Zod schemas when possible.
- Keep submit behavior separate from field rendering when the form becomes complex.

#### `features/<feature>/hooks`

Contains client-side interaction hooks.

- local state
- optimistic UX helpers
- view-model hooks

Rules:

- Do not put all data fetching in client hooks by default.
- Prefer server-rendered data and pass serialized props into interactive islands.

### Frontend Data Flow

Recommended default flow:

1. Route `page.tsx` loads required data on the server.
2. Feature server functions call the backend and parse results.
3. The page passes stable props to feature components.
4. Small client components handle interactivity such as filters, dialogs, and form submission.

Prefer this over a fully client-fetched SPA architecture because the product is operational, form-heavy, and better served by predictable server-rendered pages.

### UI Composition Rules

- `components/ui` should contain only generic primitives like button, input, table shell, dialog shell.
- `components/layout` should contain shell pieces like sidebar, header, breadcrumb, page frame.
- Business names like `HardwareStatusCard` belong in `features/hardwares/components`, not in global components.

### Frontend Error Handling

- Use route-level `error.tsx` and `loading.tsx` where it improves recovery.
- Normalize backend errors in `lib/api/errors.ts`.
- Keep auth redirects and unauthorized handling centralized.

### Frontend Testing Strategy

- Validate feature mappers and helpers with unit tests.
- Test form validation and submission behavior at feature level.
- Keep page tests focused on orchestration, not low-level implementation details.
- Prefer contract tests around API parsing if backend payload stability matters.

### Frontend Anti-Patterns To Avoid

- A giant `lib/api.ts` with every backend call in one file.
- Marking whole pages as client components because one button needs state.
- Putting business feature components under `components/` too early.
- Repeating ad hoc fetch and parse logic in every page.

## Shared Contracts Between Backend and Frontend

Use `packages/schemas` and `packages/types` as the formal contract boundary.

Recommended rule:

- backend owns business behavior and persistence
- shared packages own portable contracts
- frontend consumes contracts but does not import backend runtime code

Good shared candidates:

- request schemas
- filter schemas
- response schemas
- enums such as hardware status
- pagination contracts

Bad shared candidates:

- Nest services
- TypeORM entities
- React hooks
- backend repository implementations

## Recommended Module Breakdown For GuardaHard

Backend feature modules:

- `auth`
- `departamentos`
- `usuarios`
- `hardwares`
- `emprestimos`
- `relatorios`
- `tenant`

Frontend feature modules:

- `auth`
- `dashboard`
- `departamentos`
- `usuarios`
- `hardwares`
- `emprestimos`
- `relatorios`

Important relationship rule:

- `emprestimos` may coordinate `usuarios` and `hardwares`, but the business action of lending and returning hardware should remain owned by the emprestimos application/domain flow rather than duplicated across modules.

## Suggested Implementation Order

1. Stabilize tenant infrastructure in the backend.
2. Move current backend code into feature modules and keep AppModule as composition only.
3. Introduce application use cases for the main hardware and emprestimo flows.
4. Build shared schemas for filters, commands, and responses.
5. Create frontend route groups and feature folders before expanding pages.
6. Add generic UI primitives only after at least two feature usages justify them.

## Decision Summary

For this repository, the best modular architecture is:

- NestJS as a modular monolith with feature modules and internal domain/application/infrastructure/presentation separation.
- Next.js as a server-first App Router application with route composition in `app` and business code in `features`.
- Shared contracts in workspace packages, never shared framework runtime code.
- Tenant isolation enforced centrally in infrastructure and verified by tests.

Agents should follow this document before scaffolding new features or reorganizing existing code.
