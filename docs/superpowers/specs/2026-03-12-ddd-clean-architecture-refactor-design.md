# DDD / Clean Architecture Refactor — Design Spec

**Date:** 2026-03-12
**Status:** Approved
**Scope:** Big-bang restructure of the API layer to separate TypeORM entities from domain entities and organize code into feature modules with DDD layering.

---

## Context

The GuardaHard API currently stores all 4 TypeORM entities in a flat `api/src/entities/` folder. Domain methods (`emprestar`, `devolver`, `marcarDefeito`, `consertar`) live directly on the TypeORM entity classes. There are no feature modules, no services, no DTOs, no controllers beyond a Hello World endpoint. The `modules/` directory is empty.

The architecture doc (`docs/architecture.md`) describes this as a "temporary simplification" and prescribes a target where domain entities are plain TypeScript classes, separated from ORM persistence entities.

With Etapa 4 (domain methods) complete and Etapa 5 (domain tests) next, this is the right time to restructure before building controllers and services in Etapa 6.

---

## Decisions

| Decision               | Choice                                                                                                                     | Rationale                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Refactor scope         | Big-bang (all at once)                                                                                                     | Avoids half-migrated state; codebase is small enough                                                |
| Entity separation      | Full separation with mappers                                                                                               | Maximum isolation; domain has zero framework imports                                                |
| Repository abstraction | Interface per aggregate root                                                                                               | Expressive domain contracts; each aggregate has its own port                                        |
| Aggregate boundaries   | Hardware, Emprestimo, Departamento, Usuario as separate aggregates                                                         | Cross-aggregate coordination in use cases, not in entities                                          |
| Shared kernel location | `api/src/shared/` for cross-cutting domain; `api/src/tenant/` as standalone module; `api/src/infrastructure/` for database | Aligns with architecture.md layout                                                                  |
| Folder structure       | Feature-module layered (Approach A)                                                                                        | Aligns with architecture.md; each module is self-contained                                          |
| ID generation          | Domain factories generate UUIDs via `crypto.randomUUID()`                                                                  | ORM entities use `@PrimaryColumn` (not `@PrimaryGeneratedColumn`) since IDs originate in the domain |
| Base entity naming     | `DomainEntity` (not `BaseEntity`)                                                                                          | Avoids collision with TypeORM's `BaseEntity` export                                                 |

---

## Target Folder Structure

Follows the layout defined in `docs/architecture.md`:

```
api/src/
├── main.ts
├── app.module.ts
│
├── shared/
│   ├── shared.module.ts                       # Exports cross-cutting providers
│   ├── domain/
│   │   ├── domain-entity.base.ts              # Abstract base: id, empresaId, createdAt, updatedAt
│   │   └── domain-error.base.ts               # Abstract DomainError base class
│   └── testing/                               # Shared test helpers (future)
│
├── tenant/                                    # Standalone tenant module (matches architecture.md)
│   ├── tenant.module.ts
│   ├── application/
│   │   └── tenant-context.ts
│   └── infrastructure/
│       ├── tenant.subscriber.ts
│       ├── tenant.repository.ts
│       ├── tenant.types.ts
│       └── tenant.errors.ts
│
├── infrastructure/                            # Top-level infrastructure (matches architecture.md)
│   └── database/
│       ├── database.module.ts
│       ├── data-source.ts
│       └── migrations/
│           ├── 1773327116742-CreateEtapa2Schema.ts
│           └── 1773327116743-SeedDefaultDepartamentos.ts
│
├── modules/
│   ├── hardwares/
│   │   ├── hardwares.module.ts
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── hardware.entity.ts
│   │   │   ├── repositories/
│   │   │   │   └── hardware.repository.interface.ts
│   │   │   └── errors/
│   │   │       ├── hardware-nao-disponivel.error.ts
│   │   │       ├── hardware-defeituoso.error.ts
│   │   │       └── descricao-problema-obrigatoria.error.ts
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   └── dto/
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       ├── hardware.orm-entity.ts
│   │   │       ├── hardware.mapper.ts
│   │   │       └── hardware.typeorm-repository.ts
│   │   └── presentation/
│   │       └── http/
│   │
│   ├── emprestimos/
│   │   ├── emprestimos.module.ts
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── emprestimo.entity.ts
│   │   │   ├── repositories/
│   │   │   │   └── emprestimo.repository.interface.ts
│   │   │   └── errors/
│   │   │       └── emprestimo-ja-devolvido.error.ts
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   └── dto/
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       ├── emprestimo.orm-entity.ts
│   │   │       ├── emprestimo.mapper.ts
│   │   │       └── emprestimo.typeorm-repository.ts
│   │   └── presentation/
│   │       └── http/
│   │
│   ├── departamentos/
│   │   ├── departamentos.module.ts
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── departamento.entity.ts
│   │   │   └── repositories/
│   │   │       └── departamento.repository.interface.ts
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   └── dto/
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       ├── departamento.orm-entity.ts
│   │   │       ├── departamento.mapper.ts
│   │   │       └── departamento.typeorm-repository.ts
│   │   └── presentation/
│   │       └── http/
│   │
│   └── usuarios/
│       ├── usuarios.module.ts
│       ├── domain/
│       │   ├── entities/
│       │   │   └── usuario.entity.ts
│       │   └── repositories/
│       │       └── usuario.repository.interface.ts
│       ├── application/
│       │   ├── use-cases/
│       │   └── dto/
│       ├── infrastructure/
│       │   └── persistence/
│       │       ├── usuario.orm-entity.ts
│       │       ├── usuario.mapper.ts
│       │       └── usuario.typeorm-repository.ts
│       └── presentation/
│           └── http/
```

