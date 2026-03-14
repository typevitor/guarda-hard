import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  it('returns generic invalid credentials error', async () => {
    const useCase = new LoginUseCase({
      login: () =>
        Promise.reject(new UnauthorizedException('Invalid credentials')),
    });

    await expect(
      useCase.execute({
        email: 'inexistente@example.com',
        senha: 'senha-invalida',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
