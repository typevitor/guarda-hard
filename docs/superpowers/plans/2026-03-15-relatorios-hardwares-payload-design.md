# Relatorios Hardwares Payload Alignment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align frontend payload parsing with the backend contract for `GET /relatorios/hardwares` to expect an object `{ total, linhas }` instead of an array, ensuring stable behavior for non-empty and empty datasets.

**Architecture:** Change `getRelatorioResultado` to expect a new `RelatorioSituacaoPayload` type. Add defensive collection access for the `linhas` property (falling back to `[]` if malformed) and a deterministic fallback for `total`. Modify tests to reflect these changes.

**Tech Stack:** TypeScript, Next.js (app router/server actions), Jest.

---

## Chunk 1: Frontend contract alignment & Defensive normalization

### Task 1: Update API implementation

**Files:**
- Modify: `app/src/features/relatorios/server/relatorios-api.ts:140-180`

- [ ] **Step 1: Write the updated implementation**

Update `getRelatorioResultado` to introduce `RelatorioSituacaoPayload` and implement defensive normalizations for `linhas` and `total`.

```typescript
export type RelatorioSituacaoPayload = {
  total: number;
  linhas: HardwareApiRow[];
};

export async function getRelatorioResultado(
  rawFiltros: RelatorioFiltrosPayload,
): Promise<RelatorioResultado> {
  const filtros = relatorioFiltrosSchema.parse(rawFiltros);
  const statusQuery = filtros.status ? \`?status=\${encodeURIComponent(filtros.status)}\` : "";

  // 1) Parse as object payload
  const payload = await fetchJson<RelatorioSituacaoPayload>(\`/relatorios/hardwares\${statusQuery}\`);

  // 2) Defensive normalization for crash prevention
  const safeLinhas = Array.isArray(payload.linhas) ? payload.linhas : [];

  const linhas = safeLinhas
    .filter((linha) => {
      if (!isHardwareMatch(linha, filtros.hardware)) {
        return false;
      }

      if (!isUsuarioMatch(linha, filtros.usuario)) {
        return false;
      }

      return isWithinPeriodo(linha, filtros.periodoInicio, filtros.periodoFim);
    })
    .map((linha) => {
      return {
        hardwareId: linha.hardwareId,
        descricao: linha.descricao,
        codigoPatrimonio: linha.codigoPatrimonio,
        status: linha.status,
        usuarioId: linha.usuarioId,
        dataRetirada: linha.dataRetirada,
        dataDevolucao: linha.dataDevolucao,
      } satisfies RelatorioLinha;
    });

  // 3) Deterministic total rule
  const safeTotal = typeof payload.total === "number" && Number.isFinite(payload.total) 
    ? payload.total 
    : linhas.length;

  return {
    queryString: buildRelatorioQueryString(filtros),
    filtros,
    total: safeTotal,
    linhas,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/features/relatorios/server/relatorios-api.ts
git commit -m "fix: align /relatorios/hardwares payload with backend contract"
```

## Chunk 2: Update tests to match new contract

### Task 2: Adapt existing tests and add defensive cases

**Files:**
- Modify: `app/src/features/relatorios/server/relatorios-api.test.ts`

- [ ] **Step 1: Write the updated/new tests**

(Assuming standard Jest structure, adapt existing test setups that mock `fetchJson` or the underlying `apiClient` to return `{ total: X, linhas: [...] }` instead of just `[...]`).

```typescript
// Example snippet to guide updates in relatorios-api.test.ts:
// Update existing success mocks:
// From: mockApiClient.mockResolvedValue([{ hardwareId: "123", ... }])
// To: mockApiClient.mockResolvedValue({ total: 1, linhas: [{ hardwareId: "123", ... }] })

// Add new test: Zero-registros test
it("handles zero registros safely", async () => {
  mockApiClient.mockResolvedValue({ total: 0, linhas: [] });
  
  const result = await getRelatorioResultado(mockFiltros);
  
  expect(result.total).toBe(0);
  expect(result.linhas).toEqual([]);
});

// Add new test: Malformed payload - null linhas
it("handles malformed payload with null linhas and applies deterministic total", async () => {
  mockApiClient.mockResolvedValue({ total: undefined, linhas: null });
  
  const result = await getRelatorioResultado(mockFiltros);
  
  expect(result.linhas).toEqual([]);
  expect(result.total).toBe(0); // derived from linhas.length
});

// Add new test: Malformed payload - object linhas
it("handles malformed payload with object linhas safely", async () => {
  mockApiClient.mockResolvedValue({ total: 10, linhas: {} });
  
  const result = await getRelatorioResultado(mockFiltros);
  
  expect(result.linhas).toEqual([]);
  expect(result.total).toBe(10); // preserves valid total despite malformed linhas
});
```
*(Note: Modify the exact file ensuring you map to how the project already structures its mocks)*

- [ ] **Step 2: Run test to verify it passes**

Run: `npm run test -- app/src/features/relatorios/server/relatorios-api.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/src/features/relatorios/server/relatorios-api.test.ts
git commit -m "test: align /relatorios/hardwares tests to new payload contract and add defensive tests"
```
