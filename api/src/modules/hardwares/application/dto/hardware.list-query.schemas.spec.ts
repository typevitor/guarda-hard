import { describe, expect, it } from 'vitest';
import { hardwareListQuerySchema } from './hardware.schemas';

describe('hardwareListQuerySchema', () => {
  it('accepts only true|false for boolean filters', () => {
    const parsed = hardwareListQuerySchema.parse({
      funcionando: 'true',
      livre: 'false',
    });

    expect(parsed.funcionando).toBe(true);
    expect(parsed.livre).toBe(false);
    expect(() => hardwareListQuerySchema.parse({ funcionando: 'yes' })).toThrow();
  });
});
