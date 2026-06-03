import { defineConfig } from 'vitest/config'

// Tests at the workspace root that validate Nx/Cargo/CI wiring, polyglot app
// metadata, cross-language smoke contracts, and Taskfile includes. Owned by
// the Phase 4+ platform-foundation suite. Picks up any *.test.ts under tests/.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.git/**'],
  },
})
