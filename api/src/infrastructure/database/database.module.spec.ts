import { describe, expect, it } from 'vitest';
import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  it('exports DatabaseModule class', () => {
    expect(DatabaseModule).toBeDefined();
    expect(DatabaseModule.name).toBe('DatabaseModule');
  });
});
