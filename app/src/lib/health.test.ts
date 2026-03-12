import { healthSchema } from '@guarda-hard/schemas';

describe('healthSchema', () => {
  it('accepts valid payload', () => {
    const payload = { ok: true };
    expect(healthSchema.parse(payload)).toEqual(payload);
  });
});
