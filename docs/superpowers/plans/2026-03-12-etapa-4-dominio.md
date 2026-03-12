# Etapa 4 - Dominio Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Etapa 4 domain behavior so loan, return, defect, and repair rules are enforced directly in entities with focused tests.

**Architecture:** Keep TypeORM entities as the source of truth for stage-4 domain rules, adding small, explicit methods to `Hardware` and `Emprestimo` instead of introducing new service layers. Use dedicated domain error classes to make failures predictable and testable. Preserve current schema and repository wiring from Etapa 2/3; this stage only adds domain behavior and test coverage for that behavior.

**Tech Stack:** NestJS 11, TypeORM 0.3.x, SQLite (better-sqlite3), Vitest, TypeScript strict, pnpm workspaces

---

## Scope Check

Etapa 4 is one subsystem (domain behavior inside entities). It should stay separate from:

- Etapa 3 tenant infrastructure internals (already planned separately)
- Etapa 5 broader domain test matrix (this plan adds only the tests needed to drive Etapa 4 implementation)
- Etapa 6 API endpoints and orchestration

If you find missing tenant wiring while executing, do not expand this plan. Use the Etapa 3 plan first, then resume Etapa 4.

## Execution Skills (required during implementation)

- `@superpowers/subagent-driven-development` (required when subagents are available)
- `@superpowers/test-driven-development` (before each behavior change)
- `@superpowers/systematic-debugging` (if any test result is unexpected)
- `@superpowers/verification-before-completion` (before claiming Etapa 4 done)
- `@superpowers/requesting-code-review` (after implementation is complete)

## Preconditions

- Work from the dedicated git worktree created during brainstorming.
- Confirm a feature branch is checked out (not `main`/`master`).
- Confirm no unfinished Etapa 3 code is mixed into this branch.

Run:

```bash
git worktree list
git branch --show-current
git status --short
```

Expected:

- Current directory appears as its own worktree.
- Branch name reflects Etapa 4 work.
- Working tree is either clean or only has Etapa 4 files.

## File Structure (lock before coding)

### Create

- `api/src/entities/domain.errors.ts` - explicit domain error types for invalid loans, duplicate returns, and invalid defect payloads.
- `api/src/entities/hardware.entity.domain.spec.ts` - focused unit tests for `Hardware` behavior (`emprestar`, `marcarDefeito`, `consertar`).
- `api/src/entities/emprestimo.entity.domain.spec.ts` - focused unit tests for `Emprestimo` behavior (`emprestar`, `devolver`) and side effects on `Hardware`.

### Modify

- `api/src/entities/hardware.entity.ts` - add domain methods and invariant checks.
- `api/src/entities/emprestimo.entity.ts` - add domain factory/methods for loan open + return lifecycle.
- `api/src/entities/entities.metadata.spec.ts` - strengthen metadata assertions to lock Etapa 4 entity contract.
- `docs/PRD-GuardaHard.md` - mark Etapa 4 checklist items immediately when each is completed.

### Test Targets

- `api/src/entities/hardware.entity.domain.spec.ts`
- `api/src/entities/emprestimo.entity.domain.spec.ts`
- `api/src/entities/entities.metadata.spec.ts`

---

## Chunk 1: Domain Rules in Entities

### Task 1: Add domain error vocabulary and red tests for loan lifecycle

**Files:**

- Create: `api/src/entities/domain.errors.ts`
- Create: `api/src/entities/emprestimo.entity.domain.spec.ts`
- Modify: `api/src/entities/emprestimo.entity.ts`
- Modify: `api/src/entities/hardware.entity.ts`
- Test: `api/src/entities/emprestimo.entity.domain.spec.ts`

- [ ] **Step 1: Write failing test for opening a valid loan**

```ts
// api/src/entities/emprestimo.entity.domain.spec.ts
import { describe, expect, it } from 'vitest';
import { Emprestimo } from './emprestimo.entity';
import { Hardware } from './hardware.entity';

describe('Emprestimo domain', () => {
  it('empresta hardware disponivel e marca hardware como nao livre', () => {
    const hardware = Object.assign(new Hardware(), {
      empresa_id: 'empresa-a',
      funcionando: true,
      livre: true,
      descricao_problema: null,
    });

    const retirada = new Date('2026-03-12T12:00:00.000Z');
    const emprestimo = Emprestimo.emprestar({
      empresa_id: 'empresa-a',
      usuario_id: 'usuario-1',
      hardware_id: 'hardware-1',
      hardware,
      data_retirada: retirada,
    });

    expect(emprestimo.empresa_id).toBe('empresa-a');
    expect(emprestimo.data_devolucao).toBeNull();
    expect(hardware.livre).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts
```

