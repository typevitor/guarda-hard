import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUsuarioEmpresasDepartamentoNullable1773402000000 implements MigrationInterface {
  name = 'MakeUsuarioEmpresasDepartamentoNullable1773402000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      `PRAGMA table_info('usuario_empresas')`,
    )) as Array<{ name: string; notnull: number }>;

    const departamentoColumn = columns.find(
      (column) => column.name === 'departamento_id',
    );

    if (!departamentoColumn || departamentoColumn.notnull === 0) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "usuario_empresas_tmp" (
        "usuario_id" varchar(36) NOT NULL,
        "empresa_id" varchar(36) NOT NULL,
        "departamento_id" varchar(36),
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_usuario_empresas_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_usuario_empresas_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_usuario_empresas_departamento" FOREIGN KEY ("departamento_id") REFERENCES "departamentos" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "UQ_usuario_empresas_usuario_empresa" UNIQUE ("usuario_id", "empresa_id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "usuario_empresas_tmp" (
        "usuario_id",
        "empresa_id",
        "departamento_id",
        "created_at",
        "updated_at"
      )
      SELECT
        "usuario_id",
        "empresa_id",
        "departamento_id",
        "created_at",
        "updated_at"
      FROM "usuario_empresas"
    `);

    await queryRunner.query(`DROP TABLE "usuario_empresas"`);
    await queryRunner.query(
      `ALTER TABLE "usuario_empresas_tmp" RENAME TO "usuario_empresas"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      `PRAGMA table_info('usuario_empresas')`,
    )) as Array<{ name: string; notnull: number }>;

    const departamentoColumn = columns.find(
      (column) => column.name === 'departamento_id',
    );

    if (!departamentoColumn || departamentoColumn.notnull === 1) {
      return;
    }

    await queryRunner.query(`
      UPDATE "usuario_empresas"
      SET "departamento_id" = (
        SELECT d."id"
        FROM "departamentos" d
        WHERE d."empresa_id" = "usuario_empresas"."empresa_id"
        ORDER BY d."created_at" ASC, d."id" ASC
        LIMIT 1
      )
      WHERE "departamento_id" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "usuario_empresas_tmp" (
        "usuario_id" varchar(36) NOT NULL,
        "empresa_id" varchar(36) NOT NULL,
        "departamento_id" varchar(36) NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_usuario_empresas_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_usuario_empresas_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_usuario_empresas_departamento" FOREIGN KEY ("departamento_id") REFERENCES "departamentos" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "UQ_usuario_empresas_usuario_empresa" UNIQUE ("usuario_id", "empresa_id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "usuario_empresas_tmp" (
        "usuario_id",
        "empresa_id",
        "departamento_id",
        "created_at",
        "updated_at"
      )
      SELECT
        "usuario_id",
        "empresa_id",
        "departamento_id",
        "created_at",
        "updated_at"
      FROM "usuario_empresas"
    `);

    await queryRunner.query(`DROP TABLE "usuario_empresas"`);
    await queryRunner.query(
      `ALTER TABLE "usuario_empresas_tmp" RENAME TO "usuario_empresas"`,
    );
  }
}
