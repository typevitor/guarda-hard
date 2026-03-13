# Etapa 5 - Testes de Dominio Implementation Plan

> **Status update (2026-03-13):** This plan is superseded by the approved DDD refactor direction in `docs/architecture.md` and `docs/superpowers/specs/2026-03-12-ddd-clean-architecture-refactor-design.md`.
>
> Do not use `api/src/entities` as the canonical location for current domain/entity tests. Use feature modules under `api/src/modules/<feature>/domain` and feature-scoped tests aligned to that structure.

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Etapa 5 with complete domain test coverage for emprestimo lifecycle, defeito/conserto flows, optimistic concurrency, and multi-tenant isolation.

**Architecture:** Keep unit tests close to domain entities in `api/src/entities` for fast feedback on business invariants. Keep integration tests in `api/test/domain` for concurrency and tenant isolation behavior that requires a real TypeORM + SQLite runtime. Preserve Etapa 2/3/4 structure and only add minimal production fixes when tests reveal real defects.

**Tech Stack:** NestJS 11, TypeORM 0.3.x, SQLite (better-sqlite3), Vitest, TypeScript strict, pnpm workspaces

---

## Scope Check

Etapa 5 is one subsystem (domain quality gate), but it has two execution tracks:

- unit tests for domain rules (`emprestar`, `devolver`, `marcarDefeito`, `consertar`)
- integration tests for optimistic locking and tenant isolation

This plan keeps both tracks in one branch because they validate the same PRD stage and produce one working, testable increment.

If you want stricter split, create two plans after this:

1. `etapa-5a-domain-unit-tests`
2. `etapa-5b-concorrencia-e-tenant-integration`

## Execution Skills (required during implementation)

- `@superpowers/subagent-driven-development` (required when subagents are available)
- `@superpowers/test-driven-development` (before every task)
- `@superpowers/systematic-debugging` (if any test fails unexpectedly)
- `@superpowers/verification-before-completion` (before claiming Etapa 5 complete)
- `@superpowers/requesting-code-review` (after implementation is complete)

## Preconditions

- Work from the dedicated worktree created during brainstorming.
- Confirm Etapa 3 and Etapa 4 plans are already implemented in this branch (or merged and pulled).
- Confirm Etapa 3/4 checklist items in `docs/PRD-GuardaHard.md` are already `[x]` before starting Etapa 5.

Run:

```bash
git worktree list
git branch --show-current
git status --short
pnpm --filter @guarda-hard/api test
```

Expected:

- Current directory is a dedicated worktree.
- Current branch is a feature branch (not `main`/`master`).
- Existing API tests are green before adding new Etapa 5 tests.

## File Structure (lock before coding)

### Create

- `api/src/entities/emprestimo.entity.domain.spec.ts` - unit tests for emprestimo valid/invalid loan and devolucao.
- `api/src/entities/hardware.entity.domain.spec.ts` - unit tests for defeito and conserto domain behavior.
- `api/test/domain/domain-test-data-source.ts` - shared SQLite in-memory DataSource helper for domain integration tests.
- `api/test/domain/emprestimo.concorrencia.spec.ts` - optimistic locking simulation for concurrent loan attempts.
- `api/test/domain/multi-tenant-isolamento.spec.ts` - tenant read isolation and cross-tenant update blocking tests.

### Modify

- `api/src/entities/emprestimo.entity.ts` - minimal fixes only if new tests reveal missing/incorrect domain behavior.
- `api/src/entities/hardware.entity.ts` - minimal fixes only if new tests reveal missing/incorrect domain behavior.
- `api/src/tenant/tenant.repository.ts` - minimal fix only if isolation test reveals tenant filter gap.
- `api/src/tenant/tenant.subscriber.ts` - minimal fix only if cross-tenant mutation still leaks.
- `docs/PRD-GuardaHard.md` - mark each Etapa 5 checklist item immediately after its task completes.

### Test Targets

- `api/src/entities/emprestimo.entity.domain.spec.ts`
- `api/src/entities/hardware.entity.domain.spec.ts`
- `api/test/domain/emprestimo.concorrencia.spec.ts`
- `api/test/domain/multi-tenant-isolamento.spec.ts`

---

## Chunk 1: Domain Unit Tests (Emprestimo + Hardware)

### Task 1: Testar emprestimo valido

**Files:**

