import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'pathe'
import { renderString, renderTemplate } from '../utils/templates'

describe('renderString', () => {
  it('substitutes {{key}} placeholders', () => {
    expect(renderString('hello {{name}}!', { name: 'world' })).toBe('hello world!')
  })
  it('throws when a placeholder has no value', () => {
    expect(() => renderString('hi {{missing}}', {})).toThrow(/missing/)
  })
})

describe('renderTemplate', () => {
  it('copies files and substitutes placeholders in content + filenames', () => {
    const root = mkdtempSync(join(tmpdir(), 'tpl-'))
    const src = resolve(root, 'src')
    const dest = resolve(root, 'dest')
    mkdirSync(src, { recursive: true })
    writeFileSync(resolve(src, 'README.md'), 'package {{name}}\n')
    mkdirSync(resolve(src, '{{name}}'), { recursive: true })
    writeFileSync(resolve(src, '{{name}}', 'index.ts'), 'export const NAME = "{{name}}"\n')

    const result = renderTemplate(src, dest, { name: 'awesome' })

    expect(result.written.length).toBe(2)
    expect(readFileSync(resolve(dest, 'README.md'), 'utf-8')).toContain('package awesome')
    expect(existsSync(resolve(dest, 'awesome', 'index.ts'))).toBe(true)
    expect(readFileSync(resolve(dest, 'awesome', 'index.ts'), 'utf-8')).toContain(
      'NAME = "awesome"',
    )
  })

  it('refuses to overwrite a non-empty target without --force', () => {
    const root = mkdtempSync(join(tmpdir(), 'tpl-'))
    const src = resolve(root, 'src')
    const dest = resolve(root, 'dest')
    mkdirSync(src, { recursive: true })
    writeFileSync(resolve(src, 'a.txt'), 'x')
    mkdirSync(dest, { recursive: true })
    writeFileSync(resolve(dest, 'existing'), 'do not nuke')

    expect(() => renderTemplate(src, dest, {})).toThrow(/Target exists/)
  })
})
