# List Views, Filters, and Buttons Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a clean enterprise redesign for list views, filters, and buttons across hardwares, usuarios, emprestimos, and devolucao (inside emprestimos), including modal `Salvar` action behavior.

**Architecture:** Implement shared visual and interaction primitives first in `app/src/components/ui` and `app/src/app/globals.css`, then wire feature-specific preset behavior in each page component under `app/src/features/*/components`. Preserve existing server/API contracts and keep devolucao ownership in `app/src/features/emprestimos`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest + Testing Library, CSS in `globals.css`, pnpm workspaces.

---

## Chunk 1: Shared UI primitives and style system

### Task 1: Extend `FilterBar` with preset chips and keep backward compatibility

**Files:**

- Modify: `app/src/components/ui/filter-bar.tsx`
- Modify: `app/src/components/ui/filter-bar.test.tsx`

- [x] **Step 1: Write failing tests for preset rendering and active selection (RED)**

```tsx
it('renders optional preset chips and calls onPresetChange', () => {
  // render with presets [{id:'all', label:'Todos'}, ...]
  // click chip "Disponiveis"
  // expect onPresetChange('available')
  // expect active chip has aria-pressed=true
});

it('does not trigger callback for disabled preset chips', () => {
  // render with one disabled preset
  // click disabled chip
  // expect onPresetChange not called
});

it('supports keyboard activation for enabled chips', () => {
  // focus chip
  // press Enter (and Space)
  // expect onPresetChange called with chip id
});

it('keeps legacy mode working without presets', () => {
  // render without presets props
  // ensure search + clear still work
  // expect quick-filter group is not rendered
});
```

- [x] **Step 2: Run focused test command to confirm failure**

Run: `pnpm --filter @guarda-hard/app exec vitest run app/src/components/ui/filter-bar.test.tsx`
Expected: FAIL with missing preset behavior/assertions.

- [x] **Step 3: Implement minimal `FilterBar` API extension**

```tsx
type FilterPreset = { id: string; label: string; disabled?: boolean };

type FilterBarProps = {
  // existing props
  presets?: FilterPreset[];
  activePresetId?: string;
  onPresetChange?: (presetId: string) => void;
};
```

- [x] **Step 4: Add chip row markup, active classes, and button semantics**

```tsx
{
  presets?.length ? (
    <div className="filter-presets" role="group" aria-label="Filtros rapidos">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={preset.id === activePresetId ? 'filter-chip is-active' : 'filter-chip'}
          aria-pressed={preset.id === activePresetId}
          onClick={() => onPresetChange?.(preset.id)}
          disabled={preset.disabled}
        >
          {preset.label}
        </button>
      ))}
    </div>
  ) : null;
}
```

- [x] **Step 5: Run focused tests to verify pass (GREEN)**

Run: `pnpm --filter @guarda-hard/app exec vitest run app/src/components/ui/filter-bar.test.tsx`
Expected: PASS with both legacy and preset tests.

- [x] **Step 6: Commit shared FilterBar behavior**

```bash
git add app/src/components/ui/filter-bar.tsx app/src/components/ui/filter-bar.test.tsx
git commit -m "feat(app): add preset chips support to filter bar"
```

### Task 2: Redesign shared button, list, filter, pagination, and modal action styles

**Files:**

- Modify: `app/src/app/globals.css`
- Modify: `app/src/components/ui/pagination-controls.tsx`
- Modify: `app/src/components/ui/pagination-controls.test.tsx`
- Modify: `app/src/features/departamentos/components/departamentos-page.test.tsx`
- Modify: `app/src/features/hardwares/components/hardwares-page.listing.test.tsx`
- Modify: `app/src/features/usuarios/components/usuarios-page.listing.test.tsx`
- Modify: `app/src/features/emprestimos/components/emprestimo-page.listing.test.tsx`

- [x] **Step 1: Add failing assertions in pagination primitive and listing tests (RED)**

