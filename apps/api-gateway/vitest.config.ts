import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: '@app/api-gateway',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
