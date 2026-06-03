// internal/cli/src/__tests__/profile-validate.test.ts
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateProfileSchemas, buildValidatePlan } from '../commands/profile/validate.js'

const REPO_ROOT = resolve(__dirname, '../../../..')

describe('profile:validate plan', () => {
  it('builds a deterministic step list for p-startup-small', () => {
    const plan = buildValidatePlan('p-startup-small', REPO_ROOT)
    expect(plan.profileId).toBe('p-startup-small')
    expect(plan.steps.map((s) => s.name)).toEqual([
      'profile-v1-schema',
      'helm-template-lib-chart',
      'helm-template-go-hello',
      'helm-template-py-hello',
      'helm-template-rs-hello',
      'kubeconform-rendered-manifests',
      'crossplane-render-compositions',
    ])
  })

  it('schema check accepts p-startup-small', () => {
    const result = validateProfileSchemas('p-startup-small', REPO_ROOT)
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('schema check fails fast on an unknown profile id', () => {
    const result = validateProfileSchemas('p-bogus', REPO_ROOT)
    expect(result.ok).toBe(false)
    expect(result.errors[0]).toContain('p-bogus')
  })
})
