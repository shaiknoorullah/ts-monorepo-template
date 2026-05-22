import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  outExtensions: () => ({ js: '.mjs' }),
  dts: false,
  sourcemap: true,
  clean: true,
  target: 'node22',
  shims: true,
  // We bundle all of citty/c12/etc into the CLI so a globally-linked `repo`
  // binary doesn't need to resolve workspace deps at runtime.
  noExternal: [/.*/],
  external: ['fsevents'],
})
