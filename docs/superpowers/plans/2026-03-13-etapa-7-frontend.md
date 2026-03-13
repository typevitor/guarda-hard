# Etapa 7 - Frontend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a Etapa 7 da PRD com layout base, menu, dashboard e paginas de departamentos, usuarios, hardwares, emprestimo, devolucao e relatorios no app Next.js.

**Architecture:** Seguir `docs/architecture.md` com App Router server-first, rotas em `app/src/app`, codigo de negocio e UI por feature em `app/src/features`, primitives em `app/src/components`, e acesso HTTP centralizado em `app/src/lib/api`. Cada pagina deve ser funcional e tenant-aware via backend autenticado.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, React Hook Form, Zod, Vitest, pnpm workspaces

---

## Scope Check

Etapa 7 e um subsistema unico (frontend), com 3 trilhas paralelas naturais ja previstas na PRD:

1. paginas
2. componentes
3. formularios

Este plano organiza as trilhas em chunks para entregar incrementos testaveis sem quebrar navegacao.

## Execution Skills (required during implementation)

- `@superpowers/subagent-driven-development` (quando subagents estiverem disponiveis)
- `@superpowers/test-driven-development` (antes de cada task)
- `@superpowers/systematic-debugging` (se houver falha inesperada em build/test)
- `@superpowers/verification-before-completion` (antes de declarar Etapa 7 concluida)
- `@superpowers/requesting-code-review` (apos implementacao)

## Preconditions

- Confirmar Etapas 1-6 ja concluidas e marcadas no PRD.
- Confirmar API local operacional para integracao das paginas.
- Rodar baseline do app para detectar regressao preexistente.

Run:

```bash
pnpm --filter @guarda-hard/app lint && pnpm --filter @guarda-hard/app test && pnpm --filter @guarda-hard/app build
```

Expected:

- Todos PASS no baseline antes de iniciar Etapa 7.

## File Structure (lock before coding)

### Create

- `app/src/app/(dashboard)/layout.tsx` - layout base autenticado com menu lateral e area de conteudo.
- `app/src/app/(dashboard)/page.tsx` - dashboard principal.
- `app/src/app/(dashboard)/departamentos/page.tsx`
- `app/src/app/(dashboard)/usuarios/page.tsx`
- `app/src/app/(dashboard)/hardwares/page.tsx`
- `app/src/app/(dashboard)/emprestimo/page.tsx`
- `app/src/app/(dashboard)/devolucao/page.tsx`
- `app/src/app/(dashboard)/relatorios/page.tsx`

- `app/src/components/layout/app-shell.tsx`
- `app/src/components/layout/sidebar-menu.tsx`
- `app/src/components/layout/page-header.tsx`

- `app/src/features/dashboard/components/dashboard-page.tsx`
- `app/src/features/dashboard/components/status-card.tsx`
- `app/src/features/dashboard/server/get-dashboard-data.ts`

- `app/src/features/departamentos/components/departamentos-page.tsx`
- `app/src/features/departamentos/forms/departamento-form.tsx`
- `app/src/features/departamentos/server/departamentos-api.ts`

- `app/src/features/usuarios/components/usuarios-page.tsx`
- `app/src/features/usuarios/forms/usuario-form.tsx`
- `app/src/features/usuarios/server/usuarios-api.ts`

- `app/src/features/hardwares/components/hardwares-page.tsx`
- `app/src/features/hardwares/forms/hardware-form.tsx`
- `app/src/features/hardwares/server/hardwares-api.ts`

- `app/src/features/emprestimos/components/emprestimo-page.tsx`
- `app/src/features/emprestimos/components/devolucao-page.tsx`
- `app/src/features/emprestimos/forms/emprestimo-form.tsx`
- `app/src/features/emprestimos/forms/devolucao-form.tsx`
- `app/src/features/emprestimos/server/emprestimos-api.ts`

- `app/src/features/relatorios/components/relatorios-page.tsx`
- `app/src/features/relatorios/forms/relatorio-filtros-form.tsx`
- `app/src/features/relatorios/server/relatorios-api.ts`

- `app/src/lib/api/client.ts` - fetch wrapper para API NestJS.
- `app/src/lib/api/errors.ts` - normalizacao de erros HTTP.
- `app/src/lib/api/env.ts` - leitura tipada de `NEXT_PUBLIC_API_URL`.

