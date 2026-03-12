import { DataSource } from 'typeorm';
import {
  Departamento,
  Emprestimo,
  Hardware,
  Usuario,
} from '../../src/entities';

export async function createTenantTestDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [Departamento, Usuario, Hardware, Emprestimo],
    synchronize: true,
    logging: false,
  });

  await dataSource.initialize();

  return dataSource;
}
