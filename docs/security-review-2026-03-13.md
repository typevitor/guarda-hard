# Etapa 9 Security Review - 2026-03-13

## Scope

- Revisar validacao de payload nas rotas novas de relatorios.
- Validar isolamento tenant em leituras de relatorios e historico.
- Verificar exposicao de token em logs/codigo.
- Executar auditoria de dependencias de producao.

## Checklist

- [x] Validacao obrigatoria de payload
- [x] Isolamento tenant em relatorios
- [x] Ausencia de log de token
- [x] Dependencias sem vulnerabilidade critica conhecida

## Evidencias

### 1) Validacao de payload obrigatoria

- `api/src/modules/relatorios/presentation/http/relatorios.controller.ts` usa `ZodValidationPipe` em `@Query` para:
  - `GET /relatorios/hardwares`
  - `GET /relatorios/emprestimos`
  - `GET /relatorios/emprestimos/export.csv`
- Schemas aplicados em `api/src/modules/relatorios/application/dto/relatorio.schemas.ts`:
  - enum de status
  - validacao de datas
  - validacao de intervalo (`periodoInicio <= periodoFim`)

### 2) Isolamento tenant

- Testes executados:
  - `pnpm --filter @guarda-hard/api test -- test/tenant/tenant-read-isolation.integration.spec.ts test/tenant/tenant-cross-tenant-block.integration.spec.ts`
- Resultado: PASS.
- Teste de API de relatorios tambem valida separacao por tenant:
  - `api/test/api/relatorios.api.spec.ts`

### 3) Tokens em logs

- Busca em `api/src` nao encontrou `console.log` nem logger imprimindo `Authorization`, `Bearer` ou token JWT.
- Resultado: sem evidencia de exposicao direta de token em logs no escopo revisado.

### 4) Auditoria de dependencias

- Comando executado: `pnpm audit --prod` (root e workspaces).
- Resultado: **1 vulnerabilidade moderada** transiente:
  - `file-type` via `@nestjs/common`
  - advisory: `GHSA-5v7r-6r5c-r473`
  - severidade: moderada (nenhuma critica)

## Risco residual

- Risco residual **baixo/moderado** relacionado a dependencia transitiva `file-type`.
- Nao bloqueia Etapa 9 por nao haver severidade critica e por nao existir evidencia de exploracao no fluxo atual.

## Mitigacao recomendada

1. Monitorar atualizacao de `@nestjs/common` que incorpore `file-type >= 21.3.1`.
2. Executar `pnpm audit --prod` em cada release.
3. Reavaliar risco se houver upload/parsing de arquivos ASF no produto.