```tsx
it('uses concise pagination labels', () => {
  // render PaginationControls
  // expect getByRole('button', { name: 'Anterior' })
  // expect getByRole('button', { name: 'Proxima' })
  // expect queryByRole('button', { name: 'Pagina anterior' }) to be null
  // expect queryByRole('button', { name: 'Proxima pagina' }) to be null
  // expect first-page state disables "Anterior"
  // expect last-page state disables "Proxima"
});

it('keeps shared action class hooks present on listing pages', () => {
  // in listing tests, assert primary action has class "btn-primary"
  // in listing tests, assert filter container uses "filter-bar"
});
```

- [x] **Step 2: Run focused primitive + listing tests to verify failure**

Run: `pnpm --filter @guarda-hard/app exec vitest run app/src/components/ui/pagination-controls.test.tsx app/src/features/hardwares/components/hardwares-page.listing.test.tsx app/src/features/usuarios/components/usuarios-page.listing.test.tsx app/src/features/emprestimos/components/emprestimo-page.listing.test.tsx app/src/features/departamentos/components/departamentos-page.test.tsx`
Expected: FAIL on old label assertions (`Pagina anterior`, `Proxima pagina`).

- [x] **Step 3: Implement pagination label and aria-name updates in shared primitive**

```tsx
<button type="button">Anterior</button>
<button type="button">Proxima</button>
```

- [x] **Step 4: Implement shared style updates in `globals.css`**

```css
.list-page {
  display: grid;
  gap: 1.25rem;
}
.filter-bar {
  display: grid;
  grid-template-columns: auto minmax(220px, 1fr) auto;
  gap: 0.6rem;
  padding: 0.8rem;
  border: 1px solid var(--border);
  border-radius: 0.8rem;
  background: linear-gradient(180deg, var(--surface), var(--surface-muted));
}
.filter-presets {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
.filter-chip {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  background: var(--surface);
  color: var(--foreground);
  font-weight: 600;
  font-size: 0.85rem;
}
.filter-chip.is-active {
  border-color: var(--primary-strong);
  background: color-mix(in srgb, var(--primary) 16%, white);
  color: var(--primary-strong);
}
.btn-primary {
  border: 1px solid var(--primary-strong);
  background: var(--primary);
  color: #fff;
  border-radius: 0.65rem;
  min-height: 2.25rem;
  padding: 0.55rem 0.95rem;
  font-weight: 700;
}
.btn-ghost,
.btn-secondary {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--foreground);
  border-radius: 0.65rem;
  min-height: 2.25rem;
  padding: 0.5rem 0.85rem;
}
.pagination-controls button {
  min-height: 2.2rem;
  padding: 0.45rem 0.8rem;
  border-radius: 0.6rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;
  margin-top: 0.9rem;
  padding-top: 0.65rem;
  border-top: 1px solid var(--border);
}

@media (max-width: 720px) {
  .filter-bar {
    grid-template-columns: 1fr;
  }
}
```

- [x] **Step 5: Add focus-visible and disabled-state refinements for accessibility**

```css
button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--primary) 55%, white);
  outline-offset: 2px;
}
button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
```

- [x] **Step 6: Run impacted primitive and listing tests (GREEN)**

Run: `pnpm --filter @guarda-hard/app exec vitest run app/src/components/ui/pagination-controls.test.tsx app/src/features/hardwares/components/hardwares-page.listing.test.tsx app/src/features/usuarios/components/usuarios-page.listing.test.tsx app/src/features/emprestimos/components/emprestimo-page.listing.test.tsx app/src/features/departamentos/components/departamentos-page.test.tsx`
Expected: PASS with updated labels/classes.

- [x] **Step 6.1: Update impacted listing test assertions explicitly**

```text
- app/src/features/hardwares/components/hardwares-page.listing.test.tsx: "Proxima pagina" -> "Proxima"
- app/src/features/usuarios/components/usuarios-page.listing.test.tsx: "Proxima pagina" -> "Proxima"
- app/src/features/emprestimos/components/emprestimo-page.listing.test.tsx: "Proxima pagina" -> "Proxima"
- app/src/features/departamentos/components/departamentos-page.test.tsx: "Proxima pagina" -> "Proxima"
```

