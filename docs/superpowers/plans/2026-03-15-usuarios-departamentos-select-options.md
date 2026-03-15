# Usuarios Departamento Select Options Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make user creation use a tenant-scoped departamentos select list while keeping `departamentoId` optional/null end-to-end.

**Architecture:** Add a dedicated lightweight departamentos options endpoint in the `departamentos` backend module and consume it from the usuarios route on the server side. Replace the free-text departamento input with a select fed by tenant-scoped options, including a "Sem departamento" empty option, and update API/domain persistence contracts so `departamentoId` remains nullable.

**Tech Stack:** NestJS (modules/use-cases/controllers), TypeORM, Next.js App Router, React Hook Form, Zod, Vitest, pnpm workspaces.

---

## Chunk 1: Backend options endpoint + nullable usuario departamento contract

### Task 1: Add departamentos options query for select fields

**Files:**

- Modify: `api/src/modules/departamentos/domain/repositories/departamento.repository.interface.ts`
- Modify: `api/src/modules/departamentos/infrastructure/persistence/departamento.typeorm-repository.ts`
- Create: `api/src/modules/departamentos/application/use-cases/list-departamentos-options.use-case.ts`
- Modify: `api/src/modules/departamentos/application/services/departamentos.service.ts`
- Modify: `api/src/modules/departamentos/presentation/http/departamentos.controller.ts`
- Modify: `api/src/modules/departamentos/departamentos.module.ts`

- [ ] **Step 1: Write failing controller test for options endpoint (RED)**

```ts
it('lists tenant-scoped departamento options', async () => {
  // call GET /departamentos/options
  // expect [{ id, nome }] only
  // expect sorted by nome asc
});
```

- [ ] **Step 2: Extend repository interface with options contract**

```ts
export type DepartamentoOption = {
  id: string;
  nome: string;
};

export interface IDepartamentoRepository {
  // ...existing methods
  listOptions(): Promise<DepartamentoOption[]>;
}
```

- [ ] **Step 3: Implement tenant-scoped and sorted options query in TypeORM repository**

```ts
async listOptions(): Promise<DepartamentoOption[]> {
  const empresaId = this.tenantContext.requireEmpresaId();
  const rows = await this.ormRepo
    .createQueryBuilder('departamento')
    .select('departamento.id', 'id')
    .addSelect('departamento.nome', 'nome')
    .where('departamento.empresa_id = :empresaId', { empresaId })
    .orderBy('LOWER(departamento.nome)', 'ASC')
    .addOrderBy('departamento.id', 'ASC')
    .getRawMany<{ id: string; nome: string }>();

  return rows;
}
```

- [ ] **Step 4: Add use case and service method for options**

```ts
@Injectable()
export class ListDepartamentosOptionsUseCase {
  constructor(
    @Inject(DEPARTAMENTO_REPOSITORY)
    private readonly departamentoRepository: IDepartamentoRepository,
  ) {}

  async execute(): Promise<DepartamentoOption[]> {
    return this.departamentoRepository.listOptions();
  }
}
```

- [ ] **Step 5: Expose `GET /departamentos/options` in controller**

```ts
@Get('options')
async listOptions(): Promise<{ id: string; nome: string }[]> {
  return this.departamentosService.listOptions();
}
```

- [ ] **Step 6: Register new use case in module providers**

```ts
providers: [
  // ...existing providers
  ListDepartamentosOptionsUseCase,
];
```

- [ ] **Step 7: Run backend tests for new endpoint (GREEN)**

Run: `pnpm --filter @guarda-hard/api test src/modules/departamentos/presentation/http/departamentos.controller.spec.ts`
Expected: PASS with options endpoint assertions.

- [ ] **Step 8: Commit backend options endpoint**

```bash
git add api/src/modules/departamentos/domain/repositories/departamento.repository.interface.ts api/src/modules/departamentos/infrastructure/persistence/departamento.typeorm-repository.ts api/src/modules/departamentos/application/use-cases/list-departamentos-options.use-case.ts api/src/modules/departamentos/application/services/departamentos.service.ts api/src/modules/departamentos/presentation/http/departamentos.controller.ts api/src/modules/departamentos/departamentos.module.ts api/src/modules/departamentos/presentation/http/departamentos.controller.spec.ts
git commit -m "feat(api): expose tenant departamento options endpoint"
```

### Task 2: Keep usuario `departamentoId` nullable in create/update and persistence

**Files:**

