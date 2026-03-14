# Auth With Global Users + Company Selection Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement login/register at `/`, then require post-login company selection before dashboard access, using global users, global companies, and user-company membership pivot.

**Architecture:** Backend adds `auth` and `empresas` modules while keeping tenant-owned business tables scoped by `empresa_id`. Users become global identities, company access is represented by `usuario_empresas`, and tenant context is activated only after `select-empresa`. Frontend uses App Router with `/` auth home, company-selection step, and centralized route protection.

**Tech Stack:** NestJS 11, TypeORM + SQLite, Next.js 16, React 19, Zod, Vitest, pnpm workspaces

---

## Mandatory Execution Rules

- Follow `docs/architecture.md` module boundaries.
- Use `pnpm` commands only.
- Apply strict TDD for each task (RED -> GREEN -> REFACTOR).
- Follow `AGENTS.md` PRD gating rule: do not start next task before marking current task complete in `docs/PRD-GuardaHard.md`.

## File Structure (lock before coding)

### Create

- `api/src/infrastructure/database/migrations/1773401000000-GlobalUsersEmpresasMembership.ts`
- `api/src/infrastructure/database/migrations/global-users-empresas-membership.migration.spec.ts`

- `api/src/modules/empresas/empresas.module.ts`
- `api/src/modules/empresas/domain/entities/empresa.entity.ts`
- `api/src/modules/empresas/domain/repositories/empresa.repository.interface.ts`
- `api/src/modules/empresas/infrastructure/persistence/empresa.orm-entity.ts`
- `api/src/modules/empresas/infrastructure/persistence/empresa.typeorm-repository.ts`
- `api/src/modules/empresas/application/use-cases/list-empresas.use-case.ts`
- `api/src/modules/empresas/application/use-cases/list-empresas.use-case.spec.ts`
- `api/src/modules/empresas/application/services/empresas.service.ts`

- `api/src/modules/auth/auth.module.ts`
- `api/src/modules/auth/application/dto/auth.schemas.ts`
- `api/src/modules/auth/application/dto/auth.schemas.spec.ts`
- `api/src/modules/auth/application/use-cases/register.use-case.ts`
- `api/src/modules/auth/application/use-cases/login.use-case.ts`
- `api/src/modules/auth/application/use-cases/list-minhas-empresas.use-case.ts`
- `api/src/modules/auth/application/use-cases/select-empresa.use-case.ts`
- `api/src/modules/auth/application/use-cases/get-current-user.use-case.ts`
- `api/src/modules/auth/application/services/auth.service.ts`
- `api/src/modules/auth/infrastructure/security/password-hasher.ts`
- `api/src/modules/auth/infrastructure/security/session-token.service.ts`
- `api/src/modules/auth/presentation/http/auth.controller.ts`
- `api/src/modules/auth/presentation/http/auth.guard.ts`
- `api/src/modules/auth/presentation/http/current-auth-user.decorator.ts`
- `api/src/modules/auth/presentation/http/session-phase.guard.ts`
- `api/src/modules/auth/application/use-cases/register.use-case.spec.ts`
- `api/src/modules/auth/application/use-cases/login.use-case.spec.ts`
- `api/src/modules/auth/presentation/http/auth.controller.spec.ts`

- `api/src/shared/presentation/http/tenant-context.interceptor.ts`

- `app/src/features/auth/schemas/auth-schema.ts`
- `app/src/features/auth/server/auth-api.ts`
- `app/src/features/auth/components/auth-page.tsx`
- `app/src/features/auth/components/company-selection-page.tsx`
- `app/src/features/auth/forms/login-form.tsx`
- `app/src/features/auth/forms/register-form.tsx`
- `app/src/features/auth/forms/company-selection-form.tsx`
- `app/src/features/auth/forms/login-form.test.tsx`
- `app/src/features/auth/forms/register-form.test.tsx`
- `app/src/features/auth/forms/company-selection-form.test.tsx`
- `app/src/app/select-company/page.tsx`
- `app/src/proxy.ts`
- `app/src/proxy.test.ts`

### Modify

- `api/src/app.module.ts`
- `api/src/main.ts`
- `api/src/infrastructure/database/data-source.ts`
- `api/src/shared/presentation/http/api-error.filter.ts`

