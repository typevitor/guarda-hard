# Etapas 8 e 9 (Relatorios e Qualidade) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a Etapa 8 (relatorios) e Etapa 9 (qualidade) da PRD com relatorios funcionais, exportacao CSV, pipeline CI, revisao de seguranca e README do projeto.

**Architecture:** Seguir `docs/architecture.md` com modulo backend `relatorios` em NestJS (`application` + `presentation`), frontend server-first em `app/src/features/relatorios`, e contratos de filtro validados por Zod. Qualidade deve ser tratada como trilha separada (CI + seguranca + docs), mas respeitando a regra global da PRD de concluir e registrar Etapa 8 antes de iniciar Etapa 9.

**Tech Stack:** NestJS 11, Next.js 16, TypeScript strict, TypeORM, SQLite, Zod, Vitest, GitHub Actions, pnpm workspaces

---

## Scope Check

- Etapa 8 e Etapa 9 sao subsistemas diferentes e **tecnicamente** tem partes paralelizaveis.
- **Regra global obrigatoria da PRD (`docs/PRD-GuardaHard.md`):** nao iniciar a proxima etapa sem registrar a conclusao da etapa atual.
- Decisao de execucao: **nao executar Etapa 8 e Etapa 9 em paralelo**. Executar Etapa 8 inteira, marcar checkboxes no PRD, depois iniciar Etapa 9.
- Paralelismo permitido:
  - dentro da Etapa 8: backend relatorios e frontend relatorios podem andar em paralelo por task.
  - dentro da Etapa 9: CI e README podem andar em paralelo; revisao de seguranca fecha a etapa.

## Execution Skills (required during implementation)

- `@superpowers/subagent-driven-development` (quando subagents estiverem disponiveis)
- `@superpowers/test-driven-development` (antes de cada task)
- `@superpowers/systematic-debugging` (se houver falha inesperada)
- `@superpowers/verification-before-completion` (antes de declarar Etapa 8/9 concluidas)
- `@superpowers/requesting-code-review` (apos implementacao)

## Preconditions

- Confirmar Etapas 1-7 marcadas como concluidas na PRD.
- Confirmar baseline do monorepo antes de iniciar novas mudancas.

Run:

```bash
pnpm --filter @guarda-hard/api test && pnpm --filter @guarda-hard/app test
```

Expected:

- Baseline verde para detectar regressao introduzida durante Etapas 8/9.

## File Structure (lock before coding)

### Create

- `api/src/modules/relatorios/relatorios.module.ts`
- `api/src/modules/relatorios/application/dto/relatorio.schemas.ts`
- `api/src/modules/relatorios/application/use-cases/listar-situacao-hardwares.use-case.ts`
- `api/src/modules/relatorios/application/use-cases/listar-historico-emprestimos.use-case.ts`
- `api/src/modules/relatorios/application/use-cases/exportar-historico-emprestimos-csv.use-case.ts`
- `api/src/modules/relatorios/application/services/relatorios.service.ts`
- `api/src/modules/relatorios/presentation/http/relatorios.controller.ts`
- `api/test/api/relatorios.api.spec.ts`

- `app/src/features/relatorios/components/relatorios-page.test.tsx`

- `.github/workflows/ci.yml`
- `README.md`
- `docs/security-review-2026-03-13.md`

### Modify

- `api/src/app.module.ts` - registrar `RelatoriosModule`.
- `api/src/modules/hardwares/hardwares.module.ts` - exportar service/repository se necessario para relatorios.
- `api/src/modules/emprestimos/emprestimos.module.ts` - exportar service/repository se necessario para relatorios.

