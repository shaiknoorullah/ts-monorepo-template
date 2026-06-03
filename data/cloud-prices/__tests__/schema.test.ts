import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const __filename = fileURLToPath(import.meta.url)
const DATA = resolve(dirname(__filename), '..')

const schema = JSON.parse(readFileSync(resolve(DATA, 'price-data.schema.json'), 'utf8')) as Record<
  string,
  unknown
>
const ajv = new Ajv2020({ strict: true, allErrors: true })
addFormats(ajv)
const validate = ajv.compile(schema)

const PROVIDERS = ['hetzner', 'contabo', 'ovh', 'aws', 'azure', 'gcp', 'cloudflare', 'ghcr']

describe('cloud-prices YAML files conform to JSON Schema', () => {
  it('all 8 expected provider files exist', () => {
    const found = readdirSync(DATA)
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => f.replace(/\.yaml$/, ''))
      .sort()
    expect(found).toEqual([...PROVIDERS].sort())
  })

  for (const p of PROVIDERS) {
    it(`${p}.yaml validates`, () => {
      const file = resolve(DATA, `${p}.yaml`)
      const doc = parseYaml(readFileSync(file, 'utf8')) as Record<string, unknown>
      const ok = validate(doc)
      if (!ok) {
        throw new Error(`schema errors for ${p}: ${JSON.stringify(validate.errors, null, 2)}`)
      }
      expect(ok).toBe(true)
    })
  }
})