- Modify: `api/src/modules/usuarios/application/dto/usuario.schemas.ts`
- Modify: `api/src/modules/usuarios/domain/entities/usuario.entity.ts`
- Modify: `api/src/modules/usuarios/application/use-cases/create-usuario.use-case.ts`
- Modify: `api/src/modules/usuarios/application/use-cases/update-usuario.use-case.ts`
- Modify: `api/src/modules/usuarios/infrastructure/persistence/usuario.mapper.ts`
- Modify: `api/src/modules/usuarios/infrastructure/persistence/usuario.typeorm-repository.ts`
- Modify: `api/src/modules/usuarios/presentation/http/usuarios.controller.ts`
- Modify: `api/src/modules/usuarios/presentation/http/usuarios.controller.spec.ts`

- [ ] **Step 1: Write failing tests proving nullable `departamentoId` is accepted (RED)**

```ts
it('creates usuario with departamentoId omitted', async () => {
  // POST /usuarios with nome/email only
  // expect 201 and departamentoId null in response
});

it('updates usuario with departamentoId null', async () => {
  // PATCH /usuarios/:id with departamentoId: null
  // expect persisted null membership field
});
```

- [ ] **Step 2: Update usuario DTO schemas to support null/omitted**

```ts
export const createUsuarioSchema = z.object({
  departamentoId: z.string().uuid().nullable().optional(),
  nome: z.string().trim().min(1),
  email: z.string().trim().email(),
  senhaHash: z.string().trim().min(1).optional(),
});

export const updateUsuarioSchema = z.object({
  departamentoId: z.string().uuid().nullable().optional(),
  // ...rest
});
```

- [ ] **Step 3: Change domain and use-cases to treat departamento as nullable**

```ts
export interface UsuarioProps {
  // ...
  departamentoId: string | null;
}

static create(props: {
  empresaId: string;
  departamentoId?: string | null;
  // ...
}): Usuario {
  return new Usuario({
    // ...
    departamentoId: props.departamentoId ?? null,
  });
}
```

- [ ] **Step 4: Update mapper/repository SQL writes and reads for null-safe membership**

```ts
type UsuarioMembershipRow = {
  usuario_id: string;
  empresa_id: string;
  departamento_id: string | null;
};

// INSERT/UPDATE usuario_empresas uses usuario.departamentoId directly, including null
```

- [ ] **Step 5: Keep response shape stable with nullable `departamentoId`**

```ts
type UsuarioHttpResponse = {
  // ...
  departamentoId: string | null;
};
```

- [ ] **Step 6: Run focused backend tests (GREEN)**

Run: `pnpm --filter @guarda-hard/api test src/modules/usuarios/presentation/http/usuarios.controller.spec.ts src/modules/usuarios/domain/entities/usuario.entity.spec.ts`
Expected: PASS with nullable departamento coverage.

- [ ] **Step 7: Commit nullable usuario adjustments**

```bash
git add api/src/modules/usuarios/application/dto/usuario.schemas.ts api/src/modules/usuarios/domain/entities/usuario.entity.ts api/src/modules/usuarios/application/use-cases/create-usuario.use-case.ts api/src/modules/usuarios/application/use-cases/update-usuario.use-case.ts api/src/modules/usuarios/infrastructure/persistence/usuario.mapper.ts api/src/modules/usuarios/infrastructure/persistence/usuario.typeorm-repository.ts api/src/modules/usuarios/presentation/http/usuarios.controller.ts api/src/modules/usuarios/presentation/http/usuarios.controller.spec.ts api/src/modules/usuarios/domain/entities/usuario.entity.spec.ts
git commit -m "fix(api): keep usuario departamento optional in membership"
```

---

## Chunk 2: Frontend select integration + validation updates

### Task 3: Add frontend departamentos options API client and route wiring

**Files:**

- Create: `app/src/features/departamentos/server/departamentos-options-api.ts`
- Create: `app/src/features/departamentos/server/departamentos-options-api.test.ts`
- Modify: `app/src/app/(dashboard)/usuarios/page.tsx`
- Modify: `app/src/features/usuarios/components/usuarios-page.tsx`

- [ ] **Step 1: Write failing test for departamentos options parser (RED)**

```ts
it('requests /departamentos/options and parses id/nome array', async () => {
  // mock apiClient
  // expect fallback message
  // expect strict parse of [{ id, nome }]
});
```

- [ ] **Step 2: Implement options server client**

```ts
const departamentoOptionSchema = z.object({
  id: z.string(),
  nome: z.string(),
});

export async function listDepartamentoOptionsServer(): Promise<DepartamentoOption[]> {
  const payload = await apiClient({
    path: '/departamentos/options',
    method: 'GET',
    fallbackErrorMessage: 'Nao foi possivel carregar departamentos',
  });

  return z.array(departamentoOptionSchema).parse(payload);
}
```

- [ ] **Step 3: Fetch options in usuarios route and pass to page/form props**

```tsx
const [list, departamentoOptions] = await Promise.all([
  listUsuariosServer(query),
  listDepartamentoOptionsServer(),
]);

return (
  <UsuariosPage
    onSubmit={submitUsuario}
    list={list}
    query={query}
    departamentoOptions={departamentoOptions}
  />
);
```

