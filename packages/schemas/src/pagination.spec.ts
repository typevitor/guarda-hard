import { describe, expect, it } from 'vitest';
import { paginationQuerySchema } from './pagination';

describe('paginationQuerySchema', () => {
  it('defaults page to 1', () => {
    const parsed = paginationQuerySchema.parse({});
    expect(parsed.page).toBe(1);
  });

  it('normalizes invalid page values to 1', () => {
    expect(paginationQuerySchema.parse({ page: '0' }).page).toBe(1);
    expect(paginationQuerySchema.parse({ page: '-3' }).page).toBe(1);
    expect(paginationQuerySchema.parse({ page: 'abc' }).page).toBe(1);
  });

  it('always returns fixed pageSize as 10', () => {
    expect(paginationQuerySchema.parse({}).pageSize).toBe(10);
    expect(paginationQuerySchema.parse({ pageSize: '100' }).pageSize).toBe(10);
  });
});
