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

| Decision               | Choice                                                             | Rationale                                                    |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Refactor scope         | Big-bang (all at once)                                             | Avoids half-migrated state; codebase is small enough         |
| Entity separation      | Full separation with mappers                                       | Maximum isolation; domain has zero framework imports         |
| Repository abstraction | Interface per aggregate root                                       | Expressive domain contracts; each aggregate has its own port |
| Aggregate boundaries   | Hardware, Emprestimo, Departamento, Usuario as separate aggregates | Cross-aggregate coordination in use cases, not in entities   |
| Shared kernel location | `api/src/shared/`                                                  | Tenant infra and base domain types accessible to all modules |
| Folder structure       | Feature-module layered (Approach A)                                | Aligns with architecture.md; each module is self-contained   |

---

## Target Folder Structure

```
api/src/
├── main.ts
├── app.module.ts
│
├── shared/
│   ├── shared.module.ts
│   ├── domain/
│   │   ├── entity.base.ts
│   │   ├── domain-error.base.ts
│   │   └── repository.interface.ts
│   └── infrastructure/
│       ├── database/
│       │   ├── database.module.ts
│       │   └── data-source.ts
│       └── tenant/
│           ├── tenant.module.ts
│           ├── tenant-context.ts
│           ├── tenant.subscriber.ts
│           ├── tenant.repository.ts
│           ├── tenant.types.ts
│           └── tenant.errors.ts
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
│   │   │       └── hardware-defeituoso.error.ts
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   ├── dto/
│   │   │   └── mappers/
│   │   │       └── hardware.mapper.ts
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       ├── hardware.orm-entity.ts
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
│   │   │   ├── dto/
│   │   │   └── mappers/
│   │   │       └── emprestimo.mapper.ts
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       ├── emprestimo.orm-entity.ts
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
│   │   │   └── mappers/
│   │   │       └── departamento.mapper.ts
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       ├── departamento.orm-entity.ts
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
│       │   └── mappers/
│       │       └── usuario.mapper.ts
│       ├── infrastructure/
│       │   └── persistence/
│       │       ├── usuario.orm-entity.ts
│       │       └── usuario.typeorm-repository.ts
│       └── presentation/
│           └── http/
│
└── migrations/
    ├── 1773327116742-CreateEtapa2Schema.ts
    └── 1773327116743-SeedDefaultDepartamentos.ts
```

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
// shared/domain/entity.base.ts
export abstract class BaseEntity {
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
import { BaseEntity } from '@/shared/domain/entity.base';
import { HardwareNaoDisponivelError } from '../errors/hardware-nao-disponivel.error';
import { HardwareDefeituosoError } from '../errors/hardware-defeituoso.error';
import { DescricaoProblemaObrigatoriaError } from '../errors/descricao-problema-obrigatoria.error';

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

export class Hardware extends BaseEntity {
  private _descricao: string;
  private _marca: string;
  private _modelo: string;
  private _codigoPatrimonio: string;
  private _funcionando: boolean;
  private _descricaoProblema: string | null;
  private _livre: boolean;
  readonly version: number;

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

  // Domain methods — logic preserved from current entity
  emprestar(): void {
    if (!this._funcionando) throw new HardwareDefeituosoError();
    if (!this._livre) throw new HardwareNaoDisponivelError();
    this._livre = false;
  }

  devolver(): void {
    this._livre = true;
  }