- `app/src/components/layout/sidebar-menu.test.tsx`
- `app/src/features/dashboard/server/get-dashboard-data.test.ts`
- `app/src/features/departamentos/forms/departamento-form.test.tsx`
- `app/src/features/usuarios/forms/usuario-form.test.tsx`
- `app/src/features/hardwares/forms/hardware-form.test.tsx`
- `app/src/features/emprestimos/forms/emprestimo-form.test.tsx`
- `app/src/features/emprestimos/forms/devolucao-form.test.tsx`
- `app/src/features/relatorios/forms/relatorio-filtros-form.test.tsx`

### Modify

- `app/src/app/layout.tsx` - metadata e fonte para identidade do produto.
- `app/src/app/page.tsx` - redirecionar para dashboard.
- `app/src/app/globals.css` - tokens visuais e estilos base do shell.
- `app/package.json` - incluir dependencias de teste de componentes se necessario (`@testing-library/react`, `@testing-library/user-event`).
- `docs/PRD-GuardaHard.md` - marcar item de Etapa 7 imediatamente apos concluir cada item.

### Test Targets

- `app/src/components/layout/sidebar-menu.test.tsx`
- `app/src/features/dashboard/server/get-dashboard-data.test.ts`
- `app/src/features/departamentos/forms/departamento-form.test.tsx`
- `app/src/features/usuarios/forms/usuario-form.test.tsx`
- `app/src/features/hardwares/forms/hardware-form.test.tsx`
- `app/src/features/emprestimos/forms/emprestimo-form.test.tsx`
- `app/src/features/emprestimos/forms/devolucao-form.test.tsx`
- `app/src/features/relatorios/forms/relatorio-filtros-form.test.tsx`

---

## Chunk 1: Fundacao de Layout e Navegacao

### Task 1: Estruturar shell base e menu global

**Files:**

- Create: `app/src/components/layout/app-shell.tsx`
- Create: `app/src/components/layout/sidebar-menu.tsx`
- Create: `app/src/components/layout/page-header.tsx`
- Create: `app/src/app/(dashboard)/layout.tsx`
- Create: `app/src/components/layout/sidebar-menu.test.tsx`
- Modify: `app/src/app/layout.tsx`
- Modify: `app/src/app/page.tsx`
- Modify: `app/src/app/globals.css`

- [ ] **Step 1: Escrever teste de navegacao do menu (red)**

Criar `sidebar-menu.test.tsx` cobrindo:

- render de todos os links da Etapa 7
- destaque do item ativo por pathname

- [ ] **Step 2: Rodar teste focado e confirmar falha**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/components/layout/sidebar-menu.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implementar shell e menu minimo para passar teste**

Implementar `AppShell` com `SidebarMenu` e slot de conteudo, garantindo responsividade desktop/mobile.

- [ ] **Step 4: Ajustar layout raiz e rota inicial**

- trocar metadata para GuardaHard
- atualizar tipografia/token visual em `globals.css`
- em `app/src/app/page.tsx`, redirecionar para `/(dashboard)`

- [ ] **Step 5: Rodar teste focado e confirmar PASS**

Run o comando do Step 2.

- [ ] **Step 6: Commit do shell base**

```bash
git add app/src/app/layout.tsx app/src/app/page.tsx app/src/app/globals.css app/src/app/(dashboard)/layout.tsx app/src/components/layout
git commit -m "feat(app): add dashboard shell and navigation menu"
```

- [ ] **Step 7: Marcar PRD imediatamente (layout base + menu)**

Em `docs/PRD-GuardaHard.md`:

```md
Before:

- [ ] Criar layout base
- [ ] Criar menu

After:

- [x] Criar layout base
- [x] Criar menu
```

