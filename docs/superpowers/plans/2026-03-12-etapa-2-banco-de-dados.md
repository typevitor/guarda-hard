# Etapa 2 — Banco de Dados Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Etapa 2 from the PRD with SQLite + TypeORM, complete schema migrations for `departamentos`, `usuarios`, `hardwares`, `emprestimos`, and initial seed data.

**Architecture:** Use a single TypeORM DataSource config shared by CLI and NestJS runtime. Define entities first, generate and review migrations from entity metadata, and validate via integration tests against a real SQLite file. Keep scope tight to persistence setup only; business rules remain for later etapas.

**Tech Stack:** NestJS 11, TypeORM 0.3.x, SQLite (better-sqlite3), Vitest, TypeScript strict, pnpm workspaces

---

## Scope Check

Etapa 2 is one subsystem (persistence foundation). Do not include Etapa 3 (tenant enforcement logic), Etapa 4 domain behavior methods, or API endpoints.

## Skills To Use During Execution

- `@superpowers/subagent-driven-development` for implementation orchestration
- `@superpowers/test-driven-development` before each implementation task
- `@superpowers/systematic-debugging` if any test/migration command fails unexpectedly
- `@superpowers/verification-before-completion` before marking tasks done
- `@superpowers/requesting-code-review` after implementation

## File Structure (lock this before coding)

### Create

- `api/src/infrastructure/database/data-source.ts` — canonical TypeORM DataSource configuration (SQLite path, entities, migrations)
- `api/src/infrastructure/database/database.module.ts` — NestJS module wiring TypeORM into app runtime
- `api/src/infrastructure/database/data-source.spec.ts` — smoke test for DataSource configuration
- `api/src/infrastructure/database/database.module.spec.ts` — module bootstrapping test
- `api/src/entities/departamento.entity.ts` — `departamentos` mapping
- `api/src/entities/usuario.entity.ts` — `usuarios` mapping + relation to `Departamento`
- `api/src/entities/hardware.entity.ts` — `hardwares` mapping + optimistic lock `version`
- `api/src/entities/emprestimo.entity.ts` — `emprestimos` mapping + relations to `Usuario` and `Hardware`
- `api/src/entities/entities.metadata.spec.ts` — metadata tests for columns/relations
- `api/src/entities/index.ts` — entity barrel export
- `api/src/migrations/<timestamp>-CreateEtapa2Schema.ts` — schema migration creating 4 tables + constraints
- `api/src/migrations/<timestamp>-SeedDefaultDepartamentos.ts` — seed migration inserting 5 default departamentos
- `api/test/database/migrations.schema.spec.ts` — integration test for table creation
- `api/test/database/migrations.seed.spec.ts` — integration test for seed records
- `api/data/.gitkeep` — keeps db directory tracked

### Modify

- `api/package.json` — add TypeORM CLI scripts and migration scripts (pnpm-compatible)
- `api/tsconfig.json` — ensure decorator metadata settings for TypeORM
- `api/src/app.module.ts` — import `DatabaseModule`
- `.gitignore` (repo root) — ignore `api/data/*.sqlite`
- `docs/PRD-GuardaHard.md` — mark Etapa 2 checklist items immediately after each item is completed

### Notes

- Keep entity files focused; no business methods here.
- Avoid shared base entity abstraction now (YAGNI). Duplicate timestamp columns explicitly for clarity.
- Use UTC timestamps consistently.

## Chunk 1: Database Foundation + Entity Mapping

### Task 1: Configure TypeORM DataSource and project scripts

**Files:**
- Create: `api/src/infrastructure/database/data-source.spec.ts`
- Create: `api/src/infrastructure/database/data-source.ts`
- Create: `api/data/.gitkeep`
- Modify: `api/package.json`
- Modify: `api/tsconfig.json`
- Modify: `.gitignore`
- Test: `api/src/infrastructure/database/data-source.spec.ts`

- [ ] **Step 1: Write the failing DataSource smoke test**

```ts
// api/src/infrastructure/database/data-source.spec.ts
import { describe, expect, it } from 'vitest';
import { AppDataSource } from './data-source';

describe('AppDataSource', () => {
  it('uses sqlite and points to api/data/guarda-hard.sqlite', () => {
    expect(AppDataSource.options.type).toBe('better-sqlite3');
    expect(String(AppDataSource.options.database)).toContain('api/data/guarda-hard.sqlite');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/infrastructure/database/data-source.spec.ts
```

Expected: FAIL with module-not-found for `./data-source`.

