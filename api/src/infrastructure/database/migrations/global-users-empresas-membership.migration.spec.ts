import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { DataSource, type QueryRunner } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { DepartamentoOrmEntity } from '../../../modules/departamentos/infrastructure/persistence/departamento.orm-entity';
import { EmprestimoOrmEntity } from '../../../modules/emprestimos/infrastructure/persistence/emprestimo.orm-entity';
import { HardwareOrmEntity } from '../../../modules/hardwares/infrastructure/persistence/hardware.orm-entity';
import { UsuarioOrmEntity } from '../../../modules/usuarios/infrastructure/persistence/usuario.orm-entity';
import { CreateEtapa2Schema1773327116742 } from './1773327116742-CreateEtapa2Schema';
import { SeedDefaultDepartamentos1773327116743 } from './1773327116743-SeedDefaultDepartamentos';
import { GlobalUsersEmpresasMembership1773401000000 } from './1773401000000-GlobalUsersEmpresasMembership';

const TENANT_A = '22222222-2222-2222-2222-222222222222';
const TENANT_B = '33333333-3333-3333-3333-333333333333';

async function seedLegacyData(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(
    `
      INSERT INTO "departamentos" ("id", "empresa_id", "nome", "created_at", "updated_at")
      VALUES
        ('dpt-a-0000-0000-0000-000000000001', ?, 'Suporte A', '2026-03-14T00:00:00.000Z', '2026-03-14T00:00:00.000Z'),
        ('dpt-b-0000-0000-0000-000000000001', ?, 'Suporte B', '2026-03-14T00:00:00.000Z', '2026-03-14T00:00:00.000Z')
    `,
    [TENANT_A, TENANT_B],
  );

  await queryRunner.query(
    `
      INSERT INTO "usuarios" ("id", "empresa_id", "departamento_id", "nome", "email", "ativo", "created_at", "updated_at")
      VALUES
        ('usr-a-0000-0000-0000-000000000001', ?, 'dpt-a-0000-0000-0000-000000000001', 'User A', 'user-a@example.com', 1, '2026-03-14T00:00:00.000Z', '2026-03-14T00:00:00.000Z'),
        ('usr-b-0000-0000-0000-000000000001', ?, 'dpt-b-0000-0000-0000-000000000001', 'User B', 'user-b@example.com', 1, '2026-03-14T00:00:00.000Z', '2026-03-14T00:00:00.000Z')
    `,
    [TENANT_A, TENANT_B],
  );

  await queryRunner.query(
    `
      INSERT INTO "hardwares" ("id", "empresa_id", "descricao", "marca", "modelo", "codigo_patrimonio", "funcionando", "descricao_problema", "livre", "version", "created_at", "updated_at")
      VALUES
        ('hwd-a-0000-0000-0000-000000000001', ?, 'Notebook A', 'Dell', 'XPS', 'PAT-A', 1, NULL, 0, 1, '2026-03-14T00:00:00.000Z', '2026-03-14T00:00:00.000Z'),
        ('hwd-b-0000-0000-0000-000000000001', ?, 'Notebook B', 'Lenovo', 'T14', 'PAT-B', 1, NULL, 0, 1, '2026-03-14T00:00:00.000Z', '2026-03-14T00:00:00.000Z')
    `,
    [TENANT_A, TENANT_B],
  );

  await queryRunner.query(
    `
      INSERT INTO "emprestimos" ("id", "empresa_id", "usuario_id", "hardware_id", "data_retirada", "data_devolucao", "created_at", "updated_at")
      VALUES
        ('emp-a-0000-0000-0000-000000000001', ?, 'usr-a-0000-0000-0000-000000000001', 'hwd-a-0000-0000-0000-000000000001', '2026-03-14T00:00:00.000Z', NULL, '2026-03-14T00:00:00.000Z', '2026-03-14T00:00:00.000Z'),
        ('emp-b-0000-0000-0000-000000000001', ?, 'usr-b-0000-0000-0000-000000000001', 'hwd-b-0000-0000-0000-000000000001', '2026-03-14T00:00:00.000Z', NULL, '2026-03-14T00:00:00.000Z', '2026-03-14T00:00:00.000Z')
    `,
    [TENANT_A, TENANT_B],
  );
}

