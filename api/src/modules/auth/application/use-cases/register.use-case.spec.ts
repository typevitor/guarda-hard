import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { RegisterUseCase } from './register.use-case';

describe('RegisterUseCase', () => {
  it('rejects unknown empresaId', async () => {
    const useCase = new RegisterUseCase({
      register: async () => {
        throw new NotFoundException('Empresa nao encontrada');
      },
    });

    await expect(
      useCase.execute({
        nome: 'Novo Usuario',
        email: 'novo@empresa.test',
        senha: '12345678',
        empresaId: '11111111-1111-1111-1111-111111111111',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects duplicate global email with 409', async () => {
    const useCase = new RegisterUseCase({
      register: async () => {
        throw new ConflictException('Email ja cadastrado');
      },
    });

    await expect(
      useCase.execute({
        nome: 'Novo Usuario',
        email: 'duplicado@empresa.test',
        senha: '12345678',
        empresaId: '11111111-1111-1111-1111-111111111111',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