### Differences from original spec vs. architecture.md (resolved)

| Item                  | Original spec                                               | Architecture.md                                                | Resolution                                                                                                                                                                                                                                                                                                           |
| --------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tenant module         | `shared/infrastructure/tenant/`                             | Top-level `tenant/` with `application/` + `infrastructure/`    | Follow architecture.md: `api/src/tenant/`                                                                                                                                                                                                                                                                            |
| Database + migrations | `shared/infrastructure/database/` + top-level `migrations/` | Top-level `infrastructure/database/` with `migrations/` inside | Follow architecture.md: `api/src/infrastructure/database/`                                                                                                                                                                                                                                                           |
| Mapper placement      | `application/mappers/`                                      | `application/mappers/`                                         | Deviate: `infrastructure/persistence/`. Mappers depend on ORM entities (infrastructure); placing them in `application/` would make application depend on infrastructure, violating the dependency rule. The mapper's only consumer is the repository implementation, which is also in `infrastructure/persistence/`. |

### Naming Conventions

| Artifact              | Pattern                              | Example                            |
| --------------------- | ------------------------------------ | ---------------------------------- |
| Domain entity         | `<name>.entity.ts`                   | `hardware.entity.ts`               |
| ORM entity            | `<name>.orm-entity.ts`               | `hardware.orm-entity.ts`           |
| Domain repo interface | `<name>.repository.interface.ts`     | `hardware.repository.interface.ts` |
| TypeORM repo impl     | `<name>.typeorm-repository.ts`       | `hardware.typeorm-repository.ts`   |
| Mapper                | `<name>.mapper.ts`                   | `hardware.mapper.ts`               |
| Domain error          | `<kebab-case-error-name>.error.ts`   | `hardware-nao-disponivel.error.ts` |
| NestJS module         | `<feature-plural>.module.ts`         | `hardwares.module.ts`              |
| Unit test             | `<source-file>.spec.ts` (co-located) | `hardware.entity.spec.ts`          |

---

## Domain Entity Design

### Base Entity

```typescript
// shared/domain/domain-entity.base.ts
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

Named `DomainEntity` to avoid collision with TypeORM's exported `BaseEntity` class.

Domain uses camelCase (`empresaId`, `createdAt`). ORM entities use snake_case (`empresa_id`, `created_at`) matching the database. Mappers bridge the two.

### Base Domain Error

```typescript
// shared/domain/domain-error.base.ts
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

All domain errors extend this base class instead of `Error` directly.

### Hardware Domain Entity

