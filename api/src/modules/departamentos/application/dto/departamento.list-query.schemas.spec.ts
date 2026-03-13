import { describe, expect, it } from 'vitest';
import { departamentoListQuerySchema } from './departamento.schemas';

describe('departamentoListQuerySchema', () => {
  it('normalizes invalid page to 1', () => {
    const parsed = departamentoListQuerySchema.parse({ page: 'abc' });
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(10);
  });
});
