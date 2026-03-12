import { describe, expect, it } from 'vitest';
import { AppDataSource } from './data-source';

describe('AppDataSource', () => {
  it('uses sqlite and points to api/data/guarda-hard.sqlite', () => {
    expect(AppDataSource.options.type).toBe('better-sqlite3');
    expect(String(AppDataSource.options.database)).toContain(
      'api/data/guarda-hard.sqlite',
    );
  });
});
