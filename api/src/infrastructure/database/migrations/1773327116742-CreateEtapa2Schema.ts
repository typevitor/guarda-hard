import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEtapa2Schema1773327116742 implements MigrationInterface {
  name = 'CreateEtapa2Schema1773327116742';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existingTables: Array<{ name: string }> = await queryRunner.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('departamentos','usuarios','hardwares','emprestimos')`,
    );

    if (existingTables.length === 4) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "departamentos" ("id" varchar PRIMARY KEY NOT NULL, "empresa_id" varchar(36) NOT NULL, "nome" varchar(100) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuarios" ("id" varchar PRIMARY KEY NOT NULL, "empresa_id" varchar(36) NOT NULL, "departamento_id" varchar(36) NOT NULL, "nome" varchar(150) NOT NULL, "email" varchar(200) NOT NULL, "ativo" boolean NOT NULL DEFAULT (1), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hardwares" ("id" varchar PRIMARY KEY NOT NULL, "empresa_id" varchar(36) NOT NULL, "descricao" varchar(200) NOT NULL, "marca" varchar(100) NOT NULL, "modelo" varchar(100) NOT NULL, "codigo_patrimonio" varchar(50) NOT NULL, "funcionando" boolean NOT NULL DEFAULT (1), "descricao_problema" text, "livre" boolean NOT NULL DEFAULT (1), "version" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "emprestimos" ("id" varchar PRIMARY KEY NOT NULL, "empresa_id" varchar(36) NOT NULL, "usuario_id" varchar(36) NOT NULL, "hardware_id" varchar(36) NOT NULL, "data_retirada" datetime NOT NULL, "data_devolucao" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_usuarios" ("id" varchar PRIMARY KEY NOT NULL, "empresa_id" varchar(36) NOT NULL, "departamento_id" varchar(36) NOT NULL, "nome" varchar(150) NOT NULL, "email" varchar(200) NOT NULL, "ativo" boolean NOT NULL DEFAULT (1), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_be2e056fe966e6c0cd5347c4efc" FOREIGN KEY ("departamento_id") REFERENCES "departamentos" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_usuarios"("id", "empresa_id", "departamento_id", "nome", "email", "ativo", "created_at", "updated_at") SELECT "id", "empresa_id", "departamento_id", "nome", "email", "ativo", "created_at", "updated_at" FROM "usuarios"`,
    );
    await queryRunner.query(`DROP TABLE "usuarios"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_usuarios" RENAME TO "usuarios"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_emprestimos" ("id" varchar PRIMARY KEY NOT NULL, "empresa_id" varchar(36) NOT NULL, "usuario_id" varchar(36) NOT NULL, "hardware_id" varchar(36) NOT NULL, "data_retirada" datetime NOT NULL, "data_devolucao" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_a5dad21409edde2a7fd6ea669e6" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_ad95af636c4da969d0a71645e46" FOREIGN KEY ("hardware_id") REFERENCES "hardwares" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_emprestimos"("id", "empresa_id", "usuario_id", "hardware_id", "data_retirada", "data_devolucao", "created_at", "updated_at") SELECT "id", "empresa_id", "usuario_id", "hardware_id", "data_retirada", "data_devolucao", "created_at", "updated_at" FROM "emprestimos"`,
    );
    await queryRunner.query(`DROP TABLE "emprestimos"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_emprestimos" RENAME TO "emprestimos"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "emprestimos" RENAME TO "temporary_emprestimos"`,
    );
    await queryRunner.query(
      `CREATE TABLE "emprestimos" ("id" varchar PRIMARY KEY NOT NULL, "empresa_id" varchar(36) NOT NULL, "usuario_id" varchar(36) NOT NULL, "hardware_id" varchar(36) NOT NULL, "data_retirada" datetime NOT NULL, "data_devolucao" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `INSERT INTO "emprestimos"("id", "empresa_id", "usuario_id", "hardware_id", "data_retirada", "data_devolucao", "created_at", "updated_at") SELECT "id", "empresa_id", "usuario_id", "hardware_id", "data_retirada", "data_devolucao", "created_at", "updated_at" FROM "temporary_emprestimos"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_emprestimos"`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" RENAME TO "temporary_usuarios"`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuarios" ("id" varchar PRIMARY KEY NOT NULL, "empresa_id" varchar(36) NOT NULL, "departamento_id" varchar(36) NOT NULL, "nome" varchar(150) NOT NULL, "email" varchar(200) NOT NULL, "ativo" boolean NOT NULL DEFAULT (1), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `INSERT INTO "usuarios"("id", "empresa_id", "departamento_id", "nome", "email", "ativo", "created_at", "updated_at") SELECT "id", "empresa_id", "departamento_id", "nome", "email", "ativo", "created_at", "updated_at" FROM "temporary_usuarios"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_usuarios"`);
    await queryRunner.query(`DROP TABLE "emprestimos"`);
    await queryRunner.query(`DROP TABLE "hardwares"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
    await queryRunner.query(`DROP TABLE "departamentos"`);
  }
}