- [ ] **Step 8: Commit do checkbox da PRD**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 7 layout and menu complete"
```

### Task 2: Implementar pagina de dashboard

**Files:**

- Create: `app/src/app/(dashboard)/page.tsx`
- Create: `app/src/features/dashboard/components/dashboard-page.tsx`
- Create: `app/src/features/dashboard/components/status-card.tsx`
- Create: `app/src/features/dashboard/server/get-dashboard-data.ts`
- Create: `app/src/features/dashboard/server/get-dashboard-data.test.ts`

- [ ] **Step 1: Escrever teste de agregacao de dashboard (red)**

Testar `getDashboardData` para transformar retorno da API em cards de status (`disponivel`, `emprestado`, `defeituoso`).

- [ ] **Step 2: Rodar teste focado e confirmar falha**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/features/dashboard/server/get-dashboard-data.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implementar funcao server + componentes visuais do dashboard**

`DashboardPage` recebe dados ja processados e renderiza cards sem logica de fetch no componente.

- [ ] **Step 4: Rodar teste focado e confirmar PASS**

Run o comando do Step 2.

- [ ] **Step 5: Commit dashboard**

```bash
git add app/src/app/(dashboard)/page.tsx app/src/features/dashboard
git commit -m "feat(app): implement dashboard page with status cards"
```

- [ ] **Step 6: Marcar PRD imediatamente (dashboard)**

```md
Before:

- [ ] Criar dashboard

After:

- [x] Criar dashboard
```

- [ ] **Step 7: Commit do checkbox da PRD**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 7 dashboard complete"
```

---

## Chunk 2: Paginas de Cadastro (Departamentos, Usuarios, Hardwares)

### Task 3: Implementar pagina de departamentos com formulario

**Files:**

- Create: `app/src/app/(dashboard)/departamentos/page.tsx`
- Create: `app/src/features/departamentos/components/departamentos-page.tsx`
- Create: `app/src/features/departamentos/forms/departamento-form.tsx`
- Create: `app/src/features/departamentos/server/departamentos-api.ts`
- Create: `app/src/features/departamentos/forms/departamento-form.test.tsx`

- [ ] **Step 1: Escrever teste do formulario de departamento (red)**

Cobrir validacao de nome obrigatorio e submit chamando handler com payload valido.

- [ ] **Step 2: Rodar teste focado e confirmar falha**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/features/departamentos/forms/departamento-form.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implementar API client da feature + formulario RHF/Zod + pagina**

- [ ] **Step 4: Rodar teste focado e confirmar PASS**

Run o comando do Step 2.

- [ ] **Step 5: Commit departamentos page**

```bash
git add app/src/app/(dashboard)/departamentos/page.tsx app/src/features/departamentos
git commit -m "feat(app): implement departamentos page and form"
```

- [ ] **Step 6: Marcar PRD imediatamente (pagina departamentos)**

```md
Before:

- [ ] Criar página departamentos

After:

- [x] Criar página departamentos
```

- [ ] **Step 7: Commit do checkbox da PRD**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 7 departamentos page complete"
```

### Task 4: Implementar pagina de usuarios com formulario

**Files:**

- Create: `app/src/app/(dashboard)/usuarios/page.tsx`
- Create: `app/src/features/usuarios/components/usuarios-page.tsx`
- Create: `app/src/features/usuarios/forms/usuario-form.tsx`
- Create: `app/src/features/usuarios/server/usuarios-api.ts`
- Create: `app/src/features/usuarios/forms/usuario-form.test.tsx`

- [ ] **Step 1: Escrever teste do formulario de usuarios (red)**

Cobrir `email` valido, `nome` obrigatorio e `departamentoId` obrigatorio.

- [ ] **Step 2: Rodar teste focado e confirmar falha**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/features/usuarios/forms/usuario-form.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implementar API client da feature + formulario RHF/Zod + pagina**

- [ ] **Step 4: Rodar teste focado e confirmar PASS**

Run o comando do Step 2.

- [ ] **Step 5: Commit usuarios page**

```bash
git add app/src/app/(dashboard)/usuarios/page.tsx app/src/features/usuarios
git commit -m "feat(app): implement usuarios page and form"
```

- [ ] **Step 6: Marcar PRD imediatamente (pagina usuarios)**

```md
Before:

- [ ] Criar página usuários

After:

- [x] Criar página usuários
```

- [ ] **Step 7: Commit do checkbox da PRD**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 7 usuarios page complete"
```

### Task 5: Implementar pagina de hardwares com formulario

**Files:**

- Create: `app/src/app/(dashboard)/hardwares/page.tsx`
- Create: `app/src/features/hardwares/components/hardwares-page.tsx`
- Create: `app/src/features/hardwares/forms/hardware-form.tsx`
- Create: `app/src/features/hardwares/server/hardwares-api.ts`
- Create: `app/src/features/hardwares/forms/hardware-form.test.tsx`

