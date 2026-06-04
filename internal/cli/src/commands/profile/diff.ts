// internal/cli/src/commands/profile/diff.ts
//
// `profile:diff <from> <to>` — walks both profile directories and reports
// added/removed/modified files (byte-level compare). Pass --json for the
// MCP-friendly structured output consumed by mcp-server/profile-diff tool.
import { Args, Command, Flags } from '@oclif/core'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { findRepoRoot } from '../../lib/profile-repo-root.js'

interface FileDiff {
  path: string
  status: 'added' | 'removed' | 'modified'
  fromBytes: number | null
  toBytes: number | null
}

export interface ProfileDiff {
  from: string
  to: string
  files: FileDiff[]
}

function walk(root: string): string[] {
  const out: string[] = []
  const stack = [root]
  while (stack.length > 0) {
    const dir = stack.pop()
    if (!dir) break
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
      } else if (entry.isFile()) {
        out.push(relative(root, full))
      }
    }
  }
  return out.sort((a, b) => a.localeCompare(b))
}

export function computeProfileDiff(
  from: string,
  to: string,
  cwd: string = process.cwd(),
): ProfileDiff {
  const fromRoot = resolve(cwd, 'profiles', from)
  const toRoot = resolve(cwd, 'profiles', to)
  if (!existsSync(fromRoot)) throw new Error(`missing profile: ${fromRoot}`)
  if (!existsSync(toRoot)) throw new Error(`missing profile: ${toRoot}`)
  const fromFiles = new Set(walk(fromRoot))
  const toFiles = new Set(walk(toRoot))
  const all = new Set<string>([...fromFiles, ...toFiles])
  const files: FileDiff[] = []
  for (const rel of [...all].sort((a, b) => a.localeCompare(b))) {
    const inFrom = fromFiles.has(rel)
    const inTo = toFiles.has(rel)
    if (inFrom && !inTo) {
      files.push({
        path: rel,
        status: 'removed',
        fromBytes: statSync(resolve(fromRoot, rel)).size,
        toBytes: null,
      })
      continue
    }
    if (!inFrom && inTo) {
      files.push({
        path: rel,
        status: 'added',
        fromBytes: null,
        toBytes: statSync(resolve(toRoot, rel)).size,
      })
      continue
    }
    const fromContent = readFileSync(resolve(fromRoot, rel))
    const toContent = readFileSync(resolve(toRoot, rel))
    if (!fromContent.equals(toContent)) {
      files.push({
        path: rel,
        status: 'modified',
        fromBytes: fromContent.length,
        toBytes: toContent.length,
      })
    }
  }
  return { from, to, files }
}

export interface DiffOptions {
  json?: boolean
  cwd?: string
}

export function renderDiffText(diff: ProfileDiff): string {
  const lines: string[] = [`profile diff: ${diff.from} -> ${diff.to}`]
  for (const f of diff.files) {
    lines.push(`  ${f.status.padEnd(8)} ${f.path}`)
  }
  if (diff.files.length === 0) {
    lines.push('  (no differences)')
  }
  return lines.join('\n') + '\n'
}

export function runDiffCommand(from: string, to: string, opts: DiffOptions = {}): number {
  const diff = computeProfileDiff(from, to, opts.cwd)
  const out = opts.json ? JSON.stringify(diff) : renderDiffText(diff)
  process.stdout.write(out)
  return 0
}

export default class ProfileDiffCmd extends Command {
  static override readonly description = 'Diff two profiles'
  static override readonly args = {
    from: Args.string({ required: true }),
    to: Args.string({ required: true }),
  }
  static override readonly flags = {
    json: Flags.boolean({ default: false, description: 'Emit JSON output (MCP-friendly)' }),
  }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileDiffCmd)
    const code = runDiffCommand(args.from, args.to, { json: flags.json, cwd: findRepoRoot() })
    if (code !== 0) this.exit(code)
  }
}