- `app/src/app/(dashboard)/relatorios/page.tsx` - usar endpoints de relatorio dedicados.
- `app/src/features/relatorios/server/relatorios-api.ts` - trocar agregacao local por chamadas backend `/relatorios/*`.
- `app/src/features/relatorios/server/relatorios-api.test.ts` - atualizar testes para novos endpoints.
- `app/src/features/relatorios/forms/relatorio-filtros-form.tsx` - suportar filtros de historico e exportacao.
- `app/src/features/relatorios/forms/relatorio-filtros-form.test.tsx`
- `app/src/features/relatorios/components/relatorios-page.tsx` - render de situacao/historico + botao CSV.
- `app/src/features/relatorios/schemas/relatorio-filtros-schema.ts`

- `docs/PRD-GuardaHard.md` - marcar checklist de Etapa 8 e Etapa 9 imediatamente apos cada item concluido.

### Test Targets

- `api/test/api/relatorios.api.spec.ts`
- `app/src/features/relatorios/server/relatorios-api.test.ts`
- `app/src/features/relatorios/forms/relatorio-filtros-form.test.tsx`
- `app/src/features/relatorios/components/relatorios-page.test.tsx`

---

## Chunk 1: Etapa 8 - Relatorios

### Task 1: Implementar relatorios de situacao de hardwares (disponiveis, emprestados, defeituosos)

**Files:**

- Create: `api/src/modules/relatorios/relatorios.module.ts`
- Create: `api/src/modules/relatorios/application/dto/relatorio.schemas.ts`
- Create: `api/src/modules/relatorios/application/use-cases/listar-situacao-hardwares.use-case.ts`
- Create: `api/src/modules/relatorios/application/services/relatorios.service.ts`
- Create: `api/src/modules/relatorios/presentation/http/relatorios.controller.ts`
- Create: `api/test/api/relatorios.api.spec.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Escrever teste HTTP falhando para situacao por status (red)**

Cobrir no teste:

- `GET /relatorios/hardwares?status=disponivel` retorna apenas hardwares livres e funcionando.
- `GET /relatorios/hardwares?status=emprestado` retorna apenas hardwares funcionando e nao livres.
- `GET /relatorios/hardwares?status=defeituoso` retorna apenas hardwares nao funcionando.
- isolamento tenant em todos os cenarios.

- [ ] **Step 2: Rodar teste focado e confirmar falha**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/api/relatorios.api.spec.ts -t "situacao"
```

Expected: FAIL.

- [ ] **Step 3: Implementar modulo/use-case/controller minimo para passar**

Implementar endpoint `GET /relatorios/hardwares` com filtro `status` validado por Zod.

- [ ] **Step 4: Rodar teste focado e confirmar PASS**

Run o comando do Step 2.

- [ ] **Step 5: Integrar frontend para consumir endpoint de situacao**

Atualizar `app/src/features/relatorios/server/relatorios-api.ts` e componentes para usar `/relatorios/hardwares` ao inves de agregar `/hardwares` + `/emprestimos` no frontend.

- [ ] **Step 6: Rodar testes de relatorios no app e confirmar PASS**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/features/relatorios/server/relatorios-api.test.ts src/features/relatorios/forms/relatorio-filtros-form.test.tsx src/features/relatorios/components/relatorios-page.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit da entrega de situacao de hardwares**

```bash
git add api/src/modules/relatorios api/src/app.module.ts api/test/api/relatorios.api.spec.ts app/src/features/relatorios app/src/app/(dashboard)/relatorios/page.tsx
git commit -m "feat(relatorios): add hardware status reports endpoint and frontend integration"
```

- [ ] **Step 8: Marcar PRD imediatamente (3 itens da Etapa 8)**

Em `docs/PRD-GuardaHard.md`:

```md
Before:

- [ ] Implementar relatório hardwares disponíveis
- [ ] Implementar relatório hardwares emprestados
- [ ] Implementar relatório hardwares defeituosos

After:

- [x] Implementar relatório hardwares disponíveis
- [x] Implementar relatório hardwares emprestados
- [x] Implementar relatório hardwares defeituosos
```