- [ ] **Step 1: Escrever teste do formulario de hardwares (red)**

Cobrir obrigatoriedade de `descricao` e `codigoPatrimonio`, e submit de payload valido.

- [ ] **Step 2: Rodar teste focado e confirmar falha**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/features/hardwares/forms/hardware-form.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implementar API client da feature + formulario RHF/Zod + pagina**

- [ ] **Step 4: Rodar teste focado e confirmar PASS**

Run o comando do Step 2.

- [ ] **Step 5: Commit hardwares page**

```bash
git add app/src/app/(dashboard)/hardwares/page.tsx app/src/features/hardwares
git commit -m "feat(app): implement hardwares page and form"
```

- [ ] **Step 6: Marcar PRD imediatamente (pagina hardwares)**

```md
Before:

- [ ] Criar página hardwares

After:

- [x] Criar página hardwares
```

- [ ] **Step 7: Commit do checkbox da PRD**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 7 hardwares page complete"
```

---

## Chunk 3: Paginas Operacionais (Emprestimo, Devolucao, Relatorios) + Fechamento

### Task 6: Implementar pagina de emprestimo com formulario

**Files:**

- Create: `app/src/app/(dashboard)/emprestimo/page.tsx`
- Create: `app/src/features/emprestimos/components/emprestimo-page.tsx`
- Create: `app/src/features/emprestimos/forms/emprestimo-form.tsx`
- Create: `app/src/features/emprestimos/server/emprestimos-api.ts`
- Create: `app/src/features/emprestimos/forms/emprestimo-form.test.tsx`

- [ ] **Step 1: Escrever teste do formulario de emprestimo (red)**

Cobrir obrigatoriedade de `usuarioId` e `hardwareId` e submit de payload valido.

- [ ] **Step 2: Rodar teste focado e confirmar falha**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/features/emprestimos/forms/emprestimo-form.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implementar pagina + formulario + chamada `POST /emprestimos`**

- [ ] **Step 4: Rodar teste focado e confirmar PASS**

Run o comando do Step 2.

- [ ] **Step 5: Commit emprestimo page**

```bash
git add app/src/app/(dashboard)/emprestimo/page.tsx app/src/features/emprestimos
git commit -m "feat(app): implement emprestimo page and form"
```

- [ ] **Step 6: Marcar PRD imediatamente (pagina emprestimo)**

```md
Before:

- [ ] Criar página empréstimo

After:

- [x] Criar página empréstimo
```

- [ ] **Step 7: Commit do checkbox da PRD**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 7 emprestimo page complete"
```

### Task 7: Implementar pagina de devolucao com formulario

**Files:**

- Create: `app/src/app/(dashboard)/devolucao/page.tsx`
- Create: `app/src/features/emprestimos/components/devolucao-page.tsx`
- Create: `app/src/features/emprestimos/forms/devolucao-form.tsx`
- Create: `app/src/features/emprestimos/forms/devolucao-form.test.tsx`
- Modify: `app/src/features/emprestimos/server/emprestimos-api.ts`

- [ ] **Step 1: Escrever teste do formulario de devolucao (red)**

Cobrir obrigatoriedade de `emprestimoId` e submit de payload valido para acao de devolucao.

- [ ] **Step 2: Rodar teste focado e confirmar falha**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/features/emprestimos/forms/devolucao-form.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implementar pagina + formulario + chamada `POST /emprestimos/:id/devolucao`**

- [ ] **Step 4: Rodar teste focado e confirmar PASS**

Run o comando do Step 2.

- [ ] **Step 5: Commit devolucao page**

```bash
git add app/src/app/(dashboard)/devolucao/page.tsx app/src/features/emprestimos
git commit -m "feat(app): implement devolucao page and form"
```

- [ ] **Step 6: Marcar PRD imediatamente (pagina devolucao)**

```md
Before:

- [ ] Criar página devolução

After:

- [x] Criar página devolução
```

