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

  it('signs and verifies a token successfully', async () => {
    vi.stubEnv('SESSION_TOKEN_SECRET', 'test-secret-for-unit-tests');
    vi.resetModules();

    const { SessionTokenService } = await import('./session-token.service');
    const service = new SessionTokenService();

    const token = service.sign({ userId: 'user-1', empresaId: 'emp-1' });
    const payload = service.verify(token);

    expect(payload).toEqual({ userId: 'user-1', empresaId: 'emp-1' });

    vi.unstubAllEnvs();
  });

  it('returns null for a tampered token', async () => {
    vi.stubEnv('SESSION_TOKEN_SECRET', 'test-secret-for-unit-tests');
    vi.resetModules();

    const { SessionTokenService } = await import('./session-token.service');
    const service = new SessionTokenService();

    const token = service.sign({ userId: 'user-1' });
    const tampered = token.slice(0, -4) + 'XXXX';

    expect(service.verify(tampered)).toBeNull();

    vi.unstubAllEnvs();
  });

  it('returns null for an expired token', async () => {
    vi.stubEnv('SESSION_TOKEN_SECRET', 'test-secret-for-unit-tests');
    // A negative expiry makes exp = now - 1, so the token is immediately expired.
    vi.stubEnv('SESSION_TOKEN_EXPIRY_SECONDS', '-1');
    vi.resetModules();

    const { SessionTokenService } = await import('./session-token.service');
    const service = new SessionTokenService();

    const token = service.sign({ userId: 'user-1' });

    expect(service.verify(token)).toBeNull();

    vi.unstubAllEnvs();
  });
});
