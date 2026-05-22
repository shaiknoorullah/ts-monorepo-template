import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: '@pkg/logger',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