- [x] **Step 7: Commit style system updates**

```bash
git add app/src/app/globals.css app/src/components/ui/pagination-controls.tsx app/src/components/ui/pagination-controls.test.tsx app/src/features/departamentos/components/departamentos-page.test.tsx app/src/features/hardwares/components/hardwares-page.listing.test.tsx app/src/features/usuarios/components/usuarios-page.listing.test.tsx app/src/features/emprestimos/components/emprestimo-page.listing.test.tsx
git commit -m "feat(app): refresh enterprise styles for lists filters and buttons"
```

---

## Chunk 2: Feature-level preset wiring and Portuguese actions

### Task 3: Wire hardwares presets and Portuguese primary actions

**Files:**

- Modify: `app/src/features/hardwares/components/hardwares-page.tsx`
- Modify: `app/src/features/hardwares/components/hardwares-page.listing.test.tsx`

- [x] **Step 1: Write failing tests for new action label and preset URL mapping (RED)**

```tsx
it("opens modal with 'Novo hardware'", () => {
  // click button by Portuguese label
});

it('maps hardwares preset chips to expected query', () => {
  // Disponiveis => livre=true
  // Em uso => livre=false
  // Com defeito => funcionando=false
  // all reset page to 1
});
```

- [x] **Step 2: Run focused hardwares listing test command**

Run: `pnpm --filter @guarda-hard/app test app/src/features/hardwares/components/hardwares-page.listing.test.tsx`
Expected: FAIL on missing Portuguese label/preset behavior.

- [x] **Step 3: Implement hardwares preset model and query mutation helpers**

```ts
type HardwarePresetId = 'all' | 'available' | 'inUse' | 'broken';
// keep pushQuery as URL source of truth
```

- [x] **Step 4: Pass `presets`, `activePresetId`, and `onPresetChange` to `FilterBar`**

```tsx
<FilterBar
  presets={[...]}
  activePresetId={activePreset}
  onPresetChange={(id) => { /* set livre/funcionando + page=1 */ }}
/>
```

- [x] **Step 5: Replace `New` label with `Novo hardware` and keep modal title stable**

```tsx
<button className="btn-primary">Novo hardware</button>
```

- [x] **Step 6: Run hardwares listing tests to green**

Run: `pnpm --filter @guarda-hard/app test app/src/features/hardwares/components/hardwares-page.listing.test.tsx`
Expected: PASS.

- [x] **Step 7: Commit hardwares page changes**

```bash
git add app/src/features/hardwares/components/hardwares-page.tsx app/src/features/hardwares/components/hardwares-page.listing.test.tsx
git commit -m "feat(app): add hardwares filter presets and pt-BR actions"
```

### Task 4: Wire usuarios presets with sentinel safety and Portuguese actions

**Files:**

- Modify: `app/src/features/usuarios/components/usuarios-page.tsx`
- Modify: `app/src/features/usuarios/components/usuarios-page.listing.test.tsx`

- [x] **Step 1: Write failing tests for usuarios presets and sentinel safety (RED)**

```tsx
it("uses 'Novo usuario' and applies department presets", () => {
  // Com departamento / Sem departamento chips
});

it('never forwards sentinel values to backend query params', () => {
  // assert push URL excludes __withDepartamento and __withoutDepartamento
});
```

- [x] **Step 2: Run usuarios listing tests to confirm failure**

Run: `pnpm --filter @guarda-hard/app test app/src/features/usuarios/components/usuarios-page.listing.test.tsx`
Expected: FAIL.

- [x] **Step 3: Implement usuarios preset state and safe query mutation**

```ts
type UsuarioPresetId = 'all' | 'withDepartment' | 'withoutDepartment';
// sentinel stays in local UI state only
```