```typescript
// modules/hardwares/domain/entities/hardware.entity.ts
import { DomainEntity } from '../../../../shared/domain/domain-entity.base';
import { HardwareNaoDisponivelError } from '../errors/hardware-nao-disponivel.error';
import { HardwareDefeituosoError } from '../errors/hardware-defeituoso.error';
import { DescricaoProblemaObrigatoriaError } from '../errors/descricao-problema-obrigatoria.error';
import { randomUUID } from 'node:crypto';

export interface HardwareProps {
  id: string;
  empresaId: string;
  descricao: string;
  marca: string;
  modelo: string;
  codigoPatrimonio: string;
  funcionando: boolean;
  descricaoProblema: string | null;
  livre: boolean;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateHardwareProps {
  empresaId: string;
  descricao: string;
  marca: string;
  modelo: string;
  codigoPatrimonio: string;
}

export class Hardware extends DomainEntity {
  private _descricao: string;
  private _marca: string;
  private _modelo: string;
  private _codigoPatrimonio: string;
  private _funcionando: boolean;
  private _descricaoProblema: string | null;
  private _livre: boolean;
  readonly version: number;

  // Used by mapper to reconstitute from DB
  constructor(props: HardwareProps) {
    super(props);
    this._descricao = props.descricao;
    this._marca = props.marca;
    this._modelo = props.modelo;
    this._codigoPatrimonio = props.codigoPatrimonio;
    this._funcionando = props.funcionando;
    this._descricaoProblema = props.descricaoProblema;
    this._livre = props.livre;
    this.version = props.version;
  }

  // Factory for creating new hardware — generates UUID
  static create(props: CreateHardwareProps): Hardware {
    return new Hardware({
      id: randomUUID(),
      empresaId: props.empresaId,
      descricao: props.descricao,
      marca: props.marca,
      modelo: props.modelo,
      codigoPatrimonio: props.codigoPatrimonio,
      funcionando: true,
      descricaoProblema: null,
      livre: true,
      version: 0,
    });
  }

  // Domain methods — logic preserved from current entity
  emprestar(): void {
    if (!this._funcionando) throw new HardwareDefeituosoError();
    if (!this._livre) throw new HardwareNaoDisponivelError();
    this._livre = false;
  }

  devolver(): void {
    this._livre = true;
  }

  marcarDefeito(descricaoProblema: string): void {
    const descricao = descricaoProblema.trim();
    if (!descricao) throw new DescricaoProblemaObrigatoriaError();
    this._funcionando = false;
    this._livre = false;
    this._descricaoProblema = descricao;
  }

  consertar(): void {
    this._funcionando = true;
    this._livre = true;
    this._descricaoProblema = null;
  }

  // Getters
  get descricao(): string {
    return this._descricao;
  }
  get marca(): string {
    return this._marca;
  }
  get modelo(): string {
    return this._modelo;
  }
  get codigoPatrimonio(): string {
    return this._codigoPatrimonio;
  }
  get funcionando(): boolean {
    return this._funcionando;
  }
  get descricaoProblema(): string | null {
    return this._descricaoProblema;
  }
  get livre(): boolean {
    return this._livre;
  }
}
```

**Key design points:**

- Zero framework imports. Private fields enforce encapsulation — state changes only through domain methods.
- `static create()` generates UUID via `crypto.randomUUID()`. The regular constructor is for reconstitution from persistence (used by mapper).
- `marcarDefeito()` preserves the exact current behavior: calls `.trim()` directly on the parameter (throws `TypeError` on `null`/`undefined`, throws `DescricaoProblemaObrigatoriaError` on empty string). No optional chaining.
- `version` is readonly from the domain's perspective — optimistic locking is a persistence concern, but the domain carries the version so the mapper can pass it back.
- Imports use relative paths (no path aliases — see Path Aliases section below).

### Emprestimo Domain Entity

