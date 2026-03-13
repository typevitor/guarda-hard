# DDD / Clean Architecture Refactor — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the API from a flat entity layout to feature-module DDD layering with separated domain and ORM entities, mappers, and repository interfaces.

**Architecture:** Feature-module layered. Each module (`hardwares`, `emprestimos`, `departamentos`, `usuarios`) contains `domain/`, `application/`, `infrastructure/`, and `presentation/` layers. Domain entities are plain TS classes; ORM entities have TypeORM decorators. Mappers bridge them. Repository interfaces in domain, implementations in infrastructure.

**Tech Stack:** NestJS 11, TypeORM 0.3, better-sqlite3, Vitest, pnpm

**Spec:** `docs/superpowers/specs/2026-03-12-ddd-clean-architecture-refactor-design.md`

---

## Chunk 1: Shared Foundation + Tenant Restructure

### Task 1: Create shared domain base classes

**Files:**

- Create: `api/src/shared/domain/domain-entity.base.ts`
- Create: `api/src/shared/domain/domain-error.base.ts`
- Create: `api/src/shared/shared.module.ts`

- [ ] **Step 1: Create `DomainEntity` base class**

```typescript
// api/src/shared/domain/domain-entity.base.ts
export abstract class DomainEntity {
  readonly id: string;
  readonly empresaId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  protected constructor(props: {
    id: string;
    empresaId: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props.id;
    this.empresaId = props.empresaId;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }
}
```

- [ ] **Step 2: Create `DomainError` base class**

```typescript
// api/src/shared/domain/domain-error.base.ts
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

- [ ] **Step 3: Create `SharedModule`**

```typescript
// api/src/shared/shared.module.ts
import { Module } from '@nestjs/common';

@Module({})
export class SharedModule {}
```

- [ ] **Step 4: Write test for DomainEntity**

```typescript
// api/src/shared/domain/domain-entity.base.spec.ts
import { describe, expect, it } from 'vitest';
import { DomainEntity } from './domain-entity.base';

class TestEntity extends DomainEntity {
  constructor(props: { id: string; empresaId: string; createdAt?: Date; updatedAt?: Date }) {
    super(props);
  }
}