- Create: `api/src/entities/emprestimo.entity.domain.spec.ts`
- Modify: `api/src/entities/emprestimo.entity.ts` (only if test fails due missing behavior)
- Modify: `api/src/entities/hardware.entity.ts` (only if test fails due missing behavior)
- Test: `api/src/entities/emprestimo.entity.domain.spec.ts`

- [ ] **Step 1: Write the failing test for valid loan**

```ts
// api/src/entities/emprestimo.entity.domain.spec.ts
import { describe, expect, it } from 'vitest';
import { Emprestimo } from './emprestimo.entity';
import { Hardware } from './hardware.entity';

describe('Emprestimo domain', () => {
  it('creates loan for available hardware and marks hardware as not free', () => {
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
    expect(emprestimo.usuario_id).toBe('usuario-1');
    expect(emprestimo.hardware_id).toBe('hardware-1');
    expect(emprestimo.data_retirada).toEqual(retirada);
    expect(emprestimo.data_devolucao).toBeNull();
    expect(hardware.livre).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails first (red)**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts
```

Expected: FAIL (red) for this new test case.
If it unexpectedly passes, tighten assertions so current code fails before implementing.

- [ ] **Step 3: Write minimal implementation only if needed**

```ts
// api/src/entities/emprestimo.entity.ts (minimal fallback)
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

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/entities/emprestimo.entity.domain.spec.ts api/src/entities/emprestimo.entity.ts api/src/entities/hardware.entity.ts
git commit -m "test(api): add valid loan domain test"
```

- [ ] **Step 6: Mark PRD item immediately with exact edit**

In `docs/PRD-GuardaHard.md` change:

```md
Before:

- [ ] Testar empréstimo válido

After:

- [x] Testar empréstimo válido
```