- [ ] **Step 4: Handle options load failure in page state**

```tsx
// if options fetch fails: keep page rendering and show error banner in modal
// disable departamento select while unavailable
```

- [ ] **Step 5: Run frontend API client tests (GREEN)**

Run: `pnpm --filter @guarda-hard/app test src/features/departamentos/server/departamentos-options-api.test.ts`
Expected: PASS with request and parse assertions.

- [ ] **Step 6: Commit options data wiring**

```bash
git add app/src/features/departamentos/server/departamentos-options-api.ts app/src/features/departamentos/server/departamentos-options-api.test.ts app/src/app/(dashboard)/usuarios/page.tsx app/src/features/usuarios/components/usuarios-page.tsx
git commit -m "feat(app): load tenant departamento options for usuario form"
```

### Task 4: Replace text input with select and keep departamento optional in form schema

**Files:**

- Modify: `app/src/features/usuarios/schemas/usuario-schema.ts`
- Modify: `app/src/features/usuarios/forms/usuario-form.tsx`
- Modify: `app/src/features/usuarios/forms/usuario-form.test.tsx`
- Modify: `app/src/features/usuarios/components/usuarios-page.listing.test.tsx`
- Modify: `app/src/features/usuarios/server/usuarios-api.ts`

- [ ] **Step 1: Write failing form test for optional select behavior (RED)**

```ts
it('submits with empty departamentoId as null/undefined payload', async () => {
  // choose "Sem departamento"
  // submit valid nome/email
  // expect onSubmit with nullable departamento
});
```

- [ ] **Step 2: Update frontend schema to make departamento optional/nullable**

```ts
export const usuarioSchema = z.object({
  nome: z.string().trim().min(1, 'Nome e obrigatorio'),
  email: z.string().trim().email('Email invalido'),
  departamentoId: z.string().trim().optional(),
});
```

- [ ] **Step 3: Replace input with select using options prop**

```tsx
<select id="departamentoId" {...register('departamentoId')}>
  <option value="">Sem departamento</option>
  {departamentoOptions.map((opt) => (
    <option key={opt.id} value={opt.id}>
      {opt.nome}
    </option>
  ))}
</select>
```

- [ ] **Step 4: Normalize outbound payload to preserve nullability**

```ts
const parsedPayload = usuarioSchema.parse(payload);

await apiClient({
  path: '/usuarios',
  method: 'POST',
  body: {
    ...parsedPayload,
    departamentoId: parsedPayload.departamentoId?.trim() || null,
  },
  responseType: 'void',
  fallbackErrorMessage: 'Nao foi possivel criar usuario',
});
```

- [ ] **Step 5: Update listing flow tests to use select interactions**

Run: `pnpm --filter @guarda-hard/app test src/features/usuarios/forms/usuario-form.test.tsx src/features/usuarios/components/usuarios-page.listing.test.tsx`
Expected: PASS with select-based assertions and optional departamento scenario.

- [ ] **Step 6: Commit form + payload updates**

```bash
git add app/src/features/usuarios/schemas/usuario-schema.ts app/src/features/usuarios/forms/usuario-form.tsx app/src/features/usuarios/forms/usuario-form.test.tsx app/src/features/usuarios/components/usuarios-page.listing.test.tsx app/src/features/usuarios/server/usuarios-api.ts
git commit -m "fix(app): use optional departamento select in usuario modal"
```

---

## Chunk 3: Final verification and PRD checklist update

### Task 5: Verify end-to-end behavior and register completion in PRD

**Files:**

- Modify: `docs/PRD-GuardaHard.md`

- [ ] **Step 1: Run backend usuario + departamentos test suite**

Run: `pnpm --filter @guarda-hard/api test src/modules/departamentos src/modules/usuarios`
Expected: PASS with no regressions.

- [ ] **Step 2: Run frontend usuarios/departamentos tests**

Run: `pnpm --filter @guarda-hard/app test src/features/departamentos src/features/usuarios`
Expected: PASS with updated select tests.

- [ ] **Step 3: Run typecheck/build checks for touched workspaces**

Run: `pnpm --filter @guarda-hard/api build && pnpm --filter @guarda-hard/app build`
Expected: successful builds.

- [ ] **Step 4: Manually verify modal UX**

Run: `pnpm dev`
Expected:

- user modal shows departamento select options from tenant
- includes `Sem departamento`
- user creation succeeds with and without selected departamento

- [ ] **Step 5: Mark corresponding PRD checklist item immediately after completion**

Update the relevant checklist line in `docs/PRD-GuardaHard.md` as soon as this feature is done, following the repository global rule.

- [ ] **Step 6: Commit final verification + PRD update**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "chore(prd): mark usuario departamento select fix completion"
```