describe('DomainEntity', () => {
  it('assigns id and empresaId from props', () => {
    const entity = new TestEntity({ id: 'abc', empresaId: 'emp-1' });
    expect(entity.id).toBe('abc');
    expect(entity.empresaId).toBe('emp-1');
  });

  it('defaults createdAt and updatedAt to current date', () => {
    const before = new Date();
    const entity = new TestEntity({ id: 'abc', empresaId: 'emp-1' });
    const after = new Date();
    expect(entity.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(entity.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(entity.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('uses provided createdAt and updatedAt', () => {
    const created = new Date('2025-01-01');
    const updated = new Date('2025-06-01');
    const entity = new TestEntity({
      id: 'abc',
      empresaId: 'emp-1',
      createdAt: created,
      updatedAt: updated,
    });
    expect(entity.createdAt).toEqual(created);
    expect(entity.updatedAt).toEqual(updated);
  });
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter api exec vitest run src/shared/domain/domain-entity.base.spec.ts`
Expected: PASS

- [ ] **Step 6: Write test for DomainError**

```typescript
// api/src/shared/domain/domain-error.base.spec.ts
import { describe, expect, it } from 'vitest';
import { DomainError } from './domain-error.base';

class TestError extends DomainError {
  constructor() {
    super('test message');
  }
}

describe('DomainError', () => {
  it('sets name to subclass name', () => {
    const error = new TestError();
    expect(error.name).toBe('TestError');
    expect(error.message).toBe('test message');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
  });
});
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm --filter api exec vitest run src/shared/domain/domain-error.base.spec.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add api/src/shared/
git commit -m "feat(api): add shared domain base classes (DomainEntity, DomainError)"
```

---

### Task 2: Restructure tenant module into application/infrastructure subdirectories

**Files:**

- Move: `api/src/tenant/tenant-context.ts` → `api/src/tenant/application/tenant-context.ts`
- Move: `api/src/tenant/tenant.subscriber.ts` → `api/src/tenant/infrastructure/tenant.subscriber.ts`
- Move: `api/src/tenant/tenant.repository.ts` → `api/src/tenant/infrastructure/tenant.repository.ts`
- Move: `api/src/tenant/tenant.types.ts` → `api/src/tenant/infrastructure/tenant.types.ts`
- Move: `api/src/tenant/tenant.errors.ts` → `api/src/tenant/infrastructure/tenant.errors.ts`
- Modify: `api/src/tenant/tenant.module.ts` (update imports)
- Modify: `api/src/tenant/index.ts` (update re-exports)
- Move: `api/src/tenant/tenant-context.spec.ts` → `api/src/tenant/application/tenant-context.spec.ts`
- Move: `api/src/tenant/tenant.subscriber.spec.ts` → `api/src/tenant/infrastructure/tenant.subscriber.spec.ts`
- Move: `api/src/tenant/tenant.repository.spec.ts` → `api/src/tenant/infrastructure/tenant.repository.spec.ts`
- Move: `api/src/tenant/tenant.module.spec.ts` → `api/src/tenant/tenant.module.spec.ts` (stays)
- Modify: `api/src/infrastructure/database/database.module.ts` (update imports)

- [ ] **Step 1: Create subdirectories**

```bash
mkdir -p api/src/tenant/application api/src/tenant/infrastructure
```

- [ ] **Step 2: Move tenant-context to application/**

```bash
git mv api/src/tenant/tenant-context.ts api/src/tenant/application/tenant-context.ts
```

- [ ] **Step 3: Move infrastructure files**

```bash
git mv api/src/tenant/tenant.subscriber.ts api/src/tenant/infrastructure/tenant.subscriber.ts
git mv api/src/tenant/tenant.repository.ts api/src/tenant/infrastructure/tenant.repository.ts
git mv api/src/tenant/tenant.types.ts api/src/tenant/infrastructure/tenant.types.ts
git mv api/src/tenant/tenant.errors.ts api/src/tenant/infrastructure/tenant.errors.ts
```

- [ ] **Step 4: Move test files alongside their source**

```bash
git mv api/src/tenant/tenant-context.spec.ts api/src/tenant/application/tenant-context.spec.ts
git mv api/src/tenant/tenant.subscriber.spec.ts api/src/tenant/infrastructure/tenant.subscriber.spec.ts
git mv api/src/tenant/tenant.repository.spec.ts api/src/tenant/infrastructure/tenant.repository.spec.ts
```

Note: `tenant.module.spec.ts` stays at `api/src/tenant/tenant.module.spec.ts`.

- [ ] **Step 5: Update `tenant.module.ts` import path**

```typescript
// api/src/tenant/tenant.module.ts
import { Module } from '@nestjs/common';
import { TenantContext } from './application/tenant-context';

@Module({
  providers: [TenantContext],
  exports: [TenantContext],
})
export class TenantModule {}
```

- [ ] **Step 6: Update `tenant/index.ts` barrel export paths**

```typescript
// api/src/tenant/index.ts
export { TenantContext } from './application/tenant-context';
export { TenantModule } from './tenant.module';
export { TenantSubscriber } from './infrastructure/tenant.subscriber';
export { TenantRepository } from './infrastructure/tenant.repository';
export {
  MissingTenantContextError,
  InvalidTenantPayloadError,
  CrossTenantAccessError,
} from './infrastructure/tenant.errors';
export type { JwtTenantPayload, TenantScopedEntity } from './infrastructure/tenant.types';
```

- [ ] **Step 7: Update internal import paths in moved files**

Update `api/src/tenant/application/tenant-context.ts`:

```typescript
// Change:
import { InvalidTenantPayloadError, MissingTenantContextError } from './tenant.errors';
import type { JwtTenantPayload } from './tenant.types';
// To:
import {
  InvalidTenantPayloadError,
  MissingTenantContextError,
} from '../infrastructure/tenant.errors';
import type { JwtTenantPayload } from '../infrastructure/tenant.types';
```

Update `api/src/tenant/infrastructure/tenant.subscriber.ts`:

```typescript
// Change:
import { CrossTenantAccessError } from './tenant.errors';
import { TenantContext } from './tenant-context';
// To:
import { CrossTenantAccessError } from './tenant.errors';
import { TenantContext } from '../application/tenant-context';
```

Update `api/src/tenant/infrastructure/tenant.repository.ts`:

```typescript
// Change:
import { CrossTenantAccessError } from './tenant.errors';
import { TenantContext } from './tenant-context';
import type { TenantScopedEntity } from './tenant.types';
// To:
import { CrossTenantAccessError } from './tenant.errors';
import { TenantContext } from '../application/tenant-context';
import type { TenantScopedEntity } from './tenant.types';
```

- [ ] **Step 8: Update internal import paths in moved test files**

Update `api/src/tenant/application/tenant-context.spec.ts` — change any relative imports from `./tenant-context` to stay `./tenant-context` (same dir), and update error/types imports to `../infrastructure/...`.

Update `api/src/tenant/infrastructure/tenant.subscriber.spec.ts` — change imports of `TenantContext` from `./tenant-context` to `../application/tenant-context`, and `TenantSubscriber` from `./tenant.subscriber` stays `./tenant.subscriber`.

Update `api/src/tenant/infrastructure/tenant.repository.spec.ts` — change imports of `TenantContext` from `./tenant-context` to `../application/tenant-context`, `TenantRepository` stays `./tenant.repository`, `CrossTenantAccessError` stays `./tenant.errors`.

Update `api/src/tenant/tenant.module.spec.ts` — change import of `TenantContext` from `./tenant-context` to `./application/tenant-context`.

- [ ] **Step 9: Update `database.module.ts` imports**

The `database.module.ts` currently imports directly from files, not the barrel. Update:

```typescript
// api/src/infrastructure/database/database.module.ts
// Change:
import { TenantModule } from '../../tenant/tenant.module';
import { TenantContext } from '../../tenant/tenant-context';
import { TenantSubscriber } from '../../tenant/tenant.subscriber';
// To:
import { TenantModule } from '../../tenant/tenant.module';
import { TenantContext } from '../../tenant/application/tenant-context';
import { TenantSubscriber } from '../../tenant/infrastructure/tenant.subscriber';
```

- [ ] **Step 10: Run all existing tenant tests**

Run: `pnpm --filter api exec vitest run src/tenant/ test/tenant/`
Expected: All tests PASS (same behavior, just relocated files)

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor(api): restructure tenant module into application/infrastructure layers"
```

---

### Task 3: Move migrations into infrastructure/database/

**Files:**

- Move: `api/src/migrations/` → `api/src/infrastructure/database/migrations/`
- Modify: `api/src/infrastructure/database/data-source.ts` (update migrations glob path)

- [ ] **Step 1: Move migrations directory**

```bash
git mv api/src/migrations api/src/infrastructure/database/migrations
```

- [ ] **Step 2: Update migrations glob path in data-source.ts**

```typescript
// api/src/infrastructure/database/data-source.ts
// Change:
const migrationsGlobPath = path.resolve(__dirname, '../../migrations/*{.ts,.js}');
// To:
const migrationsGlobPath = path.resolve(__dirname, './migrations/*{.ts,.js}');
```

- [ ] **Step 3: Run migration-related tests**

Run: `pnpm --filter api exec vitest run test/database/`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(api): move migrations into infrastructure/database/"
```

---

## Chunk 2: Domain Entities + Domain Errors

### Task 4: Create Hardware domain entity and errors

**Files:**

- Create: `api/src/modules/hardwares/domain/errors/hardware-nao-disponivel.error.ts`
- Create: `api/src/modules/hardwares/domain/errors/hardware-defeituoso.error.ts`
- Create: `api/src/modules/hardwares/domain/errors/descricao-problema-obrigatoria.error.ts`
- Create: `api/src/modules/hardwares/domain/entities/hardware.entity.ts`
- Create: `api/src/modules/hardwares/domain/entities/hardware.entity.spec.ts`

- [ ] **Step 1: Create hardware domain error files**

```typescript
// api/src/modules/hardwares/domain/errors/hardware-nao-disponivel.error.ts
import { DomainError } from '../../../../shared/domain/domain-error.base';

export class HardwareNaoDisponivelError extends DomainError {
  constructor() {
    super('Hardware nao esta disponivel para emprestimo');
  }
}
```

```typescript
// api/src/modules/hardwares/domain/errors/hardware-defeituoso.error.ts
import { DomainError } from '../../../../shared/domain/domain-error.base';

export class HardwareDefeituosoError extends DomainError {
  constructor() {
    super('Hardware defeituoso nao pode ser emprestado');
  }
}
```

```typescript
// api/src/modules/hardwares/domain/errors/descricao-problema-obrigatoria.error.ts
import { DomainError } from '../../../../shared/domain/domain-error.base';

export class DescricaoProblemaObrigatoriaError extends DomainError {
  constructor() {
    super('Descricao do problema e obrigatoria');
  }
}
```

- [ ] **Step 2: Create Hardware domain entity**

Copy the full `Hardware` class from spec lines 218-334 into `api/src/modules/hardwares/domain/entities/hardware.entity.ts`. This includes:

- `HardwareProps` and `CreateHardwareProps` interfaces
- `Hardware` class extending `DomainEntity`
- All domain methods: `emprestar()`, `devolver()`, `marcarDefeito()`, `consertar()`
- All getters
- `static create()` factory with `randomUUID()`

- [ ] **Step 3: Write failing test for Hardware domain entity**

```typescript
// api/src/modules/hardwares/domain/entities/hardware.entity.spec.ts
import { describe, expect, it } from 'vitest';
import { Hardware } from './hardware.entity';
import { HardwareNaoDisponivelError } from '../errors/hardware-nao-disponivel.error';
import { HardwareDefeituosoError } from '../errors/hardware-defeituoso.error';
import { DescricaoProblemaObrigatoriaError } from '../errors/descricao-problema-obrigatoria.error';
import { DomainError } from '../../../../shared/domain/domain-error.base';

function makeHardware(
  overrides: Partial<import('./hardware.entity').HardwareProps> = {},
): Hardware {
  return new Hardware({
    id: 'hw-1',
    empresaId: 'empresa-a',
    descricao: 'Notebook Dell',
    marca: 'Dell',
    modelo: 'Latitude 5520',
    codigoPatrimonio: 'PAT-001',
    funcionando: true,
    descricaoProblema: null,
    livre: true,
    version: 1,
    ...overrides,
  });
}

describe('Hardware domain entity', () => {
  describe('create factory', () => {
    it('creates hardware with generated UUID and default values', () => {
      const hw = Hardware.create({
        empresaId: 'empresa-a',
        descricao: 'Notebook Dell',
        marca: 'Dell',
        modelo: 'Latitude 5520',
        codigoPatrimonio: 'PAT-001',
      });
      expect(hw.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(hw.empresaId).toBe('empresa-a');
      expect(hw.funcionando).toBe(true);
      expect(hw.livre).toBe(true);
      expect(hw.descricaoProblema).toBeNull();
      expect(hw.version).toBe(0);
    });
  });

  describe('emprestar', () => {
    it('marks hardware as not free', () => {
      const hw = makeHardware();
      hw.emprestar();
      expect(hw.livre).toBe(false);
    });

    it('rejects when hardware is broken', () => {
      const hw = makeHardware({ funcionando: false });
      expect(() => hw.emprestar()).toThrow(HardwareDefeituosoError);
    });

    it('rejects when hardware is already occupied', () => {
      const hw = makeHardware({ livre: false });
      expect(() => hw.emprestar()).toThrow(HardwareNaoDisponivelError);
    });
  });

  describe('devolver', () => {
    it('marks hardware as free', () => {
      const hw = makeHardware({ livre: false });
      hw.devolver();
      expect(hw.livre).toBe(true);
    });
  });

  describe('marcarDefeito', () => {
    it('marks hardware as broken and unavailable with problem description', () => {
      const hw = makeHardware();
      hw.marcarDefeito('nao liga');
      expect(hw.funcionando).toBe(false);
      expect(hw.livre).toBe(false);
      expect(hw.descricaoProblema).toBe('nao liga');
    });

    it('requires non-empty problem description', () => {
      const hw = makeHardware();
      expect(() => hw.marcarDefeito('   ')).toThrow(DescricaoProblemaObrigatoriaError);
    });
  });

  describe('consertar', () => {
    it('repairs hardware and returns it to available state', () => {
      const hw = makeHardware({ funcionando: false, livre: false, descricaoProblema: 'nao liga' });
      hw.consertar();
      expect(hw.funcionando).toBe(true);
      expect(hw.livre).toBe(true);
      expect(hw.descricaoProblema).toBeNull();
    });
  });

  describe('domain errors extend DomainError', () => {
    it('HardwareDefeituosoError is a DomainError', () => {
      expect(new HardwareDefeituosoError()).toBeInstanceOf(DomainError);
    });

    it('HardwareNaoDisponivelError is a DomainError', () => {
      expect(new HardwareNaoDisponivelError()).toBeInstanceOf(DomainError);
    });

    it('DescricaoProblemaObrigatoriaError is a DomainError', () => {
      expect(new DescricaoProblemaObrigatoriaError()).toBeInstanceOf(DomainError);
    });
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter api exec vitest run src/modules/hardwares/domain/entities/hardware.entity.spec.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/hardwares/domain/
git commit -m "feat(api): add Hardware domain entity with errors"
```

---

### Task 5: Create Emprestimo domain entity and errors

**Files:**

- Create: `api/src/modules/emprestimos/domain/errors/emprestimo-ja-devolvido.error.ts`
- Create: `api/src/modules/emprestimos/domain/entities/emprestimo.entity.ts`
- Create: `api/src/modules/emprestimos/domain/entities/emprestimo.entity.spec.ts`

- [ ] **Step 1: Create emprestimo domain error file**

```typescript
// api/src/modules/emprestimos/domain/errors/emprestimo-ja-devolvido.error.ts
import { DomainError } from '../../../../shared/domain/domain-error.base';

export class EmprestimoJaDevolvidoError extends DomainError {
  constructor() {
    super('Emprestimo ja foi devolvido');
  }
}
```

- [ ] **Step 2: Create Emprestimo domain entity**

Copy the full `Emprestimo` class from spec lines 348-408 into `api/src/modules/emprestimos/domain/entities/emprestimo.entity.ts`. This includes:

- `EmprestimoProps` interface
- `Emprestimo` class extending `DomainEntity`
- `static emprestar()` factory (no Hardware parameter — generates UUID, sets default date)
- `devolver()` method (no Hardware parameter — just sets dataDevolucao)
- Getters: `estaDevolvido`, `dataRetirada`, `dataDevolucao`

- [ ] **Step 3: Write test for Emprestimo domain entity**

Tests are rewritten to test Emprestimo independently (no cross-aggregate Hardware coordination):

```typescript
// api/src/modules/emprestimos/domain/entities/emprestimo.entity.spec.ts
import { describe, expect, it } from 'vitest';
import { Emprestimo } from './emprestimo.entity';
import { EmprestimoJaDevolvidoError } from '../errors/emprestimo-ja-devolvido.error';
import { DomainError } from '../../../../shared/domain/domain-error.base';

describe('Emprestimo domain entity', () => {
  describe('emprestar factory', () => {
    it('creates loan with generated UUID and default date', () => {
      const before = new Date();
      const emp = Emprestimo.emprestar({
        empresaId: 'empresa-a',
        usuarioId: 'usuario-1',
        hardwareId: 'hardware-1',
      });
      const after = new Date();

      expect(emp.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(emp.empresaId).toBe('empresa-a');
      expect(emp.usuarioId).toBe('usuario-1');
      expect(emp.hardwareId).toBe('hardware-1');
      expect(emp.dataRetirada.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(emp.dataRetirada.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(emp.dataDevolucao).toBeNull();
      expect(emp.estaDevolvido).toBe(false);
    });

    it('accepts explicit dataRetirada', () => {
      const retirada = new Date('2026-03-12T12:00:00.000Z');
      const emp = Emprestimo.emprestar({
        empresaId: 'empresa-a',
        usuarioId: 'usuario-1',
        hardwareId: 'hardware-1',
        dataRetirada: retirada,
      });
      expect(emp.dataRetirada).toEqual(retirada);
    });
  });

  describe('devolver', () => {
    it('sets return date', () => {
      const emp = Emprestimo.emprestar({
        empresaId: 'empresa-a',
        usuarioId: 'usuario-1',
        hardwareId: 'hardware-1',
      });
      const devolucao = new Date('2026-03-13T12:00:00.000Z');
      emp.devolver(devolucao);
      expect(emp.dataDevolucao).toEqual(devolucao);
      expect(emp.estaDevolvido).toBe(true);
    });

    it('defaults return date to now', () => {
      const emp = Emprestimo.emprestar({
        empresaId: 'empresa-a',
        usuarioId: 'usuario-1',
        hardwareId: 'hardware-1',
      });
      const before = new Date();
      emp.devolver();
      const after = new Date();
      expect(emp.dataDevolucao!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(emp.dataDevolucao!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('rejects duplicate return', () => {
      const emp = Emprestimo.emprestar({
        empresaId: 'empresa-a',
        usuarioId: 'usuario-1',
        hardwareId: 'hardware-1',
      });
      emp.devolver(new Date('2026-03-13T12:00:00.000Z'));
      expect(() => emp.devolver(new Date('2026-03-14T12:00:00.000Z'))).toThrow(
        EmprestimoJaDevolvidoError,
      );
    });
  });

  describe('domain errors extend DomainError', () => {
    it('EmprestimoJaDevolvidoError is a DomainError', () => {
      expect(new EmprestimoJaDevolvidoError()).toBeInstanceOf(DomainError);
    });
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter api exec vitest run src/modules/emprestimos/domain/entities/emprestimo.entity.spec.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/emprestimos/domain/
git commit -m "feat(api): add Emprestimo domain entity with errors"
```

---

### Task 6: Create Departamento and Usuario domain entities

**Files:**

- Create: `api/src/modules/departamentos/domain/entities/departamento.entity.ts`
- Create: `api/src/modules/departamentos/domain/entities/departamento.entity.spec.ts`
- Create: `api/src/modules/usuarios/domain/entities/usuario.entity.ts`
- Create: `api/src/modules/usuarios/domain/entities/usuario.entity.spec.ts`

- [ ] **Step 1: Create Departamento domain entity**

Copy from spec lines 418-449 into `api/src/modules/departamentos/domain/entities/departamento.entity.ts`.

- [ ] **Step 2: Write test for Departamento**

```typescript
// api/src/modules/departamentos/domain/entities/departamento.entity.spec.ts
import { describe, expect, it } from 'vitest';
import { Departamento } from './departamento.entity';

describe('Departamento domain entity', () => {
  it('creates departamento with generated UUID', () => {
    const dept = Departamento.create({ empresaId: 'empresa-a', nome: 'TI' });
    expect(dept.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dept.empresaId).toBe('empresa-a');
    expect(dept.nome).toBe('TI');
  });

  it('reconstitutes from props', () => {
    const dept = new Departamento({
      id: 'dept-1',
      empresaId: 'empresa-a',
      nome: 'RH',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-06-01'),
    });
    expect(dept.id).toBe('dept-1');
    expect(dept.nome).toBe('RH');
    expect(dept.createdAt).toEqual(new Date('2025-01-01'));
  });
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `pnpm --filter api exec vitest run src/modules/departamentos/domain/entities/departamento.entity.spec.ts`
Expected: PASS

- [ ] **Step 4: Create Usuario domain entity**

Copy from spec lines 455-509 into `api/src/modules/usuarios/domain/entities/usuario.entity.ts`.

- [ ] **Step 5: Write test for Usuario**

```typescript
// api/src/modules/usuarios/domain/entities/usuario.entity.spec.ts
import { describe, expect, it } from 'vitest';
import { Usuario } from './usuario.entity';

describe('Usuario domain entity', () => {
  it('creates usuario with generated UUID and default ativo=true', () => {
    const user = Usuario.create({
      empresaId: 'empresa-a',
      departamentoId: 'dept-1',
      nome: 'Joao Silva',
      email: 'joao@example.com',
    });
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.empresaId).toBe('empresa-a');
    expect(user.departamentoId).toBe('dept-1');
    expect(user.nome).toBe('Joao Silva');
    expect(user.email).toBe('joao@example.com');
    expect(user.ativo).toBe(true);
  });

  it('reconstitutes from props', () => {
    const user = new Usuario({
      id: 'user-1',
      empresaId: 'empresa-a',
      departamentoId: 'dept-1',
      nome: 'Maria',
      email: 'maria@example.com',
      ativo: false,
    });
    expect(user.id).toBe('user-1');
    expect(user.ativo).toBe(false);
  });
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter api exec vitest run src/modules/usuarios/domain/entities/usuario.entity.spec.ts src/modules/departamentos/domain/entities/departamento.entity.spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add api/src/modules/departamentos/domain/ api/src/modules/usuarios/domain/
git commit -m "feat(api): add Departamento and Usuario domain entities"
```

---

## Chunk 3: ORM Entities, Mappers, and Data Source Update

### Task 7: Create ORM entities for all 4 features

**Files:**

- Create: `api/src/modules/hardwares/infrastructure/persistence/hardware.orm-entity.ts`
- Create: `api/src/modules/emprestimos/infrastructure/persistence/emprestimo.orm-entity.ts`
- Create: `api/src/modules/departamentos/infrastructure/persistence/departamento.orm-entity.ts`
- Create: `api/src/modules/usuarios/infrastructure/persistence/usuario.orm-entity.ts`

- [ ] **Step 1: Create DepartamentoOrmEntity**

```typescript
// api/src/modules/departamentos/infrastructure/persistence/departamento.orm-entity.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('departamentos')
export class DepartamentoOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', name: 'empresa_id', length: 36 })
  empresa_id: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;
}
```

- [ ] **Step 2: Create UsuarioOrmEntity**

```typescript
// api/src/modules/usuarios/infrastructure/persistence/usuario.orm-entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DepartamentoOrmEntity } from '../../../departamentos/infrastructure/persistence/departamento.orm-entity';

@Entity('usuarios')
export class UsuarioOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', name: 'empresa_id', length: 36 })
  empresa_id: string;

  @Column({ type: 'varchar', name: 'departamento_id', length: 36 })
  departamento_id: string;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'varchar', length: 200 })
  email: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => DepartamentoOrmEntity)
  @JoinColumn({ name: 'departamento_id' })
  departamento: DepartamentoOrmEntity;
}
```

- [ ] **Step 3: Create HardwareOrmEntity**

Copy from spec lines 523-570 into `api/src/modules/hardwares/infrastructure/persistence/hardware.orm-entity.ts`.

- [ ] **Step 4: Create EmprestimoOrmEntity**

Copy from spec lines 576-622 into `api/src/modules/emprestimos/infrastructure/persistence/emprestimo.orm-entity.ts`.

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/*/infrastructure/persistence/*.orm-entity.ts
git commit -m "feat(api): add ORM entities for all 4 feature modules"
```

---

### Task 8: Update data-source.ts to use new ORM entities and run metadata tests

**Files:**

- Modify: `api/src/infrastructure/database/data-source.ts`
- Create: `api/src/modules/hardwares/infrastructure/persistence/hardware.orm-entity.spec.ts`
- Create: `api/src/modules/emprestimos/infrastructure/persistence/emprestimo.orm-entity.spec.ts`
- Create: `api/src/modules/departamentos/infrastructure/persistence/departamento.orm-entity.spec.ts`
- Create: `api/src/modules/usuarios/infrastructure/persistence/usuario.orm-entity.spec.ts`

- [ ] **Step 1: Update data-source.ts entity imports**

```typescript
// api/src/infrastructure/database/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'node:path';
import { DepartamentoOrmEntity } from '../../modules/departamentos/infrastructure/persistence/departamento.orm-entity';
import { UsuarioOrmEntity } from '../../modules/usuarios/infrastructure/persistence/usuario.orm-entity';
import { HardwareOrmEntity } from '../../modules/hardwares/infrastructure/persistence/hardware.orm-entity';
import { EmprestimoOrmEntity } from '../../modules/emprestimos/infrastructure/persistence/emprestimo.orm-entity';

const apiRoot = path.resolve(__dirname, '../../..');
const databaseFilePath = path.resolve(apiRoot, 'data/guarda-hard.sqlite');
const migrationsGlobPath = path.resolve(__dirname, './migrations/*{.ts,.js}');

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: databaseFilePath,
  entities: [DepartamentoOrmEntity, UsuarioOrmEntity, HardwareOrmEntity, EmprestimoOrmEntity],
  migrations: [migrationsGlobPath],
  synchronize: false,
  logging: false,
});
```

- [ ] **Step 2: Create per-module ORM metadata contract tests**

```typescript
// api/src/modules/departamentos/infrastructure/persistence/departamento.orm-entity.spec.ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppDataSource } from '../../../../infrastructure/database/data-source';

describe('DepartamentoOrmEntity metadata', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  });
  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('has required columns', () => {
    const meta = AppDataSource.getMetadata('DepartamentoOrmEntity');
    const cols = meta.columns.map((c) => c.propertyName);
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'empresa_id', 'nome', 'created_at', 'updated_at']),
    );
  });
});
```

```typescript
// api/src/modules/usuarios/infrastructure/persistence/usuario.orm-entity.spec.ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppDataSource } from '../../../../infrastructure/database/data-source';

describe('UsuarioOrmEntity metadata', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  });
  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('has required columns and relations', () => {
    const meta = AppDataSource.getMetadata('UsuarioOrmEntity');
    const cols = meta.columns.map((c) => c.propertyName);
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'empresa_id', 'departamento_id', 'nome', 'email', 'ativo']),
    );
    expect(meta.relations.map((r) => r.propertyName)).toEqual(
      expect.arrayContaining(['departamento']),
    );
  });
});
```

```typescript
// api/src/modules/hardwares/infrastructure/persistence/hardware.orm-entity.spec.ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppDataSource } from '../../../../infrastructure/database/data-source';

describe('HardwareOrmEntity metadata', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  });
  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('has required columns', () => {
    const meta = AppDataSource.getMetadata('HardwareOrmEntity');
    const cols = meta.columns.map((c) => c.propertyName);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'empresa_id',
        'descricao',
        'marca',
        'modelo',
        'codigo_patrimonio',
        'funcionando',
        'descricao_problema',
        'livre',
        'version',
      ]),
    );
  });
});
```

```typescript
// api/src/modules/emprestimos/infrastructure/persistence/emprestimo.orm-entity.spec.ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppDataSource } from '../../../../infrastructure/database/data-source';

describe('EmprestimoOrmEntity metadata', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  });
  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('has required columns and relations', () => {
    const meta = AppDataSource.getMetadata('EmprestimoOrmEntity');
    const cols = meta.columns.map((c) => c.propertyName);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'empresa_id',
        'usuario_id',
        'hardware_id',
        'data_retirada',
        'data_devolucao',
      ]),
    );
    expect(meta.relations.map((r) => r.propertyName)).toEqual(
      expect.arrayContaining(['usuario', 'hardware']),
    );
  });
});
```

- [ ] **Step 3: Run ORM metadata tests**

Run: `pnpm --filter api exec vitest run src/modules/*/infrastructure/persistence/*.orm-entity.spec.ts`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add api/src/infrastructure/database/data-source.ts api/src/modules/*/infrastructure/persistence/*.orm-entity.spec.ts
git commit -m "refactor(api): update data-source to use new ORM entities, add metadata tests"
```

---

### Task 9: Create mappers for all 4 features with round-trip tests

**Files:**

- Create: `api/src/modules/hardwares/infrastructure/persistence/hardware.mapper.ts`
- Create: `api/src/modules/hardwares/infrastructure/persistence/hardware.mapper.spec.ts`
- Create: `api/src/modules/emprestimos/infrastructure/persistence/emprestimo.mapper.ts`
- Create: `api/src/modules/emprestimos/infrastructure/persistence/emprestimo.mapper.spec.ts`
- Create: `api/src/modules/departamentos/infrastructure/persistence/departamento.mapper.ts`
- Create: `api/src/modules/departamentos/infrastructure/persistence/departamento.mapper.spec.ts`
- Create: `api/src/modules/usuarios/infrastructure/persistence/usuario.mapper.ts`
- Create: `api/src/modules/usuarios/infrastructure/persistence/usuario.mapper.spec.ts`

- [ ] **Step 1: Create HardwareMapper**

Copy from spec lines 652-692 into `api/src/modules/hardwares/infrastructure/persistence/hardware.mapper.ts`.

- [ ] **Step 2: Write HardwareMapper round-trip test**

```typescript
// api/src/modules/hardwares/infrastructure/persistence/hardware.mapper.spec.ts
import { describe, expect, it } from 'vitest';
import { HardwareMapper } from './hardware.mapper';
import { Hardware } from '../../domain/entities/hardware.entity';
import { HardwareOrmEntity } from './hardware.orm-entity';

describe('HardwareMapper', () => {
  const ormFixture = (): HardwareOrmEntity => {
    const orm = new HardwareOrmEntity();
    orm.id = 'hw-1';
    orm.empresa_id = 'empresa-a';
    orm.descricao = 'Notebook Dell';
    orm.marca = 'Dell';
    orm.modelo = 'Latitude 5520';
    orm.codigo_patrimonio = 'PAT-001';
    orm.funcionando = true;
    orm.descricao_problema = null;
    orm.livre = true;
    orm.version = 3;
    orm.created_at = new Date('2025-01-01');
    orm.updated_at = new Date('2025-06-01');
    return orm;
  };

  it('toDomain maps all fields with correct casing', () => {
    const domain = HardwareMapper.toDomain(ormFixture());
    expect(domain.id).toBe('hw-1');
    expect(domain.empresaId).toBe('empresa-a');
    expect(domain.descricao).toBe('Notebook Dell');
    expect(domain.marca).toBe('Dell');
    expect(domain.modelo).toBe('Latitude 5520');
    expect(domain.codigoPatrimonio).toBe('PAT-001');
    expect(domain.funcionando).toBe(true);
    expect(domain.descricaoProblema).toBeNull();
    expect(domain.livre).toBe(true);
    expect(domain.version).toBe(3);
    expect(domain.createdAt).toEqual(new Date('2025-01-01'));
    expect(domain.updatedAt).toEqual(new Date('2025-06-01'));
  });

  it('toOrm maps all fields with correct casing', () => {
    const domain = HardwareMapper.toDomain(ormFixture());
    const orm = HardwareMapper.toOrm(domain);
    expect(orm.id).toBe('hw-1');
    expect(orm.empresa_id).toBe('empresa-a');
    expect(orm.codigo_patrimonio).toBe('PAT-001');
    expect(orm.version).toBe(3);
  });

  it('round-trip preserves all mappable fields', () => {
    const original = ormFixture();
    const roundTripped = HardwareMapper.toOrm(HardwareMapper.toDomain(original));
    expect(roundTripped.id).toBe(original.id);
    expect(roundTripped.empresa_id).toBe(original.empresa_id);
    expect(roundTripped.descricao).toBe(original.descricao);
    expect(roundTripped.marca).toBe(original.marca);
    expect(roundTripped.modelo).toBe(original.modelo);
    expect(roundTripped.codigo_patrimonio).toBe(original.codigo_patrimonio);
    expect(roundTripped.funcionando).toBe(original.funcionando);
    expect(roundTripped.descricao_problema).toBe(original.descricao_problema);
    expect(roundTripped.livre).toBe(original.livre);
    expect(roundTripped.version).toBe(original.version);
    // created_at and updated_at are intentionally NOT mapped in toOrm
  });
});
```

- [ ] **Step 3: Create EmprestimoMapper**

```typescript
// api/src/modules/emprestimos/infrastructure/persistence/emprestimo.mapper.ts
import { Emprestimo } from '../../domain/entities/emprestimo.entity';
import { EmprestimoOrmEntity } from './emprestimo.orm-entity';

export class EmprestimoMapper {
  static toDomain(orm: EmprestimoOrmEntity): Emprestimo {
    return new Emprestimo({
      id: orm.id,
      empresaId: orm.empresa_id,
      usuarioId: orm.usuario_id,
      hardwareId: orm.hardware_id,
      dataRetirada: orm.data_retirada,
      dataDevolucao: orm.data_devolucao,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: Emprestimo): EmprestimoOrmEntity {
    const orm = new EmprestimoOrmEntity();
    orm.id = domain.id;
    orm.empresa_id = domain.empresaId;
    orm.usuario_id = domain.usuarioId;
    orm.hardware_id = domain.hardwareId;
    orm.data_retirada = domain.dataRetirada;
    orm.data_devolucao = domain.dataDevolucao;
    return orm;
  }
}
```

- [ ] **Step 4: Write EmprestimoMapper round-trip test**

```typescript
// api/src/modules/emprestimos/infrastructure/persistence/emprestimo.mapper.spec.ts
import { describe, expect, it } from 'vitest';
import { EmprestimoMapper } from './emprestimo.mapper';
import { EmprestimoOrmEntity } from './emprestimo.orm-entity';

describe('EmprestimoMapper', () => {
  const ormFixture = (): EmprestimoOrmEntity => {
    const orm = new EmprestimoOrmEntity();
    orm.id = 'emp-1';
    orm.empresa_id = 'empresa-a';
    orm.usuario_id = 'user-1';
    orm.hardware_id = 'hw-1';
    orm.data_retirada = new Date('2026-03-12');
    orm.data_devolucao = null;
    orm.created_at = new Date('2025-01-01');
    orm.updated_at = new Date('2025-06-01');
    return orm;
  };

  it('toDomain maps all fields', () => {
    const domain = EmprestimoMapper.toDomain(ormFixture());
    expect(domain.id).toBe('emp-1');
    expect(domain.empresaId).toBe('empresa-a');
    expect(domain.usuarioId).toBe('user-1');
    expect(domain.hardwareId).toBe('hw-1');
    expect(domain.dataDevolucao).toBeNull();
  });

  it('round-trip preserves all mappable fields', () => {
    const original = ormFixture();
    const roundTripped = EmprestimoMapper.toOrm(EmprestimoMapper.toDomain(original));
    expect(roundTripped.id).toBe(original.id);
    expect(roundTripped.empresa_id).toBe(original.empresa_id);
    expect(roundTripped.usuario_id).toBe(original.usuario_id);
    expect(roundTripped.hardware_id).toBe(original.hardware_id);
    expect(roundTripped.data_retirada).toEqual(original.data_retirada);
    expect(roundTripped.data_devolucao).toBe(original.data_devolucao);
  });
});
```

- [ ] **Step 5: Create DepartamentoMapper**

```typescript
// api/src/modules/departamentos/infrastructure/persistence/departamento.mapper.ts
import { Departamento } from '../../domain/entities/departamento.entity';
import { DepartamentoOrmEntity } from './departamento.orm-entity';

export class DepartamentoMapper {
  static toDomain(orm: DepartamentoOrmEntity): Departamento {
    return new Departamento({
      id: orm.id,
      empresaId: orm.empresa_id,
      nome: orm.nome,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: Departamento): DepartamentoOrmEntity {
    const orm = new DepartamentoOrmEntity();
    orm.id = domain.id;
    orm.empresa_id = domain.empresaId;
    orm.nome = domain.nome;
    return orm;
  }
}
```

- [ ] **Step 6: Write DepartamentoMapper round-trip test**

```typescript
// api/src/modules/departamentos/infrastructure/persistence/departamento.mapper.spec.ts
import { describe, expect, it } from 'vitest';
import { DepartamentoMapper } from './departamento.mapper';
import { DepartamentoOrmEntity } from './departamento.orm-entity';

describe('DepartamentoMapper', () => {
  it('round-trip preserves all mappable fields', () => {
    const orm = new DepartamentoOrmEntity();
    orm.id = 'dept-1';
    orm.empresa_id = 'empresa-a';
    orm.nome = 'TI';
    orm.created_at = new Date('2025-01-01');
    orm.updated_at = new Date('2025-06-01');

    const roundTripped = DepartamentoMapper.toOrm(DepartamentoMapper.toDomain(orm));
    expect(roundTripped.id).toBe(orm.id);
    expect(roundTripped.empresa_id).toBe(orm.empresa_id);
    expect(roundTripped.nome).toBe(orm.nome);
  });
});
```

- [ ] **Step 7: Create UsuarioMapper**

```typescript
// api/src/modules/usuarios/infrastructure/persistence/usuario.mapper.ts
import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioOrmEntity } from './usuario.orm-entity';

export class UsuarioMapper {
  static toDomain(orm: UsuarioOrmEntity): Usuario {
    return new Usuario({
      id: orm.id,
      empresaId: orm.empresa_id,
      departamentoId: orm.departamento_id,
      nome: orm.nome,
      email: orm.email,
      ativo: orm.ativo,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: Usuario): UsuarioOrmEntity {
    const orm = new UsuarioOrmEntity();
    orm.id = domain.id;
    orm.empresa_id = domain.empresaId;
    orm.departamento_id = domain.departamentoId;
    orm.nome = domain.nome;
    orm.email = domain.email;
    orm.ativo = domain.ativo;
    return orm;
  }
}
```

- [ ] **Step 8: Write UsuarioMapper round-trip test**

```typescript
// api/src/modules/usuarios/infrastructure/persistence/usuario.mapper.spec.ts
import { describe, expect, it } from 'vitest';
import { UsuarioMapper } from './usuario.mapper';
import { UsuarioOrmEntity } from './usuario.orm-entity';

describe('UsuarioMapper', () => {
  it('round-trip preserves all mappable fields', () => {
    const orm = new UsuarioOrmEntity();
    orm.id = 'user-1';
    orm.empresa_id = 'empresa-a';
    orm.departamento_id = 'dept-1';
    orm.nome = 'Joao Silva';
    orm.email = 'joao@example.com';
    orm.ativo = true;
    orm.created_at = new Date('2025-01-01');
    orm.updated_at = new Date('2025-06-01');

    const roundTripped = UsuarioMapper.toOrm(UsuarioMapper.toDomain(orm));
    expect(roundTripped.id).toBe(orm.id);
    expect(roundTripped.empresa_id).toBe(orm.empresa_id);
    expect(roundTripped.departamento_id).toBe(orm.departamento_id);
    expect(roundTripped.nome).toBe(orm.nome);
    expect(roundTripped.email).toBe(orm.email);
    expect(roundTripped.ativo).toBe(orm.ativo);
  });
});
```

- [ ] **Step 9: Run all mapper tests**

Run: `pnpm --filter api exec vitest run src/modules/*/infrastructure/persistence/*.mapper.spec.ts`
Expected: All tests PASS

- [ ] **Step 10: Commit**

```bash
git add api/src/modules/*/infrastructure/persistence/*.mapper.ts api/src/modules/*/infrastructure/persistence/*.mapper.spec.ts
git commit -m "feat(api): add mappers with round-trip tests for all 4 feature modules"
```

---

## Chunk 4: Repository Interfaces, Implementations, Module Wiring, and Cleanup

### Task 10: Create repository interfaces for all 4 features

**Files:**

- Create: `api/src/modules/hardwares/domain/repositories/hardware.repository.interface.ts`
- Create: `api/src/modules/emprestimos/domain/repositories/emprestimo.repository.interface.ts`
- Create: `api/src/modules/departamentos/domain/repositories/departamento.repository.interface.ts`
- Create: `api/src/modules/usuarios/domain/repositories/usuario.repository.interface.ts`

- [ ] **Step 1: Create IHardwareRepository**

```typescript
// api/src/modules/hardwares/domain/repositories/hardware.repository.interface.ts
import { Hardware } from '../entities/hardware.entity';

export interface IHardwareRepository {
  findById(id: string): Promise<Hardware | null>;
  findAll(): Promise<Hardware[]>;
  save(hardware: Hardware): Promise<void>;
  delete(id: string): Promise<void>;
}

export const HARDWARE_REPOSITORY = Symbol('IHardwareRepository');
```

- [ ] **Step 2: Create IEmprestimoRepository**

```typescript
// api/src/modules/emprestimos/domain/repositories/emprestimo.repository.interface.ts
import { Emprestimo } from '../entities/emprestimo.entity';

export interface IEmprestimoRepository {
  findById(id: string): Promise<Emprestimo | null>;
  findAll(): Promise<Emprestimo[]>;
  save(emprestimo: Emprestimo): Promise<void>;
  delete(id: string): Promise<void>;
}

export const EMPRESTIMO_REPOSITORY = Symbol('IEmprestimoRepository');
```

- [ ] **Step 3: Create IDepartamentoRepository**

```typescript
// api/src/modules/departamentos/domain/repositories/departamento.repository.interface.ts
import { Departamento } from '../entities/departamento.entity';

export interface IDepartamentoRepository {
  findById(id: string): Promise<Departamento | null>;
  findAll(): Promise<Departamento[]>;
  save(departamento: Departamento): Promise<void>;
  delete(id: string): Promise<void>;
}

export const DEPARTAMENTO_REPOSITORY = Symbol('IDepartamentoRepository');
```

- [ ] **Step 4: Create IUsuarioRepository**

```typescript
// api/src/modules/usuarios/domain/repositories/usuario.repository.interface.ts
import { Usuario } from '../entities/usuario.entity';

export interface IUsuarioRepository {
  findById(id: string): Promise<Usuario | null>;
  findAll(): Promise<Usuario[]>;
  save(usuario: Usuario): Promise<void>;
  delete(id: string): Promise<void>;
}

export const USUARIO_REPOSITORY = Symbol('IUsuarioRepository');
```

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/*/domain/repositories/
git commit -m "feat(api): add repository interfaces for all 4 feature modules"
```

---

### Task 11: Create TypeORM repository implementations

**Files:**

- Create: `api/src/modules/hardwares/infrastructure/persistence/hardware.typeorm-repository.ts`
- Create: `api/src/modules/emprestimos/infrastructure/persistence/emprestimo.typeorm-repository.ts`
- Create: `api/src/modules/departamentos/infrastructure/persistence/departamento.typeorm-repository.ts`
- Create: `api/src/modules/usuarios/infrastructure/persistence/usuario.typeorm-repository.ts`

- [ ] **Step 1: Create TypeOrmHardwareRepository**

Copy from spec lines 727-770 into `api/src/modules/hardwares/infrastructure/persistence/hardware.typeorm-repository.ts`.

- [ ] **Step 2: Create TypeOrmEmprestimoRepository**

```typescript
// api/src/modules/emprestimos/infrastructure/persistence/emprestimo.typeorm-repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IEmprestimoRepository } from '../../domain/repositories/emprestimo.repository.interface';
import { Emprestimo } from '../../domain/entities/emprestimo.entity';
import { EmprestimoOrmEntity } from './emprestimo.orm-entity';
import { EmprestimoMapper } from './emprestimo.mapper';
import { TenantContext } from '../../../../tenant/application/tenant-context';

@Injectable()
export class TypeOrmEmprestimoRepository implements IEmprestimoRepository {
  constructor(
    @InjectRepository(EmprestimoOrmEntity)
    private readonly ormRepo: Repository<EmprestimoOrmEntity>,
    private readonly tenantContext: TenantContext,
  ) {}

  async findById(id: string): Promise<Emprestimo | null> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orm = await this.ormRepo.findOne({ where: { id, empresa_id: empresaId } });
    return orm ? EmprestimoMapper.toDomain(orm) : null;
  }

  async findAll(): Promise<Emprestimo[]> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orms = await this.ormRepo.find({ where: { empresa_id: empresaId } });
    return orms.map(EmprestimoMapper.toDomain);
  }

  async save(emprestimo: Emprestimo): Promise<void> {
    const orm = EmprestimoMapper.toOrm(emprestimo);
    await this.ormRepo.save(orm);
  }

  async delete(id: string): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();
    await this.ormRepo.delete({ id, empresa_id: empresaId });
  }
}
```

- [ ] **Step 3: Create TypeOrmDepartamentoRepository**

```typescript
// api/src/modules/departamentos/infrastructure/persistence/departamento.typeorm-repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IDepartamentoRepository } from '../../domain/repositories/departamento.repository.interface';
import { Departamento } from '../../domain/entities/departamento.entity';
import { DepartamentoOrmEntity } from './departamento.orm-entity';
import { DepartamentoMapper } from './departamento.mapper';
import { TenantContext } from '../../../../tenant/application/tenant-context';

@Injectable()
export class TypeOrmDepartamentoRepository implements IDepartamentoRepository {
  constructor(
    @InjectRepository(DepartamentoOrmEntity)
    private readonly ormRepo: Repository<DepartamentoOrmEntity>,
    private readonly tenantContext: TenantContext,
  ) {}

  async findById(id: string): Promise<Departamento | null> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orm = await this.ormRepo.findOne({ where: { id, empresa_id: empresaId } });
    return orm ? DepartamentoMapper.toDomain(orm) : null;
  }

  async findAll(): Promise<Departamento[]> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orms = await this.ormRepo.find({ where: { empresa_id: empresaId } });
    return orms.map(DepartamentoMapper.toDomain);
  }

  async save(departamento: Departamento): Promise<void> {
    const orm = DepartamentoMapper.toOrm(departamento);
    await this.ormRepo.save(orm);
  }

  async delete(id: string): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();
    await this.ormRepo.delete({ id, empresa_id: empresaId });
  }
}
```

- [ ] **Step 4: Create TypeOrmUsuarioRepository**

```typescript
// api/src/modules/usuarios/infrastructure/persistence/usuario.typeorm-repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUsuarioRepository } from '../../domain/repositories/usuario.repository.interface';
import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioOrmEntity } from './usuario.orm-entity';
import { UsuarioMapper } from './usuario.mapper';
import { TenantContext } from '../../../../tenant/application/tenant-context';

@Injectable()
export class TypeOrmUsuarioRepository implements IUsuarioRepository {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly ormRepo: Repository<UsuarioOrmEntity>,
    private readonly tenantContext: TenantContext,
  ) {}

  async findById(id: string): Promise<Usuario | null> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orm = await this.ormRepo.findOne({ where: { id, empresa_id: empresaId } });
    return orm ? UsuarioMapper.toDomain(orm) : null;
  }

  async findAll(): Promise<Usuario[]> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orms = await this.ormRepo.find({ where: { empresa_id: empresaId } });
    return orms.map(UsuarioMapper.toDomain);
  }

  async save(usuario: Usuario): Promise<void> {
    const orm = UsuarioMapper.toOrm(usuario);
    await this.ormRepo.save(orm);
  }

  async delete(id: string): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();
    await this.ormRepo.delete({ id, empresa_id: empresaId });
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/*/infrastructure/persistence/*.typeorm-repository.ts
git commit -m "feat(api): add TypeORM repository implementations for all 4 feature modules"
```

---

### Task 12: Create NestJS feature modules and update AppModule

**Files:**

- Create: `api/src/modules/hardwares/hardwares.module.ts`
- Create: `api/src/modules/emprestimos/emprestimos.module.ts`
- Create: `api/src/modules/departamentos/departamentos.module.ts`
- Create: `api/src/modules/usuarios/usuarios.module.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Create HardwaresModule**

Copy from spec lines 780-797 into `api/src/modules/hardwares/hardwares.module.ts`.

- [ ] **Step 2: Create EmprestimosModule**

```typescript
// api/src/modules/emprestimos/emprestimos.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmprestimoOrmEntity } from './infrastructure/persistence/emprestimo.orm-entity';
import { TypeOrmEmprestimoRepository } from './infrastructure/persistence/emprestimo.typeorm-repository';
import { EMPRESTIMO_REPOSITORY } from './domain/repositories/emprestimo.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([EmprestimoOrmEntity])],
  providers: [
    {
      provide: EMPRESTIMO_REPOSITORY,
      useClass: TypeOrmEmprestimoRepository,
    },
  ],
  exports: [EMPRESTIMO_REPOSITORY],
})
export class EmprestimosModule {}
```

- [ ] **Step 3: Create DepartamentosModule**

```typescript
// api/src/modules/departamentos/departamentos.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartamentoOrmEntity } from './infrastructure/persistence/departamento.orm-entity';
import { TypeOrmDepartamentoRepository } from './infrastructure/persistence/departamento.typeorm-repository';
import { DEPARTAMENTO_REPOSITORY } from './domain/repositories/departamento.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([DepartamentoOrmEntity])],
  providers: [
    {
      provide: DEPARTAMENTO_REPOSITORY,
      useClass: TypeOrmDepartamentoRepository,
    },
  ],
  exports: [DEPARTAMENTO_REPOSITORY],
})
export class DepartamentosModule {}
```

- [ ] **Step 4: Create UsuariosModule**

```typescript
// api/src/modules/usuarios/usuarios.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioOrmEntity } from './infrastructure/persistence/usuario.orm-entity';
import { TypeOrmUsuarioRepository } from './infrastructure/persistence/usuario.typeorm-repository';
import { USUARIO_REPOSITORY } from './domain/repositories/usuario.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioOrmEntity])],
  providers: [
    {
      provide: USUARIO_REPOSITORY,
      useClass: TypeOrmUsuarioRepository,
    },
  ],
  exports: [USUARIO_REPOSITORY],
})
export class UsuariosModule {}
```

- [ ] **Step 5: Scaffold empty placeholder directories**

```bash
mkdir -p api/src/modules/hardwares/application/use-cases api/src/modules/hardwares/application/dto api/src/modules/hardwares/presentation/http
mkdir -p api/src/modules/emprestimos/application/use-cases api/src/modules/emprestimos/application/dto api/src/modules/emprestimos/presentation/http
mkdir -p api/src/modules/departamentos/application/use-cases api/src/modules/departamentos/application/dto api/src/modules/departamentos/presentation/http
mkdir -p api/src/modules/usuarios/application/use-cases api/src/modules/usuarios/application/dto api/src/modules/usuarios/presentation/http
```

Add `.gitkeep` to each empty dir so git tracks them:

```bash
touch api/src/modules/hardwares/application/use-cases/.gitkeep api/src/modules/hardwares/application/dto/.gitkeep api/src/modules/hardwares/presentation/http/.gitkeep
touch api/src/modules/emprestimos/application/use-cases/.gitkeep api/src/modules/emprestimos/application/dto/.gitkeep api/src/modules/emprestimos/presentation/http/.gitkeep
touch api/src/modules/departamentos/application/use-cases/.gitkeep api/src/modules/departamentos/application/dto/.gitkeep api/src/modules/departamentos/presentation/http/.gitkeep
touch api/src/modules/usuarios/application/use-cases/.gitkeep api/src/modules/usuarios/application/dto/.gitkeep api/src/modules/usuarios/presentation/http/.gitkeep
touch api/src/shared/testing/.gitkeep
```

- [ ] **Step 6: Update AppModule**

```typescript
// api/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { TenantModule } from './tenant/tenant.module';
import { HardwaresModule } from './modules/hardwares/hardwares.module';
import { EmprestimosModule } from './modules/emprestimos/emprestimos.module';
import { DepartamentosModule } from './modules/departamentos/departamentos.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';

@Module({
  imports: [
    DatabaseModule,
    TenantModule,
    HardwaresModule,
    EmprestimosModule,
    DepartamentosModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 7: Commit**

```bash
git add api/src/modules/ api/src/app.module.ts api/src/shared/testing/
git commit -m "feat(api): wire NestJS feature modules and update AppModule"
```

---

### Task 13: Delete old entities folder and run full test suite

**Files:**

- Delete: `api/src/entities/` (entire directory)

- [ ] **Step 1: Delete old entities directory**

```bash
git rm -r api/src/entities/
```

- [ ] **Step 2: Run full test suite**

Run: `pnpm --filter api exec vitest run`
Expected: All tests PASS. The old entity tests are deleted; their replacements exist in the new module locations.

If any test fails due to stale imports (e.g., integration tests in `test/` that import from `../../src/entities`), update those imports to use the new ORM entity paths.

- [ ] **Step 3: Run TypeScript compilation check**

Run: `pnpm --filter api exec tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Run lint**

Run: `pnpm --filter api exec eslint src/`
Expected: No errors (or pre-existing ones only)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(api): remove old flat entities/ folder, complete DDD restructure"
```

---

### Task 14: Final verification and update architecture.md

**Files:**

- Modify: `docs/architecture.md` (update mapper placement note)

- [x] **Step 1: Run full test suite one more time**

Run: `pnpm --filter api exec vitest run`
Expected: All tests PASS

- [x] **Step 2: Update architecture.md mapper placement**

Add a note in `docs/architecture.md` in the `modules/<feature>/infrastructure` section that mappers live in `infrastructure/persistence/` (not `application/mappers/`), with the rationale from the spec.

- [x] **Step 3: Commit**

```bash
git add docs/architecture.md
git commit -m "docs: update architecture.md to reflect mapper placement in infrastructure/"
```