- `api/src/modules/usuarios/domain/entities/usuario.entity.ts`
- `api/src/modules/usuarios/infrastructure/persistence/usuario.orm-entity.ts`
- `api/src/modules/usuarios/infrastructure/persistence/usuario.mapper.ts`
- `api/src/modules/usuarios/infrastructure/persistence/usuario.typeorm-repository.ts`
- `api/src/modules/usuarios/application/dto/usuario.schemas.ts`
- `api/src/modules/usuarios/usuarios.module.ts`

- `app/src/app/page.tsx`
- `app/src/app/(dashboard)/layout.tsx`
- `app/src/components/layout/sidebar-menu.tsx`
- `app/src/lib/api/client.ts`

- `docs/PRD-GuardaHard.md`

---

## Chunk 1: PRD Stage Mapping + Database Foundation

### Task 0: Create PRD stage for this feature before coding

**Files:**

- Modify: `docs/PRD-GuardaHard.md`

- [ ] **Step 1: Add dedicated checklist stage**

Add `Etapa 11 — Autenticacao global + selecao de empresa` with checkboxes mapped 1:1 to Task 1..Task 7.

- [ ] **Step 2: Commit PRD stage mapping**

Run: `git add docs/PRD-GuardaHard.md && git commit -m "docs(prd): add etapa 11 auth and company-selection checklist"`

- [ ] **Step 3: Verify gating rule**

Do not start Task 1 until this commit exists.

### Task 1: Build migration for global users, empresas, pivot, and FK integrity

**Files:**

- Create: `api/src/infrastructure/database/migrations/1773401000000-GlobalUsersEmpresasMembership.ts`
- Create: `api/src/infrastructure/database/migrations/global-users-empresas-membership.migration.spec.ts`
- Modify: `api/src/infrastructure/database/data-source.ts`

- [ ] **Step 1: Write failing migration tests (RED)**

```ts
it('creates empresas and seeds Test company', async () => {
  const rows = await queryRunner.query(`SELECT nome FROM empresas WHERE nome = 'Test company'`);
  expect(rows.length).toBe(1);
});

it('ensures every table with empresa_id has FK to empresas.id', async () => {
  const tables = await queryRunner.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
  );
  for (const t of tables.map((r: { name: string }) => r.name)) {
    const cols = await queryRunner.query(`PRAGMA table_info('${t}')`);
    if (!cols.some((c: { name: string }) => c.name === 'empresa_id')) continue;
    const fks = await queryRunner.query(`PRAGMA foreign_key_list('${t}')`);
    expect(
      fks.some(
        (fk: { from: string; table: string; to: string }) =>
          fk.from === 'empresa_id' && fk.table === 'empresas' && fk.to === 'id',
      ),
    ).toBe(true);
  }
});

it('migrates usuarios to global auth shape', async () => {
  const columns = await queryRunner.query("PRAGMA table_info('usuarios')");
  const names = columns.map((c: { name: string }) => c.name);
  expect(names).toContain('nome');
  expect(names).toContain('email');
  expect(names).toContain('senha_hash');
  expect(names).toContain('ativo');
  expect(names).toContain('created_at');
  expect(names).toContain('updated_at');
  expect(names).not.toContain('empresa_id');
});

it('creates usuario_empresas with both foreign keys and unique pair', async () => {
  const columns = await queryRunner.query("PRAGMA table_info('usuario_empresas')");
  expect(columns.some((c: { name: string }) => c.name === 'usuario_id')).toBe(true);
  expect(columns.some((c: { name: string }) => c.name === 'empresa_id')).toBe(true);

  const fks = await queryRunner.query("PRAGMA foreign_key_list('usuario_empresas')");
  expect(
    fks.some(
      (fk: { from: string; table: string; to: string }) =>
        fk.from === 'usuario_id' && fk.table === 'usuarios' && fk.to === 'id',
    ),
  ).toBe(true);
  expect(
    fks.some(
      (fk: { from: string; table: string; to: string }) =>
        fk.from === 'empresa_id' && fk.table === 'empresas' && fk.to === 'id',
    ),
  ).toBe(true);

  const idx = await queryRunner.query("PRAGMA index_list('usuario_empresas')");
  const uniqueIndexes = idx.filter((i: { unique: number }) => i.unique === 1);
  const details = await Promise.all(
    uniqueIndexes.map(async (i: { name: string }) =>
      queryRunner.query(`PRAGMA index_info('${i.name}')`),
    ),
  );
  expect(
    details.some((cols: Array<{ name: string }>) => {
      const names = cols.map((c) => c.name);
      return names.length === 2 && names[0] === 'usuario_id' && names[1] === 'empresa_id';
    }),
  ).toBe(true);
});
```

