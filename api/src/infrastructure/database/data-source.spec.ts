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

describe('AppDataSource', () => {
  it('uses sqlite and points to api/data/guarda-hard.sqlite', () => {
    expect(AppDataSource.options.type).toBe('better-sqlite3');
    expect(String(AppDataSource.options.database)).toContain(
      'api/data/guarda-hard.sqlite',
    );
  });

  it('keeps api/data path even when loaded from workspace root cwd', async () => {
    const dataSourceFromWorkspaceCwd =
      await loadDataSourceWithCwd(workspaceRoot);

    expect(String(dataSourceFromWorkspaceCwd.options.database)).toContain(
      'api/data/guarda-hard.sqlite',
    );
  });
});
