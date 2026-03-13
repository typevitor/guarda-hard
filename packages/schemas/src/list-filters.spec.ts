import { describe, expect, it } from 'vitest';
import { emprestimoStatusFilterSchema } from './list-filters';

describe('emprestimoStatusFilterSchema', () => {
  it('accepts open and returned status values', () => {
    expect(emprestimoStatusFilterSchema.parse('open')).toBe('open');
    expect(emprestimoStatusFilterSchema.parse('returned')).toBe('returned');
  });

  it('rejects unsupported status values', () => {
    expect(() => emprestimoStatusFilterSchema.parse('closed')).toThrow();
  });
});