- [ ] **Step 2: Run focused test and confirm RED**

Run: `pnpm --filter @guarda-hard/api test -- src/infrastructure/database/migrations/global-users-empresas-membership.migration.spec.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement migration minimally (GREEN)**

Required migration outcomes:

- create `empresas` and seed `Test company`;
- convert `usuarios` to global user shape (`nome`, `email`, `senha_hash`, `ativo`, timestamps);
- create `usuario_empresas` (`usuario_id`, `empresa_id`, unique pair);
- backfill `empresas` from legacy tenant ids before FK enforcement;
- add FK from all operational `empresa_id` columns to `empresas.id`;
- keep/repair existing operational data by deterministic backfill.

- [ ] **Step 4: Re-run focused test and confirm GREEN**

Run: `pnpm --filter @guarda-hard/api test -- src/infrastructure/database/migrations/global-users-empresas-membership.migration.spec.ts`  
Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Run: `git add api/src/infrastructure/database/migrations api/src/infrastructure/database/data-source.ts && git commit -m "feat(api): migrate to global users with empresas membership"`

- [ ] **Step 6: Mark Task 1 as complete in PRD and commit**

Run: `git add docs/PRD-GuardaHard.md && git commit -m "docs(prd): mark etapa 11 task 1 complete"`

---

## Chunk 2: Backend Modules and Session Flow

### Task 2: Implement empresas module for listing companies

**Files:**

- Create: `api/src/modules/empresas/empresas.module.ts`
- Create: `api/src/modules/empresas/domain/entities/empresa.entity.ts`
- Create: `api/src/modules/empresas/domain/repositories/empresa.repository.interface.ts`
- Create: `api/src/modules/empresas/infrastructure/persistence/empresa.orm-entity.ts`
- Create: `api/src/modules/empresas/infrastructure/persistence/empresa.typeorm-repository.ts`
- Create: `api/src/modules/empresas/application/use-cases/list-empresas.use-case.ts`
- Create: `api/src/modules/empresas/application/use-cases/list-empresas.use-case.spec.ts`
- Create: `api/src/modules/empresas/application/services/empresas.service.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Write failing unit test for list empresas use-case (RED)**

```ts
it('returns sorted empresas list', async () => {
  const result = await useCase.execute();
  expect(result[0]).toHaveProperty('id');
  expect(result[0]).toHaveProperty('nome');
});
```

- [ ] **Step 2: Run focused test and confirm RED**

Run: `pnpm --filter @guarda-hard/api test -- src/modules/empresas`  
Expected: FAIL.

- [ ] **Step 3: Implement minimal empresas module (GREEN)**

Implement domain/repository/use-case/service only; auth controller consumes this later.

- [ ] **Step 4: Re-run focused test and confirm GREEN**

Run: `pnpm --filter @guarda-hard/api test -- src/modules/empresas`  
Expected: PASS.

- [ ] **Step 5: Commit Task 2**

Run: `git add api/src/modules/empresas api/src/app.module.ts && git commit -m "feat(api): add empresas module for auth flows"`

- [ ] **Step 6: Mark Task 2 as complete in PRD and commit**

Run: `git add docs/PRD-GuardaHard.md && git commit -m "docs(prd): mark etapa 11 task 2 complete"`

### Task 3: Implement auth module (register, login, minhas-empresas, select-empresa, me, logout)

**Files:**

