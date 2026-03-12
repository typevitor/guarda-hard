# Etapa 3 — Infraestrutura Multi-Tenant Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Etapa 3 from the PRD by introducing tenant context propagation, automatic `empresa_id` injection, and tenant-safe repository access with test coverage.

**Architecture:** Build multi-tenant enforcement in three focused units: `TenantContext` (source of current tenant from JWT claims), `TenantSubscriber` (automatic insert/update safeguards), and `TenantRepository` (always-on `empresa_id` filtering). Keep business/domain rules out of this stage; only infrastructure concerns are in scope. Verify behavior with unit tests first, then integration tests against a real TypeORM + SQLite flow.

**Tech Stack:** NestJS 11, TypeORM 0.3.x, SQLite (better-sqlite3), Vitest, TypeScript strict, pnpm workspaces

---

## Scope Check

Etapa 3 is a single subsystem (multi-tenant persistence infrastructure). Do not pull in API CRUD endpoints, frontend changes, or domain business methods from later etapas.

If you discover missing dependencies from Etapa 2 while executing this plan, fix only what is blocking tenant infrastructure and keep commits minimal.

## Execution Skills (required during implementation)

- `@superpowers/subagent-driven-development` (required when subagents are available)
- `@superpowers/test-driven-development` (before each code change)
- `@superpowers/systematic-debugging` (if any command/test fails unexpectedly)
- `@superpowers/verification-before-completion` (before claiming completion)
- `@superpowers/requesting-code-review` (after implementation is done)

## Preconditions

- Work from a dedicated git worktree created during brainstorming.
- Confirm you are not on `main`/`master` directly.
- Confirm `Etapa 2` is not actively being edited in this same change set.

Run:

```bash
git worktree list
git branch --show-current
```

Expected:

- Current path is the dedicated worktree.
- Branch is a feature branch for Etapa 3.

## File Structure (lock before coding)

### Create

- `api/src/tenant/tenant.types.ts` - shared tenant-related types (`JwtTenantPayload`, `TenantScopedEntity`).
- `api/src/tenant/tenant.errors.ts` - explicit tenant errors used by repository/subscriber.
- `api/src/tenant/tenant-context.ts` - AsyncLocalStorage-backed current tenant accessor.
- `api/src/tenant/tenant-context.spec.ts` - unit tests for context behavior and JWT extraction.
- `api/src/tenant/tenant.repository.ts` - repository wrapper that always filters by `empresa_id`.
- `api/src/tenant/tenant.repository.spec.ts` - tests for automatic tenant filter and cross-tenant update blocking.
- `api/src/tenant/tenant.subscriber.ts` - TypeORM subscriber to inject/validate `empresa_id` on writes.
- `api/src/tenant/tenant.subscriber.spec.ts` - tests for subscriber insert/update behavior.
- `api/src/tenant/tenant.module.ts` - Nest module exporting tenant infrastructure providers.
- `api/src/tenant/tenant.module.spec.ts` - module wiring test that resolves `TenantContext` from `AppModule`.
- `api/src/tenant/index.ts` - barrel exports for tenant infrastructure.
- `api/src/infrastructure/database/database.tenant-subscriber.spec.ts` - verifies `DatabaseModule` registers `TenantSubscriber` in TypeORM DataSource.
- `api/test/tenant/tenant-auto-empresa-id.integration.spec.ts` - integration test for automatic `empresa_id` insertion.
- `api/test/tenant/tenant-cross-tenant-block.integration.spec.ts` - integration test for cross-tenant update block.
- `api/test/tenant/tenant-read-isolation.integration.spec.ts` - integration test proving tenant A cannot read tenant B rows.
- `api/test/tenant/tenant-test-data-source.ts` - test helper to bootstrap isolated in-memory DataSource.

### Modify

- `api/src/app.module.ts` - import `TenantModule` so context providers are available app-wide.
- `api/src/infrastructure/database/database.module.ts` - instantiate/register `TenantSubscriber` with TypeORM DataSource.
- `api/src/infrastructure/database/data-source.ts` - keep entity list intact and add comment-free subscriber compatibility note if needed (prefer no extra changes).
- `docs/PRD-GuardaHard.md` - mark each Etapa 3 checklist item immediately after it is completed.

