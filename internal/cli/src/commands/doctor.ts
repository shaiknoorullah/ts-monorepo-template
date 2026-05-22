// `repo doctor` — health checks for the local dev environment.

import { defineCommand } from 'citty'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'pathe'
import { emit, fail, info, isJsonMode } from '../utils/output'
import { repoPath } from '../utils/paths'
import { run } from '../utils/run'

interface Check {
  name: string
  status: 'ok' | 'warning' | 'error'
  value?: string | undefined
  expected?: string | undefined
  message?: string | undefined
}

async function getVersion(bin: string, args: string[] = ['--version']): Promise<string | null> {
  const { stdout, exitCode } = await run(bin, args, { stdio: 'pipe' })
  if (exitCode !== 0) return null
  return stdout.trim().split('\n')[0] ?? null
}

function semverGte(actual: string, required: string): boolean {
  const norm = (s: string) =>
    s
      .replace(/^v/, '')
      .split(/[.\-+]/)
      .slice(0, 3)
      .map((n) => parseInt(n, 10) || 0)
  const a = norm(actual)
  const r = norm(required)
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) > (r[i] ?? 0)) return true
    if ((a[i] ?? 0) < (r[i] ?? 0)) return false
  }
  return true
}

export const doctorCommand = defineCommand({
  meta: {
    name: 'doctor',
    description:
      'Check repo health: node/pnpm versions, lockfile, dev stack reachability, deps installed.',
  },
  async run() {
    const checks: Check[] = []

    const requiredNode = '22.0.0'
    const node = process.version
    checks.push({
      name: 'node-version',
      status: semverGte(node, requiredNode) ? 'ok' : 'error',
      value: node,
      expected: `>=${requiredNode}`,
    })

    const pnpm = await getVersion('pnpm')
    checks.push({
      name: 'pnpm-version',
      status: pnpm && semverGte(pnpm, '10.15.0') ? 'ok' : 'error',
      value: pnpm ?? '<not found>',
      expected: '>=10.15.0',
    })

    const lock = repoPath('pnpm-lock.yaml')
    checks.push({
      name: 'pnpm-lockfile',
      status: existsSync(lock) ? 'ok' : 'warning',
      value: existsSync(lock) ? 'present' : 'missing',
    })

    const nodeModules = repoPath('node_modules')
    checks.push({
      name: 'node-modules-installed',
      status: existsSync(nodeModules) ? 'ok' : 'error',
      value: existsSync(nodeModules) ? 'present' : 'missing',
      message: existsSync(nodeModules) ? undefined : 'Run `pnpm install` to install dependencies.',
    })

    const docker = await getVersion('docker', ['--version'])
    checks.push({
      name: 'docker',
      status: docker ? 'ok' : 'warning',
      value: docker ?? '<not found>',
    })

    const git = await getVersion('git')
    checks.push({
      name: 'git',
      status: git ? 'ok' : 'error',
      value: git ?? '<not found>',
    })

    // Config sanity: at least base.yaml + dev.yaml exist.
    for (const f of ['config/base.yaml', 'config/dev.yaml']) {
      checks.push({
        name: `config-${f.split('/')[1]?.replace('.yaml', '')}`,
        status: existsSync(repoPath(f)) ? 'ok' : 'error',
        value: existsSync(repoPath(f)) ? 'present' : 'missing',
        message: existsSync(repoPath(f)) ? undefined : `Expected file: ${f}`,
      })
    }

    // package.json engine band sanity (informational).
    const pkgPath = repoPath('package.json')
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        checks.push({
          name: 'engines.node',
          status: 'ok',
          value: pkg.engines?.node ?? '<unset>',
        })
      } catch {
        checks.push({ name: 'engines.node', status: 'error', message: 'failed to parse package.json' })
      }
    }

    const errors = checks.filter((c) => c.status === 'error').length
    const warns = checks.filter((c) => c.status === 'warning').length

    if (isJsonMode()) {
      emit({
        status: errors > 0 ? 'error' : warns > 0 ? 'warning' : 'ok',
        message: `${checks.length} checks: ${errors} error / ${warns} warning`,
        data: { checks },
      })
    } else {
      for (const c of checks) {
        const icon = c.status === 'ok' ? 'OK ' : c.status === 'warning' ? 'WARN' : 'ERR '
        info(`  [${icon}] ${c.name.padEnd(28)} ${c.value ?? ''} ${c.expected ? `(expected ${c.expected})` : ''}`)
        if (c.message) info(`         -> ${c.message}`)
      }
      emit({
        status: errors > 0 ? 'error' : warns > 0 ? 'warning' : 'ok',
        message: `${checks.length} checks · ${errors} error · ${warns} warning`,
      })
    }
    if (errors > 0) process.exit(1)
  },
})

// re-export resolve to keep tree-shaking quiet
void resolve
void fail
