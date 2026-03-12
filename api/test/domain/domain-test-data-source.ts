import 'reflect-metadata';
import { DataSource } from 'typeorm';
import {
  Departamento,
  Emprestimo,
  Hardware,
  Usuario,
} from '../../src/entities';

export function createDomainTestDataSource(): DataSource {
  return new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [Departamento, Usuario, Hardware, Emprestimo],
    synchronize: true,
    logging: false,
  });
}
