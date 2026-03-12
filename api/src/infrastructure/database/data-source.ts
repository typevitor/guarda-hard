import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'node:path';
import { Departamento, Usuario, Hardware, Emprestimo } from '../../entities';

const apiRoot = path.resolve(__dirname, '../../..');
const databaseFilePath = path.resolve(apiRoot, 'data/guarda-hard.sqlite');
const migrationsGlobPath = path.resolve(
  __dirname,
  '../../migrations/*{.ts,.js}',
);

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: databaseFilePath,
  entities: [Departamento, Usuario, Hardware, Emprestimo],
  migrations: [migrationsGlobPath],
  synchronize: false,
  logging: false,
});
