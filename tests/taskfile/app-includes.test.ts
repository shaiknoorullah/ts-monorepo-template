import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const tf = parseYaml(readFileSync(resolve(__dirname, '../../Taskfile.yml'), 'utf8')) as {
  includes: Record<string, string | { taskfile: string }>
}

describe('root Taskfile includes app namespaces', () => {
  it('includes go-hello, py-hello and rs-hello sub-taskfiles', () => {
    for (const name of ['go-hello', 'py-hello', 'rs-hello']) {
      const entry = tf.includes[name]
      expect(entry, `missing include for ${name}`).toBeTruthy()
      const path = typeof entry === 'string' ? entry : entry.taskfile
      expect(path).toBe(`./apps/${name}/Taskfile.yml`)
    }
  })
})
