// internal/cli/src/__tests__/ci-job.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'

const root = resolve(__dirname, '..', '..', '..', '..')

describe('pr.yml cli-test job', () => {
  it('declares cli-test job running task --list smoke and vitest', () => {
    const wf = parse(readFileSync(resolve(root, '.github/workflows/pr.yml'), 'utf8')) as {
      jobs: Record<string, { steps?: Array<{ run?: string; name?: string }> }>
    }
    const job = wf.jobs['cli-test']
    expect(job).toBeDefined()
    const runs = (job.steps ?? []).map((s) => s.run ?? '').join('\n')
    expect(runs).toContain('task --list')
    expect(runs).toContain('pnpm vitest run')
  })
})