- [x] **Step 4: Update primary button copy and filter wiring**

```tsx
<button className="btn-primary">Novo usuario</button>
```

- [x] **Step 5: Run usuarios listing tests to green**

Run: `pnpm --filter @guarda-hard/app test app/src/features/usuarios/components/usuarios-page.listing.test.tsx`
Expected: PASS.

- [x] **Step 6: Commit usuarios page changes**

```bash
git add app/src/features/usuarios/components/usuarios-page.tsx app/src/features/usuarios/components/usuarios-page.listing.test.tsx
git commit -m "feat(app): add usuarios presets with safe query mapping"
```

### Task 5: Wire emprestimos/devolucao presets and Portuguese actions

**Files:**

- Modify: `app/src/features/emprestimos/components/emprestimo-page.tsx`
- Modify: `app/src/features/emprestimos/components/devolucao-page.tsx`
- Modify: `app/src/features/emprestimos/components/emprestimo-page.listing.test.tsx`
- Modify: `app/src/features/emprestimos/components/devolucao-page.listing.test.tsx`

- [x] **Step 1: Write failing tests for Portuguese labels and preset behavior (RED)**

```tsx
it("uses 'Novo emprestimo' and keeps status=open", () => {
  // action label + preset query assertions
});

it("uses 'Nova devolucao' and status=returned presets", () => {
  // query assertions + button labels
});
```

- [x] **Step 2: Run emprestimos/devolucao listing tests to verify failure**

Run: `pnpm --filter @guarda-hard/app test app/src/features/emprestimos/components/emprestimo-page.listing.test.tsx app/src/features/emprestimos/components/devolucao-page.listing.test.tsx`
Expected: FAIL.

- [x] **Step 3: Implement preset chips for `emprestimo-page` preserving `status=open`**

```ts
type EmprestimoPresetId = 'all' | 'open' | 'dueToday' | 'overdue';
// all/open intentionally equivalent query mutation in this phase
```

- [x] **Step 4: Implement preset chips for `devolucao-page` preserving `status=returned`**

```ts
type DevolucaoPresetId = 'all' | 'today' | 'week' | 'month';
```

- [x] **Step 5: Update action labels `New` -> `Novo emprestimo` / `Nova devolucao`**

```tsx
<button className="btn-primary">Novo emprestimo</button>
<button className="btn-primary">Nova devolucao</button>
```

- [x] **Step 6: Run emprestimos/devolucao tests to green**

Run: `pnpm --filter @guarda-hard/app test app/src/features/emprestimos/components/emprestimo-page.listing.test.tsx app/src/features/emprestimos/components/devolucao-page.listing.test.tsx`
Expected: PASS.

- [x] **Step 7: Commit emprestimos/devolucao page changes**

```bash
git add app/src/features/emprestimos/components/emprestimo-page.tsx app/src/features/emprestimos/components/devolucao-page.tsx app/src/features/emprestimos/components/emprestimo-page.listing.test.tsx app/src/features/emprestimos/components/devolucao-page.listing.test.tsx
git commit -m "feat(app): redesign emprestimos and devolucao list filters"
```

---

## Chunk 3: Modal `Salvar` action redesign and full verification

### Task 6: Standardize form submit actions (`Salvar`, `Cancelar`, `Salvando...`)

**Files:**

- Modify: `app/src/features/hardwares/forms/hardware-form.tsx`
- Modify: `app/src/features/usuarios/forms/usuario-form.tsx`
- Modify: `app/src/features/emprestimos/forms/emprestimo-form.tsx`
- Modify: `app/src/features/emprestimos/forms/devolucao-form.tsx`
- Modify: `app/src/features/hardwares/forms/hardware-form.test.tsx`
- Modify: `app/src/features/usuarios/forms/usuario-form.test.tsx`
- Modify: `app/src/features/emprestimos/forms/emprestimo-form.test.tsx`
- Modify: `app/src/features/emprestimos/forms/devolucao-form.test.tsx`

