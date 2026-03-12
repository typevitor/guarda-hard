# PRD — GuardaHard

Sistema de controle de patrimônio (hardwares) com empréstimo, devolução, defeitos e relatórios.

Este documento descreve o **Product Requirements Document (PRD)** completo para implementação do sistema usando a seguinte stack:

- **Monorepo**
- **Backend:** NestJS + TypeORM
- **Banco:** SQLite
- **Frontend:** Next.js
- **Testes:** Vitest
- **Validação:** Zod
- **Tipagem:** TypeScript strict em todo o projeto
- **Arquitetura multi-tenant:** `empresa_id` injetado pela aplicação (sem RLS)

---

# 1. Objetivo do Produto

Construir um sistema simples e seguro para controle de equipamentos corporativos permitindo:

- Cadastro de hardwares
- Controle de empréstimos
- Registro de devoluções
- Controle de defeitos
- Histórico de utilização
- Relatórios operacionais

O sistema deve garantir isolamento entre empresas usando `empresa_id`.

---

# 2. Stack Tecnológica

## Backend

- NestJS
- TypeORM
- SQLite
- JWT Authentication
- Zod validation
- Vitest

## Frontend

- Next.js
- React
- React Hook Form
- Zod

## Monorepo

Gerenciado com:

- pnpm workspaces

---

# 3. Estrutura do Monorepo

repo
│
├─ api
│ ├─ src
│ │ ├─ modules
│ │ ├─ domain
│ │ ├─ infrastructure
│ │ ├─ tenant
│ │ └─ main.ts
│
├─ app
│ ├─ nextjs
│
├─ packages
│ ├─ schemas
│ ├─ types
│ ├─ domain
│ └─ utils

---

# 4. Requisitos Funcionais

## Cadastro de departamentos

Campos:

- id
- empresa_id
- nome
- created_at

Departamentos padrão:

- Suporte
- Administração
- Comercial
- Desenvolvimento
- Franquia

---

## Cadastro de usuários

Campos:

- id
- empresa_id
- departamento_id
- nome
- email
- ativo

Relacionamento:
departamento 1:N usuarios

---

## Cadastro de hardwares

Campos:

- id
- empresa_id
- descricao
- marca
- modelo
- codigo_patrimonio
- funcionando
- descricao_problema
- livre

Estados possíveis:

| funcionando | livre | estado     |
| ----------- | ----- | ---------- |
| true        | true  | disponível |
| true        | false | emprestado |
| false       | false | defeituoso |

---

## Empréstimos

Campos:

- id
- empresa_id
- usuario_id
- hardware_id
- data_retirada
- data_devolucao

Relacionamentos:
usuario 1:N emprestimos
hardware 1:N emprestimos

---

# 5. Regras de Negócio

## Empréstimo

Condições:
hardware.livre == true
hardware.funcionando == true

Ao emprestar:

- criar registro em `emprestimos`
- atualizar hardware:
  livre = false

---

## Devolução

Ao devolver:
data_devolucao = now
hardware.livre = true

---

## Marcar defeito

Ao marcar defeito:
hardware.funcionando = false
hardware.livre = false
descricao_problema preenchida

---

# 6. Multi-Tenant

Todos os registros possuem:
empresa_id

O sistema deve garantir que:
empresa A não acessa dados da empresa B

A separação será implementada no **ORM**.

---

# 7. Injeção de empresa_id

A aplicação deve possuir:

### TenantContext

Obtém `empresa_id` do JWT.

### TenantSubscriber

Responsável por:

- inserir `empresa_id` automaticamente
- bloquear updates cross-tenant

### TenantRepository

Aplica automaticamente filtro:
where empresa_id = currentTenant

---

# 8. Requisitos Não Funcionais

## Tipagem

Todo projeto deve usar:
TypeScript strict

---

## UUID

Todos IDs devem ser:
@PrimaryGeneratedColumn('uuid')

---

## Timezone

Datas devem ser armazenadas em:
UTC

---

## Segurança

Regras obrigatórias:

- frontend não gera SQL
- tokens não podem aparecer em logs
- validação de payload obrigatória
- autenticação JWT

---

# 9. Testes

Testes são obrigatórios.

Framework:
Vitest

---

## Testes de domínio

Devem existir testes para:

### Empréstimo

- emprestar hardware disponível
- impedir empréstimo se ocupado
- impedir empréstimo se quebrado

---

### Devolução

- devolver corretamente
- impedir devolução duplicada

---

### Defeito

- marcar defeito
- impedir empréstimo se quebrado

---

### Conserto

- voltar para estado disponível

---

## Testes Multi-Tenant

- empresa A não vê registros da empresa B
- update cross tenant falha

---

## Testes de concorrência

Simular dois empréstimos simultâneos.

Usar:
optimistic locking

---

# 10. Relatórios

Sistema deve permitir:

### Situação atual dos hardwares

Filtros:

- disponível
- emprestado
- defeituoso

---

### Histórico por hardware

Filtros:

- hardware
- data início
- data fim

---

### Histórico por usuário

Filtros:

- usuário
- data início
- data fim

---

### Histórico geral

Filtros:

- hardware
- usuário
- período

---

# 11. UI

Páginas mínimas:

- Login
- Dashboard
- Departamentos
- Usuários
- Hardwares
- Empréstimo
- Devolução
- Consultas
- Relatórios

---

# 12. Critérios de Aceite

O projeto será considerado pronto quando:

- Backend funcional
- Frontend funcional
- Testes passando
- Isolamento multi-tenant funcionando
- Regras de negócio implementadas
- Relatórios funcionando

---

# 13. Roadmap

## Sprint 0

Preparação do ambiente.

## Sprint 1

Banco e domínio.

## Sprint 2

Endpoints e regras.

## Sprint 3

Frontend.

## Sprint 4

Relatórios e QA.

---

# 14. Etapas de Implementação

## Regra de execução do agente

- Esta e uma regra global valida para todas as PRDs deste repositorio.
- O agente deve marcar cada etapa como concluida no PRD imediatamente apos finalizar a etapa.
- O agente nao deve iniciar a proxima etapa sem antes registrar a conclusao da etapa atual no PRD.

---

# Etapa 1 — Preparação do Ambiente

- [x] Criar repositório git
- [x] Inicializar monorepo pnpm
- [x] Criar estrutura `api`, `app`, `packages`
- [x] Configurar TypeScript
- [x] Configurar ESLint
- [x] Configurar Prettier
- [x] Configurar Vitest
- [x] Criar projeto NestJS
- [x] Criar projeto Next.js
- [x] Criar pacote `packages/schemas`
- [x] Criar pacote `packages/types`

Tarefas paralelas:

- configuração frontend
- configuração backend
- configuração packages

---

# Etapa 2 — Banco de Dados

- [x] Configurar SQLite
- [x] Configurar TypeORM
- [x] Criar migrations
- [x] Criar tabela departamentos
- [x] Criar tabela usuarios
- [x] Criar tabela hardwares
- [x] Criar tabela emprestimos
- [x] Criar seeds iniciais

Tarefas paralelas:

- criação de entidades
- criação de migrations

---

# Etapa 3 — Infraestrutura Multi-Tenant

- [ ] Criar TenantContext
- [ ] Implementar TenantSubscriber
- [ ] Implementar TenantRepository
- [ ] Testar inserção automática de empresa_id
- [ ] Testar bloqueio cross tenant

---

# Etapa 4 — Domínio

- [ ] Criar entidade Hardware
- [ ] Criar entidade Usuario
- [ ] Criar entidade Departamento
- [ ] Criar entidade Emprestimo

---

## Regras de domínio

- [ ] Implementar método emprestar
- [ ] Implementar método devolver
- [ ] Implementar método marcar defeito
- [ ] Implementar método consertar

---

# Etapa 5 — Testes de Domínio

- [ ] Testar empréstimo válido
- [ ] Testar empréstimo inválido
- [ ] Testar devolução
- [ ] Testar defeito
- [ ] Testar conserto
- [ ] Testar concorrência
- [ ] Testar isolamento multi tenant

---

# Etapa 6 — API

- [ ] Criar controllers
- [ ] Criar services
- [ ] Implementar CRUD departamentos
- [ ] Implementar CRUD usuários
- [ ] Implementar CRUD hardwares
- [ ] Implementar endpoint empréstimo
- [ ] Implementar endpoint devolução
- [ ] Implementar endpoint defeito
- [ ] Implementar endpoint conserto

Tarefas paralelas:

- controllers
- services
- testes

---

# Etapa 7 — Frontend

- [ ] Criar layout base
- [ ] Criar menu
- [ ] Criar dashboard
- [ ] Criar página departamentos
- [ ] Criar página usuários
- [ ] Criar página hardwares
- [ ] Criar página empréstimo
- [ ] Criar página devolução
- [ ] Criar página relatórios

Tarefas paralelas:

- páginas
- componentes
- formulários

---

# Etapa 8 — Relatórios

- [ ] Implementar relatório hardwares disponíveis
- [ ] Implementar relatório hardwares emprestados
- [ ] Implementar relatório hardwares defeituosos
- [ ] Implementar relatório histórico empréstimos
- [ ] Implementar exportação CSV

---

# Etapa 9 — Qualidade

- [ ] Configurar CI
- [ ] Rodar testes no pipeline
- [ ] Revisão de segurança
- [ ] Documentação README

---

# Etapa 10 — Entrega

- [ ] Todos testes passando
- [ ] Todas tarefas marcadas
- [ ] Build funcionando
- [ ] Deploy funcional
