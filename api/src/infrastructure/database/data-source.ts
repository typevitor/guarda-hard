import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'node:path';
import { DepartamentoOrmEntity } from '../../modules/departamentos/infrastructure/persistence/departamento.orm-entity';
import { UsuarioOrmEntity } from '../../modules/usuarios/infrastructure/persistence/usuario.orm-entity';
import { HardwareOrmEntity } from '../../modules/hardwares/infrastructure/persistence/hardware.orm-entity';
import { EmprestimoOrmEntity } from '../../modules/emprestimos/infrastructure/persistence/emprestimo.orm-entity';

const apiRoot = path.resolve(__dirname, '../../..');
const defaultDatabaseFilePath = path.resolve(
  apiRoot,
  'data/guarda-hard.sqlite',
);
const migrationsGlobPath = path.resolve(
  __dirname,
  './migrations/[0-9]*{.ts,.js}',
);

function resolveDatabaseFilePath(): string {
  const configuredPath = process.env.DATABASE_PATH?.trim();

  if (!configuredPath) {
    return defaultDatabaseFilePath;
  }

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(apiRoot, configuredPath);
}

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: resolveDatabaseFilePath(),
  entities: [
    DepartamentoOrmEntity,
    UsuarioOrmEntity,
    HardwareOrmEntity,
    EmprestimoOrmEntity,
  ],
  migrations: [migrationsGlobPath],
  synchronize: false,
  logging: false,
});
