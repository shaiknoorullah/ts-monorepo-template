import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { score, type RecommenderAnswers } from '../score'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const FIX = resolve(__dirname, 'fixtures')

const PROFILES = [
  'p-solo',
  'p-hobby',
  'p-startup-small',
  'p-startup-scale',
  'p-enterprise',
] as const

describe('golden fixtures — one canonical input per profile', () => {
  for (const id of PROFILES) {
    it(`${id}: recommends ${id} and matches expected ranked output`, () => {
      const input = JSON.parse(readFileSync(resolve(FIX, `${id}.input.json`), 'utf8')) as {
        answers: RecommenderAnswers
      }
      const expected = JSON.parse(readFileSync(resolve(FIX, `${id}.expected.json`), 'utf8')) as {
        recommended: string
        ranked: Array<{ profile: string; score: number }>
      }
      const actual = score(input.answers)
      expect(actual.recommended).toBe(expected.recommended)
      expect(actual.recommended).toBe(id)
      // compare ranked profiles + scores (reasons free-text, not part of golden)
      const actualPairs = actual.ranked.map((r) => ({ profile: r.profile, score: r.score }))
      expect(actualPairs).toEqual(expected.ranked)
    })
  }
})
