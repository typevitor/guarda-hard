import { describe, expect, it, vi } from 'vitest';

describe('SessionTokenService', () => {
  it('fails fast when SESSION_TOKEN_SECRET is missing', async () => {
    vi.stubEnv('SESSION_TOKEN_SECRET', '');
    vi.resetModules();

    const { SessionTokenService } = await import('./session-token.service');

    expect(() => new SessionTokenService()).toThrowError(
      'SESSION_TOKEN_SECRET must be set',
    );

    vi.unstubAllEnvs();
  });
});
