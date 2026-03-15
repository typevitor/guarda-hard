import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { AppDataSource } from './data-source';

const apiRoot = path.resolve(__dirname, '../../..');
const workspaceRoot = path.resolve(apiRoot, '..');
const dataSourceFileUrl = pathToFileURL(
  path.resolve(__dirname, './data-source.ts'),
).href;

async function loadDataSourceWithCwd(cwd: string) {
  const previousCwd = process.cwd();

  try {
    process.chdir(cwd);
    const module = (await import(`${dataSourceFileUrl}?cwd=${Date.now()}`)) as {
      AppDataSource: typeof AppDataSource;
    };

    return module.AppDataSource;
  } finally {
    process.chdir(previousCwd);
  }
}

async function loadDataSourceWithDefaultPath() {
  const savedPath = process.env.DATABASE_PATH;
  delete process.env.DATABASE_PATH;

  try {
    const module = (await import(
      `${dataSourceFileUrl}?default=${Date.now()}`
    )) as {
      AppDataSource: typeof AppDataSource;
    };

    return module.AppDataSource;
  } finally {
    if (savedPath !== undefined) {
      process.env.DATABASE_PATH = savedPath;
    }
  }
}

describe('AppDataSource', () => {
  it('uses sqlite and points to api/data/guarda-hard.sqlite', async () => {
    const dataSource = await loadDataSourceWithDefaultPath();
    expect(dataSource.options.type).toBe('better-sqlite3');
    expect(String(dataSource.options.database)).toContain(
      'api/data/guarda-hard.sqlite',
    );
  });

  it('keeps api/data path even when loaded from workspace root cwd', async () => {
    const savedPath = process.env.DATABASE_PATH;
    delete process.env.DATABASE_PATH;

    try {
      const dataSourceFromWorkspaceCwd =
        await loadDataSourceWithCwd(workspaceRoot);

      expect(String(dataSourceFromWorkspaceCwd.options.database)).toContain(
        'api/data/guarda-hard.sqlite',
      );
    } finally {
      if (savedPath !== undefined) {
        process.env.DATABASE_PATH = savedPath;
      }
    }
  });
});