```typescript
// modules/emprestimos/domain/entities/emprestimo.entity.ts
import { DomainEntity } from '../../../../shared/domain/domain-entity.base';
import { EmprestimoJaDevolvidoError } from '../errors/emprestimo-ja-devolvido.error';
import { randomUUID } from 'node:crypto';

export interface EmprestimoProps {
  id: string;
  empresaId: string;
  usuarioId: string;
  hardwareId: string;
  dataRetirada: Date;
  dataDevolucao: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Emprestimo extends DomainEntity {
  readonly usuarioId: string;
  readonly hardwareId: string;
  private _dataRetirada: Date;
  private _dataDevolucao: Date | null;

  constructor(props: EmprestimoProps) {
    super(props);
    this.usuarioId = props.usuarioId;
    this.hardwareId = props.hardwareId;
    this._dataRetirada = props.dataRetirada;
    this._dataDevolucao = props.dataDevolucao;
  }

  static emprestar(props: {
    empresaId: string;
    usuarioId: string;
    hardwareId: string;
    dataRetirada?: Date;
  }): Emprestimo {
    return new Emprestimo({
      id: randomUUID(),
      empresaId: props.empresaId,
      usuarioId: props.usuarioId,
      hardwareId: props.hardwareId,
      dataRetirada: props.dataRetirada ?? new Date(),
      dataDevolucao: null,
    });
  }

  devolver(dataDevolucao?: Date): void {
    if (this._dataDevolucao) throw new EmprestimoJaDevolvidoError();
    this._dataDevolucao = dataDevolucao ?? new Date();
  }

  get estaDevolvido(): boolean {
    return this._dataDevolucao !== null;
  }
  get dataRetirada(): Date {
    return this._dataRetirada;
  }
  get dataDevolucao(): Date | null {
    return this._dataDevolucao;
  }
}
```

**Behavioral change from current code:** The current `Emprestimo.emprestar()` receives a `Hardware` instance and calls `hardware.emprestar()` as cross-aggregate coordination. The current `devolver()` receives a `Hardware` and calls `hardware.devolver()`.

In the new design, `Emprestimo` only references aggregates by ID (`usuarioId`, `hardwareId`). Cross-aggregate coordination moves to use cases in Etapa 6. **Existing domain tests that test the coordinated behavior will need to be rewritten** to test each aggregate independently, with a use-case test covering the coordination.

### Departamento Domain Entity

```typescript
// modules/departamentos/domain/entities/departamento.entity.ts
import { DomainEntity } from '../../../../shared/domain/domain-entity.base';
import { randomUUID } from 'node:crypto';

export interface DepartamentoProps {
  id: string;
  empresaId: string;
  nome: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Departamento extends DomainEntity {
  private _nome: string;

  constructor(props: DepartamentoProps) {
    super(props);
    this._nome = props.nome;
  }

  static create(props: { empresaId: string; nome: string }): Departamento {
    return new Departamento({
      id: randomUUID(),
      empresaId: props.empresaId,
      nome: props.nome,
    });
  }

  get nome(): string {
    return this._nome;
  }
}
```

### Usuario Domain Entity

```typescript
// modules/usuarios/domain/entities/usuario.entity.ts
import { DomainEntity } from '../../../../shared/domain/domain-entity.base';
import { randomUUID } from 'node:crypto';

export interface UsuarioProps {
  id: string;
  empresaId: string;
  departamentoId: string;
  nome: string;
  email: string;
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Usuario extends DomainEntity {
  readonly departamentoId: string; // Cross-aggregate reference by ID
  private _nome: string;
  private _email: string;
  private _ativo: boolean;

  constructor(props: UsuarioProps) {
    super(props);
    this.departamentoId = props.departamentoId;
    this._nome = props.nome;
    this._email = props.email;
    this._ativo = props.ativo;
  }

  static create(props: {
    empresaId: string;
    departamentoId: string;
    nome: string;
    email: string;
  }): Usuario {
    return new Usuario({
      id: randomUUID(),
      empresaId: props.empresaId,
      departamentoId: props.departamentoId,
      nome: props.nome,
      email: props.email,
      ativo: true,
    });
  }

  get nome(): string {
    return this._nome;
  }
  get email(): string {
    return this._email;
  }
  get ativo(): boolean {
    return this._ativo;
  }
}
```

Note: `departamentoId` is a cross-aggregate reference by ID. The ORM entity keeps the `@ManyToOne` relation for query JOINs, but the domain entity only knows the ID.

---

## ORM Entities

ORM entities are pure data structures with TypeORM decorators. No domain methods. They use `@PrimaryColumn` (not `@PrimaryGeneratedColumn`) because IDs are generated in the domain layer.

### HardwareOrmEntity

```typescript
// modules/hardwares/infrastructure/persistence/hardware.orm-entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  VersionColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hardwares')
export class HardwareOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', name: 'empresa_id', length: 36 })
  empresa_id: string;

  @Column({ type: 'varchar', length: 200 })
  descricao: string;

  @Column({ type: 'varchar', length: 100 })
  marca: string;

  @Column({ type: 'varchar', length: 100 })
  modelo: string;

  @Column({ type: 'varchar', name: 'codigo_patrimonio', length: 50 })
  codigo_patrimonio: string;

  @Column({ type: 'boolean', default: true })
  funcionando: boolean;

  @Column({ type: 'text', name: 'descricao_problema', nullable: true })
  descricao_problema: string | null;

  @Column({ type: 'boolean', default: true })
  livre: boolean;

  @VersionColumn()
  version: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;
}
```

