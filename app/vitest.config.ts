import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@guarda-hard/schemas': resolve(__dirname, '../packages/schemas/src/index.ts'),
      '@guarda-hard/types': resolve(__dirname, '../packages/types/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