- Create: `api/src/modules/auth/auth.module.ts`
- Create: `api/src/modules/auth/application/dto/auth.schemas.ts`
- Create: `api/src/modules/auth/application/dto/auth.schemas.spec.ts`
- Create: `api/src/modules/auth/application/use-cases/register.use-case.ts`
- Create: `api/src/modules/auth/application/use-cases/login.use-case.ts`
- Create: `api/src/modules/auth/application/use-cases/list-minhas-empresas.use-case.ts`
- Create: `api/src/modules/auth/application/use-cases/select-empresa.use-case.ts`
- Create: `api/src/modules/auth/application/use-cases/get-current-user.use-case.ts`
- Create: `api/src/modules/auth/application/use-cases/register.use-case.spec.ts`
- Create: `api/src/modules/auth/application/use-cases/login.use-case.spec.ts`
- Create: `api/src/modules/auth/application/services/auth.service.ts`
- Create: `api/src/modules/auth/infrastructure/security/password-hasher.ts`
- Create: `api/src/modules/auth/infrastructure/security/session-token.service.ts`
- Create: `api/src/modules/auth/presentation/http/auth.controller.ts`
- Create: `api/src/modules/auth/presentation/http/auth.guard.ts`
- Create: `api/src/modules/auth/presentation/http/current-auth-user.decorator.ts`
- Create: `api/src/modules/auth/presentation/http/session-phase.guard.ts`
- Create: `api/src/modules/auth/presentation/http/auth.controller.spec.ts`
- Create: `api/src/shared/presentation/http/tenant-context.interceptor.ts`
- Modify: `api/src/app.module.ts`
- Modify: `api/src/main.ts`
- Modify: `api/src/shared/presentation/http/api-error.filter.ts`
- Modify: `api/src/modules/usuarios/domain/entities/usuario.entity.ts`
- Modify: `api/src/modules/usuarios/infrastructure/persistence/usuario.orm-entity.ts`
- Modify: `api/src/modules/usuarios/infrastructure/persistence/usuario.mapper.ts`
- Modify: `api/src/modules/usuarios/infrastructure/persistence/usuario.typeorm-repository.ts`
- Modify: `api/src/modules/usuarios/application/dto/usuario.schemas.ts`
- Modify: `api/src/modules/usuarios/usuarios.module.ts`

- [ ] **Step 1: Write failing auth contract tests (RED)**

