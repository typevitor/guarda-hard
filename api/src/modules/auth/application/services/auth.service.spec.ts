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
        .mockResolvedValueOnce([{ id: 'dep-1' }])
        .mockResolvedValueOnce([]),
    };

    const dataSource = {
      query: vi.fn(),
      transaction: vi.fn((cb: (txManager: typeof manager) => Promise<void>) =>
        cb(manager),
      ),
    };

    const passwordHasher = {
      hash: vi.fn(() => Promise.resolve('hashed-password')),
    };

    const service = new AuthService(
      dataSource as never,
      passwordHasher as never,
    );

    const result = await service.register({
      nome: 'Usuario',
      email: 'usuario@example.com',
      senha: '12345678',
      empresaId: 'emp-1',
    });

    expect(result.userId).toBeTypeOf('string');
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.query).toHaveBeenCalledTimes(5);

    expect(manager.query).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining(
        'INSERT INTO usuario_empresas (usuario_id, empresa_id, departamento_id, created_at, updated_at)',
      ),
      [result.userId, 'emp-1', 'dep-1'],
    );
  });

  it('throws when empresa does not exist', async () => {
    const manager = {
      query: vi.fn().mockResolvedValueOnce([]),
    };

    const dataSource = {
      query: vi.fn(),
      transaction: vi.fn((cb: (txManager: typeof manager) => Promise<void>) =>
        cb(manager),
      ),
    };

    const passwordHasher = {
      hash: vi.fn(() => Promise.resolve('hashed-password')),
    };

    const service = new AuthService(
      dataSource as never,
      passwordHasher as never,
    );

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

  it('throws when empresa has no departamento to associate membership', async () => {
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
      transaction: vi.fn((cb: (txManager: typeof manager) => Promise<void>) =>
        cb(manager),
      ),
    };

    const passwordHasher = {
      hash: vi.fn(() => Promise.resolve('hashed-password')),
    };

    const service = new AuthService(
      dataSource as never,
      passwordHasher as never,
    );

    await expect(
      service.register({
        nome: 'Usuario',
        email: 'usuario@example.com',
        senha: '12345678',
        empresaId: 'emp-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.query).toHaveBeenCalledTimes(4);
  });
});
