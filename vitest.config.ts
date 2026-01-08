import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./server/__tests__/helpers/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'tef_master_test',
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'server/__tests__/',
        'dist/',
        '**/*.config.ts',
        '**/*.config.js',
        'server/scripts/',
      ],
    },
    include: ['server/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
