import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import { DepartamentoOrmEntity } from '../../src/modules/departamentos/infrastructure/persistence/departamento.orm-entity';
import { EmprestimoOrmEntity } from '../../src/modules/emprestimos/infrastructure/persistence/emprestimo.orm-entity';
import { HardwareOrmEntity } from '../../src/modules/hardwares/infrastructure/persistence/hardware.orm-entity';
import { UsuarioOrmEntity } from '../../src/modules/usuarios/infrastructure/persistence/usuario.orm-entity';
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

    const departamentoRepo = dataSource.getRepository(DepartamentoOrmEntity);
    const usuarioRepo = dataSource.getRepository(UsuarioOrmEntity);
    const hardwareRepo = dataSource.getRepository(HardwareOrmEntity);
    const emprestimoRepo = dataSource.getRepository(EmprestimoOrmEntity);

    const departamento = await departamentoRepo.save(
      departamentoRepo.create({
        id: randomUUID(),
        empresa_id: 'empresa-a',
        nome: 'Suporte',
      }),
    );

    const usuario = await usuarioRepo.save(
      usuarioRepo.create({
        id: randomUUID(),
        empresa_id: 'empresa-a',
        departamento_id: departamento.id,
        nome: 'Usuario A',
        email: 'usuario.a@empresa.test',
        senha_hash: 'hash-a',
        ativo: true,
      }),
    );

    const hardware = await hardwareRepo.save(
      hardwareRepo.create({
        id: randomUUID(),
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

    // Replaces old Emprestimo.emprestar() domain method: mark hardware as not free
    hardwarePrimeiraTentativa.livre = false;

    const emprestimoOk = emprestimoRepo.create({
      id: randomUUID(),
      empresa_id: 'empresa-a',
      usuario_id: usuario.id,
      hardware_id: hardware.id,
      data_retirada: new Date('2026-03-12T10:00:00.000Z'),
      data_devolucao: null,
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
