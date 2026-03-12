import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['api/vitest.config.ts', 'app/vitest.config.ts'],
  },
});
