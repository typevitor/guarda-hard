import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { DataSource } from 'typeorm';
import { DepartamentoOrmEntity } from '../../src/modules/departamentos/infrastructure/persistence/departamento.orm-entity';
import { EmprestimoOrmEntity } from '../../src/modules/emprestimos/infrastructure/persistence/emprestimo.orm-entity';
import { HardwareOrmEntity } from '../../src/modules/hardwares/infrastructure/persistence/hardware.orm-entity';
import { UsuarioOrmEntity } from '../../src/modules/usuarios/infrastructure/persistence/usuario.orm-entity';
import { CreateEtapa2Schema1773327116742 } from '../../src/infrastructure/database/migrations/1773327116742-CreateEtapa2Schema';

type TableRow = { name: string };
type ColumnRow = { name: string };
type ForeignKeyRow = { table: string; from: string; to: string };

const tableNamesQuery =
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";

function getTableNames(db: Database.Database): string[] {
  const rows = db.prepare(tableNamesQuery).all() as TableRow[];
  return rows.map((row) => row.name);
}

function getColumnNames(db: Database.Database, table: string): string[] {
  const rows = db.prepare(`PRAGMA table_info("${table}")`).all() as ColumnRow[];
  return rows.map((row) => row.name);
}

function getForeignKeys(db: Database.Database, table: string): ForeignKeyRow[] {
  return db
    .prepare(`PRAGMA foreign_key_list("${table}")`)
    .all() as ForeignKeyRow[];
}

describe('schema migrations', () => {
  it('starts from empty database and applies etapa2 schema migration', async () => {
    let dataSource: DataSource | undefined;
    let tempDirPath: string | undefined;
    let testDbPath: string | undefined;

    try {
      tempDirPath = fs.mkdtempSync(
        path.join(os.tmpdir(), 'migrations-schema-spec-'),
      );
      testDbPath = path.join(tempDirPath, 'database.sqlite');

      const preMigrationDb = new Database(testDbPath);
      expect(getTableNames(preMigrationDb)).toEqual([]);
      preMigrationDb.close();

      dataSource = new DataSource({
        type: 'better-sqlite3',
        database: testDbPath,
        entities: [
          DepartamentoOrmEntity,
          UsuarioOrmEntity,
          HardwareOrmEntity,
          EmprestimoOrmEntity,
        ],
        migrations: [CreateEtapa2Schema1773327116742],
        synchronize: false,
        logging: false,
      });

      await dataSource.initialize();
      await dataSource.runMigrations();

      const postMigrationDb = new Database(testDbPath, { readonly: true });

      try {
        const tables = getTableNames(postMigrationDb);
        const userTables = tables.filter((table) => table !== 'migrations');
        expect(userTables.sort()).toEqual([
          'departamentos',
          'emprestimos',
          'hardwares',
          'usuarios',
        ]);

        for (const table of [
          'departamentos',
          'usuarios',
          'hardwares',
          'emprestimos',
        ]) {
          expect(getColumnNames(postMigrationDb, table)).toEqual(
            expect.arrayContaining(['created_at', 'updated_at']),
          );
        }

        expect(getColumnNames(postMigrationDb, 'hardwares')).toContain(
          'version',
        );

        expect(getForeignKeys(postMigrationDb, 'usuarios')).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              table: 'departamentos',
              from: 'departamento_id',
              to: 'id',
            }),
          ]),
        );

        expect(getForeignKeys(postMigrationDb, 'emprestimos')).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              table: 'usuarios',
              from: 'usuario_id',
              to: 'id',
            }),
            expect.objectContaining({
              table: 'hardwares',
              from: 'hardware_id',
              to: 'id',
            }),
          ]),
        );
      } finally {
        postMigrationDb.close();
      }
    } finally {
      if (dataSource?.isInitialized) {
        await dataSource.destroy();
      }

      if (tempDirPath) {
        fs.rmSync(tempDirPath, { recursive: true, force: true });
      }
    }
  });
});