- [ ] **Step 9: Commit do checkbox da PRD (situacao)**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 8 hardware status reports complete"
```

### Task 2: Implementar historico de emprestimos + exportacao CSV

**Files:**

- Create: `api/src/modules/relatorios/application/use-cases/listar-historico-emprestimos.use-case.ts`
- Create: `api/src/modules/relatorios/application/use-cases/exportar-historico-emprestimos-csv.use-case.ts`
- Modify: `api/src/modules/relatorios/application/dto/relatorio.schemas.ts`
- Modify: `api/src/modules/relatorios/application/services/relatorios.service.ts`
- Modify: `api/src/modules/relatorios/presentation/http/relatorios.controller.ts`
- Modify: `api/test/api/relatorios.api.spec.ts`
- Modify: `app/src/features/relatorios/server/relatorios-api.ts`
- Modify: `app/src/features/relatorios/server/relatorios-api.test.ts`
- Modify: `app/src/features/relatorios/components/relatorios-page.tsx`
- Modify: `app/src/features/relatorios/forms/relatorio-filtros-form.tsx`

- [ ] **Step 1: Escrever testes falhando para historico e CSV (red)**

Cobrir:

- `GET /relatorios/emprestimos` com filtros de periodo, usuario e hardware.
- `GET /relatorios/emprestimos/export.csv` retorna `text/csv` com cabecalho e linhas filtradas.
- tenant isolation para historico e CSV.

- [ ] **Step 2: Rodar teste focado e confirmar falha**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/api/relatorios.api.spec.ts -t "historico|csv"
```

Expected: FAIL.

- [ ] **Step 3: Implementar endpoints de historico e exportacao CSV**

Implementar:

- `GET /relatorios/emprestimos`
- `GET /relatorios/emprestimos/export.csv`

Com query parsing por Zod e serializacao CSV em UTF-8.

- [ ] **Step 4: Rodar teste focado e confirmar PASS**

Run o comando do Step 2.

- [ ] **Step 5: Atualizar frontend para exibir historico e acionar download CSV**

Adicionar botao de exportacao que usa os mesmos filtros aplicados e baixa arquivo CSV.

- [ ] **Step 6: Rodar testes de relatorios do app e confirmar PASS**

Run:

```bash
pnpm --filter @guarda-hard/app test -- src/features/relatorios/server/relatorios-api.test.ts src/features/relatorios/forms/relatorio-filtros-form.test.tsx src/features/relatorios/components/relatorios-page.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit historico e CSV**

```bash
git add api/src/modules/relatorios api/test/api/relatorios.api.spec.ts app/src/features/relatorios app/src/app/(dashboard)/relatorios/page.tsx
git commit -m "feat(relatorios): add emprestimo history report and csv export"
```

- [ ] **Step 8: Marcar PRD imediatamente (2 itens finais da Etapa 8)**

Em `docs/PRD-GuardaHard.md`:

```md
Before:

- [ ] Implementar relatório histórico empréstimos
- [ ] Implementar exportação CSV

After:

- [x] Implementar relatório histórico empréstimos
- [x] Implementar exportação CSV
```

- [ ] **Step 9: Commit do checkbox da PRD (historico + CSV)**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 8 historico and csv export complete"
```

### Task 3: Fechar Etapa 8 antes de iniciar Etapa 9 (gate obrigatorio)

**Files:**

- Modify: `docs/PRD-GuardaHard.md` (somente se faltou algum `[x]`)

- [ ] **Step 1: Rodar validacao da Etapa 8 (api + app)**

Run:

```bash
pnpm --filter @guarda-hard/api test -- test/api/relatorios.api.spec.ts && pnpm --filter @guarda-hard/app test -- src/features/relatorios/server/relatorios-api.test.ts src/features/relatorios/forms/relatorio-filtros-form.test.tsx src/features/relatorios/components/relatorios-page.test.tsx && pnpm --filter @guarda-hard/app build
```

Expected: PASS.

- [ ] **Step 2: Verificar checklist completo da Etapa 8 no PRD**

