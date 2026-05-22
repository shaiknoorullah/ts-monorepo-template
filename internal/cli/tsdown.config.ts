import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: false,
  entry: ['src/cli.ts'],
  external: ['fsevents'],
  format: ['esm'],
  // We bundle all of citty/c12/etc into the CLI so a globally-linked `repo`
  // binary doesn't need to resolve workspace deps at runtime.
  noExternal: [/.*/],
  outExtensions: () => ({ js: '.mjs' }),
  shims: true,
  sourcemap: true,
  target: 'node22',
})