- [ ] **Step 7: Commit do checkbox da PRD**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 7 devolucao page complete"
```

### Task 8: Implementar pagina de relatorios com filtros

**Files:**

- Create: `app/src/app/(dashboard)/relatorios/page.tsx`
- Create: `app/src/features/relatorios/components/relatorios-page.tsx`
- Create: `app/src/features/relatorios/forms/relatorio-filtros-form.tsx`
- Create: `app/src/features/relatorios/server/relatorios-api.ts`
- Create: `app/src/features/relatorios/forms/relatorio-filtros-form.test.tsx`

- [ ] **Step 1: Escrever teste do formulario de filtros de relatorio (red)**

Cobrir montagem de filtros (status, periodo, usuario/hardware) e serializacao de query string.

- [ ] **Step 2: Rodar teste focado e confirmar falha**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/features/relatorios/forms/relatorio-filtros-form.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implementar pagina + filtros + integracao dos endpoints de relatorio**

- [ ] **Step 4: Rodar teste focado e confirmar PASS**

Run o comando do Step 2.

- [ ] **Step 5: Commit relatorios page**

```bash
git add app/src/app/(dashboard)/relatorios/page.tsx app/src/features/relatorios
git commit -m "feat(app): implement relatorios page and filters"
```

- [ ] **Step 6: Marcar PRD imediatamente (pagina relatorios)**

```md
Before:

- [ ] Criar página relatórios

After:

- [x] Criar página relatórios
```

- [ ] **Step 7: Commit do checkbox da PRD**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 7 relatorios page complete"
```

### Task 9: Fechamento da Etapa 7

**Files:**

- Create: `app/src/lib/api/client.ts`
- Create: `app/src/lib/api/errors.ts`
- Create: `app/src/lib/api/env.ts`
- Modify: `app/package.json`
- Modify: `docs/PRD-GuardaHard.md` (apenas se algum item da Etapa 7 ainda estiver `[ ]`)

- [ ] **Step 1: Consolidar camada HTTP comum do frontend**

Implementar `apiClient` com parse de erro consistente e suporte a token/cookies conforme padrao do projeto.

- [ ] **Step 2: Rodar testes de frontend da Etapa 7**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/components/layout/sidebar-menu.test.tsx src/features/dashboard/server/get-dashboard-data.test.ts src/features/departamentos/forms/departamento-form.test.tsx src/features/usuarios/forms/usuario-form.test.tsx src/features/hardwares/forms/hardware-form.test.tsx src/features/emprestimos/forms/emprestimo-form.test.tsx src/features/emprestimos/forms/devolucao-form.test.tsx src/features/relatorios/forms/relatorio-filtros-form.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Rodar validacao global do app**

Run:

```bash
pnpm --filter @guarda-hard/app lint && pnpm --filter @guarda-hard/app test && pnpm --filter @guarda-hard/app build
```

Expected: todos PASS.

- [ ] **Step 4: Validar checkboxes da Etapa 7 no PRD**

Itens obrigatorios com `[x]`:

- Criar layout base
- Criar menu
- Criar dashboard
- Criar página departamentos
- Criar página usuários
- Criar página hardwares
- Criar página empréstimo
- Criar página devolução
- Criar página relatórios

- [ ] **Step 5: Commit final de sincronizacao da PRD (se necessario)**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): sync etapa 7 frontend checklist"
```

---

## Risks and Mitigations

- **Risco:** pagina grande e acoplada em `app/src/app`.
  - **Mitigacao:** manter regra de pages finas e mover regra para `features/*`.

- **Risco:** divergencia de contratos API x frontend.
  - **Mitigacao:** centralizar parsing em `features/*/server/*-api.ts` e validar com Zod.

- **Risco:** regressao visual em mobile no menu lateral.
  - **Mitigacao:** teste de render com estado colapsado e validacao manual em viewport pequena.

- **Risco:** nao cumprimento da regra global de PRD.
  - **Mitigacao:** cada task inclui passo explicito para marcar checkbox imediatamente e commitar antes de iniciar a proxima.

## Definition of Done

- Todos os itens da Etapa 7 em `docs/PRD-GuardaHard.md` estao marcados com `[x]`.
- Layout base e menu funcionam em desktop e mobile.
- Dashboard e todas as paginas da Etapa 7 estao acessiveis via menu.
- Formularios de departamentos, usuarios, hardwares, emprestimo, devolucao e relatorios usam React Hook Form + Zod.
- `pnpm --filter @guarda-hard/app lint`, `test` e `build` passam.
