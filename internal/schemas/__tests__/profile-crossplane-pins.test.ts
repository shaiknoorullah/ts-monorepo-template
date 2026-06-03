// internal/schemas/__tests__/profile-crossplane-pins.test.ts
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(__dirname, '../../..')

const EXPECTED_PG_COMPOSITION: Record<string, string> = {
  'p-solo': 'xpostgrescluster-cnpg-singlenode',
  'p-hobby': 'xpostgrescluster-cnpg-singlenode',
  'p-startup-small': 'xpostgrescluster-cnpg-singlenode',
  'p-startup-scale': 'xpostgrescluster-cnpg-ha',
  'p-enterprise': 'xpostgrescluster-cnpg-ha',
}

describe('crossplane composition-pins per profile', () => {
  for (const [id, pgComp] of Object.entries(EXPECTED_PG_COMPOSITION)) {
    it(`profiles/${id}/crossplane/composition-pins.yaml pins postgres to ${pgComp}`, () => {
      const path = resolve(REPO_ROOT, 'profiles', id, 'crossplane', 'composition-pins.yaml')
      expect(existsSync(path)).toBe(true)
      const doc = parse(readFileSync(path, 'utf8')) as Record<
        string,
        { compositionRef: { name: string } }
      >
      expect(doc['postgresclusters.pn.cloud']?.compositionRef.name).toBe(pgComp)
      expect(doc['kafkaclusters.pn.cloud']?.compositionRef.name).toBeDefined()
    })
  }
})
