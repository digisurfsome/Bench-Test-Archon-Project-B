import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    fileParallelism: false,
    env: {
      DATABASE_URL: 'file:./test.db',
      JWT_SECRET: 'test-secret-key-for-testing-only',
    },
  },
})