### EmprestimoOrmEntity

```typescript
// modules/emprestimos/infrastructure/persistence/emprestimo.orm-entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UsuarioOrmEntity } from '../../../usuarios/infrastructure/persistence/usuario.orm-entity';
import { HardwareOrmEntity } from '../../../hardwares/infrastructure/persistence/hardware.orm-entity';

@Entity('emprestimos')
export class EmprestimoOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', name: 'empresa_id', length: 36 })
  empresa_id: string;

  @Column({ type: 'varchar', name: 'usuario_id', length: 36 })
  usuario_id: string;

  @Column({ type: 'varchar', name: 'hardware_id', length: 36 })
  hardware_id: string;

  @Column({ type: 'datetime', name: 'data_retirada' })
  data_retirada: Date;

  @Column({ type: 'datetime', name: 'data_devolucao', nullable: true })
  data_devolucao: Date | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => UsuarioOrmEntity)
  @JoinColumn({ name: 'usuario_id' })
  usuario: UsuarioOrmEntity;

  @ManyToOne(() => HardwareOrmEntity)
  @JoinColumn({ name: 'hardware_id' })
  hardware: HardwareOrmEntity;
}
```

### Cross-Module ORM Imports

`EmprestimoOrmEntity` imports `UsuarioOrmEntity` and `HardwareOrmEntity` for `@ManyToOne` relations. `UsuarioOrmEntity` imports `DepartamentoOrmEntity`. These cross-module imports happen only at the infrastructure level (ORM entities), never at the domain level. This is acceptable — ORM relations are a persistence concern and don't violate domain boundaries.

### DepartamentoOrmEntity and UsuarioOrmEntity

Follow the same pattern. `UsuarioOrmEntity` preserves the `@ManyToOne(() => DepartamentoOrmEntity)` relation. `DepartamentoOrmEntity` has no outbound relations.

### ID Generation: `@PrimaryColumn` vs `@PrimaryGeneratedColumn`

The current entities use `@PrimaryGeneratedColumn('uuid')`, which makes TypeORM generate UUIDs on insert. The new ORM entities switch to `@PrimaryColumn('varchar', { length: 36 })` because IDs are generated in the domain layer via `crypto.randomUUID()` in factory methods.

This is a behavioral change: the domain now owns ID generation, not the database. The `data-source.ts` and migration schema are unaffected — the column type is the same (`varchar(36)`). But any test that relies on TypeORM auto-generating IDs will need to supply them explicitly.

---

## Mappers

Mappers live in `infrastructure/persistence/` alongside the ORM entity and repository implementation. This is the natural home because:

1. The mapper's primary dependency is the ORM entity (an infrastructure concern)
2. The repository implementation is the only consumer of the mapper
3. Placing them in `application/` would make `application/` depend on `infrastructure/` (ORM entity), violating the dependency rule

The mapper imports the domain entity (inward dependency: infrastructure → domain) and knows about the ORM entity (same layer). This is clean.

```typescript
// modules/hardwares/infrastructure/persistence/hardware.mapper.ts
import { Hardware } from '../../domain/entities/hardware.entity';
import { HardwareOrmEntity } from './hardware.orm-entity';

export class HardwareMapper {
  static toDomain(orm: HardwareOrmEntity): Hardware {
    return new Hardware({
      id: orm.id,
      empresaId: orm.empresa_id,
      descricao: orm.descricao,
      marca: orm.marca,
      modelo: orm.modelo,
      codigoPatrimonio: orm.codigo_patrimonio,
      funcionando: orm.funcionando,
      descricaoProblema: orm.descricao_problema,
      livre: orm.livre,
      version: orm.version,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: Hardware): HardwareOrmEntity {
    const orm = new HardwareOrmEntity();
    orm.id = domain.id;
    orm.empresa_id = domain.empresaId;
    orm.descricao = domain.descricao;
    orm.marca = domain.marca;
    orm.modelo = domain.modelo;
    orm.codigo_patrimonio = domain.codigoPatrimonio;
    orm.funcionando = domain.funcionando;
    orm.descricao_problema = domain.descricaoProblema;
    orm.livre = domain.livre;
    orm.version = domain.version;
    // created_at and updated_at are NOT set in toOrm().
    // TypeORM's @CreateDateColumn and @UpdateDateColumn manage these automatically.
    // On insert: TypeORM sets both. On update: TypeORM updates updated_at.
    // Setting them explicitly would overwrite TypeORM's auto-management.
    return orm;
  }
}
```