- [ ] **Step 3: Implement minimal DataSource + scripts/config**

Create:

```ts
// api/src/infrastructure/database/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'node:path';
import { Departamento, Usuario, Hardware, Emprestimo } from '../../entities';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: path.resolve(process.cwd(), 'data/guarda-hard.sqlite'),
  entities: [Departamento, Usuario, Hardware, Emprestimo],
  migrations: [path.resolve(process.cwd(), 'src/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: false,
});
```

Add `api/package.json` scripts (exact names):

```json
{
  "scripts": {
    "typeorm": "typeorm-ts-node-commonjs -d src/infrastructure/database/data-source.ts",
    "migration:generate": "pnpm run typeorm -- migration:generate src/migrations/CreateEtapa2Schema",
    "migration:run": "pnpm run typeorm -- migration:run",
    "migration:revert": "pnpm run typeorm -- migration:revert",
    "migration:show": "pnpm run typeorm -- migration:show"
  }
}
```

Ensure `api/tsconfig.json` has:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

- [ ] **Step 4: Verify resolved DB path from API cwd**

Run:

```bash
pnpm --filter @guarda-hard/api exec node -e "const path=require('node:path'); console.log(path.resolve(process.cwd(),'data/guarda-hard.sqlite'))"
```

Expected: absolute path ending with `/api/data/guarda-hard.sqlite`.

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/infrastructure/database/data-source.spec.ts
```

Expected: PASS (1 test passed).

- [ ] **Step 6: Commit**

```bash
git add api/src/infrastructure/database/data-source.spec.ts api/src/infrastructure/database/data-source.ts api/package.json api/tsconfig.json .gitignore api/data/.gitkeep
git commit -m "chore(api): configure sqlite datasource and migration scripts"
```

- [ ] **Step 7: Mark PRD item immediately**

Update `docs/PRD-GuardaHard.md`:
- Mark `Configurar SQLite` as completed (`[x]`)
- Mark `Configurar TypeORM` as completed (`[x]`)

### Task 2: Create TypeORM entities with schema metadata

**Files:**
- Create: `api/src/entities/departamento.entity.ts`
- Create: `api/src/entities/usuario.entity.ts`
- Create: `api/src/entities/hardware.entity.ts`
- Create: `api/src/entities/emprestimo.entity.ts`
- Create: `api/src/entities/index.ts`
- Create: `api/src/entities/entities.metadata.spec.ts`
- Test: `api/src/entities/entities.metadata.spec.ts`

- [ ] **Step 1: Write failing metadata test**

```ts
// api/src/entities/entities.metadata.spec.ts
import { describe, expect, it } from 'vitest';
import { AppDataSource } from '../infrastructure/database/data-source';