### Test Targets

- `api/src/tenant/tenant-context.spec.ts`
- `api/src/tenant/tenant.module.spec.ts`
- `api/src/tenant/tenant.subscriber.spec.ts`
- `api/src/tenant/tenant.repository.spec.ts`
- `api/src/infrastructure/database/database.tenant-subscriber.spec.ts`
- `api/test/tenant/tenant-auto-empresa-id.integration.spec.ts`
- `api/test/tenant/tenant-cross-tenant-block.integration.spec.ts`
- `api/test/tenant/tenant-read-isolation.integration.spec.ts`

---

## Chunk 1: Tenant Context Foundation

### Task 1: Implement `TenantContext` with JWT payload support

**Files:**

- Create: `api/src/tenant/tenant.types.ts`
- Create: `api/src/tenant/tenant.errors.ts`
- Create: `api/src/tenant/tenant-context.ts`
- Create: `api/src/tenant/tenant-context.spec.ts`
- Test: `api/src/tenant/tenant-context.spec.ts`

- [ ] **Step 1: Write failing unit tests for context lifecycle and JWT extraction**

```ts
// api/src/tenant/tenant-context.spec.ts
import { describe, expect, it } from 'vitest';
import { TenantContext } from './tenant-context';

describe('TenantContext', () => {
  it('stores and reads empresa_id inside run', async () => {
    const context = new TenantContext();
    await context.run('empresa-a', async () => {
      expect(context.getEmpresaId()).toBe('empresa-a');
      expect(context.requireEmpresaId()).toBe('empresa-a');
    });
  });

  it('throws when tenant is missing', () => {
    const context = new TenantContext();
    expect(() => context.requireEmpresaId()).toThrow('Tenant context is missing empresa_id');
  });

  it('extracts empresa_id from jwt payload', async () => {
    const context = new TenantContext();
    await context.runFromJwtPayload({ sub: 'user-1', empresa_id: 'empresa-jwt' }, async () => {
      expect(context.requireEmpresaId()).toBe('empresa-jwt');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/tenant/tenant-context.spec.ts
```

Expected: FAIL with module-not-found for `./tenant-context`.

- [ ] **Step 3: Implement `tenant.types.ts` and `tenant.errors.ts`**

```ts
// api/src/tenant/tenant.types.ts
export type JwtTenantPayload = {
  sub: string;
  empresa_id: string;
};

export type TenantScopedEntity = {
  id: string;
  empresa_id: string;
};
```

```ts
// api/src/tenant/tenant.errors.ts
export class MissingTenantContextError extends Error {
  constructor() {
    super('Tenant context is missing empresa_id');
  }
}

export class InvalidTenantPayloadError extends Error {
  constructor() {
    super('JWT payload does not contain empresa_id');
  }
}

export class CrossTenantAccessError extends Error {
  constructor() {
    super('Cross-tenant operation blocked');
  }
}
```

- [ ] **Step 4: Implement minimal `TenantContext`**

```ts
// api/src/tenant/tenant-context.ts
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { InvalidTenantPayloadError, MissingTenantContextError } from './tenant.errors';
import type { JwtTenantPayload } from './tenant.types';

type TenantStore = { empresaId: string };

@Injectable()
export class TenantContext {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  run<T>(empresaId: string, fn: () => Promise<T> | T): Promise<T> | T {
    return this.storage.run({ empresaId }, fn);
  }

  runFromJwtPayload<T>(
    payload: Partial<JwtTenantPayload>,
    fn: () => Promise<T> | T,
  ): Promise<T> | T {
    if (!payload.empresa_id) {
      throw new InvalidTenantPayloadError();
    }

    return this.run(payload.empresa_id, fn);
  }

  getEmpresaId(): string | null {
    return this.storage.getStore()?.empresaId ?? null;
  }

  requireEmpresaId(): string {
    const empresaId = this.getEmpresaId();
    if (!empresaId) {
      throw new MissingTenantContextError();
    }
    return empresaId;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/tenant/tenant-context.spec.ts
```

