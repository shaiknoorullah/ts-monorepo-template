import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: '@pkg/config',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
