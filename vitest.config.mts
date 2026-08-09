import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Integration tests hit real Supabase + real OpenAI (a few cents and a
    // few seconds each) — they're opt-in via RUN_INTEGRATION=1, not part of
    // the default fast/free unit-test run. See src/lib/intelligence/README.test.md.
    exclude: process.env.RUN_INTEGRATION ? [] : ['src/**/*.integration.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