Itens obrigatorios com `[x]`:

- Implementar relatório hardwares disponíveis
- Implementar relatório hardwares emprestados
- Implementar relatório hardwares defeituosos
- Implementar relatório histórico empréstimos
- Implementar exportação CSV

- [ ] **Step 3: Commit de sincronizacao da PRD (se necessario)**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): sync etapa 8 relatorios checklist"
```

---

## Chunk 2: Etapa 9 - Qualidade

### Task 4: Configurar CI e rodar testes no pipeline

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Escrever workflow falhando (red) com comandos do projeto**

Criar workflow com jobs para:

- install (`pnpm install --frozen-lockfile`)
- lint (`pnpm -r lint`)
- test (`pnpm -r test`)
- build (`pnpm build`)

- [ ] **Step 2: Validar workflow localmente (sintaxe + gate minimo)**

Run:

```bash
pnpm dlx actionlint && pnpm -r lint && pnpm -r test
```

Expected: `actionlint` sem erros e qualidade minima local PASS antes de push.

- [ ] **Step 3: Ajustar workflow para passar no GitHub Actions**

Incluir cache pnpm e setup Node 22.

- [ ] **Step 4: Commit CI**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add monorepo pipeline for lint test and build"
```

- [ ] **Step 5: Publicar branch e executar pipeline remoto**

Run:

```bash
git push -u origin "$(git branch --show-current)" && gh workflow run ci.yml && RUN_ID="$(gh run list --workflow ci.yml --branch "$(git branch --show-current)" --event workflow_dispatch --limit 1 --json databaseId --jq '.[0].databaseId')" && gh run watch "$RUN_ID" --exit-status && gh run view "$RUN_ID" --json conclusion --jq '.conclusion'
```

Expected: `gh run watch` conclui sem erro e `gh run view` retorna `success`.

- [ ] **Step 6: Marcar PRD imediatamente (2 itens da Etapa 9)**

Em `docs/PRD-GuardaHard.md`:

```md
Before:

- [ ] Configurar CI
- [ ] Rodar testes no pipeline

After:

- [x] Configurar CI
- [x] Rodar testes no pipeline
```

- [ ] **Step 7: Commit do checkbox da PRD (CI/pipeline)**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 9 ci and pipeline checks complete"
```

### Task 5: Revisao de seguranca

**Files:**

- Create: `docs/security-review-2026-03-13.md`

- [ ] **Step 1: Criar checklist de seguranca com status inicial pendente**

Checklist minimo:

- validacao obrigatoria de payload
- isolamento tenant
- ausencia de log de token
- dependencias sem vulnerabilidades criticas conhecidas

- [ ] **Step 2: Rodar verificacoes de seguranca**

Run:

```bash
pnpm audit --recursive --prod && pnpm --filter @guarda-hard/api test -- test/tenant/tenant-read-isolation.integration.spec.ts test/tenant/tenant-cross-tenant-block.integration.spec.ts
```

Expected: sem vulnerabilidade critica e testes tenant PASS.

- [ ] **Step 3: Registrar evidencias e acoes no documento de review**

Documentar achados, risco residual e plano de mitigacao.

- [ ] **Step 4: Commit revisao de seguranca**

```bash
git add docs/security-review-2026-03-13.md
git commit -m "docs: add etapa 9 security review report"
```

- [ ] **Step 5: Marcar PRD imediatamente (revisao de seguranca)**

Em `docs/PRD-GuardaHard.md`:

```md
Before:

- [ ] Revisão de segurança

After:

- [x] Revisão de segurança
```

- [ ] **Step 6: Commit do checkbox da PRD (seguranca)**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 9 security review complete"
```

### Task 6: Documentacao README

**Files:**

- Create: `README.md`
- Modify: `app/README.md` (opcional, somente se necessario para remover instrucoes genericas)
- Modify: `api/README.md` (opcional, somente se necessario para remover instrucoes genericas)

