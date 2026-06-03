import { describe, expect, it } from 'vitest'
import * as pkg from '../index'

describe('@internal/recommender package surface', () => {
  it('exports score, loadRubric, RUBRIC_VERSION', () => {
    expect(typeof pkg.score).toBe('function')
    expect(typeof pkg.loadRubric).toBe('function')
    expect(typeof pkg.RUBRIC_VERSION).toBe('string')
    expect(pkg.RUBRIC_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
