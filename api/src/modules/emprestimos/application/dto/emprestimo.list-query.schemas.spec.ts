import { describe, expect, it } from 'vitest';
import { emprestimoListQuerySchema } from './emprestimo.schemas';

describe('emprestimoListQuerySchema', () => {
  it('accepts only open|returned for status', () => {
    expect(emprestimoListQuerySchema.parse({ status: 'open' }).status).toBe(
      'open',
    );
    expect(emprestimoListQuerySchema.parse({ status: 'returned' }).status).toBe(
      'returned',
    );
    expect(() =>
      emprestimoListQuerySchema.parse({ status: 'closed' }),
    ).toThrow();
  });

  it('rejects invalid date filters', () => {
    expect(() =>
      emprestimoListQuerySchema.parse({ retiradaFrom: 'not-a-date' }),
    ).toThrow();
  });
});