describe('Entity metadata', () => {
  it('registers all etapa 2 entities', async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const names = AppDataSource.entityMetadatas.map((m) => m.name);
    expect(names).toEqual(expect.arrayContaining(['Departamento', 'Usuario', 'Hardware', 'Emprestimo']));
    await AppDataSource.destroy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/entities.metadata.spec.ts
```

Expected: FAIL because entity files/exports do not exist yet.

- [ ] **Step 3: Implement `departamento.entity.ts`**

Include explicit fields:

```ts
@PrimaryGeneratedColumn('uuid') id!: string;
@Column({ type: 'varchar', length: 36 }) empresa_id!: string;
@Column({ type: 'varchar', length: 100 }) nome!: string;
@CreateDateColumn({ type: 'datetime' }) created_at!: Date;
@UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;
```

- [ ] **Step 4: Implement `usuario.entity.ts`**

Include explicit fields:

```ts
@PrimaryGeneratedColumn('uuid') id!: string;
@Column({ type: 'varchar', length: 36 }) empresa_id!: string;
@Column({ type: 'varchar', length: 36 }) departamento_id!: string;
@Column({ type: 'varchar', length: 150 }) nome!: string;
@Column({ type: 'varchar', length: 200 }) email!: string;
@Column({ type: 'boolean', default: true }) ativo!: boolean;
@CreateDateColumn({ type: 'datetime' }) created_at!: Date;
@UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;
```

Add relation:

```ts
@ManyToOne(() => Departamento)
@JoinColumn({ name: 'departamento_id' })
departamento!: Departamento;
```

- [ ] **Step 5: Implement `hardware.entity.ts`**

Include explicit fields:

```ts
@PrimaryGeneratedColumn('uuid') id!: string;
@Column({ type: 'varchar', length: 36 }) empresa_id!: string;
@Column({ type: 'varchar', length: 200 }) descricao!: string;
@Column({ type: 'varchar', length: 100 }) marca!: string;
@Column({ type: 'varchar', length: 100 }) modelo!: string;
@Column({ type: 'varchar', length: 50 }) codigo_patrimonio!: string;
@Column({ type: 'boolean', default: true }) funcionando!: boolean;
@Column({ type: 'text', nullable: true }) descricao_problema!: string | null;
@Column({ type: 'boolean', default: true }) livre!: boolean;
@VersionColumn() version!: number;
@CreateDateColumn({ type: 'datetime' }) created_at!: Date;
@UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;
```

- [ ] **Step 6: Implement `emprestimo.entity.ts` and `entities/index.ts`**

Include explicit fields:

```ts
@PrimaryGeneratedColumn('uuid') id!: string;
@Column({ type: 'varchar', length: 36 }) empresa_id!: string;
@Column({ type: 'varchar', length: 36 }) usuario_id!: string;
@Column({ type: 'varchar', length: 36 }) hardware_id!: string;
@Column({ type: 'datetime' }) data_retirada!: Date;
@Column({ type: 'datetime', nullable: true }) data_devolucao!: Date | null;
@CreateDateColumn({ type: 'datetime' }) created_at!: Date;
@UpdateDateColumn({ type: 'datetime' }) updated_at!: Date;
```

Add relations:

```ts
@ManyToOne(() => Usuario) @JoinColumn({ name: 'usuario_id' }) usuario!: Usuario;
@ManyToOne(() => Hardware) @JoinColumn({ name: 'hardware_id' }) hardware!: Hardware;
```

- [ ] **Step 7: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/entities/entities.metadata.spec.ts
```

Expected: PASS, all 4 entities discovered.

- [ ] **Step 8: Commit**

```bash
git add api/src/entities
git commit -m "feat(api): add etapa2 entities and relations"
```

### Task 3: Wire DatabaseModule into NestJS app

**Files:**
- Create: `api/src/infrastructure/database/database.module.ts`
- Create: `api/src/infrastructure/database/database.module.spec.ts`
- Modify: `api/src/app.module.ts`
- Test: `api/src/infrastructure/database/database.module.spec.ts`

- [ ] **Step 1: Write failing module boot test**

```ts
// api/src/infrastructure/database/database.module.spec.ts
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  it('compiles', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule] }).compile();
    expect(moduleRef).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/infrastructure/database/database.module.spec.ts
```

Expected: FAIL because `database.module.ts` does not exist.

- [ ] **Step 3: Implement DatabaseModule and AppModule wiring**

Create:

```ts
// api/src/infrastructure/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './data-source';

@Module({
  imports: [TypeOrmModule.forRoot(AppDataSource.options)],
})
export class DatabaseModule {}
```

Modify `api/src/app.module.ts` to include `DatabaseModule` in `imports`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- src/infrastructure/database/database.module.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/infrastructure/database/database.module.ts api/src/infrastructure/database/database.module.spec.ts api/src/app.module.ts
git commit -m "feat(api): wire database module into nest app"
```

## Chunk 2: Migrations, Seeds, and Final Verification

### Task 4: Generate and validate schema migration

**Files:**
- Create: `api/src/migrations/<timestamp>-CreateEtapa2Schema.ts`
- Create: `api/test/database/migrations.schema.spec.ts`
- Test: `api/test/database/migrations.schema.spec.ts`

- [ ] **Step 1: Write failing migration schema integration test**

```ts
// api/test/database/migrations.schema.spec.ts
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import path from 'node:path';

describe('schema migrations', () => {
  it('creates all etapa2 tables', () => {
    const db = new Database(path.resolve(process.cwd(), 'data/guarda-hard.sqlite'));
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
    const names = rows.map((r) => r.name);
    expect(names).toEqual(expect.arrayContaining(['departamentos', 'usuarios', 'hardwares', 'emprestimos']));
    db.close();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/database/migrations.schema.spec.ts
```

Expected: FAIL because tables do not exist yet.

- [ ] **Step 3: Generate migration and run it**

Run:

```bash
pnpm --filter @guarda-hard/api migration:generate
pnpm --filter @guarda-hard/api migration:run
```

Expected:
- `migration:generate` creates one migration file under `api/src/migrations/`
- `migration:run` reports successful execution

Then verify generated migration includes:
- table creation for 4 tables
- FK constraints (`departamento_id`, `usuario_id`, `hardware_id`)
- `version` column on `hardwares`
- timestamp columns on all tables

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/database/migrations.schema.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/migrations api/test/database/migrations.schema.spec.ts
git commit -m "feat(api): add etapa2 schema migration"
```

- [ ] **Step 6: Mark PRD items immediately**

Update `docs/PRD-GuardaHard.md`:
- Mark `Criar migrations`
- Mark `Criar tabela departamentos`
- Mark `Criar tabela usuarios`
- Mark `Criar tabela hardwares`
- Mark `Criar tabela emprestimos`

### Task 5: Add seed migration for default departamentos

**Files:**
- Create: `api/src/migrations/<timestamp>-SeedDefaultDepartamentos.ts`
- Create: `api/test/database/migrations.seed.spec.ts`
- Test: `api/test/database/migrations.seed.spec.ts`

- [ ] **Step 1: Write failing seed test**

```ts
// api/test/database/migrations.seed.spec.ts
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import path from 'node:path';

describe('seed migration', () => {
  it('inserts the 5 default departamentos', () => {
    const db = new Database(path.resolve(process.cwd(), 'data/guarda-hard.sqlite'));
    const rows = db.prepare('SELECT nome FROM departamentos ORDER BY nome').all() as Array<{ nome: string }>;
    expect(rows.map((r) => r.nome)).toEqual([
      'Administração',
      'Comercial',
      'Desenvolvimento',
      'Franquia',
      'Suporte',
    ]);
    db.close();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/database/migrations.seed.spec.ts
```

Expected: FAIL with empty rows or missing table content.

- [ ] **Step 3: Implement seed migration and execute**

Migration `up` inserts 5 rows with explicit values for:
- `id` (UUID string literals)
- `empresa_id` (fixed dev UUID)
- `nome` (5 default names)
- `created_at` and `updated_at` (UTC now)

Migration `down` deletes those rows by `nome` + `empresa_id`.

Run:

```bash
pnpm --filter @guarda-hard/api migration:run
```

Expected: seed migration executes successfully.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/database/migrations.seed.spec.ts
```

Expected: PASS with exactly 5 expected names.

- [ ] **Step 5: Commit**

```bash
git add api/src/migrations api/test/database/migrations.seed.spec.ts
git commit -m "feat(api): add default departamentos seed migration"
```

- [ ] **Step 6: Mark PRD item immediately**

Update `docs/PRD-GuardaHard.md`:
- Mark `Criar seeds iniciais`

### Task 6: Full verification and Etapa 2 completion gate

**Files:**
- Modify: `docs/PRD-GuardaHard.md` (final audit only if any Etapa 2 checkbox is still unchecked)

- [ ] **Step 1: Run focused API test suite**

Run:

```bash
pnpm --filter @guarda-hard/api test
```

Expected: PASS, including new migration and module tests.

- [ ] **Step 2: Run lint and build**

Run:

```bash
pnpm --filter @guarda-hard/api lint
pnpm --filter @guarda-hard/api build
```

Expected: both commands succeed with no errors.

- [ ] **Step 3: Verify migration status is clean**

Run:

```bash
pnpm --filter @guarda-hard/api migration:show
```

Expected: all current migrations listed as executed (no pending expected for local db).

- [ ] **Step 4: Verify PRD Etapa 2 is fully checked**

Ensure these are all `[x]` in `docs/PRD-GuardaHard.md`:
- Configurar SQLite
- Configurar TypeORM
- Criar migrations
- Criar tabela departamentos
- Criar tabela usuarios
- Criar tabela hardwares
- Criar tabela emprestimos
- Criar seeds iniciais

- [ ] **Step 5: Final commit for checklist updates (if needed)**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 2 database checklist as complete"
```

---

## Risks and Mitigations

- **Risk:** SQLite file path differs between CLI and runtime.
  - **Mitigation:** Keep one DataSource config and resolve path from repo root consistently.
- **Risk:** Auto-generated migration contains unwanted diffs.
  - **Mitigation:** Review generated SQL before commit; regenerate if needed.
- **Risk:** Seed migration not idempotent in local reruns.
  - **Mitigation:** Use deterministic `down` cleanup and verify with revert/run during testing.

## Definition of Done

- All Etapa 2 PRD items checked `[x]`
- Migrations create all 4 tables with required columns/relations
- Seed migration inserts default departamentos
- `pnpm --filter @guarda-hard/api test`, `lint`, and `build` pass
- No scope creep into Etapa 3+