**Note on `created_at` / `updated_at` in `toOrm()`**: These are intentionally not mapped from domain to ORM. TypeORM's `@CreateDateColumn` and `@UpdateDateColumn` decorators auto-manage these timestamps. Setting them explicitly on `save()` would interfere with that behavior. The `toDomain()` direction reads them from the ORM entity to populate the domain entity's readonly fields.

Each feature module follows this same mapper pattern.

---

## Repository Interfaces & Implementations

### Domain Repository Interface

```typescript
// modules/hardwares/domain/repositories/hardware.repository.interface.ts
import { Hardware } from '../entities/hardware.entity';

export interface IHardwareRepository {
  findById(id: string): Promise<Hardware | null>;
  findAll(): Promise<Hardware[]>;
  save(hardware: Hardware): Promise<void>;
  delete(id: string): Promise<void>;
}

export const HARDWARE_REPOSITORY = Symbol('IHardwareRepository');
```

- Lives in `domain/` — no framework imports
- Speaks in domain entities, not ORM entities
- `Symbol` constant used as NestJS DI token (TypeScript interfaces are erased at runtime)
- Methods are minimal; add domain-specific queries as use cases need them (YAGNI)

### TypeORM Repository Implementation

```typescript
// modules/hardwares/infrastructure/persistence/hardware.typeorm-repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IHardwareRepository } from '../../domain/repositories/hardware.repository.interface';
import { Hardware } from '../../domain/entities/hardware.entity';
import { HardwareOrmEntity } from './hardware.orm-entity';
import { HardwareMapper } from './hardware.mapper';
import { TenantContext } from '../../../../tenant/application/tenant-context';

@Injectable()
export class TypeOrmHardwareRepository implements IHardwareRepository {
  constructor(
    @InjectRepository(HardwareOrmEntity)
    private readonly ormRepo: Repository<HardwareOrmEntity>,
    private readonly tenantContext: TenantContext,
  ) {}

  async findById(id: string): Promise<Hardware | null> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orm = await this.ormRepo.findOne({
      where: { id, empresa_id: empresaId },
    });
    return orm ? HardwareMapper.toDomain(orm) : null;
  }

  async findAll(): Promise<Hardware[]> {
    const empresaId = this.tenantContext.requireEmpresaId();
    const orms = await this.ormRepo.find({
      where: { empresa_id: empresaId },
    });
    return orms.map(HardwareMapper.toDomain);
  }

  async save(hardware: Hardware): Promise<void> {
    const orm = HardwareMapper.toOrm(hardware);
    await this.ormRepo.save(orm);
  }

  async delete(id: string): Promise<void> {
    const empresaId = this.tenantContext.requireEmpresaId();
    await this.ormRepo.delete({ id, empresa_id: empresaId });
  }
}
```

**Tenant scoping uses `requireEmpresaId()`** (not `getEmpresaId()`). This returns `string` (not `string | null`) and throws `MissingTenantContextError` if no tenant context is set. Repository operations should never run without a tenant.

The existing `TenantRepository` stays in `tenant/infrastructure/` as an optional utility that feature repositories can use internally if they prefer a wrapper over raw TypeORM + TenantContext.

### NestJS Module Wiring

```typescript
// modules/hardwares/hardwares.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HardwareOrmEntity } from './infrastructure/persistence/hardware.orm-entity';
import { TypeOrmHardwareRepository } from './infrastructure/persistence/hardware.typeorm-repository';
import { HARDWARE_REPOSITORY } from './domain/repositories/hardware.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([HardwareOrmEntity])],
  providers: [
    {
      provide: HARDWARE_REPOSITORY,
      useClass: TypeOrmHardwareRepository,
    },
  ],
  exports: [HARDWARE_REPOSITORY],
})
export class HardwaresModule {}
```

