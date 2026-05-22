import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: '@app/worker',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
