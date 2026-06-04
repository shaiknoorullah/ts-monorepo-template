// internal/schemas/__tests__/profile-helm-values.test.ts
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(__dirname, '../../..')
const PROFILES = [
  'p-solo',
  'p-hobby',
  'p-startup-small',
  'p-startup-scale',
  'p-enterprise',
] as const
const CHARTS = ['lib-chart', 'go-hello', 'py-hello', 'rs-hello'] as const

const REGISTRY_BY_PROFILE: Record<(typeof PROFILES)[number], string> = {
  'p-solo': 'ghcr.io',
  'p-hobby': 'ghcr.io',
  'p-startup-small': 'ghcr.io',
  'p-startup-scale': 'acr.io',
  'p-enterprise': 'harbor.local',
}

describe('helm-values per profile', () => {
  for (const id of PROFILES) {
    for (const chart of CHARTS) {
      it(`profiles/${id}/helm-values/${chart}.values.yaml parses`, () => {
        const path = resolve(REPO_ROOT, 'profiles', id, 'helm-values', `${chart}.values.yaml`)
        expect(existsSync(path)).toBe(true)
        const doc = parse(readFileSync(path, 'utf8')) as Record<string, unknown>
        expect(doc).toBeDefined()
      })
    }

    it(`profiles/${id} lib-chart values declare registry ${REGISTRY_BY_PROFILE[id]}`, () => {
      const path = resolve(REPO_ROOT, 'profiles', id, 'helm-values', 'lib-chart.values.yaml')
      const doc = parse(readFileSync(path, 'utf8')) as {
        image?: { registry?: string }
      }
      expect(doc.image?.registry).toBe(REGISTRY_BY_PROFILE[id])
    })
  }
})