- [x] **Step 1: Add failing tests for submit loading label and disabled state (RED)**

```tsx
it("shows 'Salvando...' while submit promise is pending", async () => {
  // assert submit button text and disabled=true during pending request
});
```

- [x] **Step 2: Run targeted form tests to confirm failures**

Run: `pnpm --filter @guarda-hard/app test app/src/features/hardwares/forms/hardware-form.test.tsx app/src/features/usuarios/forms/usuario-form.test.tsx app/src/features/emprestimos/forms/emprestimo-form.test.tsx app/src/features/emprestimos/forms/devolucao-form.test.tsx`
Expected: FAIL on loading-state expectations.

- [x] **Step 3: Implement primary submit copy standardization in each form**

```tsx
<button type="submit" className="btn-primary" disabled={isSubmitting}>
  {isSubmitting ? 'Salvando...' : 'Salvar'}
</button>
```

- [x] **Step 4: Add modal footer action layout for `Cancelar` + `Salvar` pairing**

```tsx
<div className="modal-actions">
  <button type="button" className="btn-ghost">
    Cancelar
  </button>
  <button type="submit" className="btn-primary">
    Salvar
  </button>
</div>
```

- [x] **Step 5: Run form tests to green**

Run: `pnpm --filter @guarda-hard/app test app/src/features/hardwares/forms/hardware-form.test.tsx app/src/features/usuarios/forms/usuario-form.test.tsx app/src/features/emprestimos/forms/emprestimo-form.test.tsx app/src/features/emprestimos/forms/devolucao-form.test.tsx`
Expected: PASS.

- [x] **Step 6: Commit modal/form action redesign**

```bash
git add app/src/features/hardwares/forms/hardware-form.tsx app/src/features/usuarios/forms/usuario-form.tsx app/src/features/emprestimos/forms/emprestimo-form.tsx app/src/features/emprestimos/forms/devolucao-form.tsx app/src/features/hardwares/forms/hardware-form.test.tsx app/src/features/usuarios/forms/usuario-form.test.tsx app/src/features/emprestimos/forms/emprestimo-form.test.tsx app/src/features/emprestimos/forms/devolucao-form.test.tsx
git commit -m "feat(app): standardize modal save actions across forms"
```

### Task 7: Final integration verification

**Files:**

- Modify (if needed): `app/src/features/departamentos/components/departamentos-page.tsx`
- Modify (if needed): `app/src/features/departamentos/components/*` tests touching `FilterBar` compatibility

- [x] **Step 1: Run full targeted listing + form suites**

Run: `pnpm --filter @guarda-hard/app test app/src/features/hardwares/components/hardwares-page.listing.test.tsx app/src/features/usuarios/components/usuarios-page.listing.test.tsx app/src/features/emprestimos/components/emprestimo-page.listing.test.tsx app/src/features/emprestimos/components/devolucao-page.listing.test.tsx app/src/features/hardwares/forms/hardware-form.test.tsx app/src/features/usuarios/forms/usuario-form.test.tsx app/src/features/emprestimos/forms/emprestimo-form.test.tsx app/src/features/emprestimos/forms/devolucao-form.test.tsx app/src/components/ui/filter-bar.test.tsx`
Expected: PASS.

- [x] **Step 2: Run frontend lint**

Run: `pnpm --filter @guarda-hard/app lint`
Expected: PASS with no new lint violations.

- [x] **Step 3: Run frontend build**

Run: `pnpm --filter @guarda-hard/app build`
Expected: PASS and production build generated.

- [x] **Step 4: Validate DoD checklist from spec**

```text
- shared UI updates applied
- Portuguese labels standardized
- preset mapping matches spec
- no backend/API changes
- lint/test/build all pass
```

- [x] **Step 5: Commit final compatibility adjustments (only if needed)**

```bash
git add app/src/components/ui/filter-bar.tsx app/src/app/globals.css app/src/features
git commit -m "chore(app): finalize list redesign verification fixes"
```