Same pattern for all 4 feature modules. Use cases inject the repository via `@Inject(HARDWARE_REPOSITORY)` — they never know about TypeORM.

### SharedModule

```typescript
// shared/shared.module.ts
import { Module } from '@nestjs/common';

@Module({
  // No providers for now — shared/domain/ contains only pure TS classes
  // Future: could export shared application services
})
export class SharedModule {}
```

The `SharedModule` is minimal since `shared/domain/` contains only plain TypeScript base classes that are imported directly (not via DI). The `TenantModule` and `DatabaseModule` are imported separately by the `AppModule`.

### AppModule Update

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/database/database.module';
import { TenantModule } from './tenant/tenant.module';
import { HardwaresModule } from './modules/hardwares/hardwares.module';
import { EmprestimosModule } from './modules/emprestimos/emprestimos.module';
import { DepartamentosModule } from './modules/departamentos/departamentos.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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

### data-source.ts Update

The `data-source.ts` entity registration must change to import ORM entities from their new locations:

```typescript
// infrastructure/database/data-source.ts
import { DepartamentoOrmEntity } from '../../modules/departamentos/infrastructure/persistence/departamento.orm-entity';
import { UsuarioOrmEntity } from '../../modules/usuarios/infrastructure/persistence/usuario.orm-entity';
import { HardwareOrmEntity } from '../../modules/hardwares/infrastructure/persistence/hardware.orm-entity';
import { EmprestimoOrmEntity } from '../../modules/emprestimos/infrastructure/persistence/emprestimo.orm-entity';

export const AppDataSource = new DataSource({
  // ...
  entities: [DepartamentoOrmEntity, UsuarioOrmEntity, HardwareOrmEntity, EmprestimoOrmEntity],
  migrations: [path.resolve(__dirname, './migrations/*{.ts,.js}')],
  // ...
});
```

Migration glob path also updates since migrations now live inside `infrastructure/database/migrations/`.

---

## Dependency Rule

```
presentation/ → application/ → domain/ ← infrastructure/
```

- `domain/` has zero imports from NestJS, TypeORM, or other layers (only `node:crypto` for UUID generation)
- `application/` imports from `domain/` only
- `infrastructure/` imports from `domain/` (implements interfaces) and contains mappers
- `presentation/` imports from `application/` (use cases, DTOs)

### Intentional exception

Mappers live in `infrastructure/persistence/` and import from `domain/`. This is the standard Clean Architecture direction (infrastructure depends on domain). The mapper does NOT live in `application/` — that would violate the rule since `application/` should not know about ORM entities.

---

## Optimistic Locking

Only `Hardware` uses `@VersionColumn()` for optimistic locking. `Emprestimo`, `Departamento`, and `Usuario` do not have version columns. This is consistent with the current schema and the PRD's concurrency requirements (concurrent lending operations on hardware).

---

## Path Aliases

The current `api/tsconfig.json` does not configure path aliases (`paths`). All imports in this spec use relative paths. If the team wants to add a `@/` alias (e.g., `@/shared/domain/...`), this should be configured as a separate step in `api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["src/*"] }
  }
}
```

This spec does not require path aliases. All import paths work with the current tsconfig.

---

## `domain/services/` Directory

The architecture.md includes `domain/services/` in the target folder structure for cross-entity domain services. This refactor intentionally defers creating `domain/services/` directories. They can be added per-module when a use case reveals business logic spanning multiple entities within the same bounded context. YAGNI applies — there's no known need for domain services yet.

---

## Testing Strategy

Tests are co-located with source files:

```
modules/hardwares/
├── domain/entities/hardware.entity.spec.ts
├── infrastructure/persistence/hardware.mapper.spec.ts
├── infrastructure/persistence/hardware.orm-entity.spec.ts
├── infrastructure/persistence/hardware.typeorm-repository.spec.ts
```

### Test migration from current structure

