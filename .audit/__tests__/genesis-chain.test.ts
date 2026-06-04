// .audit/__tests__/genesis-chain.test.ts
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const auditPath = resolve(__dirname, '../decisions.jsonl')

function canonicalJson(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort()
  return JSON.stringify(obj, keys)
}

describe('.audit/decisions.jsonl genesis line', () => {
  const raw = readFileSync(auditPath, 'utf8').trim()
  const line = raw.split('\n').find((l) => l.length > 0)
  const genesis = JSON.parse(line!)

  it('uses sha256_prev = sixty-four zeros', () => {
    expect(genesis.sha256_prev).toBe('0'.repeat(64))
  })

  it('declares actor=system and question=genesis', () => {
    expect(genesis.actor).toBe('system')
    expect(genesis.question).toBe('genesis')
  })

  it('sha256_self matches sha256(sha256_prev || canonical_json(rest))', () => {
    const { sha256_self, ...rest } = genesis
    const recomputed = createHash('sha256')
      .update(genesis.sha256_prev + canonicalJson(rest))
      .digest('hex')
    expect(sha256_self).toBe(recomputed)
  })
})
