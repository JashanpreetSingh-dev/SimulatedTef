import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['emails/**/*.test.ts?(x)', 'server/**/*.test.ts?(x)'],
  },
});