  marcarDefeito(descricao: string): void {
    if (!descricao?.trim()) throw new DescricaoProblemaObrigatoriaError();
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

Zero framework imports. Private fields enforce encapsulation — state changes only through domain methods.

### Emprestimo Domain Entity

```typescript
// modules/emprestimos/domain/entities/emprestimo.entity.ts
import { BaseEntity } from '@/shared/domain/entity.base';
import { EmprestimoJaDevolvidoError } from '../errors/emprestimo-ja-devolvido.error';

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

export class Emprestimo extends BaseEntity {
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
    id: string;
    empresaId: string;
    usuarioId: string;
    hardwareId: string;
  }): Emprestimo {
    return new Emprestimo({
      ...props,
      dataRetirada: new Date(),
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

Cross-aggregate references are by ID (`usuarioId`, `hardwareId`). The `Emprestimo.emprestar()` factory no longer receives a `Hardware` instance. Coordinating `hardware.emprestar()` with `Emprestimo.emprestar()` moves to a use case (Etapa 6).

### Departamento and Usuario Domain Entities

Thin entities extending `BaseEntity` with properties only. No domain behavior currently — if behavior emerges later, it goes in these classes.

---

## ORM Entities

ORM entities are pure data structures with TypeORM decorators. No domain methods.

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

  @Column('varchar', { name: 'empresa_id', length: 36 })
  empresa_id: string;

  @Column('varchar', { length: 200 })
  descricao: string;

  @Column('varchar', { length: 100 })
  marca: string;

  @Column('varchar', { length: 100 })
  modelo: string;

  @Column('varchar', { name: 'codigo_patrimonio', length: 50 })
  codigo_patrimonio: string;

  @Column('boolean', { default: true })
  funcionando: boolean;

  @Column('text', { name: 'descricao_problema', nullable: true })
  descricao_problema: string | null;

  @Column('boolean', { default: true })
  livre: boolean;

  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
```

ORM entities use snake_case field names matching the database schema. Relations (`@ManyToOne`) are preserved for query-time JOINs.

---

## Mappers

Mappers convert between domain entities (camelCase) and ORM entities (snake_case). They live in `application/mappers/` because they depend on both layers.

```typescript
// modules/hardwares/application/mappers/hardware.mapper.ts
import { Hardware } from '../../domain/entities/hardware.entity';
import { HardwareOrmEntity } from '../../infrastructure/persistence/hardware.orm-entity';

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
    return orm;
  }
}
```

Each feature module has its own mapper. The pattern is identical across all 4 features.

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
- `Symbol` constant used as NestJS DI token
- Methods are minimal; add domain-specific queries as use cases need them

### TypeORM Repository Implementation

```typescript
// modules/hardwares/infrastructure/persistence/hardware.typeorm-repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IHardwareRepository } from '../../domain/repositories/hardware.repository.interface';
import { Hardware } from '../../domain/entities/hardware.entity';
import { HardwareOrmEntity } from './hardware.orm-entity';
import { HardwareMapper } from '../../application/mappers/hardware.mapper';
import { TenantContext } from '@/shared/infrastructure/tenant/tenant-context';

@Injectable()
export class TypeOrmHardwareRepository implements IHardwareRepository {
  constructor(
    @InjectRepository(HardwareOrmEntity)
    private readonly ormRepo: Repository<HardwareOrmEntity>,
    private readonly tenantContext: TenantContext,
  ) {}

  async findById(id: string): Promise<Hardware | null> {
    const empresaId = this.tenantContext.getEmpresaId();
    const orm = await this.ormRepo.findOne({
      where: { id, empresa_id: empresaId },
    });
    return orm ? HardwareMapper.toDomain(orm) : null;
  }

  async findAll(): Promise<Hardware[]> {
    const empresaId = this.tenantContext.getEmpresaId();
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
    const empresaId = this.tenantContext.getEmpresaId();
    await this.ormRepo.delete({ id, empresa_id: empresaId });
  }
}
```

Tenant scoping uses `TenantContext` directly. The existing `TenantRepository` stays in `shared/` as an optional utility.

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

Same pattern for all 4 feature modules.

---

## Dependency Rule

```
presentation/ → application/ → domain/ ← infrastructure/
```

- `domain/` has zero imports from NestJS, TypeORM, or other layers
- `application/` imports from `domain/` (and knows about ORM entity types for mapping)
- `infrastructure/` imports from `domain/` (implements interfaces) and uses mappers
- `presentation/` imports from `application/` (use cases, DTOs)

---

## Testing Strategy

Tests are co-located with source files:

```
modules/hardwares/
├── domain/entities/hardware.entity.spec.ts
├── application/mappers/hardware.mapper.spec.ts
├── infrastructure/persistence/hardware.orm-entity.spec.ts
├── infrastructure/persistence/hardware.typeorm-repository.spec.ts
```

### Test migration from current structure:

| Current file                                | New location                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `entities/hardware.entity.domain.spec.ts`   | `modules/hardwares/domain/entities/hardware.entity.spec.ts`                           |
| `entities/emprestimo.entity.domain.spec.ts` | `modules/emprestimos/domain/entities/emprestimo.entity.spec.ts`                       |
| `entities/entities.metadata.spec.ts`        | Split per module into `<module>/infrastructure/persistence/<name>.orm-entity.spec.ts` |
| `tenant/*.spec.ts`                          | `shared/infrastructure/tenant/*.spec.ts`                                              |
| `infrastructure/database/*.spec.ts`         | `shared/infrastructure/database/*.spec.ts`                                            |

### New tests to add:

- **Mapper round-trip tests** — `toDomain(toOrm(entity))` preserves all fields
- **ORM metadata contract tests** — per module (split from current monolithic test)

---

## Migration Steps

1. Create `shared/` folder — move tenant + database infrastructure, update imports
2. Create feature module directories with DDD layer structure
3. Extract domain entities from TypeORM entities (plain TS classes with domain methods)
4. Create ORM entities (TypeORM decorators only, no domain methods)
5. Create mappers for each feature
6. Create repository interfaces in each module's `domain/repositories/`
7. Create TypeORM repository implementations in each module's `infrastructure/persistence/`
8. Wire NestJS feature modules and update `AppModule`
9. Move and adapt existing tests to new locations
10. Delete old `entities/` folder
11. Verify all tests pass

**No database migration changes needed.** The schema is unchanged; only the TypeScript representation changes.

---

## What This Refactor Does NOT Include

- Controllers, use cases, DTOs (Etapa 6)
- Auth module (Etapa 7)
- Domain events
- Value objects (can be added when patterns emerge)
- ESLint import boundary enforcement (can be added later)

---

## Files to Delete After Migration

- `api/src/entities/` (entire directory)
- `api/src/app.controller.ts` (stays — trivial, not part of this refactor)
- `api/src/app.service.ts` (stays)
