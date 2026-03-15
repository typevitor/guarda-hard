import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { INestApplication } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import Database from 'better-sqlite3';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

const EMPRESA_ID = '11111111-1111-1111-1111-111111111111';
const DEPARTAMENTO_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';

function createDriftedDatabase(filePath: string): void {
  const db = new Database(filePath);

  try {
    db.exec(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE migrations (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        timestamp bigint NOT NULL,
        name varchar NOT NULL
      );

      CREATE TABLE empresas (
        id varchar(36) PRIMARY KEY NOT NULL,
        nome varchar(150) NOT NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE departamentos (
        id varchar PRIMARY KEY NOT NULL,
        empresa_id varchar(36) NOT NULL,
        nome varchar(100) NOT NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE usuarios (
        id varchar PRIMARY KEY NOT NULL,
        nome varchar(150) NOT NULL,
        email varchar(200) NOT NULL,
        senha_hash varchar(255) NOT NULL,
        ativo boolean NOT NULL DEFAULT (1),
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT UQ_usuarios_email UNIQUE (email)
      );

      CREATE TABLE usuario_empresas (
        usuario_id varchar(36) NOT NULL,
        empresa_id varchar(36) NOT NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT UQ_usuario_empresas_usuario_empresa UNIQUE (usuario_id, empresa_id)
      );

      CREATE TABLE hardwares (
        id varchar PRIMARY KEY NOT NULL,
        empresa_id varchar(36) NOT NULL,
        descricao varchar(200) NOT NULL,
        marca varchar(100) NOT NULL,
        modelo varchar(100) NOT NULL,
        codigo_patrimonio varchar(50) NOT NULL,
        funcionando boolean NOT NULL DEFAULT (1),
        descricao_problema text,
        livre boolean NOT NULL DEFAULT (1),
        version integer NOT NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE emprestimos (
        id varchar PRIMARY KEY NOT NULL,
        empresa_id varchar(36) NOT NULL,
        usuario_id varchar(36) NOT NULL,
        hardware_id varchar(36) NOT NULL,
        data_retirada datetime NOT NULL,
        data_devolucao datetime,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now'))
      );
    `);

    db.prepare(
      `
        INSERT INTO migrations (timestamp, name)
        VALUES
          (1773327116742, 'CreateEtapa2Schema1773327116742'),
          (1773327116743, 'SeedDefaultDepartamentos1773327116743'),
          (1773401000000, 'GlobalUsersEmpresasMembership1773401000000')
      `,
    ).run();

    db.prepare(
      `
        INSERT INTO empresas (id, nome, created_at, updated_at)
        VALUES (?, 'Test company', datetime('now'), datetime('now'))
      `,
    ).run(EMPRESA_ID);

    db.prepare(
      `
        INSERT INTO departamentos (id, empresa_id, nome, created_at, updated_at)
        VALUES (?, ?, 'Administracao', datetime('now'), datetime('now'))
      `,
    ).run(DEPARTAMENTO_ID, EMPRESA_ID);
  } finally {
    db.close();
  }
}

describe('Auth register schema compatibility (runtime drift)', () => {
  let app: INestApplication | undefined;
  let tempDir: string | undefined;
  const previousDatabasePath = process.env.DATABASE_PATH;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }

    if (previousDatabasePath === undefined) {
      delete process.env.DATABASE_PATH;
    } else {
      process.env.DATABASE_PATH = previousDatabasePath;
    }

    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  it('returns 201 on register when DB schema includes usuario_empresas.departamento_id', async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-schema-compat-'));
    const databasePath = path.join(tempDir, 'runtime.sqlite');
    createDriftedDatabase(databasePath);
    process.env.DATABASE_PATH = databasePath;

    const staleDb = new Database(databasePath, { readonly: true });
    try {
      const columns = staleDb
        .prepare(`PRAGMA table_info('usuario_empresas')`)
        .all() as Array<{ name: string }>;
      expect(columns.some((column) => column.name === 'departamento_id')).toBe(
        false,
      );
    } finally {
      staleDb.close();
    }

    const { AppModule } = (await import('../../src/app.module')) as {
      AppModule: Type<unknown>;
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nome: 'Schema Compat User',
        email: 'schema-compat@example.com',
        senha: '12345678',
        confirmarSenha: '12345678',
        empresaId: EMPRESA_ID,
      });

    if (response.status !== 201) {
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('code', 'INTERNAL_ERROR');
    }

    expect(response.status).toBe(201);
    expect(response.body).not.toHaveProperty('code', 'INTERNAL_ERROR');
  });
});
