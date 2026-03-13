import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { DepartamentoOrmEntity } from '../../src/modules/departamentos/infrastructure/persistence/departamento.orm-entity';
import { EmprestimoOrmEntity } from '../../src/modules/emprestimos/infrastructure/persistence/emprestimo.orm-entity';
import { HardwareOrmEntity } from '../../src/modules/hardwares/infrastructure/persistence/hardware.orm-entity';
import { UsuarioOrmEntity } from '../../src/modules/usuarios/infrastructure/persistence/usuario.orm-entity';

export function createDomainTestDataSource(): DataSource {
  return new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [
      DepartamentoOrmEntity,
      UsuarioOrmEntity,
      HardwareOrmEntity,
      EmprestimoOrmEntity,
    ],
    synchronize: true,
    logging: false,
  });
}
