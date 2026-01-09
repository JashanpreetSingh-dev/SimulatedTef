import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
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
        '**/*.stories.tsx',
      ],
    },
    exclude: ['node_modules', 'dist'],
    // Use workspace-like configuration with different environments
    environmentMatchGlobs: [
      // Frontend tests use jsdom
      ['components/**/*.test.tsx', 'jsdom'],
      ['components/**/*.test.ts', 'jsdom'],
      // Backend tests use node
      ['server/**/*.test.ts', 'node'],
    ],
    // Setup files
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'server/__tests__/**/*.test.ts',
      'components/**/*.test.tsx',
      'components/**/*.test.ts',
    ],
    env: {
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'tef_master_test',
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