describe('GlobalUsersEmpresasMembership migration', () => {
  it('creates empresas, migrates usuarios, and enforces empresa foreign keys', async () => {
    let dataSource: DataSource | undefined;
    let queryRunner: QueryRunner | undefined;
    let tempDirPath: string | undefined;

    try {
      tempDirPath = fs.mkdtempSync(
        path.join(os.tmpdir(), 'global-users-empresas-spec-'),
      );
      const testDbPath = path.join(tempDirPath, 'database.sqlite');

      dataSource = new DataSource({
        type: 'better-sqlite3',
        database: testDbPath,
        entities: [
          DepartamentoOrmEntity,
          UsuarioOrmEntity,
          HardwareOrmEntity,
          EmprestimoOrmEntity,
        ],
        migrations: [CreateEtapa2Schema1773327116742, SeedDefaultDepartamentos1773327116743],
        synchronize: false,
        logging: false,
      });

      await dataSource.initialize();
      await dataSource.runMigrations({ transaction: 'none' });

      queryRunner = dataSource.createQueryRunner();

      await seedLegacyData(queryRunner);

      const migration = new GlobalUsersEmpresasMembership1773401000000();
      await migration.up(queryRunner);

      const empresasRows = await queryRunner.query(
        `SELECT id, nome FROM empresas ORDER BY id ASC`,
      );
      expect(empresasRows.some((row: { nome: string }) => row.nome === 'Test company')).toBe(true);
      expect(
        empresasRows.some(
          (row: { id: string; nome: string }) =>
            row.id === TENANT_A && row.nome === `Empresa ${TENANT_A}`,
        ),
      ).toBe(true);
      expect(
        empresasRows.some(
          (row: { id: string; nome: string }) =>
            row.id === TENANT_B && row.nome === `Empresa ${TENANT_B}`,
        ),
      ).toBe(true);

      const tables = await queryRunner.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
      );

      for (const row of tables as Array<{ name: string }>) {
        const columns = await queryRunner.query(`PRAGMA table_info('${row.name}')`);
        if (!columns.some((column: { name: string }) => column.name === 'empresa_id')) {
          continue;
        }

        const foreignKeys = await queryRunner.query(
          `PRAGMA foreign_key_list('${row.name}')`,
        );

        expect(
          foreignKeys.some(
            (fk: { from: string; table: string; to: string }) =>
              fk.from === 'empresa_id' && fk.table === 'empresas' && fk.to === 'id',
          ),
        ).toBe(true);
      }

      const usuarioColumns = await queryRunner.query(`PRAGMA table_info('usuarios')`);
      const usuarioColumnNames = usuarioColumns.map(
        (column: { name: string }) => column.name,
      );
      expect(usuarioColumnNames).toContain('nome');
      expect(usuarioColumnNames).toContain('email');
      expect(usuarioColumnNames).toContain('senha_hash');
      expect(usuarioColumnNames).toContain('ativo');
      expect(usuarioColumnNames).toContain('created_at');
      expect(usuarioColumnNames).toContain('updated_at');
      expect(usuarioColumnNames).not.toContain('empresa_id');

      const usuarioIndexList = await queryRunner.query(`PRAGMA index_list('usuarios')`);
      const usuarioUniqueIndexes = usuarioIndexList.filter(
        (idx: { unique: number }) => idx.unique === 1,
      );
      const usuarioUniqueIndexColumns = await Promise.all(
        usuarioUniqueIndexes.map((idx: { name: string }) =>
          queryRunner!.query(`PRAGMA index_info('${idx.name}')`),
        ),
      );
      expect(
        usuarioUniqueIndexColumns.some((cols: Array<{ name: string }>) => {
          const names = cols.map((column) => column.name);
          return names.length === 1 && names[0] === 'email';
        }),
      ).toBe(true);

      const usuarioEmpresasColumns = await queryRunner.query(
        `PRAGMA table_info('usuario_empresas')`,
      );
      expect(
        usuarioEmpresasColumns.some(
          (column: { name: string }) => column.name === 'usuario_id',
        ),
      ).toBe(true);
      expect(
        usuarioEmpresasColumns.some(
          (column: { name: string }) => column.name === 'empresa_id',
        ),
      ).toBe(true);

      const usuarioEmpresasForeignKeys = await queryRunner.query(
        `PRAGMA foreign_key_list('usuario_empresas')`,
      );
      expect(
        usuarioEmpresasForeignKeys.some(
          (fk: { from: string; table: string; to: string }) =>
            fk.from === 'usuario_id' && fk.table === 'usuarios' && fk.to === 'id',
        ),
      ).toBe(true);
      expect(
        usuarioEmpresasForeignKeys.some(
          (fk: { from: string; table: string; to: string }) =>
            fk.from === 'empresa_id' && fk.table === 'empresas' && fk.to === 'id',
        ),
      ).toBe(true);

      const usuarioEmpresasIndexList = await queryRunner.query(
        `PRAGMA index_list('usuario_empresas')`,
      );
      const uniqueIndexes = usuarioEmpresasIndexList.filter(
        (idx: { unique: number }) => idx.unique === 1,
      );
      const uniqueIndexColumns = await Promise.all(
        uniqueIndexes.map((idx: { name: string }) =>
          queryRunner!.query(`PRAGMA index_info('${idx.name}')`),
        ),
      );

      expect(
        uniqueIndexColumns.some((cols: Array<{ name: string }>) => {
          const names = cols.map((column) => column.name);
          return (
            names.length === 2 &&
            names[0] === 'usuario_id' &&
            names[1] === 'empresa_id'
          );
        }),
      ).toBe(true);

      const memberships = await queryRunner.query(
        `SELECT usuario_id, empresa_id FROM usuario_empresas ORDER BY usuario_id ASC`,
      );
      expect(memberships).toEqual(
        expect.arrayContaining([
          {
            usuario_id: 'usr-a-0000-0000-0000-000000000001',
            empresa_id: TENANT_A,
          },
          {
            usuario_id: 'usr-b-0000-0000-0000-000000000001',
            empresa_id: TENANT_B,
          },
        ]),
      );

      const legacyHashRows = await queryRunner.query(
        `SELECT id, senha_hash FROM usuarios WHERE id IN ('usr-a-0000-0000-0000-000000000001', 'usr-b-0000-0000-0000-000000000001') ORDER BY id ASC`,
      );
      expect(legacyHashRows).toEqual([
        { id: 'usr-a-0000-0000-0000-000000000001', senha_hash: 'legacy-usr-a-0000-0000-0000-000000000001' },
        { id: 'usr-b-0000-0000-0000-000000000001', senha_hash: 'legacy-usr-b-0000-0000-0000-000000000001' },
      ]);

      const db = new Database(testDbPath, { readonly: true });
      try {
        const departamentoCount = db
          .prepare(`SELECT COUNT(*) as count FROM departamentos`)
          .get() as { count: number };
        const hardwareCount = db
          .prepare(`SELECT COUNT(*) as count FROM hardwares`)
          .get() as { count: number };
        const emprestimoCount = db
          .prepare(`SELECT COUNT(*) as count FROM emprestimos`)
          .get() as { count: number };

        expect(departamentoCount.count).toBeGreaterThanOrEqual(2);
        expect(hardwareCount.count).toBeGreaterThanOrEqual(2);
        expect(emprestimoCount.count).toBeGreaterThanOrEqual(2);
      } finally {
        db.close();
      }
    } finally {
      if (queryRunner && !queryRunner.isReleased) {
        await queryRunner.release();
      }

      if (dataSource?.isInitialized) {
        await dataSource.destroy();
      }

      if (tempDirPath) {
        fs.rmSync(tempDirPath, { recursive: true, force: true });
      }
    }
  });

  it('deduplicates usuarios by normalized email and keeps tenant memberships', async () => {
    let dataSource: DataSource | undefined;
    let queryRunner: QueryRunner | undefined;
    let tempDirPath: string | undefined;

    try {
      tempDirPath = fs.mkdtempSync(
        path.join(os.tmpdir(), 'global-users-empresas-dedup-spec-'),
      );
      const testDbPath = path.join(tempDirPath, 'database.sqlite');

      dataSource = new DataSource({
        type: 'better-sqlite3',
        database: testDbPath,
        entities: [
          DepartamentoOrmEntity,
          UsuarioOrmEntity,
          HardwareOrmEntity,
          EmprestimoOrmEntity,
        ],
        migrations: [CreateEtapa2Schema1773327116742, SeedDefaultDepartamentos1773327116743],
        synchronize: false,
        logging: false,
      });

      await dataSource.initialize();
      await dataSource.runMigrations({ transaction: 'none' });

      queryRunner = dataSource.createQueryRunner();

      await queryRunner.query(
        `
          INSERT INTO "departamentos" ("id", "empresa_id", "nome", "created_at", "updated_at")
          VALUES
            ('dpt-a-dup-0000-0000-000000000001', ?, 'Suporte A', '2026-03-14T00:00:00.000Z', '2026-03-14T00:00:00.000Z'),
            ('dpt-b-dup-0000-0000-000000000001', ?, 'Suporte B', '2026-03-14T00:00:00.000Z', '2026-03-14T00:00:00.000Z')
        `,
        [TENANT_A, TENANT_B],
      );

      await queryRunner.query(
        `
          INSERT INTO "usuarios" ("id", "empresa_id", "departamento_id", "nome", "email", "ativo", "created_at", "updated_at")
          VALUES
            ('usr-dup-a-0000-0000-000000000001', ?, 'dpt-a-dup-0000-0000-000000000001', 'Legacy A', '  Shared.User@Example.com  ', 1, '2026-03-14T00:00:00.000Z', '2026-03-14T00:00:00.000Z'),
            ('usr-dup-b-0000-0000-000000000001', ?, 'dpt-b-dup-0000-0000-000000000001', 'Legacy B', 'shared.user@example.com', 0, '2026-03-14T00:00:00.000Z', '2026-03-14T12:00:00.000Z')
        `,
        [TENANT_A, TENANT_B],
      );

      const migration = new GlobalUsersEmpresasMembership1773401000000();
      await migration.up(queryRunner);

      const dedupedRows = await queryRunner.query(
        `
          SELECT id, nome, email, senha_hash, ativo, created_at, updated_at
          FROM usuarios
          WHERE email = 'shared.user@example.com'
        `,
      );

      expect(dedupedRows).toEqual([
        {
          id: 'usr-dup-a-0000-0000-000000000001',
          nome: 'Legacy A',
          email: 'shared.user@example.com',
          senha_hash: 'legacy-usr-dup-a-0000-0000-000000000001',
          ativo: 1,
          created_at: '2026-03-14T00:00:00.000Z',
          updated_at: '2026-03-14T00:00:00.000Z',
        },
      ]);

      const duplicateMemberships = await queryRunner.query(
        `
          SELECT usuario_id, empresa_id
          FROM usuario_empresas
          WHERE usuario_id = 'usr-dup-a-0000-0000-000000000001'
          ORDER BY empresa_id ASC
        `,
      );

      expect(duplicateMemberships).toEqual([
        { usuario_id: 'usr-dup-a-0000-0000-000000000001', empresa_id: TENANT_A },
        { usuario_id: 'usr-dup-a-0000-0000-000000000001', empresa_id: TENANT_B },
      ]);

      const removedDuplicateRows = await queryRunner.query(
        `SELECT id FROM usuarios WHERE id = 'usr-dup-b-0000-0000-000000000001'`,
      );
      expect(removedDuplicateRows).toEqual([]);

      const usuarioIndexList = await queryRunner.query(`PRAGMA index_list('usuarios')`);
      const usuarioUniqueIndexes = usuarioIndexList.filter(
        (idx: { unique: number }) => idx.unique === 1,
      );
      const usuarioUniqueIndexColumns = await Promise.all(
        usuarioUniqueIndexes.map((idx: { name: string }) =>
          queryRunner!.query(`PRAGMA index_info('${idx.name}')`),
        ),
      );
      expect(
        usuarioUniqueIndexColumns.some((cols: Array<{ name: string }>) => {
          const names = cols.map((column) => column.name);
          return names.length === 1 && names[0] === 'email';
        }),
      ).toBe(true);
    } finally {
      if (queryRunner && !queryRunner.isReleased) {
        await queryRunner.release();
      }

      if (dataSource?.isInitialized) {
        await dataSource.destroy();
      }

      if (tempDirPath) {
        fs.rmSync(tempDirPath, { recursive: true, force: true });
      }
    }
  });
});