Expected: FAIL with `TypeError: Emprestimo.emprestar is not a function`.

- [ ] **Step 3: Implement minimal domain errors and loan open behavior**

```ts
// api/src/entities/domain.errors.ts
export class HardwareNaoDisponivelError extends Error {
  constructor() {
    super('Hardware nao esta disponivel para emprestimo');
  }
}

export class HardwareDefeituosoError extends Error {
  constructor() {
    super('Hardware defeituoso nao pode ser emprestado');
  }
}

export class EmprestimoJaDevolvidoError extends Error {
  constructor() {
    super('Emprestimo ja foi devolvido');
  }
}

export class DescricaoProblemaObrigatoriaError extends Error {
  constructor() {
    super('Descricao do problema e obrigatoria');
  }
}
```

```ts
// api/src/entities/hardware.entity.ts (new methods only)
emprestar(): void {
  this.livre = false;
}
```

```ts
// api/src/entities/emprestimo.entity.ts (new static method only)
static emprestar(input: {
  empresa_id: string;
  usuario_id: string;
  hardware_id: string;
  hardware: Hardware;
  data_retirada?: Date;
}): Emprestimo {
  input.hardware.emprestar();

  return Object.assign(new Emprestimo(), {
    empresa_id: input.empresa_id,
    usuario_id: input.usuario_id,
    hardware_id: input.hardware_id,
    data_retirada: input.data_retirada ?? new Date(),
    data_devolucao: null,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts
```

Expected: PASS (1 test passed).

- [ ] **Step 5: Commit**

```bash
git add api/src/entities/domain.errors.ts api/src/entities/hardware.entity.ts api/src/entities/emprestimo.entity.ts api/src/entities/emprestimo.entity.domain.spec.ts
git commit -m "feat(api): add domain loan opening behavior for entities"
```

- [ ] **Step 6: Mark PRD items immediately**

Update `docs/PRD-GuardaHard.md`:

- Mark `Implementar método emprestar` as `[x]`.

### Task 2: Enforce invalid loan rules (occupied or broken hardware)

**Files:**

- Modify: `api/src/entities/emprestimo.entity.domain.spec.ts`
- Modify: `api/src/entities/hardware.entity.ts`
- Test: `api/src/entities/emprestimo.entity.domain.spec.ts`

- [ ] **Step 1: Update test imports and add failing tests for occupied and broken hardware loan attempts**

```ts
import { HardwareDefeituosoError, HardwareNaoDisponivelError } from './domain.errors';

it('impede emprestimo quando hardware ja esta ocupado', () => {
  const hardware = Object.assign(new Hardware(), {
    empresa_id: 'empresa-a',
    funcionando: true,
    livre: false,
    descricao_problema: null,
  });

  expect(() =>
    Emprestimo.emprestar({
      empresa_id: 'empresa-a',
      usuario_id: 'usuario-1',
      hardware_id: 'hardware-1',
      hardware,
    }),
  ).toThrow(HardwareNaoDisponivelError);
});

it('impede emprestimo quando hardware esta defeituoso', () => {
  const hardware = Object.assign(new Hardware(), {
    empresa_id: 'empresa-a',
    funcionando: false,
    livre: true,
    descricao_problema: 'nao liga',
  });

  expect(() =>
    Emprestimo.emprestar({
      empresa_id: 'empresa-a',
      usuario_id: 'usuario-1',
      hardware_id: 'hardware-1',
      hardware,
    }),
  ).toThrow(HardwareDefeituosoError);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts
```

Expected: FAIL because `Emprestimo.emprestar` does not throw `HardwareNaoDisponivelError`/`HardwareDefeituosoError` yet.

- [ ] **Step 3: Implement minimal adjustments to keep guard behavior explicit**

