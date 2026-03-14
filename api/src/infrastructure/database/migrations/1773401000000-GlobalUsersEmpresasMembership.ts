import type { MigrationInterface, QueryRunner } from 'typeorm';

const TEST_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

export class GlobalUsersEmpresasMembership1773401000000
  implements MigrationInterface
{
  name = 'GlobalUsersEmpresasMembership1773401000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`PRAGMA foreign_keys = OFF`);

    try {
      await queryRunner.query(
        `
          CREATE TABLE IF NOT EXISTS "empresas" (
            "id" varchar(36) PRIMARY KEY NOT NULL,
            "nome" varchar(150) NOT NULL,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
          )
        `,
      );

      await queryRunner.query(
        `
          INSERT OR IGNORE INTO "empresas" ("id", "nome", "created_at", "updated_at")
          VALUES (?, 'Test company', datetime('now'), datetime('now'))
        `,
        [TEST_COMPANY_ID],
      );

      await queryRunner.query(
        `
          INSERT OR IGNORE INTO "empresas" ("id", "nome", "created_at", "updated_at")
          SELECT
            legacy."empresa_id",
            CASE
              WHEN legacy."empresa_id" = ? THEN 'Test company'
              ELSE ('Empresa ' || legacy."empresa_id")
            END,
            datetime('now'),
            datetime('now')
          FROM (
            SELECT DISTINCT "empresa_id" FROM "departamentos"
            UNION
            SELECT DISTINCT "empresa_id" FROM "usuarios"
            UNION
            SELECT DISTINCT "empresa_id" FROM "hardwares"
            UNION
            SELECT DISTINCT "empresa_id" FROM "emprestimos"
          ) legacy
          WHERE legacy."empresa_id" IS NOT NULL
        `,
        [TEST_COMPANY_ID],
      );

      await queryRunner.query(
        `
          CREATE TABLE "usuarios_global_tmp" (
            "id" varchar PRIMARY KEY NOT NULL,
            "nome" varchar(150) NOT NULL,
            "email" varchar(200) NOT NULL,
            "senha_hash" varchar(255) NOT NULL,
            "ativo" boolean NOT NULL DEFAULT (1),
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
          )
        `,
      );

      await queryRunner.query(
        `
          INSERT INTO "usuarios_global_tmp" ("id", "nome", "email", "senha_hash", "ativo", "created_at", "updated_at")
          SELECT
            "id",
            "nome",
            lower(trim("email")),
            ('legacy-' || "id"),
            "ativo",
            "created_at",
            "updated_at"
          FROM "usuarios"
        `,
      );

      await queryRunner.query(
        `
          CREATE TABLE "usuario_empresas" (
            "usuario_id" varchar(36) NOT NULL,
            "empresa_id" varchar(36) NOT NULL,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
            CONSTRAINT "FK_usuario_empresas_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios_global_tmp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
            CONSTRAINT "FK_usuario_empresas_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
            CONSTRAINT "UQ_usuario_empresas_usuario_empresa" UNIQUE ("usuario_id", "empresa_id")
          )
        `,
      );

      await queryRunner.query(
        `
          INSERT OR IGNORE INTO "usuario_empresas" ("usuario_id", "empresa_id", "created_at", "updated_at")
          SELECT "id", "empresa_id", "created_at", "updated_at"
          FROM "usuarios"
          WHERE "empresa_id" IS NOT NULL
        `,
      );

      await queryRunner.query(`DROP TABLE "usuarios"`);
      await queryRunner.query(
        `ALTER TABLE "usuarios_global_tmp" RENAME TO "usuarios"`,
      );

      await queryRunner.query(
        `
          CREATE TABLE "departamentos_tmp" (
            "id" varchar PRIMARY KEY NOT NULL,
            "empresa_id" varchar(36) NOT NULL,
            "nome" varchar(100) NOT NULL,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
            CONSTRAINT "FK_departamentos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
          )
        `,
      );
      await queryRunner.query(
        `
          INSERT INTO "departamentos_tmp" ("id", "empresa_id", "nome", "created_at", "updated_at")
          SELECT "id", "empresa_id", "nome", "created_at", "updated_at"
          FROM "departamentos"
        `,
      );
      await queryRunner.query(`DROP TABLE "departamentos"`);
      await queryRunner.query(
        `ALTER TABLE "departamentos_tmp" RENAME TO "departamentos"`,
      );

      await queryRunner.query(
        `
          CREATE TABLE "hardwares_tmp" (
            "id" varchar PRIMARY KEY NOT NULL,
            "empresa_id" varchar(36) NOT NULL,
            "descricao" varchar(200) NOT NULL,
            "marca" varchar(100) NOT NULL,
            "modelo" varchar(100) NOT NULL,
            "codigo_patrimonio" varchar(50) NOT NULL,
            "funcionando" boolean NOT NULL DEFAULT (1),
            "descricao_problema" text,
            "livre" boolean NOT NULL DEFAULT (1),
            "version" integer NOT NULL,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
            CONSTRAINT "FK_hardwares_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
          )
        `,
      );
      await queryRunner.query(
        `
          INSERT INTO "hardwares_tmp" (
            "id",
            "empresa_id",
            "descricao",
            "marca",
            "modelo",
            "codigo_patrimonio",
            "funcionando",
            "descricao_problema",
            "livre",
            "version",
            "created_at",
            "updated_at"
          )
          SELECT
            "id",
            "empresa_id",
            "descricao",
            "marca",
            "modelo",
            "codigo_patrimonio",
            "funcionando",
            "descricao_problema",
            "livre",
            "version",
            "created_at",
            "updated_at"
          FROM "hardwares"
        `,
      );
      await queryRunner.query(`DROP TABLE "hardwares"`);
      await queryRunner.query(`ALTER TABLE "hardwares_tmp" RENAME TO "hardwares"`);

      await queryRunner.query(
        `
          CREATE TABLE "emprestimos_tmp" (
            "id" varchar PRIMARY KEY NOT NULL,
            "empresa_id" varchar(36) NOT NULL,
            "usuario_id" varchar(36) NOT NULL,
            "hardware_id" varchar(36) NOT NULL,
            "data_retirada" datetime NOT NULL,
            "data_devolucao" datetime,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
            CONSTRAINT "FK_emprestimos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
            CONSTRAINT "FK_emprestimos_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT "FK_emprestimos_hardware" FOREIGN KEY ("hardware_id") REFERENCES "hardwares" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
          )
        `,
      );
      await queryRunner.query(
        `
          INSERT INTO "emprestimos_tmp" (
            "id",
            "empresa_id",
            "usuario_id",
            "hardware_id",
            "data_retirada",
            "data_devolucao",
            "created_at",
            "updated_at"
          )
          SELECT
            "id",
            "empresa_id",
            "usuario_id",
            "hardware_id",
            "data_retirada",
            "data_devolucao",
            "created_at",
            "updated_at"
          FROM "emprestimos"
        `,
      );
      await queryRunner.query(`DROP TABLE "emprestimos"`);
      await queryRunner.query(
        `ALTER TABLE "emprestimos_tmp" RENAME TO "emprestimos"`,
      );
    } finally {
      await queryRunner.query(`PRAGMA foreign_keys = ON`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`PRAGMA foreign_keys = OFF`);

    try {
      await queryRunner.query(
        `
          CREATE TABLE "emprestimos_legacy_tmp" (
            "id" varchar PRIMARY KEY NOT NULL,
            "empresa_id" varchar(36) NOT NULL,
            "usuario_id" varchar(36) NOT NULL,
            "hardware_id" varchar(36) NOT NULL,
            "data_retirada" datetime NOT NULL,
            "data_devolucao" datetime,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
            CONSTRAINT "FK_emprestimos_usuario_legacy" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT "FK_emprestimos_hardware_legacy" FOREIGN KEY ("hardware_id") REFERENCES "hardwares" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
          )
        `,
      );
      await queryRunner.query(
        `
          INSERT INTO "emprestimos_legacy_tmp" (
            "id",
            "empresa_id",
            "usuario_id",
            "hardware_id",
            "data_retirada",
            "data_devolucao",
            "created_at",
            "updated_at"
          )
          SELECT
            "id",
            "empresa_id",
            "usuario_id",
            "hardware_id",
            "data_retirada",
            "data_devolucao",
            "created_at",
            "updated_at"
          FROM "emprestimos"
        `,
      );
      await queryRunner.query(`DROP TABLE "emprestimos"`);
      await queryRunner.query(
        `ALTER TABLE "emprestimos_legacy_tmp" RENAME TO "emprestimos"`,
      );

      await queryRunner.query(
        `
          CREATE TABLE "hardwares_legacy_tmp" (
            "id" varchar PRIMARY KEY NOT NULL,
            "empresa_id" varchar(36) NOT NULL,
            "descricao" varchar(200) NOT NULL,
            "marca" varchar(100) NOT NULL,
            "modelo" varchar(100) NOT NULL,
            "codigo_patrimonio" varchar(50) NOT NULL,
            "funcionando" boolean NOT NULL DEFAULT (1),
            "descricao_problema" text,
            "livre" boolean NOT NULL DEFAULT (1),
            "version" integer NOT NULL,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
          )
        `,
      );
      await queryRunner.query(
        `
          INSERT INTO "hardwares_legacy_tmp" (
            "id",
            "empresa_id",
            "descricao",
            "marca",
            "modelo",
            "codigo_patrimonio",
            "funcionando",
            "descricao_problema",
            "livre",
            "version",
            "created_at",
            "updated_at"
          )
          SELECT
            "id",
            "empresa_id",
            "descricao",
            "marca",
            "modelo",
            "codigo_patrimonio",
            "funcionando",
            "descricao_problema",
            "livre",
            "version",
            "created_at",
            "updated_at"
          FROM "hardwares"
        `,
      );
      await queryRunner.query(`DROP TABLE "hardwares"`);
      await queryRunner.query(
        `ALTER TABLE "hardwares_legacy_tmp" RENAME TO "hardwares"`,
      );

      await queryRunner.query(
        `
          CREATE TABLE "departamentos_legacy_tmp" (
            "id" varchar PRIMARY KEY NOT NULL,
            "empresa_id" varchar(36) NOT NULL,
            "nome" varchar(100) NOT NULL,
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
          )
        `,
      );
      await queryRunner.query(
        `
          INSERT INTO "departamentos_legacy_tmp" ("id", "empresa_id", "nome", "created_at", "updated_at")
          SELECT "id", "empresa_id", "nome", "created_at", "updated_at"
          FROM "departamentos"
        `,
      );
      await queryRunner.query(`DROP TABLE "departamentos"`);
      await queryRunner.query(
        `ALTER TABLE "departamentos_legacy_tmp" RENAME TO "departamentos"`,
      );

      await queryRunner.query(
        `
          CREATE TABLE "usuarios_legacy_tmp" (
            "id" varchar PRIMARY KEY NOT NULL,
            "empresa_id" varchar(36) NOT NULL,
            "departamento_id" varchar(36) NOT NULL,
            "nome" varchar(150) NOT NULL,
            "email" varchar(200) NOT NULL,
            "ativo" boolean NOT NULL DEFAULT (1),
            "created_at" datetime NOT NULL DEFAULT (datetime('now')),
            "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
            CONSTRAINT "FK_usuarios_departamentos_legacy" FOREIGN KEY ("departamento_id") REFERENCES "departamentos" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
          )
        `,
      );

      await queryRunner.query(
        `
          INSERT INTO "usuarios_legacy_tmp" (
            "id",
            "empresa_id",
            "departamento_id",
            "nome",
            "email",
            "ativo",
            "created_at",
            "updated_at"
          )
          SELECT
            u."id",
            COALESCE(
              (
                SELECT MIN(ue."empresa_id")
                FROM "usuario_empresas" ue
                WHERE ue."usuario_id" = u."id"
              ),
              ?
            ) AS "empresa_id",
            COALESCE(
              (
                SELECT d."id"
                FROM "departamentos" d
                WHERE d."empresa_id" = COALESCE(
                  (
                    SELECT MIN(ue."empresa_id")
                    FROM "usuario_empresas" ue
                    WHERE ue."usuario_id" = u."id"
                  ),
                  ?
                )
                ORDER BY d."created_at" ASC
                LIMIT 1
              ),
              (
                SELECT d."id"
                FROM "departamentos" d
                ORDER BY d."created_at" ASC
                LIMIT 1
              )
            ) AS "departamento_id",
            u."nome",
            u."email",
            u."ativo",
            u."created_at",
            u."updated_at"
          FROM "usuarios" u
        `,
        [TEST_COMPANY_ID, TEST_COMPANY_ID],
      );

      await queryRunner.query(`DROP TABLE "usuarios"`);
      await queryRunner.query(
        `ALTER TABLE "usuarios_legacy_tmp" RENAME TO "usuarios"`,
      );

      await queryRunner.query(`DROP TABLE "usuario_empresas"`);
      await queryRunner.query(`DROP TABLE "empresas"`);
    } finally {
      await queryRunner.query(`PRAGMA foreign_keys = ON`);
    }
  }
}
