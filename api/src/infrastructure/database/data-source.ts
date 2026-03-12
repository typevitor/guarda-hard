import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'node:path';
import { Departamento, Usuario, Hardware, Emprestimo } from '../../entities';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: path.resolve(process.cwd(), 'data/guarda-hard.sqlite'),
  entities: [Departamento, Usuario, Hardware, Emprestimo],
  migrations: [path.resolve(process.cwd(), 'src/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: false,
});
