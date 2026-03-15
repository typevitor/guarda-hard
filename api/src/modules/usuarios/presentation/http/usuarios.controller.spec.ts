import { describe, expect, it } from 'vitest';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from '../../domain/entities/usuario.entity';

describe('UsuariosController', () => {
  it('does not expose senhaHash in usuario response payload', async () => {
    const usuario = new Usuario({
      id: 'usr-1',
      empresaId: 'emp-1',
      departamentoId: 'dep-1',
      nome: 'Usuario',
      email: 'usuario@example.com',
      senhaHash: 'hash-secreto',
      ativo: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    const usuariosService = {
      getById: () => Promise.resolve(usuario),
    };

    const controller = new UsuariosController(usuariosService as never);

    const response = await controller.getById({ id: usuario.id });

    expect(response).not.toHaveProperty('senhaHash');
  });

  it('returns departamentoId null when usuario has no departamento', async () => {
    const usuario = new Usuario({
      id: 'usr-2',
      empresaId: 'emp-1',
      departamentoId: null,
      nome: 'Sem Departamento',
      email: 'semdepto@example.com',
      senhaHash: 'hash-secreto',
      ativo: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    const usuariosService = {
      getById: () => Promise.resolve(usuario),
    };

    const controller = new UsuariosController(usuariosService as never);
    const response = await controller.getById({ id: usuario.id });

    expect(response.departamentoId).toBeNull();
  });
});