| Current file                                                     | New location                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/entities/hardware.entity.domain.spec.ts`                    | `src/modules/hardwares/domain/entities/hardware.entity.spec.ts`                       |
| `src/entities/emprestimo.entity.domain.spec.ts`                  | `src/modules/emprestimos/domain/entities/emprestimo.entity.spec.ts`                   |
| `src/entities/entities.metadata.spec.ts`                         | Split per module into `<module>/infrastructure/persistence/<name>.orm-entity.spec.ts` |
| `src/tenant/*.spec.ts`                                           | `src/tenant/**/*.spec.ts` (co-located in new tenant subdirs)                          |
| `src/infrastructure/database/*.spec.ts`                          | `src/infrastructure/database/*.spec.ts` (stays, path unchanged relative to src/)      |
| `src/infrastructure/database/database.tenant-subscriber.spec.ts` | `src/infrastructure/database/database.tenant-subscriber.spec.ts`                      |
| `test/tenant/*.spec.ts`                                          | `test/tenant/*.spec.ts` (integration tests stay in test/)                             |
| `test/database/*.spec.ts`                                        | `test/database/*.spec.ts` (integration tests stay in test/)                           |

### Test updates needed for behavioral changes

- **Emprestimo domain tests**: Current tests for `Emprestimo.emprestar()` pass a `Hardware` instance and verify it calls `hardware.emprestar()`. After migration, `Emprestimo.emprestar()` no longer takes a `Hardware`. Tests must be rewritten to test `Emprestimo` independently (factory creates emprestimo, verifies fields) and `Hardware.emprestar()` independently (verifies state changes). Cross-aggregate coordination tests move to use-case tests in Etapa 6.
- **ID generation in tests**: Current tests may rely on TypeORM auto-generating IDs. After migration, tests must supply IDs explicitly (e.g., `crypto.randomUUID()` or hardcoded UUIDs for deterministic tests).
- **ORM metadata tests**: The monolithic `entities.metadata.spec.ts` splits into per-module files. Each tests its own ORM entity's TypeORM metadata (table name, column types, relations).

### New tests to add

- **Mapper round-trip tests**: For each feature, verify `toDomain(toOrm(entity))` preserves all fields. This catches mapping bugs early.
- **Per-module ORM metadata contract tests**: Split from current monolithic test.

---

## Migration Steps

1. **Create `tenant/` directory** — restructure current `src/tenant/` into `tenant/application/` and `tenant/infrastructure/` subdirectories, update imports throughout
2. **Move `infrastructure/database/`** — move `data-source.ts` and `database.module.ts` (already at `src/infrastructure/database/`), move `src/migrations/` into `infrastructure/database/migrations/`, update migration glob path
3. **Create `shared/` directory** — create `shared/domain/domain-entity.base.ts`, `shared/domain/domain-error.base.ts`, `shared/shared.module.ts`
4. **Create feature module directories** — scaffold the DDD layer structure for all 4 modules (empty dirs for use-cases, dto, presentation/http)
5. **Extract domain entities** — create plain TS classes with domain methods for each feature, including `static create()` factories with `crypto.randomUUID()`
6. **Create domain errors** — split `domain.errors.ts` into per-feature error files extending `DomainError`
7. **Create ORM entities** — strip domain methods from current entities, keep only decorators + columns, switch from `@PrimaryGeneratedColumn` to `@PrimaryColumn`
8. **Create mappers** — one per feature in `infrastructure/persistence/`
9. **Create repository interfaces** — in each module's `domain/repositories/`
10. **Create repository implementations** — in each module's `infrastructure/persistence/`
11. **Wire NestJS modules** — create feature module files, update `AppModule`, update `data-source.ts` entity imports
12. **Move and adapt existing tests** — update imports, rewrite Emprestimo tests for aggregate separation, supply explicit IDs
13. **Add new tests** — mapper round-trip tests, per-module ORM metadata tests
14. **Delete old `entities/` folder** — remove once everything is moved and passing
15. **Verify all tests pass** — run full suite (`pnpm --filter api test`)

**No database migration changes needed.** The schema is unchanged; only the TypeScript representation changes.

**Rollback strategy:** All changes are committed atomically per step. If tests fail at step 15, revert the commits and investigate.

---

## What This Refactor Does NOT Include

- Controllers, use cases, DTOs (Etapa 6)
- Auth module (Etapa 7)
- Domain events
- Value objects (can be added when patterns emerge)
- Domain services directories (deferred — YAGNI)
- ESLint import boundary enforcement (can be added later)
- Path alias configuration (optional, independent concern)

---

## Files to Delete After Migration

- `api/src/entities/` — entire directory (entities, domain.errors.ts, barrel export, all spec files that have been moved)
