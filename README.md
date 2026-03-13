# GuardaHard

Sistema de controle de patrimonio (hardwares) com foco em emprestimo, devolucao, defeitos, historico e relatorios, com isolamento multi-tenant por `empresa_id`.

## Stack

- Monorepo com pnpm workspaces
- Backend: NestJS + TypeORM + SQLite
- Frontend: Next.js (App Router)
- Validacao: Zod
- Testes: Vitest
- TypeScript strict em todos os pacotes

## Estrutura do monorepo

- `api/`: aplicacao NestJS (dominio, casos de uso, persistencia, tenant)
- `app/`: aplicacao Next.js (rotas, features, UI)
- `packages/schemas/`: contratos Zod compartilhados
- `packages/types/`: tipos compartilhados
- `docs/`: PRD, arquitetura e planos

Referencias principais:

- Arquitetura: `docs/architecture.md`
- PRD: `docs/PRD-GuardaHard.md`

## Requisitos

- Node.js 22+
- pnpm 10+

## Instalacao

```bash
pnpm install
```

## Desenvolvimento

Subir todos os projetos em paralelo:

```bash
pnpm dev
```

Rodar apenas backend:

```bash
pnpm --filter @guarda-hard/api start:dev
```

Rodar apenas frontend:

```bash
pnpm --filter @guarda-hard/app dev
```

## Testes

Executar todos os testes do monorepo:

```bash
pnpm test
```

Executar somente API:

```bash
pnpm --filter @guarda-hard/api test
```

Executar somente App:

```bash
pnpm --filter @guarda-hard/app test
```

## Lint

```bash
pnpm -r lint
```

## Build

```bash
pnpm -r build
```

## Banco e migrations (API)

```bash
pnpm --filter @guarda-hard/api migration:run
```

## CI

Pipeline definido em `.github/workflows/ci.yml` com etapas:

1. Install (`pnpm install --frozen-lockfile`)
2. Lint (`pnpm -r lint`)
3. Test (`pnpm -r test`)
4. Build (`pnpm -r build`)

## Multi-tenant

- O tenant atual e resolvido via `TenantContext`.
- Repositorios de persistencia aplicam filtro por `empresa_id`.
- Testes de isolamento ficam em `api/test/tenant`.

## Observacoes

- Use `pnpm` para todos os comandos neste repositorio.
- Ao executar etapas da PRD, marque os checklists imediatamente apos concluir cada item.