```ts
// api/src/entities/hardware.entity.ts (guard order, keep explicit)
import { HardwareDefeituosoError, HardwareNaoDisponivelError } from './domain.errors';

emprestar(): void {
  if (!this.funcionando) {
    throw new HardwareDefeituosoError();
  }

  if (!this.livre) {
    throw new HardwareNaoDisponivelError();
  }

  this.livre = false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts
```

Expected: PASS with all loan tests.

- [ ] **Step 5: Commit**

```bash
git add api/src/entities/emprestimo.entity.domain.spec.ts api/src/entities/hardware.entity.ts
git commit -m "test(api): cover invalid loan domain rules"
```

### Task 3: Implement return behavior and duplicate return protection

**Files:**

- Modify: `api/src/entities/emprestimo.entity.domain.spec.ts`
- Modify: `api/src/entities/emprestimo.entity.ts`
- Modify: `api/src/entities/hardware.entity.ts`
- Test: `api/src/entities/emprestimo.entity.domain.spec.ts`

- [ ] **Step 1: Add failing tests for successful return and duplicate return block**

```ts
import { EmprestimoJaDevolvidoError } from './domain.errors';

it('devolve emprestimo e libera hardware', () => {
  const hardware = Object.assign(new Hardware(), {
    empresa_id: 'empresa-a',
    funcionando: true,
    livre: true,
    descricao_problema: null,
  });
  const emprestimo = Emprestimo.emprestar({
    empresa_id: 'empresa-a',
    usuario_id: 'usuario-1',
    hardware_id: 'hardware-1',
    hardware,
  });

  const devolucao = new Date('2026-03-13T12:00:00.000Z');
  emprestimo.devolver(hardware, devolucao);

  expect(emprestimo.data_devolucao).toEqual(devolucao);
  expect(hardware.livre).toBe(true);
});

it('impede devolucao duplicada', () => {
  const hardware = Object.assign(new Hardware(), {
    empresa_id: 'empresa-a',
    funcionando: true,
    livre: true,
    descricao_problema: null,
  });
  const emprestimo = Emprestimo.emprestar({
    empresa_id: 'empresa-a',
    usuario_id: 'usuario-1',
    hardware_id: 'hardware-1',
    hardware,
  });

  emprestimo.devolver(hardware, new Date('2026-03-13T12:00:00.000Z'));
  expect(() => emprestimo.devolver(hardware, new Date('2026-03-14T12:00:00.000Z'))).toThrow(
    EmprestimoJaDevolvidoError,
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts
```

Expected: FAIL with `TypeError: emprestimo.devolver is not a function`.

- [ ] **Step 3: Implement minimal return behavior**

```ts
// api/src/entities/hardware.entity.ts (new method only)
devolver(): void {
  this.livre = true;
}
```

```ts
// api/src/entities/emprestimo.entity.ts (new method only)
import { EmprestimoJaDevolvidoError } from './domain.errors';

devolver(hardware: Hardware, dataDevolucao: Date = new Date()): void {
  if (this.data_devolucao) {
    throw new EmprestimoJaDevolvidoError();
  }

  this.data_devolucao = dataDevolucao;
  hardware.devolver();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/entities/emprestimo.entity.ts api/src/entities/hardware.entity.ts api/src/entities/emprestimo.entity.domain.spec.ts
git commit -m "feat(api): add return lifecycle to emprestimo entity"
```

- [ ] **Step 6: Mark PRD item immediately**

Update `docs/PRD-GuardaHard.md`:

- Mark `Implementar método devolver` as `[x]`.

### Task 4: Implement defect and repair behavior on hardware

**Files:**

- Create: `api/src/entities/hardware.entity.domain.spec.ts`
- Modify: `api/src/entities/hardware.entity.ts`
- Test: `api/src/entities/hardware.entity.domain.spec.ts`

- [ ] **Step 1: Write failing tests for `marcarDefeito` and `consertar`**

