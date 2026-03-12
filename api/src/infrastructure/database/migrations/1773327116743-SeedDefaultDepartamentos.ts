import type { MigrationInterface, QueryRunner } from 'typeorm';

const EMPRESA_ID = '11111111-1111-1111-1111-111111111111';

const DEFAULT_DEPARTAMENTOS = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    nome: 'Administração',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    nome: 'Comercial',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    nome: 'Desenvolvimento',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    nome: 'Franquia',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
    nome: 'Suporte',
  },
] as const;

export class SeedDefaultDepartamentos1773327116743 implements MigrationInterface {
  name = 'SeedDefaultDepartamentos1773327116743';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const now = new Date().toISOString();
    const rowPlaceholders = DEFAULT_DEPARTAMENTOS.map(
      () => '(?, ?, ?, ?, ?)',
    ).join(',\n        ');
    const insertValues = DEFAULT_DEPARTAMENTOS.flatMap(({ id, nome }) => [
      id,
      EMPRESA_ID,
      nome,
      now,
      now,
    ]);

    await queryRunner.query(
      `
      INSERT INTO "departamentos" ("id", "empresa_id", "nome", "created_at", "updated_at")
      VALUES
        ${rowPlaceholders}
      `,
      insertValues,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const seededIds = DEFAULT_DEPARTAMENTOS.map(({ id }) => id);
    const idPlaceholders = seededIds.map(() => '?').join(', ');

    await queryRunner.query(
      `
      DELETE FROM "departamentos"
      WHERE "empresa_id" = ?
        AND "id" IN (${idPlaceholders})
      `,
      [EMPRESA_ID, ...seededIds],
    );
  }
}
