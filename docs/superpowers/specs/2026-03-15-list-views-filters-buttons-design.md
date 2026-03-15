# List Views, Filters, and Buttons Redesign (Frontend)

## Context

This design improves the dashboard listing experiences for:

- `hardwares`
- `usuarios`
- `emprestimos`
- `devolucao`

`devolucao` remains part of the existing `emprestimos` feature boundary (no new top-level feature/module). Frontend implementation stays under `app/src/features/emprestimos/*` and existing route composition.

The goal is a cleaner enterprise visual language with better scanability, stronger action hierarchy, and faster filtering workflows, while preserving current backend contracts and feature boundaries.

## Objectives

- Improve list-page visual hierarchy and readability.
- Expand filtering UX with fast preset chips plus search.
- Standardize buttons and action labels in Portuguese.
- Include modal submit actions (`Salvar`) in the redesign.
- Keep behavior and data flow compatible with current route/query patterns.

## Non-Goals

- No backend API schema changes.
- No domain logic changes.
- No route structure changes.
- No cross-feature business refactor.

## Architectural Fit

The redesign follows current frontend boundaries in `docs/architecture.md`:

- Shared visual primitives remain in `app/src/components/ui`.
- Feature-specific behavior remains in `app/src/features/*/components`.
- Route composition remains in `app/src/app/(dashboard)/*/page.tsx`.
- Global visual tokens and shared classes evolve in `app/src/app/globals.css`.

## Design Direction

Chosen direction: **clean enterprise**.

Visual principles:

- Clear hierarchy: title/subtitle/action/filter/table/pagination.
- Controlled density: compact but readable rows and controls.
- Subtle emphasis: stronger active/focus/hover states without noisy effects.
- Consistent language: Portuguese action copy across list and modal flows.

## Proposed Approach

Recommended approach: **shared primitives first**.

1. Upgrade shared UI components and classes used by all list pages.
2. Apply minimal page-level updates for text/actions and preset definitions.
3. Validate behavior with existing listing tests plus lint/typecheck.

This minimizes duplication and visual drift while keeping implementation size contained.

## Component-Level Design

### 1) List Page Header and Table Hierarchy

- Keep current section structure but tighten spacing and alignment.
- Standardize header treatment across the four listing screens.
- Improve table shell contrast and row interaction states for scanability.
- Improve empty-state and pagination legibility.

Expected result: pages feel consistent and easier to parse at a glance.

### 2) FilterBar with Preset Chips

Evolve `FilterBar` to include:

- Search input (existing behavior preserved)
- Clear action (secondary)
- New preset chips row with active state

Behavior:

- Selecting a preset updates query state and resets `page` to `1`.
- Search changes continue to update query state and reset `page` to `1`.
- URL remains the source of truth via existing router push patterns.

Preset baseline by page:

- `hardwares`: `Todos`, `Disponiveis`, `Em uso`, `Com defeito`
- `usuarios`: `Todos`, `Com departamento`, `Sem departamento`
- `emprestimos`: `Todos`, `Abertos`, `Vencendo hoje`, `Atrasados`
- `devolucao`: `Todos`, `Devolvidos hoje`, `Esta semana`, `Este mes`

Deterministic query mapping for implementation and QA:

| Page          | Preset             | Query mutation                                                             | Resets page?   | Unsupported behavior                                                                         |
| ------------- | ------------------ | -------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| `hardwares`   | `Todos`            | `livre=unset`, `funcionando=unset`                                         | Yes (`page=1`) | n/a                                                                                          |
| `hardwares`   | `Disponiveis`      | `livre=true`, `funcionando=unset`                                          | Yes (`page=1`) | n/a                                                                                          |
| `hardwares`   | `Em uso`           | `livre=false`, `funcionando=unset`                                         | Yes (`page=1`) | n/a                                                                                          |
| `hardwares`   | `Com defeito`      | `funcionando=false`, `livre=unset`                                         | Yes (`page=1`) | n/a                                                                                          |
| `usuarios`    | `Todos`            | `departamentoId=unset`, `ativo=unset`                                      | Yes (`page=1`) | n/a                                                                                          |
| `usuarios`    | `Com departamento` | `departamentoId=__withDepartamento` (UI sentinel only), `ativo=unset`      | Yes (`page=1`) | If backend cannot filter by sentinel, apply client-side post-filter for current page results |
| `usuarios`    | `Sem departamento` | `departamentoId=__withoutDepartamento` (UI sentinel only), `ativo=unset`   | Yes (`page=1`) | If backend cannot filter by sentinel, apply client-side post-filter for current page results |
| `emprestimos` | `Todos`            | `status=open`, `retiradaFrom=unset`, `retiradaTo=unset`                    | Yes (`page=1`) | n/a                                                                                          |
| `emprestimos` | `Abertos`          | `status=open`, date range unset                                            | Yes (`page=1`) | n/a                                                                                          |
| `emprestimos` | `Vencendo hoje`    | `status=open`, date range unset + client-side due-date filter for today    | Yes (`page=1`) | If due-date field unavailable in payload, disable chip                                       |
| `emprestimos` | `Atrasados`        | `status=open`, date range unset + client-side due-date filter for past due | Yes (`page=1`) | If due-date field unavailable in payload, disable chip                                       |
| `devolucao`   | `Todos`            | `status=returned`, date range unset                                        | Yes (`page=1`) | n/a                                                                                          |
| `devolucao`   | `Devolvidos hoje`  | `status=returned` + client-side returned-date filter today                 | Yes (`page=1`) | If returned-date unavailable, disable chip                                                   |
| `devolucao`   | `Esta semana`      | `status=returned` + client-side returned-date filter current week          | Yes (`page=1`) | If returned-date unavailable, disable chip                                                   |
| `devolucao`   | `Este mes`         | `status=returned` + client-side returned-date filter current month         | Yes (`page=1`) | If returned-date unavailable, disable chip                                                   |

