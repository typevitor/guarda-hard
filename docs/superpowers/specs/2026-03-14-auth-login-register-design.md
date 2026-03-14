# Auth Home + Global Users + Company Membership Selection - Design Spec

**Date:** 2026-03-14  
**Status:** Approved (design conversation)  
**Scope:** Implement login/register at `/`, enforce authentication before protected pages, introduce global tenants (`empresas`) and global users (`usuarios`) with pivot membership (`usuario_empresas`), and require company selection after successful login.

---

## 1. Context

Current state:

- `/` redirects directly to dashboard.
- No dedicated authentication flow with login/register/select-company.
- Multi-tenant ownership exists in operational tables via `empresa_id`.

User-approved target model:

- `usuarios` is **global** (not tenant-scoped).
- `empresas` is **global** (not tenant-scoped).
- User-company access is represented by pivot table `usuario_empresas`.
- User logs in first, then selects one allowed company before entering protected pages.
- Register asks for company and grants initial membership to selected company.
- Add/keep FK from every tenant-owned `empresa_id` to `empresas.id`.

---

## 2. Approved Product Decisions

- Auth transport: cookie session (`HttpOnly`).
- Register fields: `nome`, `email` (login), `senha`, `confirmarSenha`, `empresaId`.
- Register success behavior: redirect to login (no auto-login).
- Login credential: `email + senha` only.
- Company selection happens **after** successful login.
- Company selector must show only companies user has access to.

---

## 3. Architecture Alignment

This design follows `docs/architecture.md`:

- Backend: modular monolith with feature modules and layered boundaries.
- Add `auth` feature for login/register/session flows.
- Add `empresas` capability for tenant catalog access.
- Keep tenant-aware business modules using `empresa_id` and centralized tenant context.
- Frontend: route composition in `app/src/app`; auth feature behavior in `app/src/features/auth`.

---

## 4. Proposed System Design

### 4.1 Data model

#### Global tables

- `usuarios` (global identity/auth)
  - `id`
  - `nome`
  - `email` (global unique)
  - `senha_hash`
  - `ativo`
  - `created_at`, `updated_at`

- `empresas` (global catalog)
  - `id`
  - `nome`
  - `created_at`, `updated_at`

- `usuario_empresas` (membership pivot)
  - `id` (or composite key policy)
  - `usuario_id` FK -> `usuarios.id`
  - `empresa_id` FK -> `empresas.id`
  - unique membership pair (`usuario_id`, `empresa_id`)
  - optional audit timestamps if useful

#### Tenant-owned operational tables

Keep `empresa_id` on operational tables (`departamentos`, `hardwares`, `emprestimos`, and any other existing tenant-owned table).

Mandatory referential integrity:

- Every operational `empresa_id` must reference `empresas.id`.

### 4.2 Migration and seed behavior

- Create `empresas` table.
- Seed one default row: `Test company`.
- Refactor `usuarios` from tenant-bound shape to global auth shape.
- Create `usuario_empresas` with unique pair constraint.
- Backfill memberships where legacy data implies previous tenant ownership.
- Add FK constraints from all discovered operational `empresa_id` columns to `empresas.id`.

### 4.3 Authentication and session states

Auth uses two session phases:

- **Phase A (authenticated, tenant not selected):** set after successful login.
- **Phase B (authenticated + tenant selected):** set after `select-empresa` success.

Session payload must include:

- user identity (`userId`)
- selected tenant id only in Phase B (`empresaId`)

Tenant context for tenant-scoped modules is available only in Phase B.

### 4.4 Frontend routing and guards

- `/` is auth home (login/register).
- After login success, redirect to a company selection view.
- Company selection view lists only memberships from backend.
- After selecting company, redirect to `/dashboard`.
- Any protected route requires Phase B session.
- If user is authenticated but has no selected company, redirect to company-selection step.

---

## 5. API Contracts

### Public auth endpoints

- `GET /auth/empresas`
  - Purpose: tenant options for registration
  - Response:

```json
{
  "items": [{ "id": "uuid", "nome": "Test company" }]
}
```

- `POST /auth/register`
  - Request:

```json
{
  "nome": "Jane Doe",
  "email": "jane@example.com",
  "senha": "secret123",
  "confirmarSenha": "secret123",
  "empresaId": "uuid"
}
```

- Behavior:
  - creates global user in `usuarios`
  - creates one membership in `usuario_empresas`
  - does not log user in automatically

- `POST /auth/login`
  - Request:

```json
{
  "email": "jane@example.com",
  "senha": "secret123"
}
```

- Behavior:
  - validates credentials
  - sets Phase A session (tenant not selected)

### Authenticated auth endpoints

- `GET /auth/minhas-empresas`
  - Returns only companies available to authenticated user via `usuario_empresas`.

- `POST /auth/select-empresa`
  - Request:

```json
{
  "empresaId": "uuid"
}
```

- Behavior:
  - validates membership exists for authenticated user
  - upgrades session to Phase B with selected `empresaId`

- `GET /auth/me`
  - Returns user identity + selected tenant context when Phase B is active.

- `POST /auth/logout`
  - Clears session cookie.

---

## 6. Validation and Security Rules

- Password hash only, never plaintext storage.
- Email normalization (`trim` + lowercase).
- Register enforces password confirmation match.
- Register blocks duplicate global email.
- `select-empresa` authorizes through `usuario_empresas`; payload alone is never trusted.
- Invalid credentials return generic message.
- Cookie flags: `HttpOnly`, `SameSite=Lax`, `Secure` in production.

---

## 7. Error Handling

- `400 VALIDATION_ERROR`: invalid payloads or malformed input.
- `401 AUTH_REQUIRED`: unauthenticated requests.
- `403 TENANT_FORBIDDEN`: selecting or using tenant without membership.
- `409 CONFLICT`: duplicate email or duplicate membership conflicts.
- `500 INTERNAL_ERROR`: unexpected failures.

Frontend behavior on errors:

- Keep entered values in login/register forms.
- Show top-level error alert.
- Keep user on current step until corrected.

---

## 8. Testing Strategy

### 8.1 Migration tests

- `empresas` created and seeded with `Test company`.
- `usuarios` migrated to global auth columns.
- `usuario_empresas` created with unique pair + FKs.
- Every discovered operational `empresa_id` has FK to `empresas.id`.

### 8.2 Backend auth tests

- Register success creates user + membership.
- Register rejects unknown `empresaId`.
- Register rejects mismatched password confirmation.
- Login success creates Phase A session.
- `minhas-empresas` returns only user memberships.
- `select-empresa` upgrades to Phase B only with valid membership.
- Tenant-scoped endpoints reject Phase A-only sessions.
- Logout clears session.

### 8.3 Frontend tests

- `/` renders login/register.
- Register submits all required fields and redirects to login state.
- Login success routes user to company selection.
- Company selection shows only allowed companies.
- Protected routes require selected company (Phase B session).

---

## 9. Rollout Plan

1. Database migration and data transition (`empresas`, global `usuarios`, pivot).
2. Backend auth and membership endpoints.
3. Session phase handling + tenant-context guard policy.
4. Frontend auth home + company-selection flow.
5. Protected route enforcement and verification.

---

## 10. Acceptance Criteria

- `/` is login/register home.
- Registration collects required fields and associates user to selected company.
- Login does not require company input.
- After login, user must select a company from allowed memberships only.
- User cannot access protected pages until company is selected.
- `empresas` includes `Test company`.
- All operational `empresa_id` columns have FK to `empresas.id`.

---

## 11. Out of Scope

- Password reset flow.
- Email verification.
- OAuth/SSO providers.
- Role-based permission matrix.
