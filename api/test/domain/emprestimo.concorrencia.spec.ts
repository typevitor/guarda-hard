import { afterEach, describe, expect, it } from 'vitest';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import {
  Departamento,
  Emprestimo,
  Hardware,
  Usuario,
} from '../../src/entities';
import { createDomainTestDataSource } from './domain-test-data-source';

describe('Domain concurrency - emprestimo', () => {
  const dataSource = createDomainTestDataSource();

  afterEach(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('rejects second stale loan attempt using optimistic lock', async () => {
    await dataSource.initialize();

    const departamentoRepo = dataSource.getRepository(Departamento);
    const usuarioRepo = dataSource.getRepository(Usuario);
    const hardwareRepo = dataSource.getRepository(Hardware);
    const emprestimoRepo = dataSource.getRepository(Emprestimo);

    const departamento = await departamentoRepo.save(
      departamentoRepo.create({ empresa_id: 'empresa-a', nome: 'Suporte' }),
    );

    const usuario = await usuarioRepo.save(
      usuarioRepo.create({
        empresa_id: 'empresa-a',
        departamento_id: departamento.id,
        nome: 'Usuario A',
        email: 'usuario.a@empresa.test',
        ativo: true,
      }),
    );

    const hardware = await hardwareRepo.save(
      hardwareRepo.create({
        empresa_id: 'empresa-a',
        descricao: 'Notebook',
        marca: 'Lenovo',
        modelo: 'T14',
        codigo_patrimonio: 'PAT-001',
        funcionando: true,
        livre: true,
        descricao_problema: null,
      }),
    );

    const staleVersion = hardware.version;

    const hardwarePrimeiraTentativa = await hardwareRepo
      .createQueryBuilder('hardware')
      .setLock('optimistic', staleVersion)
      .where('hardware.id = :id', { id: hardware.id })
      .getOneOrFail();

    const emprestimoOk = Emprestimo.emprestar({
      empresa_id: 'empresa-a',
      usuario_id: usuario.id,
      hardware_id: hardware.id,
      hardware: hardwarePrimeiraTentativa,
      data_retirada: new Date('2026-03-12T10:00:00.000Z'),
    });

    await hardwareRepo.save(hardwarePrimeiraTentativa);
    await emprestimoRepo.save(emprestimoOk);

    await expect(
      hardwareRepo
        .createQueryBuilder('hardware')
        .setLock('optimistic', staleVersion)
        .where('hardware.id = :id', { id: hardware.id })
        .getOneOrFail(),
    ).rejects.toThrow(OptimisticLockVersionMismatchError);
  });
});