- [ ] **Step 1: Escrever checklist de conteudo minimo do README (red)**

README deve cobrir:

- visao geral do produto
- requisitos de ambiente
- setup com pnpm workspaces
- comandos de dev/test/build
- CI
- arquitetura e referencia para `docs/architecture.md`

- [ ] **Step 2: Validar comandos documentados localmente**

Run:

```bash
pnpm -r lint && pnpm -r test && pnpm -r build
```

Expected: PASS e comandos validos para documentacao.

- [ ] **Step 3: Implementar README final do repositorio**

Escrever README orientado ao projeto (nao template default de Nest/Next).

- [ ] **Step 4: Commit README**

```bash
git add README.md && git add -u app/README.md api/README.md
git commit -m "docs: add project readme for setup architecture and workflows"
```

- [ ] **Step 5: Marcar PRD imediatamente (documentacao README)**

Em `docs/PRD-GuardaHard.md`:

```md
Before:

- [ ] Documentação README

After:

- [x] Documentação README
```

- [ ] **Step 6: Commit do checkbox da PRD (README)**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): mark etapa 9 readme documentation complete"
```

---

## Chunk 3: Fechamento conjunto Etapas 8 e 9

### Task 7: Verificacao final e gate de entrega

**Files:**

- Modify: `docs/PRD-GuardaHard.md` (somente se algum item de Etapa 8/9 ainda estiver `[ ]`)

- [ ] **Step 1: Rodar validacao final de qualidade**

Run:

```bash
pnpm -r lint && pnpm -r test && pnpm -r build
```

Expected: PASS.

- [ ] **Step 2: Conferir checklists da PRD**

Etapa 8 obrigatoriamente com 5 itens `[x]`.
Etapa 9 obrigatoriamente com 4 itens `[x]`.

- [ ] **Step 3: Commit final de sincronizacao da PRD (se necessario)**

```bash
git add docs/PRD-GuardaHard.md
git commit -m "docs(prd): sync etapa 8 and etapa 9 checklists"
```

- [ ] **Step 4: Preparar solicitacao de code review**

Usar `@superpowers/requesting-code-review` e registrar principais riscos resolvidos.

---

## Parallelization Decision (explicit)

- **Entre Etapa 8 e Etapa 9:** NAO, por regra global da PRD (gate obrigatorio de etapa).
- **Dentro da Etapa 8:** SIM, backend e frontend podem trabalhar em paralelo apos contratos de endpoint estarem definidos.
- **Dentro da Etapa 9:** SIM, CI e README podem seguir em paralelo; revisao de seguranca deve consolidar evidencias perto do fim da etapa.

## Risks and Mitigations

- **Risco:** endpoint de relatorio acoplar regra de dominio no controller.
  - **Mitigacao:** regras de filtro em use-case/service e controller apenas como adaptador HTTP.

- **Risco:** CSV inconsistente com filtros ativos da UI.
  - **Mitigacao:** compartilhar builder de query string no schema de filtros e reaproveitar no botao de exportacao.

- **Risco:** CI verde local mas vermelho no GitHub por ambiente.
  - **Mitigacao:** fixar Node/pnpm no workflow e validar com `gh run list` apos disparo.

- **Risco:** quebra da regra global do PRD ao iniciar Etapa 9 cedo.
  - **Mitigacao:** task gate explicita no fim da Etapa 8 exigindo todos checkboxes `[x]` antes de prosseguir.

## Definition of Done

- Todos os 5 itens da Etapa 8 estao com `[x]` em `docs/PRD-GuardaHard.md`.
- Todos os 4 itens da Etapa 9 estao com `[x]` em `docs/PRD-GuardaHard.md`.
- Endpoints de relatorios e exportacao CSV funcionam e possuem testes.
- Frontend de relatorios usa endpoints dedicados e exporta CSV com filtros.
- Pipeline CI executa lint/test/build com sucesso.
- Revisao de seguranca registrada em documento e README do projeto atualizado.