Notes:

- `unset` means removing that key from URL query params.
- Sentinel values (`__withDepartamento`, `__withoutDepartamento`) are UI-only identifiers and must not be forwarded as backend query params.
- Date-based chips do not introduce new API params in this phase; they operate over currently fetched rows.
- `Todos` and `Abertos` in `emprestimos` are intentionally equivalent in query mutation for now; labels remain separate for user clarity and future divergence.

### 3) Button System and Copy

Standardize button hierarchy and Portuguese labels:

- Primary CTA labels per page:
  - `Novo hardware`
  - `Novo usuario`
  - `Novo emprestimo`
  - `Nova devolucao`
- Utility actions remain secondary or ghost.
- Pagination text becomes concise (`Anterior`, `Proxima`).

Interaction polish:

- Consistent hover, pressed, disabled, and focus-visible states.
- No disruptive animation; only subtle motion for clarity.

### 4) Modal Footer Actions (`Salvar`)

Include modal action redesign as first-class scope:

- Standard action pair: `Cancelar` (secondary) + `Salvar` (primary).
- `Salvar` adopts unified primary style and spacing.
- Submit loading state: `Salvando...` and temporary disabled button.
- Keep validation/error banners in place with cleaner vertical rhythm.

Applied to hardware, usuario, emprestimo, and devolucao forms.

Devolucao modal updates remain implemented in `app/src/features/emprestimos` to preserve feature ownership.

## Data Flow and State Impact

- No API contract changes.
- Existing page-level query state (`activeQuery`) remains the interaction source.
- Filter presets map to explicit query mutations defined in this document.
- Pagination logic remains unchanged except label and visual behavior.

## Accessibility

- Preserve label/input association and semantic button usage.
- Ensure visible focus rings for keyboard navigation.
- Keep color contrast for primary, secondary, and disabled states.
- Avoid motion that impairs readability; keep transitions short.

## Testing Strategy

Verification scope:

- Existing listing tests for hardwares/usuarios/emprestimos/devolucao.
- Filter interactions: search, clear, preset activation, page reset behavior.
- Modal form submit states (`Salvar` -> `Salvando...` -> settled state).
- `pnpm` lint and typecheck for frontend workspace.

Acceptance matrix:

| Area                | Required assertion                                                                               | Suggested test level                   |
| ------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Filter presets      | Clicking a preset updates URL/query state and forces `page=1`                                    | Feature component listing tests        |
| Filter param safety | UI sentinel values are never forwarded to backend query params                                   | Feature component listing tests        |
| Search + clear      | Search updates URL/query; clear resets search and preset state deterministically                 | Feature component listing tests        |
| Modal save action   | Primary button transitions `Salvar -> Salvando... -> enabled` on completion/error                | Form/component tests                   |
| Accessibility       | Keyboard focus visible on chips/buttons, label-input association preserved, no broken ARIA names | Component tests + manual keyboard pass |
| Pagination          | `Anterior`/`Proxima` labels render and disabled states are correct at boundaries                 | Feature component listing tests        |

Test location guidance:

- Keep behavior tests close to existing files under `app/src/features/*/components/*.listing.test.tsx`.
- Add/extend form interaction tests near corresponding form components when submit-state coverage is missing.

## Risks and Mitigations

- Risk: visual regression across other pages using shared classes.
  - Mitigation: keep class changes scoped and run listing tests.
- Risk: preset semantics mismatched with current query capabilities.
  - Mitigation: define fallback presets and avoid breaking query contracts.
- Risk: inconsistent modal behavior across forms.
  - Mitigation: unify submit action patterns and test each modal flow.

## Implementation Readiness

Design is ready to be translated into an execution plan with these boundaries:

- Shared UI-first changes
- Feature-level preset wiring
- No backend changes
- Verify with frontend tests and static checks

Definition of Done:

- [ ] Shared UI updates applied to filters, buttons, pagination, and modal actions.
- [ ] Portuguese action labels standardized in all target list pages and modals.
- [ ] Preset chip behavior matches mapping table in this spec.
- [ ] No API/schema/backend diff introduced.
- [ ] `pnpm --filter @guarda-hard/app lint` passes.
- [ ] `pnpm --filter @guarda-hard/app test` passes.
- [ ] `pnpm --filter @guarda-hard/app build` passes.