```ts
it('POST /auth/login creates phase-A session without tenant', async () => {
  const res = await request(server).post('/auth/login').send({ email, senha });
  expect(res.status).toBe(200);
  expect(res.headers['set-cookie'][0]).toContain('gh_session=');
});

it('GET /auth/minhas-empresas returns only membership companies', async () => {
  const res = await request(server).get('/auth/minhas-empresas').set('Cookie', cookiePhaseA);
  expect(res.status).toBe(200);
  expect(res.body.items.length).toBeGreaterThan(0);
});

it('POST /auth/select-empresa upgrades session and enables tenant-scoped access', async () => {
  const select = await request(server)
    .post('/auth/select-empresa')
    .set('Cookie', cookiePhaseA)
    .send({ empresaId });
  expect(select.status).toBe(200);
});

it('GET /auth/empresas returns public registration companies list', async () => {
  const res = await request(server).get('/auth/empresas');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.items)).toBe(true);
  expect(res.body.items[0]).toHaveProperty('id');
  expect(res.body.items[0]).toHaveProperty('nome');
});

it('register rejects unknown empresaId', async () => {
  const res = await request(server).post('/auth/register').send({
    nome,
    email,
    senha,
    confirmarSenha: senha,
    empresaId: '99999999-9999-9999-9999-999999999999',
  });
  expect(res.status).toBe(400);
});

it('register rejects senha mismatch', async () => {
  const res = await request(server).post('/auth/register').send({
    nome,
    email,
    senha,
    confirmarSenha: 'different',
    empresaId,
  });
  expect(res.status).toBe(400);
});

it('register rejects duplicate global email with 409', async () => {
  await request(server)
    .post('/auth/register')
    .send({ nome, email, senha, confirmarSenha: senha, empresaId });
  const duplicate = await request(server).post('/auth/register').send({
    nome: 'Other',
    email,
    senha,
    confirmarSenha: senha,
    empresaId: otherEmpresaId,
  });
  expect(duplicate.status).toBe(409);
});

it('register normalizes email before persistence', async () => {
  await request(server).post('/auth/register').send({
    nome,
    email: '  USER@Example.COM  ',
    senha,
    confirmarSenha: senha,
    empresaId,
  });
  const persisted = await usersRepository.findByEmail('user@example.com');
  expect(persisted).toBeDefined();
});

it('login returns generic invalid credentials error', async () => {
  const res = await request(server).post('/auth/login').send({ email, senha: 'wrong-pass' });
  expect(res.status).toBe(401);
  expect(res.body.message).toBe('Invalid credentials');
});

it('login cookie includes security flags', async () => {
  const res = await request(server).post('/auth/login').send({ email, senha });
  const cookie = String(res.headers['set-cookie']?.[0] ?? '');
  expect(cookie).toContain('HttpOnly');
  expect(cookie).toContain('SameSite=Lax');
  // Add production-mode test case to assert Secure flag.
});

it('select-empresa rejects non-member company with TENANT_FORBIDDEN', async () => {
  const res = await request(server)
    .post('/auth/select-empresa')
    .set('Cookie', cookiePhaseA)
    .send({ empresaId: nonMemberEmpresaId });
  expect(res.status).toBe(403);
  expect(res.body.code).toBe('TENANT_FORBIDDEN');
});

it('phase-A session is rejected on tenant-scoped operational endpoint', async () => {
  const res = await request(server)
    .post('/departamentos')
    .set('Cookie', cookiePhaseA)
    .send({ nome: 'TI' });
  expect([401, 403]).toContain(res.status);
});

it('GET /auth/me returns identity in phase A and includes empresaId in phase B', async () => {
  const phaseA = await request(server).get('/auth/me').set('Cookie', cookiePhaseA);
  expect(phaseA.status).toBe(200);
  expect(phaseA.body).toHaveProperty('id');
  expect(phaseA.body).not.toHaveProperty('empresaId');

  const phaseB = await request(server).get('/auth/me').set('Cookie', cookiePhaseB);
  expect(phaseB.status).toBe(200);
  expect(phaseB.body).toHaveProperty('empresaId');
});

it('POST /auth/logout clears session cookie', async () => {
  const res = await request(server).post('/auth/logout').set('Cookie', cookiePhaseB);
  expect(res.status).toBe(200);
  expect(String(res.headers['set-cookie']?.[0] ?? '')).toContain('gh_session=;');
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `pnpm --filter @guarda-hard/api test -- src/modules/auth`  
Expected: FAIL.

- [ ] **Step 3: Implement minimal auth flow (GREEN)**

Implement:

- register: create global user + `usuario_empresas` membership;
- login: phase-A session (`userId`, no tenant);
- public endpoint `GET /auth/empresas` for register options;
- minhas-empresas: list membership companies;
- select-empresa: membership validation + phase-B session (`userId`, `empresaId`);
- me + logout;
- auth/session guards;
- interceptor that sets `TenantContext` only when session has `empresaId`;
- validation/security requirements:
  - unknown `empresaId` rejected on register,
  - password confirmation mismatch rejected,
  - duplicate global email returns 409,
  - email normalization (`trim + lowercase`),
  - generic invalid login error,
  - cookie flags (`HttpOnly`, `SameSite=Lax`, `Secure` in production).

- [ ] **Step 4: Re-run focused tests and confirm GREEN**

Run: `pnpm --filter @guarda-hard/api test -- src/modules/auth`  
Expected: PASS.

- [ ] **Step 5: Run integration safety tests**

Run: `pnpm --filter @guarda-hard/api test -- src/modules/auth src/modules/departamentos src/tenant src/infrastructure/database`  
Expected: PASS.

- [ ] **Step 6: Commit Task 3**

Run: `git add api/src/modules/auth api/src/shared/presentation/http/tenant-context.interceptor.ts api/src/modules/usuarios api/src/shared/presentation/http/api-error.filter.ts api/src/app.module.ts api/src/main.ts && git commit -m "feat(api): implement two-phase auth and tenant selection"`

- [ ] **Step 7: Mark Task 3 as complete in PRD and commit**

Run: `git add docs/PRD-GuardaHard.md && git commit -m "docs(prd): mark etapa 11 task 3 complete"`

---

## Chunk 3: Frontend Auth UX + Route Protection

### Task 4: Build auth home page at `/` (login/register)

**Files:**

- Create: `app/src/features/auth/schemas/auth-schema.ts`
- Create: `app/src/features/auth/server/auth-api.ts`
- Create: `app/src/features/auth/components/auth-page.tsx`
- Create: `app/src/features/auth/forms/login-form.tsx`
- Create: `app/src/features/auth/forms/register-form.tsx`
- Create: `app/src/features/auth/forms/login-form.test.tsx`
- Create: `app/src/features/auth/forms/register-form.test.tsx`
- Modify: `app/src/app/page.tsx`

- [ ] **Step 1: Write failing form tests (RED)**

```tsx
it('register sends nome, email, senha, confirmarSenha, empresaId', async () => {
  // fill and submit
});

