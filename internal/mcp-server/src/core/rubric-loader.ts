import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'

export interface Rubric {
  version: string
  questions: { id: string; weight: number }[]
  sha256: string
}

export function loadRubric(path: string): Rubric {
  const raw = readFileSync(path)
  const sha256 = createHash('sha256').update(raw).digest('hex')
  const doc = parseYaml(raw.toString('utf8')) as {
    version: string
    questions: { id: string; weight: number }[]
  }
  return { version: doc.version, questions: doc.questions, sha256 }
}