- [ ] **Step 7: Commit PRD checkbox update**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark valid loan test item complete"
```

### Task 2: Testar emprestimo invalido

**Files:**

- Modify: `api/src/entities/emprestimo.entity.domain.spec.ts`
- Modify: `api/src/entities/hardware.entity.ts` (only if test reveals guard bug)
- Test: `api/src/entities/emprestimo.entity.domain.spec.ts`

- [ ] **Step 1: Update import block for invalid-loan errors**

```ts
// api/src/entities/emprestimo.entity.domain.spec.ts (top import block)
import { HardwareDefeituosoError, HardwareNaoDisponivelError } from './domain.errors';
```

- [ ] **Step 2: Add failing test for occupied hardware**

```ts
// append to api/src/entities/emprestimo.entity.domain.spec.ts
it('rejects loan when hardware is already occupied', () => {
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
```

- [ ] **Step 3: Run occupied-hardware test to verify it fails (red)**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts -t "rejects loan when hardware is already occupied"
```

Expected: FAIL (red) for the new test case.
If it unexpectedly passes, tighten assertions so current code fails before implementing.

- [ ] **Step 4: Implement minimal occupied-hardware guard only if needed**

```ts
// api/src/entities/hardware.entity.ts (occupied guard)
if (!this.livre) {
  throw new HardwareNaoDisponivelError();
}
```

- [ ] **Step 5: Re-run occupied-hardware test**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts -t "rejects loan when hardware is already occupied"
```

Expected: PASS.

- [ ] **Step 6: Commit occupied-hardware test cycle**

```bash
git add api/src/entities/emprestimo.entity.domain.spec.ts api/src/entities/hardware.entity.ts
git commit -m "test(api): cover occupied-hardware loan rejection"
```

- [ ] **Step 7: Add failing test for broken hardware**

```ts
// append to api/src/entities/emprestimo.entity.domain.spec.ts
it('rejects loan when hardware is broken', () => {
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

- [ ] **Step 8: Run broken-hardware test to verify it fails (red)**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts -t "rejects loan when hardware is broken"
```

Expected: FAIL (red) for the new test case.
If it unexpectedly passes, tighten assertions so current code fails before implementing.

- [ ] **Step 9: Implement minimal broken-hardware guard only if needed**

```ts
// api/src/entities/hardware.entity.ts (broken guard)
if (!this.funcionando) {
  throw new HardwareDefeituosoError();
}
```

- [ ] **Step 10: Re-run broken-hardware test**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts -t "rejects loan when hardware is broken"
```

Expected: PASS.

- [ ] **Step 11: Commit broken-hardware test cycle**

```bash
git add api/src/entities/emprestimo.entity.domain.spec.ts api/src/entities/hardware.entity.ts
git commit -m "test(api): cover broken-hardware loan rejection"
```

- [ ] **Step 12: Mark PRD item immediately with exact edit**

In `docs/PRD-GuardaHard.md` change:

```md
Before:

- [ ] Testar empréstimo inválido

After:

- [x] Testar empréstimo inválido
```

- [ ] **Step 13: Commit PRD checkbox update**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark invalid loan test item complete"
```

### Task 3: Testar devolucao

**Files:**

- Modify: `api/src/entities/emprestimo.entity.domain.spec.ts`
- Modify: `api/src/entities/emprestimo.entity.ts` (only if needed)
- Modify: `api/src/entities/hardware.entity.ts` (only if needed)
- Test: `api/src/entities/emprestimo.entity.domain.spec.ts`

- [ ] **Step 1: Update import block for duplicate-return error**

```ts
// api/src/entities/emprestimo.entity.domain.spec.ts (top import block)
import { EmprestimoJaDevolvidoError } from './domain.errors';
```

- [ ] **Step 2: Add failing test for successful return**

```ts
// append to api/src/entities/emprestimo.entity.domain.spec.ts
it('returns loan and frees hardware', () => {
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
```

- [ ] **Step 3: Run successful-return test to verify it fails (red)**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts -t "returns loan and frees hardware"
```

Expected: FAIL (red) for the new test case.
If it unexpectedly passes, tighten assertions so current code fails before implementing.

- [ ] **Step 4: Implement minimal successful-return behavior only if needed**

```ts
// api/src/entities/emprestimo.entity.ts
devolver(hardware: Hardware, dataDevolucao: Date = new Date()): void {
  this.data_devolucao = dataDevolucao;
  hardware.devolver();
}
```

```ts
// api/src/entities/hardware.entity.ts
devolver(): void {
  this.livre = true;
}
```

- [ ] **Step 5: Re-run successful-return test**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts -t "returns loan and frees hardware"
```

Expected: PASS.

- [ ] **Step 6: Commit successful-return test cycle**

```bash
git add api/src/entities/emprestimo.entity.domain.spec.ts api/src/entities/emprestimo.entity.ts api/src/entities/hardware.entity.ts
git commit -m "test(api): cover successful loan return"
```

- [ ] **Step 7: Add failing test for duplicate return protection**

```ts
// append to api/src/entities/emprestimo.entity.domain.spec.ts
it('rejects duplicate return for same loan', () => {
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

- [ ] **Step 8: Run duplicate-return test to verify it fails (red)**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts -t "rejects duplicate return for same loan"
```

Expected: FAIL (red) for the new test case.
If it unexpectedly passes, tighten assertions so current code fails before implementing.

- [ ] **Step 9: Implement minimal duplicate-return guard only if needed**

```ts
// api/src/entities/emprestimo.entity.ts
if (this.data_devolucao) {
  throw new EmprestimoJaDevolvidoError();
}
```

- [ ] **Step 10: Re-run duplicate-return test**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts -t "rejects duplicate return for same loan"
```

Expected: PASS.

- [ ] **Step 11: Commit duplicate-return test cycle**

```bash
git add api/src/entities/emprestimo.entity.domain.spec.ts api/src/entities/emprestimo.entity.ts
git commit -m "test(api): cover duplicate return rejection"
```

- [ ] **Step 12: Mark PRD item immediately with exact edit**

In `docs/PRD-GuardaHard.md` change:

```md
Before:

- [ ] Testar devolução

After:

- [x] Testar devolução
```

- [ ] **Step 13: Commit PRD checkbox update**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark return test item complete"
```

### Task 4: Testar defeito

**Files:**

- Create: `api/src/entities/hardware.entity.domain.spec.ts`
- Modify: `api/src/entities/hardware.entity.ts` (only if needed)
- Test: `api/src/entities/hardware.entity.domain.spec.ts`

- [ ] **Step 1: Create test file skeleton**

```ts
// api/src/entities/hardware.entity.domain.spec.ts
import { describe, expect, it } from 'vitest';
import { Hardware } from './hardware.entity';
import { DescricaoProblemaObrigatoriaError } from './domain.errors';

describe('Hardware domain', () => {
  // tests added in next steps
});
```

- [ ] **Step 2: Add failing defect-state test**

```ts
// append inside describe block in api/src/entities/hardware.entity.domain.spec.ts
it('marks hardware as broken and unavailable with problem description', () => {
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
```

- [ ] **Step 3: Run defect-state test to verify it fails (red)**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/hardware.entity.domain.spec.ts -t "marks hardware as broken and unavailable with problem description"
```

Expected: FAIL (red) for the new test case.
If it unexpectedly passes, tighten assertions so current code fails before implementing.

- [ ] **Step 4: Implement minimal defect-state behavior only if needed**

```ts
// api/src/entities/hardware.entity.ts
this.funcionando = false;
this.livre = false;
this.descricao_problema = descricaoProblema.trim();
```

- [ ] **Step 5: Re-run defect-state test**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/hardware.entity.domain.spec.ts -t "marks hardware as broken and unavailable with problem description"
```

Expected: PASS.

- [ ] **Step 6: Commit defect-state test cycle**

```bash
git add api/src/entities/hardware.entity.domain.spec.ts api/src/entities/hardware.entity.ts
git commit -m "test(api): cover hardware defect state transition"
```

- [ ] **Step 7: Add failing defect-description validation test**

```ts
// append inside describe block in api/src/entities/hardware.entity.domain.spec.ts
it('requires non-empty problem description', () => {
  const hardware = Object.assign(new Hardware(), {
    empresa_id: 'empresa-a',
    funcionando: true,
    livre: true,
    descricao_problema: null,
  });

  expect(() => hardware.marcarDefeito('   ')).toThrow(DescricaoProblemaObrigatoriaError);
});
```

- [ ] **Step 8: Run defect-description test to verify it fails (red)**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/hardware.entity.domain.spec.ts -t "requires non-empty problem description"
```

Expected: FAIL (red) for the new test case.
If it unexpectedly passes, tighten assertions so current code fails before implementing.

- [ ] **Step 9: Implement minimal defect-description validation only if needed**

```ts
// api/src/entities/hardware.entity.ts
const descricao = descricaoProblema.trim();
if (!descricao) {
  throw new DescricaoProblemaObrigatoriaError();
}
```

- [ ] **Step 10: Re-run defect-description test**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/hardware.entity.domain.spec.ts -t "requires non-empty problem description"
```

Expected: PASS.

- [ ] **Step 11: Commit defect-description test cycle**

```bash
git add api/src/entities/hardware.entity.domain.spec.ts api/src/entities/hardware.entity.ts
git commit -m "test(api): cover defect description validation"
```

- [ ] **Step 12: Mark PRD item immediately with exact edit**

In `docs/PRD-GuardaHard.md` change:

```md
Before:

- [ ] Testar defeito

After:

- [x] Testar defeito
```

- [ ] **Step 13: Commit PRD checkbox update**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark defect test item complete"
```

### Task 5: Testar conserto

**Files:**

- Modify: `api/src/entities/hardware.entity.domain.spec.ts`
- Modify: `api/src/entities/hardware.entity.ts` (only if needed)
- Test: `api/src/entities/hardware.entity.domain.spec.ts`

- [ ] **Step 1: Add failing test for repair flow**

```ts
// append to api/src/entities/hardware.entity.domain.spec.ts
it('repairs hardware and returns it to available state', () => {
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
```

- [ ] **Step 2: Run test to verify it fails first (red)**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/hardware.entity.domain.spec.ts
```

Expected: FAIL (red) for the new test case.
If it unexpectedly passes, tighten assertions so current code fails before implementing.

- [ ] **Step 3: Implement minimal repair behavior only if needed**

```ts
// api/src/entities/hardware.entity.ts
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

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/entities/hardware.entity.domain.spec.ts api/src/entities/hardware.entity.ts
git commit -m "test(api): add repair domain behavior test"
```

- [ ] **Step 6: Mark PRD item immediately with exact edit**

In `docs/PRD-GuardaHard.md` change:

```md
Before:

- [ ] Testar conserto

After:

- [x] Testar conserto
```

- [ ] **Step 7: Commit PRD checkbox update**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark repair test item complete"
```

---

## Chunk 2: Integration Tests (Concorrencia + Multi-Tenant)

### Task 6: Testar concorrencia com optimistic locking

**Files:**

- Create: `api/test/domain/domain-test-data-source.ts`
- Create: `api/test/domain/emprestimo.concorrencia.spec.ts`
- Modify: `api/src/entities/hardware.entity.ts` (only if `version` optimistic behavior is broken)
- Test: `api/test/domain/emprestimo.concorrencia.spec.ts`

- [ ] **Step 1: Write failing integration test that simulates two stale loan attempts**

```ts
// api/test/domain/emprestimo.concorrencia.spec.ts
import { afterEach, describe, expect, it } from 'vitest';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import { Departamento, Emprestimo, Hardware, Usuario } from '../../src/entities';
import { createDomainTestDataSource } from './domain-test-data-source';

describe('Domain concurrency - emprestimo', () => {
  const dataSource = createDomainTestDataSource();

  afterEach(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('rejects second stale loan attempt using optimistic lock', async () => {
    await dataSource.initialize();

    const departamentoRepo = dataSource.getRepository(Departamento);
    const usuarioRepo = dataSource.getRepository(Usuario);
    const hardwareRepo = dataSource.getRepository(Hardware);
    const emprestimoRepo = dataSource.getRepository(Emprestimo);

    const departamento = await departamentoRepo.save(
      departamentoRepo.create({ empresa_id: 'empresa-a', nome: 'Suporte' }),
    );

    const usuario = await usuarioRepo.save(
      usuarioRepo.create({
        empresa_id: 'empresa-a',
        departamento_id: departamento.id,
        nome: 'Usuario A',
        email: 'usuario.a@empresa.test',
        ativo: true,
      }),
    );

    const hardware = await hardwareRepo.save(
      hardwareRepo.create({
        empresa_id: 'empresa-a',
        descricao: 'Notebook',
        marca: 'Lenovo',
        modelo: 'T14',
        codigo_patrimonio: 'PAT-001',
        funcionando: true,
        livre: true,
        descricao_problema: null,
      }),
    );

    const staleVersion = hardware.version;

    const hardwarePrimeiraTentativa = await hardwareRepo
      .createQueryBuilder('hardware')
      .setLock('optimistic', staleVersion)
      .where('hardware.id = :id', { id: hardware.id })
      .getOneOrFail();

    const emprestimoOk = Emprestimo.emprestar({
      empresa_id: 'empresa-a',
      usuario_id: usuario.id,
      hardware_id: hardware.id,
      hardware: hardwarePrimeiraTentativa,
      data_retirada: new Date('2026-03-12T10:00:00.000Z'),
    });

    await hardwareRepo.save(hardwarePrimeiraTentativa);
    await emprestimoRepo.save(emprestimoOk);

    await expect(
      hardwareRepo
        .createQueryBuilder('hardware')
        .setLock('optimistic', staleVersion)
        .where('hardware.id = :id', { id: hardware.id })
        .getOneOrFail(),
    ).rejects.toThrow(OptimisticLockVersionMismatchError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails first**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/domain/emprestimo.concorrencia.spec.ts
```

Expected: FAIL (red) for the new test case.
If it unexpectedly passes, tighten assertions so current code fails before implementing.

- [ ] **Step 3: Add minimal integration helper**

```ts
// api/test/domain/domain-test-data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Departamento, Emprestimo, Hardware, Usuario } from '../../src/entities';

export function createDomainTestDataSource(): DataSource {
  return new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [Departamento, Usuario, Hardware, Emprestimo],
    synchronize: true,
    logging: false,
  });
}
```

- [ ] **Step 4: Re-run concurrency test to verify current status**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/domain/emprestimo.concorrencia.spec.ts
```

Expected: FAIL if `Hardware.version` optimistic locking support is missing.

- [ ] **Step 5: Add fallback `version` column only if needed**

```ts
// api/src/entities/hardware.entity.ts
@VersionColumn()
version!: number;
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/domain/emprestimo.concorrencia.spec.ts
```

Expected: PASS with optimistic lock mismatch asserted.

- [ ] **Step 7: Commit concurrency test cycle (choose one command)**

If no fallback edit was needed:

```bash
git add api/test/domain/domain-test-data-source.ts api/test/domain/emprestimo.concorrencia.spec.ts
git commit -m "test(api): add optimistic locking concurrency test for loans"
```

If fallback edit was needed:

```bash
git add api/test/domain/domain-test-data-source.ts api/test/domain/emprestimo.concorrencia.spec.ts api/src/entities/hardware.entity.ts
git commit -m "test(api): add optimistic locking concurrency test for loans"
```

- [ ] **Step 8: Mark PRD item immediately with exact edit**

In `docs/PRD-GuardaHard.md` change:

```md
Before:

- [ ] Testar concorrência

After:

- [x] Testar concorrência
```

- [ ] **Step 9: Commit PRD checkbox update**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark concurrency test item complete"
```

### Task 7: Testar isolamento multi tenant (read isolation)

**Files:**

- Create: `api/test/domain/multi-tenant-isolamento.spec.ts`
- Modify: `api/src/tenant/tenant.repository.ts` (only if test reveals missing tenant filter)
- Test: `api/test/domain/multi-tenant-isolamento.spec.ts`

- [ ] **Step 1: Write failing read-isolation integration test**

```ts
// api/test/domain/multi-tenant-isolamento.spec.ts
import { afterEach, describe, expect, it } from 'vitest';
import { Departamento } from '../../src/entities';
import { TenantContext, TenantRepository, TenantSubscriber } from '../../src/tenant';
import { createDomainTestDataSource } from './domain-test-data-source';

describe('Domain integration - multi tenant isolation', () => {
  const dataSource = createDomainTestDataSource();
  const tenantContext = new TenantContext();

  afterEach(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('ensures tenant A cannot read tenant B rows through TenantRepository', async () => {
    await dataSource.initialize();
    dataSource.subscribers.push(new TenantSubscriber(tenantContext));

    const rawRepo = dataSource.getRepository(Departamento);
    const tenantRepo = new TenantRepository(rawRepo, tenantContext);

    await tenantContext.run('empresa-a', async () => {
      await rawRepo.save(rawRepo.create({ nome: 'Suporte A' }));
    });

    await tenantContext.run('empresa-b', async () => {
      await rawRepo.save(rawRepo.create({ nome: 'Suporte B' }));
    });

    await tenantContext.run('empresa-a', async () => {
      const rows = await tenantRepo.find();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.empresa_id).toBe('empresa-a');
      expect(rows[0]?.nome).toBe('Suporte A');
    });
  });
});
```

- [ ] **Step 2: Run read-isolation test to verify it fails first (red)**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/domain/multi-tenant-isolamento.spec.ts -t "ensures tenant A cannot read tenant B rows through TenantRepository"
```

Expected: FAIL (red) for the new read-isolation case.
If it unexpectedly passes, tighten assertions so current code fails before implementing.

- [ ] **Step 3: Implement minimal tenant read filter fix only if needed**

```ts
// api/src/tenant/tenant.repository.ts
find(options: Omit<FindManyOptions<T>, 'where'> = {}): Promise<T[]> {
  const empresaId = this.tenantContext.requireEmpresaId();
  return this.repository.find({
    ...options,
    where: { empresa_id: empresaId } as FindOptionsWhere<T>,
  });
}
```

- [ ] **Step 4: Re-run read-isolation test**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/domain/multi-tenant-isolamento.spec.ts -t "ensures tenant A cannot read tenant B rows through TenantRepository"
```

Expected: PASS.

- [ ] **Step 5: Commit read-isolation test cycle (choose one command)**

If no repository fix was needed:

```bash
git add api/test/domain/multi-tenant-isolamento.spec.ts
git commit -m "test(api): add tenant read isolation integration test"
```

If repository fix was needed:

```bash
git add api/test/domain/multi-tenant-isolamento.spec.ts api/src/tenant/tenant.repository.ts
git commit -m "test(api): add tenant read isolation integration test"
```

### Task 8: Testar isolamento multi tenant (cross-tenant update block)

**Files:**

- Modify: `api/test/domain/multi-tenant-isolamento.spec.ts`
- Modify: `api/src/tenant/tenant.subscriber.ts` (only if test reveals missing cross-tenant block)
- Test: `api/test/domain/multi-tenant-isolamento.spec.ts`

- [ ] **Step 1: Add failing cross-tenant update-block integration test**

```ts
// append in api/test/domain/multi-tenant-isolamento.spec.ts (same describe block)
import { CrossTenantAccessError } from '../../src/tenant';

it('blocks cross-tenant update attempts', async () => {
  await dataSource.initialize();
  dataSource.subscribers.push(new TenantSubscriber(tenantContext));

  const rawRepo = dataSource.getRepository(Departamento);
  const tenantRepo = new TenantRepository(rawRepo, tenantContext);

  const departamentoTenantB = await tenantContext.run('empresa-b', async () => {
    return rawRepo.save(rawRepo.create({ nome: 'Comercial B' }));
  });

  await tenantContext.run('empresa-a', async () => {
    await expect(
      tenantRepo.updateById(departamentoTenantB.id, { nome: 'Tentativa indevida' }),
    ).rejects.toThrow(CrossTenantAccessError);
  });
});
```

- [ ] **Step 2: Run cross-tenant update test to verify it fails first (red)**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/domain/multi-tenant-isolamento.spec.ts -t "blocks cross-tenant update attempts"
```

Expected: FAIL (red) for the new cross-tenant update case.
If it unexpectedly passes, tighten assertions so current code fails before implementing.

- [ ] **Step 3: Implement minimal cross-tenant update guard only if needed**

```ts
// api/src/tenant/tenant.subscriber.ts
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
```

- [ ] **Step 4: Re-run cross-tenant update test**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/domain/multi-tenant-isolamento.spec.ts -t "blocks cross-tenant update attempts"
```

Expected: PASS.

- [ ] **Step 5: Commit cross-tenant update test cycle (choose one command)**

If no subscriber fix was needed:

```bash
git add api/test/domain/multi-tenant-isolamento.spec.ts
git commit -m "test(api): add cross-tenant update blocking integration test"
```

If subscriber fix was needed:

```bash
git add api/test/domain/multi-tenant-isolamento.spec.ts api/src/tenant/tenant.subscriber.ts
git commit -m "test(api): add cross-tenant update blocking integration test"
```

- [ ] **Step 6: Mark PRD item immediately with exact edit**

In `docs/PRD-GuardaHard.md` change:

```md
Before:

- [ ] Testar isolamento multi tenant

After:

- [x] Testar isolamento multi tenant
```

- [ ] **Step 7: Commit PRD checkbox update**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark multi-tenant isolation test item complete"
```

### Task 9: Etapa 5 checklist completion gate

**Files:**

- Modify: `docs/PRD-GuardaHard.md` (checklist state only, if any Etapa 5 item is still unchecked)

- [ ] **Step 1: Run focused Etapa 5 tests together**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/emprestimo.entity.domain.spec.ts src/entities/hardware.entity.domain.spec.ts test/domain/emprestimo.concorrencia.spec.ts test/domain/multi-tenant-isolamento.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Verify Etapa 5 checklist is fully checked in PRD**

Run:

```bash
pnpm --filter @guarda-hard/api exec node -e "const fs=require('node:fs');const p='../docs/PRD-GuardaHard.md';const t=fs.readFileSync(p,'utf8');const items=['Testar empréstimo válido','Testar empréstimo inválido','Testar devolução','Testar defeito','Testar conserto','Testar concorrência','Testar isolamento multi tenant'];for(const item of items){if(!t.includes(`- [x] ${item}`)){throw new Error(`missing checkbox update: ${item}`)}}console.log('ok: etapa 5 checklist completo');"
```

Expected: prints `ok: etapa 5 checklist completo`.

- [ ] **Step 3: If any Etapa 5 item is unchecked, update PRD before final commit**

Update `docs/PRD-GuardaHard.md` so all Etapa 5 items are `[x]`.

- [ ] **Step 4: Commit PRD checklist sync (if needed)**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): sync etapa 5 checklist"
```

### Optional hardening (outside Etapa 5 scope)

Run these only as an extra safety pass before opening PR; they are not required for Etapa 5 checklist completion:

```bash
pnpm --filter @guarda-hard/api test
pnpm --filter @guarda-hard/api lint
pnpm --filter @guarda-hard/api build
```

---

## Risks and Mitigations

- **Risk:** Etapa 3 or Etapa 4 behavior is not present in branch, causing false-negative Etapa 5 failures.
  - **Mitigation:** enforce precondition check; if missing, execute prior stage plans first.
- **Risk:** Concurrency test becomes flaky.
  - **Mitigation:** use deterministic stale-version simulation instead of timing-based parallel race.
- **Risk:** Tenant integration tests bypass subscriber protections.
  - **Mitigation:** explicitly register `TenantSubscriber` in test DataSource and assert both read + update isolation.

## Definition of Done

- All Etapa 5 checklist items in `docs/PRD-GuardaHard.md` are `[x]`.
- Domain unit tests cover valid/invalid emprestimo, devolucao, defeito, and conserto.
- Integration tests prove optimistic locking and tenant isolation behavior.
- `pnpm --filter @guarda-hard/api test`, `lint`, and `build` all pass.
- No scope creep into API endpoints, frontend, or reports.
