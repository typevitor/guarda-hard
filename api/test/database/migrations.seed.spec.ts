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
import { SeedDefaultDepartamentos1773327116743 } from '../../src/infrastructure/database/migrations/1773327116743-SeedDefaultDepartamentos';

describe('seed migration', () => {
  it('inserts defaults and safely reverts only seeded rows', async () => {
    let schemaDataSource: DataSource | undefined;
    let seedDataSource: DataSource | undefined;
    let tempDirPath: string | undefined;

    const readDepartamentoNames = (dbPath: string): string[] => {
      const db = new Database(dbPath, { readonly: true });

      try {
        const rows = db
          .prepare('SELECT nome FROM departamentos ORDER BY nome ASC')
          .all() as Array<{ nome: string }>;

        return rows.map((row) => row.nome);
      } finally {
        db.close();
      }
    };

    try {
      tempDirPath = fs.mkdtempSync(
        path.join(os.tmpdir(), 'migrations-seed-spec-'),
      );
      const testDbPath = path.join(tempDirPath, 'database.sqlite');
      const businessDepartamentoId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const empresaId = '11111111-1111-1111-1111-111111111111';

      schemaDataSource = new DataSource({
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

      await schemaDataSource.initialize();
      await schemaDataSource.runMigrations();

      expect(readDepartamentoNames(testDbPath)).toEqual([]);

      await schemaDataSource.query(
        `
        INSERT INTO "departamentos" ("id", "empresa_id", "nome", "created_at", "updated_at")
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          businessDepartamentoId,
          empresaId,
          'Administração',
          '2026-01-01T00:00:00.000Z',
          '2026-01-01T00:00:00.000Z',
        ],
      );

      await schemaDataSource.destroy();
      schemaDataSource = undefined;

      seedDataSource = new DataSource({
        type: 'better-sqlite3',
        database: testDbPath,
        entities: [
          DepartamentoOrmEntity,
          UsuarioOrmEntity,
          HardwareOrmEntity,
          EmprestimoOrmEntity,
        ],
        migrations: [SeedDefaultDepartamentos1773327116743],
        synchronize: false,
        logging: false,
      });

      await seedDataSource.initialize();
      await seedDataSource.runMigrations();

      expect(readDepartamentoNames(testDbPath)).toEqual([
        'Administração',
        'Administração',
        'Comercial',
        'Desenvolvimento',
        'Franquia',
        'Suporte',
      ]);

      await seedDataSource.undoLastMigration();

      expect(readDepartamentoNames(testDbPath)).toEqual(['Administração']);

      const businessRows = await seedDataSource.query(
        `
        SELECT id FROM "departamentos"
        WHERE id = ?
        `,
        [businessDepartamentoId],
      );

      expect(businessRows).toEqual([{ id: businessDepartamentoId }]);
    } finally {
      if (schemaDataSource?.isInitialized) {
        await schemaDataSource.destroy();
      }

      if (seedDataSource?.isInitialized) {
        await seedDataSource.destroy();
      }

      if (tempDirPath) {
        fs.rmSync(tempDirPath, { recursive: true, force: true });
      }
    }
  });
});
