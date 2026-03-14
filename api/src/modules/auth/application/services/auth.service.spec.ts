import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';

describe('AuthService.register', () => {
  it('creates user and membership inside one transaction', async () => {
    const manager = {
      query: vi
        .fn()
        .mockResolvedValueOnce([{ id: 'emp-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    };

    const dataSource = {
      query: vi.fn(),
      transaction: vi.fn(async (cb: (txManager: typeof manager) => Promise<void>) => cb(manager)),
    };

    const passwordHasher = {
      hash: vi.fn(async () => 'hashed-password'),
    };

    const service = new AuthService(dataSource as never, passwordHasher as never);

    const result = await service.register({
      nome: 'Usuario',
      email: 'usuario@example.com',
      senha: '12345678',
      empresaId: 'emp-1',
    });

    expect(result.userId).toBeTypeOf('string');
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.query).toHaveBeenCalledTimes(4);
  });

  it('throws when empresa does not exist', async () => {
    const manager = {
      query: vi.fn().mockResolvedValueOnce([]),
    };

    const dataSource = {
      query: vi.fn(),
      transaction: vi.fn(async (cb: (txManager: typeof manager) => Promise<void>) => cb(manager)),
    };

    const passwordHasher = {
      hash: vi.fn(async () => 'hashed-password'),
    };

    const service = new AuthService(dataSource as never, passwordHasher as never);

    await expect(
      service.register({
        nome: 'Usuario',
        email: 'usuario@example.com',
        senha: '12345678',
        empresaId: 'missing',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.query).toHaveBeenCalledTimes(1);
  });
});