```ts
// api/src/entities/hardware.entity.domain.spec.ts
import { describe, expect, it } from 'vitest';
import { Hardware } from './hardware.entity';
import { DescricaoProblemaObrigatoriaError } from './domain.errors';

describe('Hardware domain', () => {
  it('marca defeito e tira hardware de circulacao', () => {
    const hardware = Object.assign(new Hardware(), {
      empresa_id: 'empresa-a',
      funcionando: true,
      livre: true,
      descricao_problema: null,
    });

    hardware.marcarDefeito('nao liga');

    expect(hardware.funcionando).toBe(false);
    expect(hardware.livre).toBe(false);
    expect(hardware.descricao_problema).toBe('nao liga');
  });

  it('exige descricao do problema ao marcar defeito', () => {
    const hardware = Object.assign(new Hardware(), {
      empresa_id: 'empresa-a',
      funcionando: true,
      livre: true,
      descricao_problema: null,
    });

    expect(() => hardware.marcarDefeito('   ')).toThrow(DescricaoProblemaObrigatoriaError);
  });

  it('conserta hardware e volta para estado disponivel', () => {
    const hardware = Object.assign(new Hardware(), {
      empresa_id: 'empresa-a',
      funcionando: false,
      livre: false,
      descricao_problema: 'nao liga',
    });

    hardware.consertar();

    expect(hardware.funcionando).toBe(true);
    expect(hardware.livre).toBe(true);
    expect(hardware.descricao_problema).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/hardware.entity.domain.spec.ts
```

Expected: FAIL because methods do not exist yet.

- [ ] **Step 3: Implement minimal defect and repair methods**

```ts
// api/src/entities/hardware.entity.ts (new methods only)
import { DescricaoProblemaObrigatoriaError } from './domain.errors';

marcarDefeito(descricaoProblema: string): void {
  const descricao = descricaoProblema.trim();

  if (!descricao) {
    throw new DescricaoProblemaObrigatoriaError();
  }

  this.funcionando = false;
  this.livre = false;
  this.descricao_problema = descricao;
}

consertar(): void {
  this.funcionando = true;
  this.livre = true;
  this.descricao_problema = null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/hardware.entity.domain.spec.ts
```

Expected: PASS (3 tests passed).

- [ ] **Step 5: Commit**

```bash
git add api/src/entities/hardware.entity.domain.spec.ts api/src/entities/hardware.entity.ts
git commit -m "feat(api): add hardware defect and repair domain rules"
```

- [ ] **Step 6: Mark PRD items immediately**

Update `docs/PRD-GuardaHard.md`:

- Mark `Implementar método marcar defeito` as `[x]`.
- Mark `Implementar método consertar` as `[x]`.

---

## Chunk 2: Entity Contract Lock + Etapa 4 Completion Gate

### Task 5: Lock required entity and relation contracts, then complete create-entity checklist

**Files:**

- Modify: `api/src/entities/entities.metadata.spec.ts`
- Test: `api/src/entities/entities.metadata.spec.ts`

- [ ] **Step 1: Replace metadata test with an intentionally failing lifecycle + contract test**

Replace `api/src/entities/entities.metadata.spec.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { AppDataSource } from '../infrastructure/database/data-source';

describe('Entity metadata', () => {
  it('loads metadata for departamento and usuario', async () => {
    await AppDataSource.initialize();

    const departamento = AppDataSource.getMetadata('Departamento');
    const usuario = AppDataSource.getMetadata('Usuario');

    expect(departamento.columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining(['id', 'empresa_id', 'nome', 'created_at']),
    );
    expect(usuario.columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining(['id', 'empresa_id', 'departamento_id', 'nome', 'email', 'ativo']),
    );
    expect(usuario.relations.map((r) => r.propertyName)).toEqual(
      expect.arrayContaining(['departamento']),
    );
  });

  it('loads metadata for hardware and emprestimo', async () => {
    await AppDataSource.initialize();

    const hardware = AppDataSource.getMetadata('Hardware');
    const emprestimo = AppDataSource.getMetadata('Emprestimo');

    expect(hardware.columns.map((c) => c.propertyName)).toEqual(
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
      ]),
    );
    expect(emprestimo.columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining([
        'id',
        'empresa_id',
        'usuario_id',
        'hardware_id',
        'data_retirada',
        'data_devolucao',
      ]),
    );
    expect(emprestimo.relations.map((r) => r.propertyName)).toEqual(
      expect.arrayContaining(['usuario', 'hardware']),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/entities.metadata.spec.ts
```

Expected: FAIL with `DataSource is already initialized` on the second test.

- [ ] **Step 3: Stabilize DataSource lifecycle and keep required contract assertions aligned to PRD**

Update `api/src/entities/entities.metadata.spec.ts` to initialize once and destroy once:

```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppDataSource } from '../infrastructure/database/data-source';

describe('Entity metadata', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('keeps etapa 4 entity contracts required by PRD', () => {
    const departamento = AppDataSource.getMetadata('Departamento');
    const usuario = AppDataSource.getMetadata('Usuario');
    const hardware = AppDataSource.getMetadata('Hardware');
    const emprestimo = AppDataSource.getMetadata('Emprestimo');

    expect(departamento.columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining(['id', 'empresa_id', 'nome', 'created_at']),
    );
    expect(usuario.columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining(['id', 'empresa_id', 'departamento_id', 'nome', 'email', 'ativo']),
    );
    expect(usuario.relations.map((r) => r.propertyName)).toEqual(
      expect.arrayContaining(['departamento']),
    );
    expect(hardware.columns.map((c) => c.propertyName)).toEqual(
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
      ]),
    );
    expect(emprestimo.columns.map((c) => c.propertyName)).toEqual(
      expect.arrayContaining([
        'id',
        'empresa_id',
        'usuario_id',
        'hardware_id',
        'data_retirada',
        'data_devolucao',
      ]),
    );
    expect(emprestimo.relations.map((r) => r.propertyName)).toEqual(
      expect.arrayContaining(['usuario', 'hardware']),
    );
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/entities.metadata.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/entities/entities.metadata.spec.ts
git commit -m "test(api): lock etapa4 entity contract metadata"
```

- [ ] **Step 6: Mark PRD items immediately**

Update `docs/PRD-GuardaHard.md`:

- Mark `Criar entidade Hardware` as `[x]`.
- Mark `Criar entidade Emprestimo` as `[x]`.
- Mark `Criar entidade Usuario` as `[x]`.
- Mark `Criar entidade Departamento` as `[x]`.

### Task 6: Final verification and PRD checklist audit for Etapa 4

**Files:**

- Modify: `docs/PRD-GuardaHard.md` (checklist state only)

- [ ] **Step 1: Run Etapa 4 focused tests together**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts src/entities/hardware.entity.domain.spec.ts src/entities/entities.metadata.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run full API test suite for regression check**

Run:

```bash
pnpm --filter @guarda-hard/api test
```

Expected: PASS with no regressions.

- [ ] **Step 3: Run lint**

Run:

```bash
pnpm --filter @guarda-hard/api lint
```

Expected: PASS.

- [ ] **Step 4: Run build**

Run:

```bash
pnpm --filter @guarda-hard/api build
```

Expected: PASS.

- [ ] **Step 5: Verify Etapa 4 checklist is fully checked in PRD**

Confirm these are `[x]` in `docs/PRD-GuardaHard.md`:

- `Criar entidade Hardware`
- `Criar entidade Usuario`
- `Criar entidade Departamento`
- `Criar entidade Emprestimo`
- `Implementar método emprestar`
- `Implementar método devolver`
- `Implementar método marcar defeito`
- `Implementar método consertar`

Expected: all 8 items are `[x]`.

- [ ] **Step 6: If any Etapa 4 item is unchecked, update PRD before commit**

Update `docs/PRD-GuardaHard.md` so every Etapa 4 item listed in Step 5 is `[x]`.

- [ ] **Step 7: Commit PRD checklist updates**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 4 dominio checklist as complete"
```

---

## Risks and Mitigations

- **Risk:** Domain behavior is duplicated later in services, causing rule drift.
  - **Mitigation:** Keep service layer orchestration thin and call entity methods directly.
- **Risk:** TypeORM entity instantiation in tests bypasses runtime defaults.
  - **Mitigation:** Explicitly set required fields in test fixtures (`Object.assign(new Entity(), {...})`).
- **Risk:** Missing immediate PRD updates breaks global repository rule.
  - **Mitigation:** Every checklist-linked task includes a dedicated PRD update step before moving on.

## Definition of Done

- Etapa 4 checklist in `docs/PRD-GuardaHard.md` is fully `[x]`.
- `Hardware` and `Emprestimo` enforce loan/return/defect/repair rules through explicit methods.
- Focused Etapa 4 tests pass, then `pnpm --filter @guarda-hard/api test`, `lint`, and `build` pass.
- No scope creep into API endpoints, frontend, or reporting stages.