Expected: PASS with 3 tests.

- [ ] **Step 6: Commit**

```bash
git add api/src/tenant/tenant.types.ts api/src/tenant/tenant.errors.ts api/src/tenant/tenant-context.ts api/src/tenant/tenant-context.spec.ts
git commit -m "feat(api): add tenant context with jwt payload support"
```

- [ ] **Step 7: Mark PRD item immediately**

Update `docs/PRD-GuardaHard.md`:

- Mark `Criar TenantContext` as `[x]`.

- [ ] **Step 8: Verify PRD checkbox update is present**

Run:

```bash
pnpm --filter @guarda-hard/api exec node -e "const fs=require('node:fs');const p='../docs/PRD-GuardaHard.md';const t=fs.readFileSync(p,'utf8');if(!t.includes('- [x] Criar TenantContext')){throw new Error('missing checkbox update')}console.log('ok: Criar TenantContext marcado');"
```

Expected: prints `ok: Criar TenantContext marcado`.

### Task 2: Wire tenant providers in a dedicated module

**Files:**

- Create: `api/src/tenant/tenant.module.ts`
- Create: `api/src/tenant/tenant.module.spec.ts`
- Create: `api/src/tenant/index.ts`
- Modify: `api/src/app.module.ts`
- Test: `api/src/tenant/tenant.module.spec.ts`

- [ ] **Step 1: Write failing module wiring test against `AppModule`**

Create:

```ts
// api/src/tenant/tenant.module.spec.ts
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { TenantContext } from './tenant-context';

describe('TenantModule wiring', () => {
  it('resolves TenantContext from AppModule imports', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(TenantContext)).toBeInstanceOf(TenantContext);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/tenant/tenant.module.spec.ts
```

Expected: FAIL because `TenantContext` is not available from `AppModule` yet.

- [ ] **Step 3: Implement `TenantModule` and barrel exports**

- [ ] **Step 3a: Create `TenantModule`**

```ts
// api/src/tenant/tenant.module.ts
import { Module } from '@nestjs/common';
import { TenantContext } from './tenant-context';

@Module({
  providers: [TenantContext],
  exports: [TenantContext],
})
export class TenantModule {}
```

- [ ] **Step 3b: Create tenant barrel exports (`index.ts`)**

```ts
// api/src/tenant/index.ts
export { TenantContext } from './tenant-context';
export { TenantModule } from './tenant.module';
export {
  MissingTenantContextError,
  InvalidTenantPayloadError,
  CrossTenantAccessError,
} from './tenant.errors';
export type { JwtTenantPayload, TenantScopedEntity } from './tenant.types';
```

- [ ] **Step 3c: Add `TenantModule` into `AppModule` imports**

Modify `api/src/app.module.ts` with a minimal additive change only:

- add import line: `import { TenantModule } from './tenant';`
- append `TenantModule` to existing `imports` array without removing any current modules.

Do not rewrite the full file; preserve all existing controllers/providers/imports order except the new module inclusion.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/tenant/tenant.module.spec.ts
```

Expected: PASS with `TenantContext` resolved from `AppModule`.

- [ ] **Step 5: Commit**

```bash
git add api/src/tenant/tenant.module.ts api/src/tenant/tenant.module.spec.ts api/src/tenant/index.ts api/src/app.module.ts
git commit -m "refactor(api): expose tenant module and context exports"
```

## Chunk 2: Tenant Enforcement in TypeORM

### Task 4: Implement `TenantSubscriber` auto-injection and tenant safety checks

**Files:**

- Create: `api/src/tenant/tenant.subscriber.ts`
- Create: `api/src/tenant/tenant.subscriber.spec.ts`
- Test: `api/src/tenant/tenant.subscriber.spec.ts`

- [ ] **Step 1: Expand failing subscriber tests for insert/update behavior**

Create `api/src/tenant/tenant.subscriber.spec.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import type { InsertEvent, UpdateEvent } from 'typeorm';
import { TenantContext } from './tenant-context';
import { CrossTenantAccessError } from './tenant.errors';
import { TenantSubscriber } from './tenant.subscriber';