it('login sends email and senha only', async () => {
  // fill and submit
});

it('loads register company options from GET /auth/empresas', async () => {
  // mock GET /auth/empresas and assert only returned options are shown/selectable
});

it('shows top-level error and preserves values on register failure', async () => {
  // backend error should keep values and keep register panel active
});

it('shows top-level error and preserves values on login failure', async () => {
  // backend error should keep values and keep login panel active
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `pnpm --filter @guarda-hard/app test -- src/features/auth/forms/login-form.test.tsx src/features/auth/forms/register-form.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement minimal auth home (GREEN)**

`/` shows login/register. Register success returns to login panel with success feedback.

Register company dropdown must fetch options via `auth-api.ts` (`GET /auth/empresas`) and only submit `empresaId` values present in fetched options.

On backend errors, auth page must display top-level error alert, preserve input values, and keep user on current step until correction.

- [ ] **Step 4: Re-run focused tests and confirm GREEN**

Run: `pnpm --filter @guarda-hard/app test -- src/features/auth/forms/login-form.test.tsx src/features/auth/forms/register-form.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit Task 4**

Run: `git add app/src/app/page.tsx app/src/features/auth && git commit -m "feat(app): add auth home login and register"`

- [ ] **Step 6: Mark Task 4 as complete in PRD and commit**

Run: `git add docs/PRD-GuardaHard.md && git commit -m "docs(prd): mark etapa 11 task 4 complete"`

### Task 5: Build post-login company selection page

**Files:**

- Create: `app/src/app/select-company/page.tsx`
- Create: `app/src/features/auth/components/company-selection-page.tsx`
- Create: `app/src/features/auth/forms/company-selection-form.tsx`
- Create: `app/src/features/auth/forms/company-selection-form.test.tsx`
- Modify: `app/src/features/auth/server/auth-api.ts`

- [ ] **Step 1: Write failing company-selection tests (RED)**

```tsx
it('renders only allowed companies from minhas-empresas', async () => {
  // expect provided companies only
});

it('submits selected empresaId to select-empresa', async () => {
  // select and submit
});

it('shows top-level error and preserves selection when select-empresa fails', async () => {
  // backend error should keep user on selection page with chosen option preserved
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `pnpm --filter @guarda-hard/app test -- src/features/auth/forms/company-selection-form.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement minimal company-selection flow (GREEN)**

After login success, redirect to `/select-company`. Submit selected company then redirect `/dashboard`.

On select-company backend error, keep user on `/select-company`, preserve selected company, and show top-level error alert.

- [ ] **Step 4: Re-run focused tests and confirm GREEN**

Run: `pnpm --filter @guarda-hard/app test -- src/features/auth/forms/company-selection-form.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit Task 5**

Run: `git add app/src/app/select-company/page.tsx app/src/features/auth && git commit -m "feat(app): add post-login company selection step"`

- [ ] **Step 6: Mark Task 5 as complete in PRD and commit**

Run: `git add docs/PRD-GuardaHard.md && git commit -m "docs(prd): mark etapa 11 task 5 complete"`

### Task 6: Enforce global route protection with phase-aware redirects

**Files:**

- Create: `app/src/proxy.ts`
- Create: `app/src/proxy.test.ts`
- Modify: `app/src/app/(dashboard)/layout.tsx`
- Modify: `app/src/lib/api/client.ts`
- Modify: `app/src/components/layout/sidebar-menu.tsx`

- [ ] **Step 1: Write failing route-protection tests (RED)**

```ts
it('redirects unauthenticated access to /dashboard -> /', async () => {
  // no cookie
});

it('redirects phase-A session from /dashboard -> /select-company', async () => {
  // cookie without empresaId
});

it('redirects phase-B session from / to /dashboard', async () => {
  // cookie with empresaId
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `pnpm --filter @guarda-hard/app test -- src/proxy.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement proxy and layout fallback checks (GREEN)**

Rules:

- public routes: `/`, static assets;
- authenticated-only pre-tenant route: `/select-company`;
- no session -> `/`;
- no session + `/select-company` -> `/`;
- phase-A session + protected route -> `/select-company`;
- phase-B session + `/` or `/select-company` -> `/dashboard`.

- [ ] **Step 4: Add logout behavior**

Sidebar logout calls `/auth/logout` and redirects to `/`.

- [ ] **Step 5: Re-run focused tests and confirm GREEN**

Run: `pnpm --filter @guarda-hard/app test -- src/proxy.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit Task 6**

Run: `git add app/src/proxy.ts app/src/proxy.test.ts app/src/app/(dashboard)/layout.tsx app/src/lib/api/client.ts app/src/components/layout/sidebar-menu.tsx && git commit -m "feat(app): enforce phase-aware auth route protection"`

- [ ] **Step 7: Mark Task 6 as complete in PRD and commit**

Run: `git add docs/PRD-GuardaHard.md && git commit -m "docs(prd): mark etapa 11 task 6 complete"`

---

## Chunk 4: Verification and Closure

### Task 7: End-to-end verification and final quality gate

**Files:**

- Modify (if needed): `docs/PRD-GuardaHard.md`

- [ ] **Step 1: Run backend quality checks**

Run: `pnpm --filter @guarda-hard/api lint && pnpm --filter @guarda-hard/api test && pnpm --filter @guarda-hard/api build`  
Expected: PASS.

- [ ] **Step 2: Run frontend quality checks**

Run: `pnpm --filter @guarda-hard/app lint && pnpm --filter @guarda-hard/app test && pnpm --filter @guarda-hard/app build`  
Expected: PASS.

- [ ] **Step 3: Run workspace checks**

Run: `pnpm lint && pnpm test && pnpm build`  
Expected: PASS.

- [ ] **Step 4: Manual smoke tests**

1. Open `/` and verify login/register.
2. Register with `Test company`.
3. Login successfully.
4. Verify redirect to `/select-company`.
5. Verify only membership companies are listed.
6. Select company and reach `/dashboard`.
7. Logout and confirm redirect `/`.
8. Access `/dashboard` without session and confirm redirect `/`.

- [ ] **Step 5: Mark Task 7 as complete in PRD and commit**

Run: `git add docs/PRD-GuardaHard.md && git commit -m "docs(prd): mark etapa 11 task 7 complete"`

- [ ] **Step 6: Verify etapa 11 checkboxes all `[x]`**

Ensure no task was started before previous PRD checkbox update commit.

---

## Risks and Mitigations

- **Risk:** Legacy tenant data breaks migration when adding strict FKs.
  - **Mitigation:** backfill `empresas` from discovered tenant ids before FK creation; test with migration spec.
- **Risk:** Existing modules fail when session has no selected tenant.
  - **Mitigation:** phase-aware guard + interceptor tests against operational endpoints.
- **Risk:** Route loops between `/`, `/select-company`, `/dashboard`.
  - **Mitigation:** dedicated `proxy.test.ts` for all redirect combinations.

## Definition of Done

- Global `usuarios`, global `empresas`, and `usuario_empresas` pivot are live.
- `Test company` exists.
- All operational `empresa_id` columns FK to `empresas.id`.
- Login/register available at `/`.
- Company selection required after login and before protected routes.
- Only allowed companies are shown for selection.
- Lint, tests, and build pass for API/app/workspace.