describe('TenantSubscriber', () => {
  it('injects empresa_id on insert when field is missing', async () => {
    const context = new TenantContext();
    const subscriber = new TenantSubscriber(context);
    const entity: Record<string, unknown> = {};

    await context.run('empresa-a', async () => {
      subscriber.beforeInsert({ entity } as InsertEvent<Record<string, unknown>>);
    });

    expect(entity.empresa_id).toBe('empresa-a');
  });

  it('blocks updates when database row belongs to another tenant', async () => {
    const context = new TenantContext();
    const subscriber = new TenantSubscriber(context);

    await context.run('empresa-b', async () => {
      expect(() =>
        subscriber.beforeUpdate({ databaseEntity: { empresa_id: 'empresa-a' } } as UpdateEvent<
          Record<string, unknown>
        >),
      ).toThrow(CrossTenantAccessError);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/tenant/tenant.subscriber.spec.ts
```

Expected: FAIL until `tenant.subscriber.ts` exists with expected methods.

- [ ] **Step 3: Implement minimal `TenantSubscriber`**

```ts
// api/src/tenant/tenant.subscriber.ts
import {
  EventSubscriber,
  type EntitySubscriberInterface,
  type InsertEvent,
  type UpdateEvent,
} from 'typeorm';
import { TenantContext } from './tenant-context';
import { CrossTenantAccessError } from './tenant.errors';

@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface<Record<string, unknown>> {
  constructor(private readonly tenantContext: TenantContext) {}

  beforeInsert(event: InsertEvent<Record<string, unknown>>): void {
    if (!event.entity) {
      return;
    }

    const currentTenant = this.tenantContext.requireEmpresaId();
    const incomingTenant = event.entity.empresa_id as string | undefined;

    if (!incomingTenant) {
      event.entity.empresa_id = currentTenant;
      return;
    }

    if (incomingTenant !== currentTenant) {
      throw new CrossTenantAccessError();
    }
  }

  beforeUpdate(event: UpdateEvent<Record<string, unknown>>): void {
    if (!event.databaseEntity || !('empresa_id' in event.databaseEntity)) {
      return;
    }

    const currentTenant = this.tenantContext.requireEmpresaId();
    const persistedTenant = event.databaseEntity.empresa_id as string;

    if (persistedTenant !== currentTenant) {
      throw new CrossTenantAccessError();
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/tenant/tenant.subscriber.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/tenant/tenant.subscriber.ts api/src/tenant/tenant.subscriber.spec.ts
git commit -m "feat(api): implement tenant subscriber guards"
```

- [ ] **Step 6: Mark PRD item immediately**

Update `docs/PRD-GuardaHard.md`:

- Mark `Implementar TenantSubscriber` as `[x]`.

- [ ] **Step 7: Verify PRD checkbox update is present**

Run:

```bash
pnpm --filter @guarda-hard/api exec node -e "const fs=require('node:fs');const p='../docs/PRD-GuardaHard.md';const t=fs.readFileSync(p,'utf8');if(!t.includes('- [x] Implementar TenantSubscriber')){throw new Error('missing checkbox update')}console.log('ok: Implementar TenantSubscriber marcado');"
```

Expected: prints `ok: Implementar TenantSubscriber marcado`.

### Task 5: Implement `TenantRepository` automatic filter and safe update API

**Files:**

- Create: `api/src/tenant/tenant.repository.ts`
- Create: `api/src/tenant/tenant.repository.spec.ts`
- Test: `api/src/tenant/tenant.repository.spec.ts`

- [ ] **Step 1: Write failing repository tests for find/update constraints**

```ts
// api/src/tenant/tenant.repository.spec.ts
import { describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { TenantContext } from './tenant-context';
import { CrossTenantAccessError } from './tenant.errors';
import { TenantRepository } from './tenant.repository';

describe('TenantRepository', () => {
  it('adds empresa_id filter to find', async () => {
    const repo = { find: vi.fn().mockResolvedValue([]) } as unknown as Repository<{
      id: string;
      empresa_id: string;
    }>;
    const context = new TenantContext();
    const tenantRepo = new TenantRepository(repo, context);

    await context.run('empresa-a', async () => {
      await tenantRepo.find();
    });

    expect(repo.find).toHaveBeenCalledWith({ where: { empresa_id: 'empresa-a' } });
  });

  it('throws when updateById affects zero rows', async () => {
    const repo = { update: vi.fn().mockResolvedValue({ affected: 0 }) } as unknown as Repository<{
      id: string;
      empresa_id: string;
    }>;
    const context = new TenantContext();
    const tenantRepo = new TenantRepository(repo, context);

    await context.run('empresa-b', async () => {
      await expect(tenantRepo.updateById('id-1', { id: 'id-1' })).rejects.toThrow(
        CrossTenantAccessError,
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/tenant/tenant.repository.spec.ts
```

Expected: FAIL because repository implementation does not exist.

- [ ] **Step 3: Implement minimal `TenantRepository`**

```ts
// api/src/tenant/tenant.repository.ts
import type {
  FindManyOptions,
  FindOptionsWhere,
  QueryDeepPartialEntity,
  Repository,
} from 'typeorm';
import { CrossTenantAccessError } from './tenant.errors';
import { TenantContext } from './tenant-context';
import type { TenantScopedEntity } from './tenant.types';

export class TenantRepository<T extends TenantScopedEntity> {
  constructor(
    private readonly repository: Repository<T>,
    private readonly tenantContext: TenantContext,
  ) {}

  find(options: Omit<FindManyOptions<T>, 'where'> = {}): Promise<T[]> {
    const empresaId = this.tenantContext.requireEmpresaId();
    return this.repository.find({
      ...options,
      where: { empresa_id: empresaId } as FindOptionsWhere<T>,
    });
  }

  async updateById(id: string, patch: QueryDeepPartialEntity<T>): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const result = await this.repository.update(
      { id, empresa_id: empresaId } as FindOptionsWhere<T>,
      patch,
    );
    if (!result.affected) {
      throw new CrossTenantAccessError();
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/tenant/tenant.repository.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/tenant/tenant.repository.ts api/src/tenant/tenant.repository.spec.ts
git commit -m "feat(api): add tenant-aware repository wrapper"
```

- [ ] **Step 6: Mark PRD item immediately**

Update `docs/PRD-GuardaHard.md`:

- Mark `Implementar TenantRepository` as `[x]`.

- [ ] **Step 7: Verify PRD checkbox update is present**

Run:

```bash
pnpm --filter @guarda-hard/api exec node -e "const fs=require('node:fs');const p='../docs/PRD-GuardaHard.md';const t=fs.readFileSync(p,'utf8');if(!t.includes('- [x] Implementar TenantRepository')){throw new Error('missing checkbox update')}console.log('ok: Implementar TenantRepository marcado');"
```

Expected: prints `ok: Implementar TenantRepository marcado`.

### Task 6: Wire subscriber into database module and prove Etapa 3 behaviors with integration tests

**Files:**

- Create: `api/test/tenant/tenant-test-data-source.ts`
- Create: `api/test/tenant/tenant-auto-empresa-id.integration.spec.ts`
- Create: `api/test/tenant/tenant-cross-tenant-block.integration.spec.ts`
- Create: `api/test/tenant/tenant-read-isolation.integration.spec.ts`
- Create: `api/src/infrastructure/database/database.tenant-subscriber.spec.ts`
- Modify: `api/src/infrastructure/database/database.module.ts`
- Modify: `api/src/tenant/index.ts`
- Test: `api/test/tenant/tenant-auto-empresa-id.integration.spec.ts`
- Test: `api/test/tenant/tenant-cross-tenant-block.integration.spec.ts`
- Test: `api/test/tenant/tenant-read-isolation.integration.spec.ts`
- Test: `api/src/infrastructure/database/database.tenant-subscriber.spec.ts`

- [ ] **Step 1: Write failing integration test for automatic `empresa_id` insertion**

```ts
// api/test/tenant/tenant-auto-empresa-id.integration.spec.ts
import { afterEach, describe, expect, it } from 'vitest';
import { Departamento } from '../../src/entities';
import { TenantContext, TenantSubscriber } from '../../src/tenant';
import { createTenantTestDataSource } from './tenant-test-data-source';

describe('Tenant integration - auto empresa_id', () => {
  const tenantContext = new TenantContext();
  const dataSource = createTenantTestDataSource();

  afterEach(async () => {
    if (dataSource.isInitialized) await dataSource.destroy();
  });

  it('injects empresa_id when saving a tenant-scoped entity', async () => {
    await dataSource.initialize();
    dataSource.subscribers.push(new TenantSubscriber(tenantContext));

    await tenantContext.run('empresa-a', async () => {
      const repo = dataSource.getRepository(Departamento);
      const created = repo.create({ nome: 'Suporte' });
      const saved = await repo.save(created);
      expect(saved.empresa_id).toBe('empresa-a');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/tenant/tenant-auto-empresa-id.integration.spec.ts
```

Expected: FAIL because helper and subscriber wiring are missing.

- [ ] **Step 3: Write failing integration test for cross-tenant update blocking**

```ts
// api/test/tenant/tenant-cross-tenant-block.integration.spec.ts
import { afterEach, describe, expect, it } from 'vitest';
import { Departamento } from '../../src/entities';
import { CrossTenantAccessError, TenantContext, TenantSubscriber } from '../../src/tenant';
import { createTenantTestDataSource } from './tenant-test-data-source';

describe('Tenant integration - cross tenant block', () => {
  const tenantContext = new TenantContext();
  const dataSource = createTenantTestDataSource();

  afterEach(async () => {
    if (dataSource.isInitialized) await dataSource.destroy();
  });

  it('prevents update from another tenant', async () => {
    await dataSource.initialize();
    dataSource.subscribers.push(new TenantSubscriber(tenantContext));
    const repo = dataSource.getRepository(Departamento);

    const registro = await tenantContext.run('empresa-a', async () => {
      return repo.save(repo.create({ nome: 'Comercial' }));
    });

    await tenantContext.run('empresa-b', async () => {
      const loaded = await repo.findOneByOrFail({ id: registro.id });
      loaded.nome = 'Comercial B';
      await expect(repo.save(loaded)).rejects.toThrow(CrossTenantAccessError);
    });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/tenant/tenant-cross-tenant-block.integration.spec.ts
```

Expected: FAIL until helper + exports + subscriber behavior are wired.

- [ ] **Step 4a: Write failing integration test for tenant read isolation (`empresa A` cannot read `empresa B`)**

```ts
// api/test/tenant/tenant-read-isolation.integration.spec.ts
import { afterEach, describe, expect, it } from 'vitest';
import { Departamento } from '../../src/entities';
import { TenantContext, TenantRepository } from '../../src/tenant';
import { createTenantTestDataSource } from './tenant-test-data-source';

describe('Tenant integration - read isolation', () => {
  const tenantContext = new TenantContext();
  const dataSource = createTenantTestDataSource();

  afterEach(async () => {
    if (dataSource.isInitialized) await dataSource.destroy();
  });

  it('returns only rows from current tenant', async () => {
    await dataSource.initialize();
    const rawRepo = dataSource.getRepository(Departamento);

    await rawRepo.save([
      rawRepo.create({ empresa_id: 'empresa-a', nome: 'Suporte A' }),
      rawRepo.create({ empresa_id: 'empresa-b', nome: 'Suporte B' }),
    ]);

    const tenantRepo = new TenantRepository(rawRepo, tenantContext);

    await tenantContext.run('empresa-a', async () => {
      const rows = await tenantRepo.find();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.empresa_id).toBe('empresa-a');
    });
  });
});
```

- [ ] **Step 4b: Run read-isolation test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/tenant/tenant-read-isolation.integration.spec.ts
```

Expected: FAIL until helper exists and tenant barrel exports `TenantRepository`.

- [ ] **Step 5a: Implement tenant test DataSource helper**

```ts
// api/test/tenant/tenant-test-data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Departamento, Usuario, Hardware, Emprestimo } from '../../src/entities';

export function createTenantTestDataSource(): DataSource {
  return new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [Departamento, Usuario, Hardware, Emprestimo],
    synchronize: true,
    logging: false,
  });
}
```

- [ ] **Step 5b: Export tenant runtime building blocks in barrel**

Update `api/src/tenant/index.ts` by adding:

```ts
export { TenantSubscriber } from './tenant.subscriber';
export { TenantRepository } from './tenant.repository';
```

- [ ] **Step 5c: Run auto-insert integration test and verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/tenant/tenant-auto-empresa-id.integration.spec.ts
```

Expected: PASS.

- [ ] **Step 5d: Run cross-tenant integration test and verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/tenant/tenant-cross-tenant-block.integration.spec.ts
```

Expected: PASS.

- [ ] **Step 5e: Run read-isolation integration test and verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/tenant/tenant-read-isolation.integration.spec.ts
```

Expected: PASS.

- [ ] **Step 5f: Write failing database module subscriber wiring test**

Create:

```ts
// api/src/infrastructure/database/database.tenant-subscriber.spec.ts
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { TenantSubscriber } from '../../tenant/tenant.subscriber';

describe('DatabaseModule tenant wiring', () => {
  it('registers TenantSubscriber in DataSource subscribers', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const dataSource = moduleRef.get(DataSource);

    expect(
      dataSource.subscribers.some((subscriber) => subscriber instanceof TenantSubscriber),
    ).toBe(true);
  });
});
```

- [ ] **Step 5g: Run database module wiring test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/infrastructure/database/database.tenant-subscriber.spec.ts
```

Expected: FAIL because `DatabaseModule` does not register `TenantSubscriber` yet.

- [ ] **Step 5h: Add direct tenant imports in `database.module.ts`**

In `api/src/infrastructure/database/database.module.ts`, add:

```ts
import { TenantModule } from '../../tenant/tenant.module';
import { TenantContext } from '../../tenant/tenant-context';
import { TenantSubscriber } from '../../tenant/tenant.subscriber';
```

- [ ] **Step 5i: Add `TenantModule` to module imports**

Edit only the `imports` array to include `TenantModule`:

```ts
imports: [TypeOrmModule.forRoot(AppDataSource.options), TenantModule];
```

- [ ] **Step 5j: Register `TenantSubscriber` provider factory**

Modify `api/src/infrastructure/database/database.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppDataSource } from './data-source';
import { TenantModule } from '../../tenant/tenant.module';
import { TenantContext } from '../../tenant/tenant-context';
import { TenantSubscriber } from '../../tenant/tenant.subscriber';

@Module({
  imports: [TypeOrmModule.forRoot(AppDataSource.options), TenantModule],
  providers: [
    {
      provide: TenantSubscriber,
      inject: [DataSource, TenantContext],
      useFactory: (dataSource: DataSource, tenantContext: TenantContext) => {
        const subscriber = new TenantSubscriber(tenantContext);
        dataSource.subscribers.push(subscriber);
        return subscriber;
      },
    },
  ],
})
export class DatabaseModule {}
```

- [ ] **Step 5k: Run database module wiring test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/infrastructure/database/database.tenant-subscriber.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add api/test/tenant/tenant-test-data-source.ts api/test/tenant/tenant-auto-empresa-id.integration.spec.ts api/test/tenant/tenant-cross-tenant-block.integration.spec.ts api/test/tenant/tenant-read-isolation.integration.spec.ts api/src/infrastructure/database/database.module.ts api/src/infrastructure/database/database.tenant-subscriber.spec.ts api/src/tenant/index.ts
git commit -m "test(api): verify tenant insert injection and cross-tenant blocking"
```

- [ ] **Step 7: Mark PRD items immediately**

Update `docs/PRD-GuardaHard.md`:

- Mark `Testar inserção automática de empresa_id` as `[x]`.
- Mark `Testar bloqueio cross tenant` as `[x]`.

- [ ] **Step 8: Verify PRD checkbox updates are present**

Run:

```bash
pnpm --filter @guarda-hard/api exec node -e "const fs=require('node:fs');const p='../docs/PRD-GuardaHard.md';const t=fs.readFileSync(p,'utf8');for(const item of ['Testar inserção automática de empresa_id','Testar bloqueio cross tenant']){if(!t.includes(`- [x] ${item}`)){throw new Error(`missing checkbox update: ${item}`)}}console.log('ok: testes multi-tenant marcados');"
```

Expected: prints `ok: testes multi-tenant marcados`.

- [ ] **Step 9: Verify no accidental checklist drift for Etapa 3**

Run:

```bash
pnpm --filter @guarda-hard/api exec node -e "const fs=require('node:fs');const p='../docs/PRD-GuardaHard.md';const t=fs.readFileSync(p,'utf8');for(const item of ['Criar TenantContext','Implementar TenantSubscriber','Implementar TenantRepository','Testar inserção automática de empresa_id','Testar bloqueio cross tenant']){if(!t.includes(`- [x] ${item}`)){throw new Error(`missing checkbox update: ${item}`)}}console.log('ok: etapa 3 sem drift de checklist');"
```

Expected: prints `ok: etapa 3 sem drift de checklist`.

- [ ] **Step 10: Verify `Implementar TenantSubscriber` checkbox remains checked**

Run:

```bash
pnpm --filter @guarda-hard/api exec node -e "const fs=require('node:fs');const p='../docs/PRD-GuardaHard.md';const t=fs.readFileSync(p,'utf8');if(!t.includes('- [x] Implementar TenantSubscriber')){throw new Error('missing checkbox update')}console.log('ok: Implementar TenantSubscriber permanece marcado');"
```

Expected: prints `ok: Implementar TenantSubscriber permanece marcado`.

### Task 7: Final verification gate and Etapa 3 completion

**Files:**

- Modify: `docs/PRD-GuardaHard.md` (only checklist state updates)

- [ ] **Step 1: Run tenant-focused tests together**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/tenant/tenant-context.spec.ts src/tenant/tenant.subscriber.spec.ts src/tenant/tenant.repository.spec.ts test/tenant/tenant-auto-empresa-id.integration.spec.ts test/tenant/tenant-cross-tenant-block.integration.spec.ts
pnpm --filter @guarda-hard/api test -- test/tenant/tenant-read-isolation.integration.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Verify all Etapa 3 checklist items are checked in PRD**

Run:

```bash
pnpm --filter @guarda-hard/api exec node -e "const fs=require('node:fs');const p='../docs/PRD-GuardaHard.md';const t=fs.readFileSync(p,'utf8');const items=['Criar TenantContext','Implementar TenantSubscriber','Implementar TenantRepository','Testar inserção automática de empresa_id','Testar bloqueio cross tenant'];for(const item of items){if(!t.includes(`- [x] ${item}`)){throw new Error(`missing checkbox update: ${item}`)}}console.log('ok: etapa 3 checklist completo');"
```

Expected: prints `ok: etapa 3 checklist completo`.

- [ ] **Step 3: Commit PRD checklist updates**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 3 multi-tenant checklist as complete"
```

### Optional hardening before merge (recommended, outside Etapa 3 checklist gate)

- Run broader verification to catch unrelated regressions before opening PR:

```bash
pnpm --filter @guarda-hard/api test
pnpm --filter @guarda-hard/api lint
pnpm --filter @guarda-hard/api build
```

---

## Risks and Mitigations

- **Risk:** `TenantContext` is not set before persistence calls in some execution paths.
  - **Mitigation:** Fail fast with `MissingTenantContextError`; keep tests that assert this behavior.
- **Risk:** Subscriber is not registered in runtime DataSource.
  - **Mitigation:** Register subscriber in `DatabaseModule` provider factory and verify via integration tests.
- **Risk:** Repository filtering is bypassed by direct raw repository usage.
  - **Mitigation:** Use `TenantRepository` as default pattern in upcoming API services; flag direct `Repository` usage in review.

## Definition of Done

- Etapa 3 checklist in `docs/PRD-GuardaHard.md` is fully `[x]`.
- `TenantContext`, `TenantSubscriber`, and `TenantRepository` exist and are covered by tests.
- Automatic insert tenant injection and cross-tenant block are proven by integration tests.
- `pnpm --filter @guarda-hard/api test`, `lint`, and `build` all pass.
- No scope creep into Etapa 4+.
